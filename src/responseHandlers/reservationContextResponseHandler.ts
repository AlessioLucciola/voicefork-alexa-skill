import { HandlerInput } from 'ask-sdk-core'
import { Response } from 'ask-sdk-model'
import {
    LatLng,
    ReservationContext,
    Restaurant,
    RestaurantSearchResult,
    RestaurantSlots,
    RestaurantWithScore,
    Variances,
    VarianceResult,
    ContextResults,
} from '../shared/types'
import getCoordinates, { distanceBetweenCoordinates } from '../utils/localizationFeatures'
import { getDistanceFromContext, searchRestaurants, getCityCoordinates } from '../apiCalls'
import { CONF, TEST_LATLNG, MAX_DISTANCE } from '../shared/constants'
import { getDateComponentsFromDate, convertAmazonDateTime, parseTime } from '../utils/dateTimeUtils'
import { beautify } from '../utils/debugUtils'

const { VALUE_MAP, CONTEXT_WEIGHT, NULL_DISTANCE_SCALING_FACTOR, DISTANCE_THRESHOLD } = CONF
let coordinates = getCoordinates()
let isSearchRestaurantCompleted = false
let isRestaurantContextComputationCompleted = false
let restaurantsToDisambiguate: RestaurantWithScore[]
let fieldsForDisambiguation: Variances
let lastAnalyzedRestaurant: RestaurantWithScore | null
let cityBestRestaurant: string
let zoneBestRestaurant: string
let cuisineType: string
let usedFields: []

/**
 * Searches for the restaurants that match better the user query, and gives a score to each one of them based on the distance from the query and the context.
 * @param handlerInput
 * @param slots
 * @returns
 */
export const handleSimilarRestaurants = async (
    handlerInput: HandlerInput,
    slots: RestaurantSlots,
): Promise<Response> => {
    let { restaurantName, location, date, time, numPeople, yesNo } = slots
    let searchResults: RestaurantSearchResult[] = []

    if (!restaurantName || !date || !time || !numPeople) {
        //Ask for the data that's missing before disambiguation
        return handlerInput.responseBuilder.addDelegateDirective().getResponse()
    }

    //The following control checks if it's necessary to retrieve restaurant and in that case it search for them based on a query
    if (!isSearchRestaurantCompleted) {
        console.log(`DEBUG: SEARCHING FOR RESTAURANTS`)
        if (coordinates !== undefined && location !== undefined) {
            // Caso in cui HO le coordinate dell'utente MA voglio comunque prenotare altrove
            console.log('DEBUG INSIDE COORDINATES BUT CITY CASE')
            const cityCoordinates = await getCityCoordinates(location)
            coordinates = cityCoordinates
            const locationInfo = { location: coordinates, maxDistance: MAX_DISTANCE }
            searchResults = await searchRestaurants(restaurantName, locationInfo, undefined)
            isSearchRestaurantCompleted = true
            console.log(`DEBUG FOUND ${searchRestaurants.length} RESTAURANTS!`)
        } else if (coordinates !== undefined && location === undefined) {
            // Caso in cui HO le coordinate dell'utente e NON mi è stata detta la città (quindi devo cercare vicino all'utente)
            console.log('DEBUG INSIDE COORDINATES BUT NOT CITY CASE')
            const locationInfo = { location: coordinates, maxDistance: MAX_DISTANCE }
            searchResults = await searchRestaurants(restaurantName, locationInfo, undefined)
            console.log(`DEBUG FOUND ${searchRestaurants.length} RESTAURANTS!`)
            isSearchRestaurantCompleted = true
        } else if (coordinates === undefined && location !== undefined) {
            // Caso in cui NON HO le coordinate dell'utente MA mi è stata detta la città
            console.log('DEBUG INSIDE NOT COORDINATES BUT CITY CASE')
            const cityCoordinates = await getCityCoordinates(location)
            coordinates = cityCoordinates
            const locationInfo = { location: coordinates, maxDistance: MAX_DISTANCE }
            searchResults = await searchRestaurants(restaurantName, locationInfo, undefined)
            isSearchRestaurantCompleted = true
            console.log(`DEBUG FOUND ${searchRestaurants.length} RESTAURANTS!`)
        } else {
            // Altrimenti (non ho né coordinate, né città)..
            return handlerInput.responseBuilder
                .speak(
                    `Sorry, I can't get your location. Can you please tell me the name of the city you want to reserve to?`,
                )
                .reprompt(`Please, tell me the name of a city like "Rome" or "Milan" in which the restaurant is.`)
                .addElicitSlotDirective('location')
                .getResponse()
        }
    }

    //The following control checks if the restaurant scores were computed. If not it computes the scores and save the restaurants with score in a variable.
    if (!isRestaurantContextComputationCompleted) {
        let plausibleContexts: {
            restaurant: Restaurant
            contextDistance: number | null
            nameDistance: number
            locationDistance: number | null
        }[] = []

        //Examine the search results
        for (let result of searchResults) {
            if (result.nameDistance >= DISTANCE_THRESHOLD) continue //TODO: maybe remove it

            const { id } = result.restaurant

            const { weekday: currentDay, hour: currentHour, minute: currentMinute } = getDateComponentsFromDate()
            const currentTime = parseTime(currentHour, currentMinute)
            const reservationDateTime = convertAmazonDateTime(date, time)
            const reservationDateComponents = getDateComponentsFromDate(reservationDateTime)
            const {
                weekday: reservationDay,
                hour: reservationHour,
                minute: reservationMinute,
            } = reservationDateComponents
            const reservationTime = parseTime(reservationHour, reservationMinute)

            const context: ReservationContext = {
                id_restaurant: id,
                n_people: parseInt(numPeople),
                reservationLocation: TEST_LATLNG, //TODO: for now because the context api only works with coordinates and not with the city
                currentDay,
                reservationDay,
                currentTime,
                reservationTime,
            }
            const contextDistance = await getDistanceFromContext(context)

            plausibleContexts.push({
                restaurant: result.restaurant,
                contextDistance: contextDistance,
                nameDistance: result.nameDistance,
                locationDistance: result.locationDistance ?? null,
            })
        }
        console.log('DEBUG_PLAUSIBLE_CONTEXT: ', beautify(plausibleContexts)) //TODO: debug
        let scores: RestaurantWithScore[] = []
        if (plausibleContexts.every(context => context.contextDistance === null)) {
            //If all the context are null, then the score is just 1 - nameDistnace
            console.log("DEBUG CONTEXT: I'm in the case in which every context is null")
            for (let context of plausibleContexts) {
                const { restaurant, locationDistance, nameDistance } = context
                const { LOCATION_BOOST_FACTOR } = CONF
                const score = 1 - nameDistance
                let locationBoost = 0
                if (locationDistance !== null)
                    locationBoost = LOCATION_BOOST_FACTOR * latLngDistanceBoost(locationDistance, MAX_DISTANCE)
                console.log('DEBUG LOCATION BOOST: ', {
                    originalScore: score,
                    boosted: score + locationBoost,
                    boostAmount: `${latLngDistanceBoost(
                        locationDistance ?? 0,
                        MAX_DISTANCE,
                    )} * ${LOCATION_BOOST_FACTOR} = ${locationBoost}`,
                    locationDistance,
                })
                scores.push({
                    restaurant: restaurant,
                    score: Math.min(1, score + locationBoost),
                })
            }
        } else {
            //If a non-null context exists, I have to adjust all the scores accordingly in order to push the restaurant with a context up in the list
            for (let context of plausibleContexts) {
                scores.push({
                    restaurant: context.restaurant,
                    score: computeAggregateScore(context),
                })
            }
        }
        scores.sort((a, b) => b.score - a.score)
        console.log(`DEBUG SCORES: ${beautify(scores)}`) //TODO: debug

        // I save all the restaurants in the restaurant to disambiguate list and iterate over that list until there is one restaurant left
        restaurantsToDisambiguate = scores
    }

    // Remove the restaurant discarded in the previous iteration or accept it if the decision was "yes"
    if (lastAnalyzedRestaurant) {
        if (yesNo === 'yes') {
            return handlerInput.responseBuilder
                .speak(
                    `You seem that you want to reserve to ${lastAnalyzedRestaurant.restaurant.name} in ${lastAnalyzedRestaurant.restaurant.address}`,
                )
                .getResponse()
        } else {
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter(
                restaurant => restaurant.restaurant.id !== lastAnalyzedRestaurant?.restaurant.id,
            )
        }
        lastAnalyzedRestaurant = null
    }

    // Remove the restaurants according to their cuisine types
    if (cuisineType && cuisineType !== '') {
        // If the user confirms that he wants that types of cuisines, remove the restaurants that doesn't have them
        let restaurantsToDisambiguateWithNotNullCuisines = restaurantsToDisambiguate.filter(restaurant => restaurant.restaurant.macroCuisines !== "")
        if (yesNo === 'yes') {
            restaurantsToDisambiguateWithNotNullCuisines = restaurantsToDisambiguateWithNotNullCuisines.filter((restaurant) => {
                const cuisines: string[] = restaurant.restaurant.macroCuisines.split(",").map(part => part.replace(/^\s+/, ''))
                return cuisines.includes(cuisineType)
            })
        } else {
        // If the user confirms that he doesn't want that types of cuisines, remove the restaurants that have them
            restaurantsToDisambiguateWithNotNullCuisines = restaurantsToDisambiguateWithNotNullCuisines.filter((restaurant) => {
                const cuisines: string[] = restaurant.restaurant.macroCuisines.split(",").map(part => part.replace(/^\s+/, ''))
                return !cuisines.includes(cuisineType)
            })
        }
        let filteredRestaurants: RestaurantWithScore[] = []
        for (const restaurant of restaurantsToDisambiguate) {
            const found = restaurantsToDisambiguateWithNotNullCuisines.some((r) => r.restaurant.id === restaurant.restaurant.id);
            if (found || restaurant.restaurant.macroCuisines === "") {
                filteredRestaurants.push(restaurant);
            }
        }
        restaurantsToDisambiguate = filteredRestaurants
        cuisineType = '' // Reset cuisine type
    }

    // Disambiguation with city result
    if (cityBestRestaurant && cityBestRestaurant !== '') {
        if (yesNo === 'yes') {
            //If the response was "yes" it means that the user wants to reserve to the city of the best restaurant so let's remove the ones that are in other cities
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter(
                restaurant => restaurant.restaurant.city === cityBestRestaurant,
            )
        } else {
            // Otherwise, remove the restaurant in the same city of the best restaurant
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter(
                restaurant => restaurant.restaurant.city !== cityBestRestaurant,
            )
        }
        cityBestRestaurant = '' // Reset city best restaurant
    }

    // Disambiguation with zones result
    if (zoneBestRestaurant && zoneBestRestaurant !== '') {
        if (yesNo === 'yes') {
            //If the response was "yes" it means that the user wants to reserve to the zone of the best restaurant so let's remove the ones that are in other zones
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter(
                restaurant => restaurant.restaurant.zone === zoneBestRestaurant,
            )
        } else {
            // Otherwise, remove the restaurant in the same zone of the best restaurant
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter(
                restaurant => restaurant.restaurant.zone !== zoneBestRestaurant,
            )
        }
        zoneBestRestaurant = '' // Reset zone best restaurant
    }

    // I compute the variance (and the buckets)
    // This is done at each iteration
    const handleResult = handleScores(restaurantsToDisambiguate)

    // If the are no restaurants found
    if (!handleResult) {
        return handlerInput.responseBuilder
            .speak(
                `Sorry, but it looks that I can't find restaurant matching your query. Please, try again with a different restaurant name.`,
            )
            .getResponse()
    }

    console.log(handleResult)
    // If there are more restaurant to disambiguate I save them (as well as the variances)
    if ('restaurants' in handleResult && 'fieldsAndVariances' in handleResult) {
        const { restaurants, fieldsAndVariances } = handleResult as {
            restaurants: RestaurantWithScore[]
            fieldsAndVariances: Variances
        }
        restaurantsToDisambiguate = restaurants
        fieldsForDisambiguation = fieldsAndVariances
        isRestaurantContextComputationCompleted = true
    } else {
        // No variance, one a restaurant left. I immediatly take it.
        restaurantsToDisambiguate = [handleResult]
        lastAnalyzedRestaurant = handleResult
        isRestaurantContextComputationCompleted = true
    }

    console.log(`DISAMBIGUATION_DEBUG: Restaurants to disambiguate left ${beautify(restaurantsToDisambiguate)}`)
    console.log(`DISAMBIGUATION_DEBUG: Fields for disambiguation left ${beautify(fieldsForDisambiguation)}`)

    // If there is one restaurant left, take it and ask for confirmation
    if (restaurantsToDisambiguate.length === 1) {
        const finalRestaurant = restaurantsToDisambiguate[0]
        return handlerInput.responseBuilder
            .speak(
                `Can you confirm that you want to make a reservation to ${finalRestaurant.restaurant.name} in ${finalRestaurant.restaurant.address}, ${date} at ${time} for ${numPeople}?`,
            )
            .addElicitSlotDirective('YesNoSlot')
            .getResponse()
    }

    // If there are two restaurants left, ask immediatly if the user wants to reserve to the one with the highest score
    if (restaurantsToDisambiguate.length === 2) {
        const restaurantWithHighestScore = getBestRestaurant(restaurantsToDisambiguate)
        lastAnalyzedRestaurant = restaurantWithHighestScore
        return handlerInput.responseBuilder
        .speak(
            `Do you want to reserve to ${restaurantWithHighestScore.restaurant.name} in ${restaurantWithHighestScore.restaurant.address}?`,
        )
        .addElicitSlotDirective('YesNoSlot')
        .getResponse()
    }

    // Otherwise (if there are more than 2 resturants) -> disambiguation
    // Take the most discriminative field and remove unwanted resturants until to remain with 1 (it will the one to confirm)
    const disambiguationField = getBestField(fieldsForDisambiguation)

    const restaurantWithHighestScore = getBestRestaurant(restaurantsToDisambiguate)
    if (disambiguationField.field === 'cuisine') {
        console.log('DISAMBIGUATION DEBUG: You are in the cuisine case!')
        const discriminativeCuisine = getMostDiscriminativeCuisine(restaurantsToDisambiguate, restaurantWithHighestScore)
        if (discriminativeCuisine !== undefined) {
            cuisineType = discriminativeCuisine
            return handlerInput.responseBuilder
            .speak(
                `Does the restaurant you're looking have ${discriminativeCuisine} dishes in the menu?`,
            )
            .addElicitSlotDirective('YesNoSlot')
            .getResponse()
        }
    }

    // Otherwise, try to disambiguate using latLon (standard behavior)
    // Check if there are different cities and, if so, try to understand if the user wants to reserve to the city of the best restaurant
    const allCities = [...new Set(restaurantsToDisambiguate.map(restaurant => restaurant.restaurant.city))]
    if (allCities.length > 1) {
        cityBestRestaurant = restaurantWithHighestScore.restaurant.city
        return handlerInput.responseBuilder
            .speak(`Is the restaurant in ${getRestaurantCity(restaurantWithHighestScore)}?`)
            .addElicitSlotDirective('YesNoSlot')
            .getResponse()
    }

    // Check if there are different zones (in a certain city) and, if so, try to understand if the user wants to reserve to the city of the best restaurant
    const allZones = restaurantsToDisambiguate
        .map(restaurant => restaurant.restaurant.zone)
        .filter(zone => !zone.toLowerCase().startsWith('via '))
    console.log(allZones)
    if (
        allZones.length > 1 &&
        getRestaurantCity(restaurantWithHighestScore).toLowerCase() !==
            restaurantWithHighestScore.restaurant.zone.toLowerCase()
    ) {
        zoneBestRestaurant = restaurantWithHighestScore.restaurant.zone
        return handlerInput.responseBuilder
            .speak(
                `Is the restaurant in ${zoneBestRestaurant} neighboorhood, in ${getRestaurantCity(
                    restaurantWithHighestScore,
                )}?`,
            )
            .addElicitSlotDirective('YesNoSlot')
            .getResponse()
    }

    // Otherwise, simply ask to confirm the best restaurant
    lastAnalyzedRestaurant = restaurantWithHighestScore
    return handlerInput.responseBuilder
    .speak(
        `Do you want to reserve to ${restaurantWithHighestScore.restaurant.name} in ${restaurantWithHighestScore.restaurant.address}?`,
    )
    .addElicitSlotDirective('YesNoSlot')
    .getResponse()

    return handlerInput.responseBuilder
            .speak(
                `End`,
            )
            .getResponse()
}

const getMostDiscriminativeCuisine = (restaurants: RestaurantWithScore[], bestRestaurant: RestaurantWithScore) => {
    const cuisinesBestRestaurant = bestRestaurant.restaurant.macroCuisines.split(',').filter(cuisine => cuisine !== "").map(part => part.replace(/^\s+/, '')) // Extract cuisines of the best resturant
    if (cuisinesBestRestaurant.length === 0) return undefined

    let restaurantsWithNotNullCuisines = 0 // Count the restaurants with with not null cuisines (macroCuisines !== "")
    restaurants.forEach((restaurant) => {
        if (restaurant.restaurant.macroCuisines.trim() !== "") {
            restaurantsWithNotNullCuisines++
        }
    })

    const allCuisines: string[] = [] // Array to save all the cuisines
    // Get all cuisines
    restaurants.forEach(restaurant => {
        const cuisines = restaurant.restaurant.macroCuisines.split(",").filter(cuisine => cuisine !== "").map(part => part.replace(/^\s+/, ''))
        allCuisines.push(...cuisines);
    })
    const cuisineCounts: { [cuisine: string]: number } = {} // Array to save the occcurrences for each cuisine
    allCuisines.forEach(cuisine => {
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1
    })

    const cuisineCountsArray: [string, number][] = Object.entries(cuisineCounts) // Convert object to array of key-value pairs
    cuisineCountsArray.sort((a, b) => a[1] - b[1]) // Sort array based on number of occurrences

    console.log(`DISAMBIGUATION DEBUG: I found ${cuisinesBestRestaurant.length} cuisines in the best resturant: ${beautify(cuisinesBestRestaurant)}`)
    console.log(`DISAMBIGUATION DEBUG: I found these cuisines in the restaurants to disambiguate: ${beautify(cuisineCountsArray)}`)
    
    let selectedCuisines: string | undefined
    for (const [cuisine, count] of cuisineCountsArray) {
        // Get the cuisine in the best restaurant that has the lowest number of occurrences in restaurants to disambiguate
        if (cuisinesBestRestaurant.includes(cuisine) && count !== restaurantsWithNotNullCuisines) {
            selectedCuisines = cuisine
        }
    }

    // If there is no "unique" discriminative cuisine (the least common cuisine in the best restaurant is in all restaurants)
    if (!selectedCuisines) {
        console.log(`DISAMBIGUATION DEBUG: I didn't find a discriminative cuisines in the best restaurant so I will try to get the most discriminative one in the other restaurants`)
        for (const [cuisine, count] of cuisineCountsArray) {
            // Get the cuisine that has the highest number of occurrences in restaurants to disambiguate (but not in the best restaurant!)
            if (count !== restaurantsWithNotNullCuisines) {
                selectedCuisines = cuisine
            }
        }
    }

    if (!selectedCuisines) {
        console.log(`DISAMBIGUATION DEBUG: I couldn't find any discriminative cuisines. I'll abort the cuisine disambiguation!`)
    } else {
        console.log(`DISAMBIGUATION DEBUG: Final discrivimative cuisines: ${beautify(selectedCuisines)}`)
    }
    return selectedCuisines
}

const getRestaurantCity = (restaurant: RestaurantWithScore): string => {
    let city = restaurant.restaurant.city
    if (city === 'ome') city = 'rome'
    return city.charAt(0).toUpperCase() + city.slice(1)
}

const getBestRestaurant = (restaurants: RestaurantWithScore[]): RestaurantWithScore => {
    return restaurants.reduce((highestScoreRestaurant, currentRestaurant) => {
        if (currentRestaurant.score > highestScoreRestaurant.score) {
            return currentRestaurant
        }
        return highestScoreRestaurant
    })
}

const getBestField = (fieldsAndVariances: Variances): { field: string; variance: number } => {
    const [maxPropertyName, maxValue] = Object.entries(fieldsAndVariances).reduce(
        (acc, [property, value]) => (value > acc[1] ? [property, value] : acc),
        ['', -Infinity],
    )

    return { field: maxPropertyName, variance: maxValue as number }
}

/**
 * Computes the aggregate score between the contextDistance and the nameDistance. The higher the score, the better.
 * @param context
 * @returns
 */
const computeAggregateScore = (context: {
    restaurant: Restaurant
    contextDistance: number | null
    nameDistance: number
    locationDistance: number | null
}): number => {
    const { contextDistance, nameDistance, locationDistance } = context
    let locationBoost = 0
    const { LOCATION_BOOST_FACTOR } = CONF
    if (contextDistance == null) {
        const minNameDistance = Math.max(nameDistance, 0.05) // The name distance won't ever be 0 because of floats, so it has to be increased a little bit for the scaling to work
        let score = 1 - Math.min(Math.pow(minNameDistance, NULL_DISTANCE_SCALING_FACTOR), 1)
        if (locationDistance !== null)
            locationBoost = LOCATION_BOOST_FACTOR * latLngDistanceBoost(locationDistance, MAX_DISTANCE)
        console.log('DEBUG LOCATION BOOST: ', {
            originalScore: score,
            boosted: score + locationBoost,
            boostAmount: `${latLngDistanceBoost(
                locationDistance ?? 0,
                MAX_DISTANCE,
            )} * ${LOCATION_BOOST_FACTOR} = ${locationBoost}`,
            locationDistance,
        })
        return Math.min(1, score + locationBoost)
    }
    const normalizedContextDistance = normalizeContext(contextDistance)
    const avg = (1 - CONTEXT_WEIGHT) * nameDistance + CONTEXT_WEIGHT * normalizedContextDistance
    let score = 1 - avg
    if (locationDistance !== null)
        locationBoost = LOCATION_BOOST_FACTOR * latLngDistanceBoost(locationDistance, MAX_DISTANCE)
    console.log('DEBUG LOCATION BOOST: ', {
        originalScore: score,
        boosted: score + locationBoost,
        boostAmount: `${latLngDistanceBoost(
            locationDistance ?? 0,
            MAX_DISTANCE,
        )} * ${LOCATION_BOOST_FACTOR} = ${locationBoost}`,
        locationDistance,
    })
    return Math.min(1, score + locationBoost)
}

/**
 * Normalizes the inputValue according to the valueMap distribution, interpolating the values in between.
 * @param inputValue
 * @returns
 */
const normalizeContext = (inputValue: number): number => {
    // Sort the input values
    const sortedValues = VALUE_MAP.map(([inputValue]) => inputValue).sort((a, b) => a - b)

    // Find the index of inputValue in the sorted list
    const index = sortedValues.findIndex(value => inputValue <= value)

    if (index === 0) {
        // If inputValue is less than the smallest value in the list, return the normalized value of the smallest value
        return VALUE_MAP[0][1]
    } else if (index === -1) {
        // If inputValue is greater than the largest value in the list, return the normalized value of the largest value
        return VALUE_MAP[VALUE_MAP.length - 1][1]
    } else {
        // Interpolate between the normalized values based on the index
        const [prevValue, prevNormalizedValue] = VALUE_MAP[index - 1]
        const [nextValue, nextNormalizedValue] = VALUE_MAP[index]
        const t = (inputValue - prevValue) / (nextValue - prevValue)
        return prevNormalizedValue + (nextNormalizedValue - prevNormalizedValue) * t
    }
}

const handleScores = (items: RestaurantWithScore[]): RestaurantWithScore | ContextResults | null => {
    const { SCORE_THRESHOLDS } = CONF
    let highChoices: RestaurantWithScore[] = []
    let mediumChoices: RestaurantWithScore[] = []
    let lowChoices: RestaurantWithScore[] = []

    const { high, medium, low } = SCORE_THRESHOLDS
    for (let item of items) {
        const { score } = item
        if (score >= high) highChoices.push(item)
        if (medium <= score && score < high) mediumChoices.push(item)
        if (low <= score && score < medium) lowChoices.push(item)
    }

    if (highChoices.length > 0) {
        console.log(
            `CHOICES_DEBUG: Inside high choices with length of ${highChoices.length}. The object is ${beautify(
                highChoices,
            )}`,
        )
        const fieldsAndVariances = computeVariances(highChoices)
        if (fieldsAndVariances) {
            return { restaurants: highChoices, fieldsAndVariances: fieldsAndVariances }
        }
        return highChoices[0]
    }
    if (mediumChoices.length > 0) {
        //TODO: Change this, for now it's just a copy of the highChoices
        console.log(
            `CHOICES_DEBUG: Inside medium choices with length of ${mediumChoices.length}. The object is ${beautify(
                mediumChoices,
            )}`,
        )
        const fieldsAndVariances = computeVariances(mediumChoices)
        if (fieldsAndVariances) {
            return { restaurants: mediumChoices, fieldsAndVariances: fieldsAndVariances }
        }
        return mediumChoices[0]
    }
    if (lowChoices.length > 0) {
        //TODO: Change this, for now it's just a copy of the highChoices
        console.log(
            `CHOICES_DEBUG: Inside low choices with length of ${lowChoices.length}. The object is ${beautify(
                lowChoices,
            )}`,
        )
        const fieldsAndVariances = computeVariances(lowChoices)
        if (fieldsAndVariances) {
            return { restaurants: lowChoices, fieldsAndVariances: fieldsAndVariances }
        }
        return lowChoices[0]
    }
    return null
}

export const latLngDistanceBoost = (locationDistance: number, maxDistance: number): number => {
    if (locationDistance > maxDistance / 3) return 0
    locationDistance += 50 //Avoid log(0)
    const normalizedDistance = locationDistance / maxDistance
    const boost = 1 - (-Math.log(1 / normalizedDistance) / Math.log(100) + 1) // 1 - (-log_100(1/x)+1)
    const MIN = 0
    const MAX = 1
    return Math.min(Math.max(boost, MIN), MAX) //Clamp between 0 and 1
}

//******************************************//
//********COMPUTING VARIANCES***************//
//******************************************//

const computeVariances = (items: RestaurantWithScore[]): Variances | null => {
    if (items.length <= 1) return null

    let allLatLng: LatLng[] = []
    let allCities: string[][] = []
    let allCuisines: string[][] = []
    let allAvgRating: number[] = []
    for (let { restaurant, score } of items) {
        const { latitude, longitude, city, cuisines, avgRating } = restaurant
        allLatLng.push({ latitude, longitude })
        allCities.push([city])
        allCuisines.push(cuisines.split(',').map(item => item.trim()))
        allAvgRating.push(avgRating)
    }

    console.log(
        `DEBUG DATA: ${beautify({
            allLatLng: allLatLng,
            allCities: allCities,
            allCuisines: allCuisines,
            allAvgRating: allAvgRating,
        })}`,
    )

    const variances: Variances = {
        latLng: computeLatLngVariance(allLatLng).variance,
        city: computeStringArrayVariance(allCities).variance,
        cuisine: computeStringArrayVariance(allCuisines).variance,
        avgRating: computeSimpleVariance(allAvgRating).variance,
    }

    return variances
}

const computeSimpleVariance = (values: number[]): VarianceResult => {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2))
    const sumOfSquaredDifferences = squaredDifferences.reduce((sum, difference) => sum + difference, 0)
    const variance = sumOfSquaredDifferences / values.length
    const standardDeviation = Math.sqrt(variance)

    return { mean, std: standardDeviation, variance }
}

const computeLatLngVariance = (values: LatLng[]): VarianceResult => {
    // Calculate the average latitude and longitude
    const sumLatitude = values.reduce((sum, { latitude }) => sum + latitude, 0)
    const sumLongitude = values.reduce((sum, { longitude }) => sum + longitude, 0)
    const avgLatitude = sumLatitude / values.length
    const avgLongitude = sumLongitude / values.length

    // Calculate the sum of squared distances
    const sumSquaredDistances = values.reduce((sum, { latitude, longitude }) => {
        const distance =
            distanceBetweenCoordinates({ latitude, longitude }, { latitude: avgLatitude, longitude: avgLongitude }) /
            1000 //Distance in km instead of meters
        return sum + distance * distance
    }, 0)

    // Calculate the sum of distances
    const mean =
        values.reduce((sum, { latitude, longitude }) => {
            const distance =
                distanceBetweenCoordinates(
                    { latitude, longitude },
                    { latitude: avgLatitude, longitude: avgLongitude },
                ) / 1000 //Distance in km instead of meters
            return sum + distance
        }, 0) / values.length

    const variance = sumSquaredDistances / (values.length - 1)
    const standardDeviation = Math.sqrt(variance)

    return { mean, std: standardDeviation, variance }
}

const computeStringArrayVariance = (values: string[][]): VarianceResult => {
    const uniqueCategories = new Set<string>()

    for (const arr of values) {
        for (const str of arr) {
            uniqueCategories.add(str)
        }
    }

    const numUniqueCategories = uniqueCategories.size

    // Calculate the average count of unique categories
    const avgCount = numUniqueCategories / values.length

    // Calculate the sum of squared differences from the average count
    const sumSquaredDifferences = values.reduce((sum, arr) => {
        const numUniqueInArr = new Set<string>(arr).size
        const difference = numUniqueInArr - avgCount
        return sum + difference * difference
    }, 0)

    const mean = sumSquaredDifferences / values.length

    // Calculate the variance
    const variance = sumSquaredDifferences / (values.length - 1)
    const standardDeviation = Math.sqrt(variance)

    return { mean, std: standardDeviation, variance }
}
