"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.latLngDistanceBoost = exports.handleSimilarRestaurants = void 0;
const localizationFeatures_1 = require("../utils/localizationFeatures");
const apiCalls_1 = require("../apiCalls");
const constants_1 = require("../shared/constants");
const dateTimeUtils_1 = require("../utils/dateTimeUtils");
const debugUtils_1 = require("../utils/debugUtils");
const { VALUE_MAP, CONTEXT_WEIGHT, NULL_DISTANCE_SCALING_FACTOR, DISTANCE_THRESHOLD } = constants_1.CONF;
let coordinates = (0, localizationFeatures_1.getCoordinates)();
/**
 * Searches for the restaurants that match better the user query, and gives a score to each one of them based on the distance from the query and the context.
 * @param handlerInput
 * @param slots
 * @returns
 */
const handleSimilarRestaurants = (handlerInput, slots) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { restaurantName, location, date, time, numPeople, yesNo } = slots;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //handlerInput.attributesManager.setSessionAttributes(sessionAttributes)
    let searchResults = [];
    if (!restaurantName || !date || !time || !numPeople) {
        //Ask for the data that's missing before disambiguation
        return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    }
    //The following control checks if it's necessary to retrieve restaurant and in that case it search for them based on a query
    if (!sessionAttributes.isSearchRestaurantCompleted) {
        console.log(`DEBUG: SEARCHING FOR RESTAURANTS`);
        if (coordinates !== undefined && location !== undefined) {
            // Caso in cui HO le coordinate dell'utente MA voglio comunque prenotare altrove
            console.log('DEBUG INSIDE COORDINATES BUT CITY CASE');
            const cityCoordinates = yield (0, apiCalls_1.getCityCoordinates)(location);
            coordinates = cityCoordinates;
            //const locationInfo = { location: coordinates, maxDistance: MAX_DISTANCE }
            searchResults = yield (0, apiCalls_1.searchRestaurants)(restaurantName, undefined, location);
            sessionAttributes.isSearchRestaurantCompleted = true;
            console.log(`DEBUG FOUND ${apiCalls_1.searchRestaurants.length} RESTAURANTS!`);
        }
        else if (coordinates !== undefined && location === undefined) {
            // Caso in cui HO le coordinate dell'utente e NON mi è stata detta la città (quindi devo cercare vicino all'utente)
            console.log('DEBUG INSIDE COORDINATES BUT NOT CITY CASE');
            const locationInfo = { location: coordinates, maxDistance: constants_1.MAX_DISTANCE };
            searchResults = yield (0, apiCalls_1.searchRestaurants)(restaurantName, locationInfo, undefined);
            console.log(`DEBUG FOUND ${apiCalls_1.searchRestaurants.length} RESTAURANTS!`);
            sessionAttributes.isSearchRestaurantCompleted = true;
        }
        else if (coordinates === undefined && location !== undefined) {
            // Caso in cui NON HO le coordinate dell'utente MA mi è stata detta la città
            console.log('DEBUG INSIDE NOT COORDINATES BUT CITY CASE');
            const cityCoordinates = yield (0, apiCalls_1.getCityCoordinates)(location);
            coordinates = cityCoordinates;
            //const locationInfo = { location: coordinates, maxDistance: MAX_DISTANCE }
            searchResults = yield (0, apiCalls_1.searchRestaurants)(restaurantName, undefined, location);
            sessionAttributes.isSearchRestaurantCompleted = true;
            console.log(`DEBUG FOUND ${apiCalls_1.searchRestaurants.length} RESTAURANTS!`);
        }
        else {
            // Altrimenti (non ho né coordinate, né città)..
            return handlerInput.responseBuilder
                .speak(`Sorry, I can't get your location. Can you please tell me the name of the city you want to reserve to?`)
                .reprompt(`Please, tell me the name of a city like "Rome" or "Milan" in which the restaurant is.`)
                .addElicitSlotDirective('location')
                .getResponse();
        }
    }
    //The following control checks if the restaurant scores were computed. If not it computes the scores and save the restaurants with score in a variable.
    if (!sessionAttributes.isRestaurantContextComputationCompleted) {
        let plausibleContexts = [];
        //Examine the search results
        for (let result of searchResults) {
            if (result.nameDistance >= DISTANCE_THRESHOLD)
                continue; //TODO: maybe remove it
            const { id } = result.restaurant;
            const { weekday: currentDay, hour: currentHour, minute: currentMinute } = (0, dateTimeUtils_1.getDateComponentsFromDate)();
            const currentTime = (0, dateTimeUtils_1.parseTime)(currentHour, currentMinute);
            const reservationDateTime = (0, dateTimeUtils_1.convertAmazonDateTime)(date, time);
            const reservationDateComponents = (0, dateTimeUtils_1.getDateComponentsFromDate)(reservationDateTime);
            const { weekday: reservationDay, hour: reservationHour, minute: reservationMinute, } = reservationDateComponents;
            const reservationTime = (0, dateTimeUtils_1.parseTime)(reservationHour, reservationMinute);
            const context = {
                id_restaurant: id,
                n_people: parseInt(numPeople),
                reservationLocation: constants_1.TEST_LATLNG,
                currentDay,
                reservationDay,
                currentTime,
                reservationTime,
            };
            const contextDistance = yield (0, apiCalls_1.getDistanceFromContext)(context);
            plausibleContexts.push({
                restaurant: result.restaurant,
                contextDistance: contextDistance,
                nameDistance: result.nameDistance,
                locationDistance: (_a = result.locationDistance) !== null && _a !== void 0 ? _a : null,
            });
        }
        console.log('DEBUG_PLAUSIBLE_CONTEXT: ', (0, debugUtils_1.beautify)(plausibleContexts)); //TODO: debug
        let scores = [];
        if (plausibleContexts.every(context => context.contextDistance === null)) {
            //If all the context are null, then the score is just 1 - nameDistnace
            console.log("DEBUG CONTEXT: I'm in the case in which every context is null");
            for (let context of plausibleContexts) {
                const { restaurant, locationDistance, nameDistance } = context;
                const { LOCATION_BOOST_FACTOR } = constants_1.CONF;
                const score = 1 - nameDistance;
                let locationBoost = 0;
                if (locationDistance !== null)
                    locationBoost = LOCATION_BOOST_FACTOR * (0, exports.latLngDistanceBoost)(locationDistance, constants_1.MAX_DISTANCE);
                console.log('DEBUG LOCATION BOOST: ', {
                    originalScore: score,
                    boosted: score + locationBoost,
                    boostAmount: `${(0, exports.latLngDistanceBoost)(locationDistance !== null && locationDistance !== void 0 ? locationDistance : 0, constants_1.MAX_DISTANCE)} * ${LOCATION_BOOST_FACTOR} = ${locationBoost}`,
                    locationDistance,
                });
                scores.push({
                    restaurant: restaurant,
                    score: Math.min(1, score + locationBoost),
                });
            }
        }
        else {
            //If a non-null context exists, I have to adjust all the scores accordingly in order to push the restaurant with a context up in the list
            for (let context of plausibleContexts) {
                scores.push({
                    restaurant: context.restaurant,
                    score: computeAggregateScore(context),
                });
            }
        }
        scores.sort((a, b) => b.score - a.score);
        console.log(`DEBUG SCORES: ${(0, debugUtils_1.beautify)(scores)}`); //TODO: debug
        // I save all the restaurants in the restaurant to disambiguate list and iterate over that list until there is one restaurant left
        sessionAttributes.restaurantsToDisambiguate = scores;
    }
    // Remove the restaurant discarded in the previous iteration or accept it if the decision was "yes"
    if (sessionAttributes.lastAnalyzedRestaurant) {
        if (yesNo === 'yes') {
            /*return handlerInput.responseBuilder
                .speak(
                    `You seem that you want to reserve to ${sessionAttributes.lastAnalyzedRestaurant.restaurant.name} in ${sessionAttributes.lastAnalyzedRestaurant.restaurant.address}`,
                )
                .getResponse()
            */
            const reservationDateTime = (0, dateTimeUtils_1.convertAmazonDateTime)(date, time);
            const reservationInfo = {
                id_user: constants_1.USER_ID,
                id_restaurant: sessionAttributes.lastAnalyzedRestaurant.restaurant.id,
                dateTime: reservationDateTime.toString(),
                n_people: Number(numPeople),
                createdAtLatitude: Number(coordinates === null || coordinates === void 0 ? void 0 : coordinates.latitude),
                createdAtLongitude: Number(coordinates === null || coordinates === void 0 ? void 0 : coordinates.longitude)
            };
            console.log(`DEBUG RESERVATION: ${(0, debugUtils_1.beautify)(reservationInfo)}`);
            const addReservationResponse = yield (0, apiCalls_1.createReservation)(reservationInfo);
            console.log(`DEBUG RESERVATION: status ${addReservationResponse}`);
            if (addReservationResponse === 200) {
                return handlerInput.responseBuilder
                    .speak(`Reservation to ${sessionAttributes.lastAnalyzedRestaurant.restaurant.name} in ${(0, localizationFeatures_1.parseAddress)(sessionAttributes.lastAnalyzedRestaurant.restaurant.address, getRestaurantCity(sessionAttributes.lastAnalyzedRestaurant), sessionAttributes.lastAnalyzedRestaurant.restaurant.zone)} successfully added`)
                    .getResponse();
            }
            else {
                return handlerInput.responseBuilder
                    .speak(`Error while making the reservation!`)
                    .getResponse();
            }
        }
        else {
            sessionAttributes.restaurantsToDisambiguate = sessionAttributes.restaurantsToDisambiguate.filter((restaurant) => { var _a; return restaurant.restaurant.id !== ((_a = sessionAttributes.lastAnalyzedRestaurant) === null || _a === void 0 ? void 0 : _a.restaurant.id); });
        }
        sessionAttributes.lastAnalyzedRestaurant = null;
    }
    // Remove the restaurants according to their cuisine types
    if (sessionAttributes.cuisineType && sessionAttributes.cuisineType !== '') {
        // If the user confirms that he wants that types of cuisines, remove the restaurants that doesn't have them
        let restaurantsToDisambiguateWithNotNullCuisines = sessionAttributes.restaurantsToDisambiguate.filter((restaurant) => restaurant.restaurant.macroCuisines !== "");
        if (yesNo === 'yes') {
            restaurantsToDisambiguateWithNotNullCuisines = restaurantsToDisambiguateWithNotNullCuisines.filter((restaurant) => {
                const cuisines = restaurant.restaurant.macroCuisines.split(",").map(part => part.replace(/^\s+/, ''));
                return cuisines.includes(sessionAttributes.cuisineType);
            });
        }
        else {
            // If the user confirms that he doesn't want that types of cuisines, remove the restaurants that have them
            restaurantsToDisambiguateWithNotNullCuisines = restaurantsToDisambiguateWithNotNullCuisines.filter((restaurant) => {
                const cuisines = restaurant.restaurant.macroCuisines.split(",").map(part => part.replace(/^\s+/, ''));
                return !cuisines.includes(sessionAttributes.cuisineType);
            });
        }
        let filteredRestaurants = [];
        for (const restaurant of sessionAttributes.restaurantsToDisambiguate) {
            const found = restaurantsToDisambiguateWithNotNullCuisines.some((r) => r.restaurant.id === restaurant.restaurant.id);
            if (found || restaurant.restaurant.macroCuisines === "") {
                filteredRestaurants.push(restaurant);
            }
        }
        sessionAttributes.restaurantsToDisambiguate = filteredRestaurants;
        sessionAttributes.cuisineType = ''; // Reset cuisine type
    }
    // Disambiguation with city result
    if (sessionAttributes.cityBestRestaurant && sessionAttributes.cityBestRestaurant !== '') {
        if (yesNo === 'yes') {
            //If the response was "yes" it means that the user wants to reserve to the city of the best restaurant so let's remove the ones that are in other cities
            sessionAttributes.restaurantsToDisambiguate = sessionAttributes.restaurantsToDisambiguate.filter((restaurant) => restaurant.restaurant.city === sessionAttributes.cityBestRestaurant);
        }
        else {
            // Otherwise, remove the restaurant in the same city of the best restaurant
            sessionAttributes.restaurantsToDisambiguate = sessionAttributes.restaurantsToDisambiguate.filter((restaurant) => restaurant.restaurant.city !== sessionAttributes.cityBestRestaurant);
        }
        sessionAttributes.cityBestRestaurant = ''; // Reset city best restaurant
    }
    // Disambiguation with zones result
    if (sessionAttributes.zoneBestRestaurant && sessionAttributes.zoneBestRestaurant !== '') {
        if (yesNo === 'yes') {
            //If the response was "yes" it means that the user wants to reserve to the zone of the best restaurant so let's remove the ones that are in other zones
            sessionAttributes.restaurantsToDisambiguate = sessionAttributes.restaurantsToDisambiguate.filter((restaurant) => restaurant.restaurant.zone === sessionAttributes.zoneBestRestaurant);
        }
        else {
            // Otherwise, remove the restaurant in the same zone of the best restaurant
            sessionAttributes.restaurantsToDisambiguate = sessionAttributes.restaurantsToDisambiguate.filter((restaurant) => restaurant.restaurant.zone !== sessionAttributes.zoneBestRestaurant);
        }
        sessionAttributes.zoneBestRestaurant = ''; // Reset zone best restaurant
    }
    // I compute the variance (and the buckets)
    // This is done at each iteration
    const handleResult = handleScores(sessionAttributes.restaurantsToDisambiguate);
    // If the are no restaurants found
    if (!handleResult) {
        return handlerInput.responseBuilder
            .speak(`Sorry, but it looks that I can't find restaurant matching your query. Please, try again with a different restaurant name.`)
            .getResponse();
    }
    console.log(handleResult);
    // If there are more restaurant to disambiguate I save them (as well as the variances)
    if ('restaurants' in handleResult && 'fieldsAndVariances' in handleResult) {
        const { restaurants, fieldsAndVariances } = handleResult;
        sessionAttributes.restaurantsToDisambiguate = restaurants;
        sessionAttributes.fieldsForDisambiguation = fieldsAndVariances;
        sessionAttributes.isRestaurantContextComputationCompleted = true;
    }
    else {
        // No variance, one a restaurant left. I immediatly take it.
        sessionAttributes.restaurantsToDisambiguate = [handleResult];
        sessionAttributes.lastAnalyzedRestaurant = handleResult;
        sessionAttributes.isRestaurantContextComputationCompleted = true;
    }
    console.log(`DISAMBIGUATION_DEBUG: Restaurants to disambiguate left ${(0, debugUtils_1.beautify)(sessionAttributes.restaurantsToDisambiguate)}`);
    console.log(`DISAMBIGUATION_DEBUG: Fields for disambiguation left ${(0, debugUtils_1.beautify)(sessionAttributes.fieldsForDisambiguation)}`);
    // If there is one restaurant left, take it and ask for confirmation
    if (sessionAttributes.restaurantsToDisambiguate.length === 1) {
        const finalRestaurant = sessionAttributes.restaurantsToDisambiguate[0];
        return handlerInput.responseBuilder
            .speak(`Can you confirm that you want to make a reservation to ${finalRestaurant.restaurant.name} in ${(0, localizationFeatures_1.parseAddress)(finalRestaurant.restaurant.address, getRestaurantCity(finalRestaurant), finalRestaurant.restaurant.zone)}, ${(0, dateTimeUtils_1.formatDate)(date)} at ${time} for ${numPeople} ${Number(numPeople) === 1 ? 'person' : 'people'}?`)
            .addElicitSlotDirective('YesNoSlot')
            .getResponse();
    }
    // If there are two restaurants left, ask immediatly if the user wants to reserve to the one with the highest score
    if (sessionAttributes.restaurantsToDisambiguate.length === 2) {
        const restaurantWithHighestScore = getBestRestaurant(sessionAttributes.restaurantsToDisambiguate);
        sessionAttributes.lastAnalyzedRestaurant = restaurantWithHighestScore;
        return handlerInput.responseBuilder
            .speak(`Do you want to reserve to ${restaurantWithHighestScore.restaurant.name} in ${(0, localizationFeatures_1.parseAddress)(restaurantWithHighestScore.restaurant.address, getRestaurantCity(restaurantWithHighestScore), restaurantWithHighestScore.restaurant.zone)}?`)
            .addElicitSlotDirective('YesNoSlot')
            .getResponse();
    }
    // Otherwise (if there are more than 2 resturants) -> disambiguation
    // Take the most discriminative field and remove unwanted resturants until to remain with 1 (it will the one to confirm)
    const disambiguationField = getBestField(sessionAttributes.fieldsForDisambiguation);
    const restaurantWithHighestScore = getBestRestaurant(sessionAttributes.restaurantsToDisambiguate);
    if (disambiguationField.field === 'cuisine') {
        console.log('DISAMBIGUATION DEBUG: You are in the cuisine case!');
        const discriminativeCuisine = getMostDiscriminativeCuisine(sessionAttributes.restaurantsToDisambiguate, restaurantWithHighestScore);
        if (discriminativeCuisine !== undefined) {
            sessionAttributes.cuisineType = discriminativeCuisine;
            return handlerInput.responseBuilder
                .speak(getCuisineAlexaResponse(discriminativeCuisine))
                .addElicitSlotDirective('YesNoSlot')
                .getResponse();
        }
    }
    // Choose to disambiguate with avgRating only if the similarity score between the restaurants is high enough
    if (disambiguationField.field === "avgRating" && isScoreSimilar(sessionAttributes.restaurantsToDisambiguate)) {
        console.log('DISAMBIGUATION DEBUG: You are in the avgRating case!');
        // Sort the restaurants to be disambiguated by their avgRating (highest to lowest)
        // Creates a copy of the original array
        const copyRestaurantsToDisambiguate = sessionAttributes.restaurantsToDisambiguate.slice();
        // Sort the copy by avgRating in descending order
        copyRestaurantsToDisambiguate.sort((a, b) => b.restaurant.avgRating - a.restaurant.avgRating);
        console.log(`DISAMBIGUATION_DEBUG: Restaurants to disambiguate ordered by avgRating ${(0, debugUtils_1.beautify)(copyRestaurantsToDisambiguate)}`);
        // Get the restaurant with the highest avgRating
        sessionAttributes.lastAnalyzedRestaurant = copyRestaurantsToDisambiguate[0];
        return handlerInput.responseBuilder
            .speak(`Do you want to reserve to ${sessionAttributes.lastAnalyzedRestaurant.restaurant.name} in ${(0, localizationFeatures_1.parseAddress)(sessionAttributes.lastAnalyzedRestaurant.restaurant.address, getRestaurantCity(sessionAttributes.lastAnalyzedRestaurant), sessionAttributes.lastAnalyzedRestaurant.restaurant.zone)} with an average rating of ${sessionAttributes.lastAnalyzedRestaurant.restaurant.avgRating}?`)
            .addElicitSlotDirective('YesNoSlot')
            .getResponse();
    }
    // Otherwise, try to disambiguate using latLon (standard behavior)
    // Check if there are different cities and, if so, try to understand if the user wants to reserve to the city of the best restaurant
    const allCities = [...new Set(sessionAttributes.restaurantsToDisambiguate.map((restaurant) => restaurant.restaurant.city))];
    if (allCities.length > 1) {
        sessionAttributes.cityBestRestaurant = restaurantWithHighestScore.restaurant.city;
        return handlerInput.responseBuilder
            .speak(`Is the restaurant in ${getRestaurantCity(restaurantWithHighestScore)}?`)
            .addElicitSlotDirective('YesNoSlot')
            .getResponse();
    }
    // Check if there are different zones (in a certain city) and, if so, try to understand if the user wants to reserve to the city of the best restaurant
    const allZones = sessionAttributes.restaurantsToDisambiguate
        .map((restaurant) => restaurant.restaurant.zone)
        .filter((zone) => !zone.toLowerCase().startsWith('via '));
    console.log(allZones);
    if (allZones.length > 1 &&
        getRestaurantCity(restaurantWithHighestScore).toLowerCase() !==
            restaurantWithHighestScore.restaurant.zone.toLowerCase()) {
        sessionAttributes.zoneBestRestaurant = restaurantWithHighestScore.restaurant.zone;
        return handlerInput.responseBuilder
            .speak(`Is the restaurant in ${sessionAttributes.zoneBestRestaurant} neighboorhood, in ${getRestaurantCity(restaurantWithHighestScore)}?`)
            .addElicitSlotDirective('YesNoSlot')
            .getResponse();
    }
    // Otherwise, simply ask to confirm the best restaurant
    sessionAttributes.lastAnalyzedRestaurant = restaurantWithHighestScore;
    return handlerInput.responseBuilder
        .speak(`Do you want to reserve to ${restaurantWithHighestScore.restaurant.name} in ${(0, localizationFeatures_1.parseAddress)(restaurantWithHighestScore.restaurant.address, getRestaurantCity(restaurantWithHighestScore), restaurantWithHighestScore.restaurant.zone)}?`)
        .addElicitSlotDirective('YesNoSlot')
        .getResponse();
});
exports.handleSimilarRestaurants = handleSimilarRestaurants;
const getMostDiscriminativeCuisine = (restaurants, bestRestaurant) => {
    const cuisinesBestRestaurant = bestRestaurant.restaurant.macroCuisines.split(',').filter(cuisine => cuisine !== "").map(part => part.replace(/^\s+/, '')); // Extract cuisines of the best resturant
    if (cuisinesBestRestaurant.length === 0)
        return undefined;
    let restaurantsWithNotNullCuisines = 0; // Count the restaurants with with not null cuisines (macroCuisines !== "")
    restaurants.forEach((restaurant) => {
        if (restaurant.restaurant.macroCuisines.trim() !== "") {
            restaurantsWithNotNullCuisines++;
        }
    });
    const allCuisines = []; // Array to save all the cuisines
    // Get all cuisines
    restaurants.forEach(restaurant => {
        const cuisines = restaurant.restaurant.macroCuisines.split(",").filter(cuisine => cuisine !== "").map(part => part.replace(/^\s+/, ''));
        allCuisines.push(...cuisines);
    });
    const cuisineCounts = {}; // Array to save the occcurrences for each cuisine
    allCuisines.forEach(cuisine => {
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
    });
    const cuisineCountsArray = Object.entries(cuisineCounts); // Convert object to array of key-value pairs
    cuisineCountsArray.sort((a, b) => a[1] - b[1]); // Sort array based on number of occurrences
    console.log(`DISAMBIGUATION DEBUG: I found ${cuisinesBestRestaurant.length} cuisines in the best resturant: ${(0, debugUtils_1.beautify)(cuisinesBestRestaurant)}`);
    console.log(`DISAMBIGUATION DEBUG: I found these cuisines in the restaurants to disambiguate: ${(0, debugUtils_1.beautify)(cuisineCountsArray)}`);
    let selectedCuisines;
    for (const [cuisine, count] of cuisineCountsArray) {
        // Get the cuisine in the best restaurant that has the lowest number of occurrences in restaurants to disambiguate
        if (cuisinesBestRestaurant.includes(cuisine) && count !== restaurantsWithNotNullCuisines) {
            selectedCuisines = cuisine;
        }
    }
    // If there is no "unique" discriminative cuisine (the least common cuisine in the best restaurant is in all restaurants)
    if (!selectedCuisines) {
        console.log(`DISAMBIGUATION DEBUG: I didn't find a discriminative cuisines in the best restaurant so I will try to get the most discriminative one in the other restaurants`);
        for (const [cuisine, count] of cuisineCountsArray) {
            // Get the cuisine that has the highest number of occurrences in restaurants to disambiguate (but not in the best restaurant!)
            if (count !== restaurantsWithNotNullCuisines) {
                selectedCuisines = cuisine;
            }
        }
    }
    if (!selectedCuisines) {
        console.log(`DISAMBIGUATION DEBUG: I couldn't find any discriminative cuisines. I'll abort the cuisine disambiguation!`);
    }
    else {
        console.log(`DISAMBIGUATION DEBUG: Final discrivimative cuisines: ${(0, debugUtils_1.beautify)(selectedCuisines)}`);
    }
    return selectedCuisines;
};
const isScoreSimilar = (restaurantsToDisambiguate) => {
    // Calculate the average of the "score" values
    const scores = restaurantsToDisambiguate.map(restaurant => restaurant.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    console.log(`DISAMBIGUATION_DEBUG: isScoreSimilar ${(0, debugUtils_1.beautify)(scores)}`);
    console.log(`DISAMBIGUATION_DEBUG: isScoreSimilar ${(0, debugUtils_1.beautify)(averageScore)}`);
    // Set the tolerance value
    const tolerance = 0.1;
    // Check whether the "score" values are similar within tolerance
    const isScoreSimilar = scores.every(score => Math.abs(score - averageScore) <= tolerance);
    console.log(`DISAMBIGUATION_DEBUG: isScoreSimilar ${(0, debugUtils_1.beautify)(isScoreSimilar)}`);
    return isScoreSimilar;
};
const getRestaurantCity = (restaurant) => {
    let city = restaurant.restaurant.city;
    if (city === 'ome')
        city = 'rome';
    return city.charAt(0).toUpperCase() + city.slice(1);
};
const getBestRestaurant = (restaurants) => {
    return restaurants.reduce((highestScoreRestaurant, currentRestaurant) => {
        if (currentRestaurant.score > highestScoreRestaurant.score) {
            return currentRestaurant;
        }
        return highestScoreRestaurant;
    });
};
const getBestField = (fieldsAndVariances) => {
    const [maxPropertyName, maxValue] = Object.entries(fieldsAndVariances).reduce((acc, [property, value]) => (value > acc[1] ? [property, value] : acc), ['', -Infinity]);
    return { field: maxPropertyName, variance: maxValue };
};
const getCuisineAlexaResponse = (cuisinetype) => {
    if (cuisinetype === 'bar' || cuisinetype === 'pub') {
        return `Is the place you're looking fore a ${cuisinetype}?`;
    }
    return `Does the restaurant you're looking for have ${cuisinetype} dishes in the menu?`;
};
/**
 * Computes the aggregate score between the contextDistance and the nameDistance. The higher the score, the better.
 * @param context
 * @returns
 */
const computeAggregateScore = (context) => {
    const { contextDistance, nameDistance, locationDistance } = context;
    let locationBoost = 0;
    const { LOCATION_BOOST_FACTOR } = constants_1.CONF;
    if (contextDistance == null) {
        const minNameDistance = Math.max(nameDistance, 0.05); // The name distance won't ever be 0 because of floats, so it has to be increased a little bit for the scaling to work
        let score = 1 - Math.min(Math.pow(minNameDistance, NULL_DISTANCE_SCALING_FACTOR), 1);
        if (locationDistance !== null)
            locationBoost = LOCATION_BOOST_FACTOR * (0, exports.latLngDistanceBoost)(locationDistance, constants_1.MAX_DISTANCE);
        console.log('DEBUG LOCATION BOOST: ', {
            originalScore: score,
            boosted: score + locationBoost,
            boostAmount: `${(0, exports.latLngDistanceBoost)(locationDistance !== null && locationDistance !== void 0 ? locationDistance : 0, constants_1.MAX_DISTANCE)} * ${LOCATION_BOOST_FACTOR} = ${locationBoost}`,
            locationDistance,
        });
        return Math.min(1, score + locationBoost);
    }
    const normalizedContextDistance = normalizeContext(contextDistance);
    const avg = (1 - CONTEXT_WEIGHT) * nameDistance + CONTEXT_WEIGHT * normalizedContextDistance;
    let score = 1 - avg;
    if (locationDistance !== null)
        locationBoost = LOCATION_BOOST_FACTOR * (0, exports.latLngDistanceBoost)(locationDistance, constants_1.MAX_DISTANCE);
    console.log('DEBUG LOCATION BOOST: ', {
        originalScore: score,
        boosted: score + locationBoost,
        boostAmount: `${(0, exports.latLngDistanceBoost)(locationDistance !== null && locationDistance !== void 0 ? locationDistance : 0, constants_1.MAX_DISTANCE)} * ${LOCATION_BOOST_FACTOR} = ${locationBoost}`,
        locationDistance,
    });
    return Math.min(1, score + locationBoost);
};
/**
 * Normalizes the inputValue according to the valueMap distribution, interpolating the values in between.
 * @param inputValue
 * @returns
 */
const normalizeContext = (inputValue) => {
    // Sort the input values
    const sortedValues = VALUE_MAP.map(([inputValue]) => inputValue).sort((a, b) => a - b);
    // Find the index of inputValue in the sorted list
    const index = sortedValues.findIndex(value => inputValue <= value);
    if (index === 0) {
        // If inputValue is less than the smallest value in the list, return the normalized value of the smallest value
        return VALUE_MAP[0][1];
    }
    else if (index === -1) {
        // If inputValue is greater than the largest value in the list, return the normalized value of the largest value
        return VALUE_MAP[VALUE_MAP.length - 1][1];
    }
    else {
        // Interpolate between the normalized values based on the index
        const [prevValue, prevNormalizedValue] = VALUE_MAP[index - 1];
        const [nextValue, nextNormalizedValue] = VALUE_MAP[index];
        const t = (inputValue - prevValue) / (nextValue - prevValue);
        return prevNormalizedValue + (nextNormalizedValue - prevNormalizedValue) * t;
    }
};
const handleScores = (items) => {
    const { SCORE_THRESHOLDS } = constants_1.CONF;
    let highChoices = [];
    let mediumChoices = [];
    let lowChoices = [];
    const { high, medium, low } = SCORE_THRESHOLDS;
    for (let item of items) {
        const { score } = item;
        if (score >= high)
            highChoices.push(item);
        if (medium <= score && score < high)
            mediumChoices.push(item);
        if (low <= score && score < medium)
            lowChoices.push(item);
    }
    if (highChoices.length > 0) {
        console.log(`CHOICES_DEBUG: Inside high choices with length of ${highChoices.length}. The object is ${(0, debugUtils_1.beautify)(highChoices)}`);
        const fieldsAndVariances = computeVariances(highChoices);
        if (fieldsAndVariances) {
            return { restaurants: highChoices, fieldsAndVariances: fieldsAndVariances };
        }
        return highChoices[0];
    }
    if (mediumChoices.length > 0) {
        //TODO: Change this, for now it's just a copy of the highChoices
        console.log(`CHOICES_DEBUG: Inside medium choices with length of ${mediumChoices.length}. The object is ${(0, debugUtils_1.beautify)(mediumChoices)}`);
        const fieldsAndVariances = computeVariances(mediumChoices);
        if (fieldsAndVariances) {
            return { restaurants: mediumChoices, fieldsAndVariances: fieldsAndVariances };
        }
        return mediumChoices[0];
    }
    if (lowChoices.length > 0) {
        //TODO: Change this, for now it's just a copy of the highChoices
        console.log(`CHOICES_DEBUG: Inside low choices with length of ${lowChoices.length}. The object is ${(0, debugUtils_1.beautify)(lowChoices)}`);
        const fieldsAndVariances = computeVariances(lowChoices);
        if (fieldsAndVariances) {
            return { restaurants: lowChoices, fieldsAndVariances: fieldsAndVariances };
        }
        return lowChoices[0];
    }
    return null;
};
const latLngDistanceBoost = (locationDistance, maxDistance) => {
    if (locationDistance > maxDistance / 3)
        return 0;
    locationDistance += 50; //Avoid log(0)
    const normalizedDistance = locationDistance / maxDistance;
    const boost = 1 - (-Math.log(1 / normalizedDistance) / Math.log(100) + 1); // 1 - (-log_100(1/x)+1)
    const MIN = 0;
    const MAX = 1;
    return Math.min(Math.max(boost, MIN), MAX); //Clamp between 0 and 1
};
exports.latLngDistanceBoost = latLngDistanceBoost;
//******************************************//
//********COMPUTING VARIANCES***************//
//******************************************//
const computeVariances = (items) => {
    if (items.length <= 1)
        return null;
    let allLatLng = [];
    let allCities = [];
    let allCuisines = [];
    let allAvgRating = [];
    for (let { restaurant, score } of items) {
        const { latitude, longitude, city, cuisines, avgRating } = restaurant;
        allLatLng.push({ latitude, longitude });
        allCities.push([city]);
        allCuisines.push(cuisines.split(',').map(item => item.trim()));
        allAvgRating.push(avgRating);
    }
    console.log(`DEBUG DATA: ${(0, debugUtils_1.beautify)({
        allLatLng: allLatLng,
        allCities: allCities,
        allCuisines: allCuisines,
        allAvgRating: allAvgRating,
    })}`);
    const variances = {
        latLng: computeLatLngVariance(allLatLng).variance,
        city: computeStringArrayVariance(allCities).variance,
        cuisine: computeStringArrayVariance(allCuisines).variance,
        avgRating: computeSimpleVariance(allAvgRating).variance,
    };
    return variances;
};
const computeSimpleVariance = (values) => {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const sumOfSquaredDifferences = squaredDifferences.reduce((sum, difference) => sum + difference, 0);
    const variance = sumOfSquaredDifferences / values.length;
    const standardDeviation = Math.sqrt(variance);
    return { mean, std: standardDeviation, variance };
};
const computeLatLngVariance = (values) => {
    // Calculate the average latitude and longitude
    const sumLatitude = values.reduce((sum, { latitude }) => sum + latitude, 0);
    const sumLongitude = values.reduce((sum, { longitude }) => sum + longitude, 0);
    const avgLatitude = sumLatitude / values.length;
    const avgLongitude = sumLongitude / values.length;
    // Calculate the sum of squared distances
    const sumSquaredDistances = values.reduce((sum, { latitude, longitude }) => {
        const distance = (0, localizationFeatures_1.distanceBetweenCoordinates)({ latitude, longitude }, { latitude: avgLatitude, longitude: avgLongitude }) /
            1000; //Distance in km instead of meters
        return sum + distance * distance;
    }, 0);
    // Calculate the sum of distances
    const mean = values.reduce((sum, { latitude, longitude }) => {
        const distance = (0, localizationFeatures_1.distanceBetweenCoordinates)({ latitude, longitude }, { latitude: avgLatitude, longitude: avgLongitude }) / 1000; //Distance in km instead of meters
        return sum + distance;
    }, 0) / values.length;
    const variance = sumSquaredDistances / (values.length - 1);
    const standardDeviation = Math.sqrt(variance);
    return { mean, std: standardDeviation, variance };
};
const computeStringArrayVariance = (values) => {
    const uniqueCategories = new Set();
    for (const arr of values) {
        for (const str of arr) {
            uniqueCategories.add(str);
        }
    }
    const numUniqueCategories = uniqueCategories.size;
    // Calculate the average count of unique categories
    const avgCount = numUniqueCategories / values.length;
    // Calculate the sum of squared differences from the average count
    const sumSquaredDifferences = values.reduce((sum, arr) => {
        const numUniqueInArr = new Set(arr).size;
        const difference = numUniqueInArr - avgCount;
        return sum + difference * difference;
    }, 0);
    const mean = sumSquaredDifferences / values.length;
    // Calculate the variance
    const variance = sumSquaredDifferences / (values.length - 1);
    const standardDeviation = Math.sqrt(variance);
    return { mean, std: standardDeviation, variance };
};
