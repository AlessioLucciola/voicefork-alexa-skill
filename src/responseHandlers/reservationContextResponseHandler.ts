import { HandlerInput } from 'ask-sdk-core'
import { Response } from 'ask-sdk-model'
import { ReservationContext, Restaurant, RestaurantSearchResult, RestaurantSlots } from '../shared/types'
import getCoordinates from '../utils/localizationFeatures'
import { searchRestaurants } from '../apiCalls'
import { getDistanceFromContext } from '../apiCalls'
import { CONF, TEST_LATLNG } from '../shared/constants'
import { getDateComponentsFromDate, convertAmazonDateTime, parseTime } from '../utils/dateTimeUtils'

const { VALUE_MAP, CONTEXT_WEIGHT, NULL_DISTANCE_SCALING_FACTOR, DISTANCE_THRESHOLD } = CONF

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
    const { restaurantName, location, date, time, numPeople, yesNo } = slots

    let searchResults: RestaurantSearchResult[] = []
    const coordinates = getCoordinates()

    if (!restaurantName || !date || !time || !numPeople) {
        //Ask for the data that's missing before disambiguation
        return handlerInput.responseBuilder.addDelegateDirective().getResponse()
    }

    if (coordinates) {
        const locationInfo = { location: coordinates, maxDistance: 40000 }
        searchResults = await searchRestaurants(restaurantName, locationInfo)
    } else {
        searchResults = await searchRestaurants(restaurantName, undefined, location ?? 'Rome')
    }

    let plausibleContexts: { restaurant: Restaurant; contextDistance: number | null; nameDistance: number }[] = []

    //Examine the search results
    for (let result of searchResults) {
        if (result.nameDistance > DISTANCE_THRESHOLD) continue

        const { id } = result.restaurant

        const { weekday: currentDay, hour: currentHour, minute: currentMinute } = getDateComponentsFromDate()
        const currentTime = parseTime(currentHour, currentMinute)
        const reservationDateTime = convertAmazonDateTime(date, time)
        const reservationDateComponents = getDateComponentsFromDate(reservationDateTime)
        const { weekday: reservationDay, hour: reservationHour, minute: reservationMinute } = reservationDateComponents
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
        })
    }
    console.log(JSON.stringify(plausibleContexts, null, 2)) //TODO: debug
    let scores: { restaurant: Restaurant; nameDistance: number; contextDistance: number | null; score: number }[] = []
    for (let context of plausibleContexts) {
        scores.push({
            restaurant: context.restaurant,
            nameDistance: context.nameDistance,
            contextDistance: context.contextDistance,
            score: computeAggregateScore(context),
        })
    }
    scores.sort((a, b) => b.score - a.score)
    //Examine the plausible restaurants
    console.log(JSON.stringify(scores, null, 2)) //TODO: debug

    return handlerInput.responseBuilder
        .speak(
            `I examined the results, they are ${scores.length}, the top 3 are: ${JSON.stringify(scores.slice(0, 3))}`,
        )
        .getResponse()
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
}): number => {
    const { contextDistance, nameDistance } = context
    if (contextDistance == null) {
        //TODO: There is a problem with this, because if each restaurant has the distance == null, the nameDistance score gets too distorted
        const minNameDistance = Math.max(nameDistance, 0.05) // The name distance won't ever be 0 because of floats, so it has to be increased a little bit for the scaling to work
        return 1 - Math.min(Math.pow(minNameDistance, NULL_DISTANCE_SCALING_FACTOR), 1)
    }
    const normalizedContextDistance = normalizeContext(contextDistance)
    const avg = (1 - CONTEXT_WEIGHT) * nameDistance + CONTEXT_WEIGHT * normalizedContextDistance
    return 1 - avg
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

const handleScores = (items: { restaurant: Restaurant; score: number }[]) => {
    const { SCORE_THRESHOLDS } = CONF
    let highChoices = []
    let mediumChoices = []
    let lowChoices = []
    const { high, medium, low } = SCORE_THRESHOLDS
    for (let item of items) {
        const { score } = item
        if (score >= high) highChoices.push(item)
        if (medium <= score && score < high) mediumChoices.push(item)
        if (low <= score && score < medium) lowChoices.push(item)
    }

    if (highChoices.length > 0) {
        //TODO:
    }
    if (mediumChoices.length > 0) {
        //TODO:
    } else {
        //TODO:
    }
}
