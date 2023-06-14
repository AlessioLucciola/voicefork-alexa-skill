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
exports.handleSimilarRestaurants = void 0;
const localizationFeatures_1 = require("../utils/localizationFeatures");
const apiCalls_1 = require("../apiCalls");
const constants_1 = require("../shared/constants");
const dateTimeUtils_1 = require("../utils/dateTimeUtils");
const debugUtils_1 = require("../utils/debugUtils");
const { VALUE_MAP, CONTEXT_WEIGHT, NULL_DISTANCE_SCALING_FACTOR, DISTANCE_THRESHOLD } = constants_1.CONF;
let coordinates = (0, localizationFeatures_1.default)();
let isSearchRestaurantCompleted = false;
let isRestaurantContextComputationCompleted = false;
let restaurantsToDisambiguate;
let fieldsForDisambiguation;
let lastAnalyzedRestaurant;
let cityBestRestaurant;
let zoneBestRestaurant;
let usedFields;
/**
 * Searches for the restaurants that match better the user query, and gives a score to each one of them based on the distance from the query and the context.
 * @param handlerInput
 * @param slots
 * @returns
 */
const handleSimilarRestaurants = (handlerInput, slots) => __awaiter(void 0, void 0, void 0, function* () {
    let { restaurantName, location, date, time, numPeople, yesNo } = slots;
    let searchResults = [];
    if (!restaurantName || !date || !time || !numPeople) {
        //Ask for the data that's missing before disambiguation
        return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    }
    //The following control checks if it's necessary to retrieve restaurant and in that case it search for them based on a query
    if (!isSearchRestaurantCompleted) {
        console.log(`DEBUG: SEARCHING FOR RESTAURANTS`);
        if (coordinates !== undefined && location !== undefined) {
            // Caso in cui HO le coordinate dell'utente MA voglio comunque prenotare altrove
            console.log('DEBUG INSIDE COORDINATES BUT CITY CASE');
            const cityCoordinates = yield (0, apiCalls_1.getCityCoordinates)(location);
            coordinates = cityCoordinates;
            const locationInfo = { location: coordinates, maxDistance: constants_1.MAX_DISTANCE };
            searchResults = yield (0, apiCalls_1.searchRestaurants)(restaurantName, locationInfo, undefined);
            isSearchRestaurantCompleted = true;
            console.log(`DEBUG FOUND ${apiCalls_1.searchRestaurants.length} RESTAURANTS!`);
        }
        else if (coordinates !== undefined && location === undefined) {
            // Caso in cui HO le coordinate dell'utente e NON mi è stata detta la città (quindi devo cercare vicino all'utente)
            console.log('DEBUG INSIDE COORDINATES BUT NOT CITY CASE');
            const locationInfo = { location: coordinates, maxDistance: constants_1.MAX_DISTANCE };
            searchResults = yield (0, apiCalls_1.searchRestaurants)(restaurantName, locationInfo, undefined);
            console.log(`DEBUG FOUND ${apiCalls_1.searchRestaurants.length} RESTAURANTS!`);
            isSearchRestaurantCompleted = true;
        }
        else if (coordinates === undefined && location !== undefined) {
            // Caso in cui NON HO le coordinate dell'utente MA mi è stata detta la città
            console.log('DEBUG INSIDE NOT COORDINATES BUT CITY CASE');
            const cityCoordinates = yield (0, apiCalls_1.getCityCoordinates)(location);
            coordinates = cityCoordinates;
            const locationInfo = { location: coordinates, maxDistance: constants_1.MAX_DISTANCE };
            searchResults = yield (0, apiCalls_1.searchRestaurants)(restaurantName, locationInfo, undefined);
            isSearchRestaurantCompleted = true;
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
    if (!isRestaurantContextComputationCompleted) {
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
            const { weekday: reservationDay, hour: reservationHour, minute: reservationMinute } = reservationDateComponents;
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
            });
        }
        console.log('DEBUG_PLAUSIBLE_CONTEXT: ', (0, debugUtils_1.beautify)(plausibleContexts)); //TODO: debug
        let scores = [];
        if (plausibleContexts.every(context => context === null)) {
            //If all the context are null, then the score is just 1 - nameDistnace
            for (let context of plausibleContexts) {
                scores.push({
                    restaurant: context.restaurant,
                    score: context.nameDistance,
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
        restaurantsToDisambiguate = scores;
    }
    // Remove the restaurant discarded in the previous iteration or accept it if the decision was "yes"
    if (lastAnalyzedRestaurant) {
        if (yesNo === 'yes') {
            return handlerInput.responseBuilder
                .speak(`You seem that you want to reserve to ${lastAnalyzedRestaurant.restaurant.name} in ${lastAnalyzedRestaurant.restaurant.address}`)
                .getResponse();
        }
        else {
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter((restaurant) => restaurant.restaurant.id !== (lastAnalyzedRestaurant === null || lastAnalyzedRestaurant === void 0 ? void 0 : lastAnalyzedRestaurant.restaurant.id));
        }
        lastAnalyzedRestaurant = null;
    }
    // Disambiguation with city result
    if (cityBestRestaurant && cityBestRestaurant !== "") {
        if (yesNo === 'yes') { //If the response was "yes" it means that the user wants to reserve to the city of the best restaurant so let's remove the ones that are in other cities
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter(restaurant => restaurant.restaurant.city === cityBestRestaurant);
        }
        else { // Otherwise, remove the restaurant in the same city of the best restaurant
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter(restaurant => restaurant.restaurant.city !== cityBestRestaurant);
        }
        cityBestRestaurant = ""; // Reset city best restaurant
    }
    // Disambiguation with zones result
    if (zoneBestRestaurant && zoneBestRestaurant !== "") {
        if (yesNo === 'yes') { //If the response was "yes" it means that the user wants to reserve to the zone of the best restaurant so let's remove the ones that are in other zones
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter(restaurant => restaurant.restaurant.zone === zoneBestRestaurant);
        }
        else { // Otherwise, remove the restaurant in the same zone of the best restaurant
            restaurantsToDisambiguate = restaurantsToDisambiguate.filter(restaurant => restaurant.restaurant.zone !== zoneBestRestaurant);
        }
        zoneBestRestaurant = ""; // Reset zone best restaurant
    }
    // I compute the variance (and the buckets)
    // This is done at each iteration
    const handleResult = handleScores(restaurantsToDisambiguate);
    // If the are no restaurants found
    if (!handleResult) {
        return handlerInput.responseBuilder.speak(`Sorry, but it looks that I can't find restaurant matching your query. Please, try again with a different restaurant name.`).getResponse();
    }
    console.log(handleResult);
    // If there are more restaurant to disambiguate I save them (as well as the variances)
    if ('restaurants' in handleResult && 'fieldsAndVariances' in handleResult) {
        const { restaurants, fieldsAndVariances } = handleResult;
        restaurantsToDisambiguate = restaurants;
        fieldsForDisambiguation = fieldsAndVariances;
        isRestaurantContextComputationCompleted = true;
    }
    else {
        // No variance, one a restaurant left. I immediatly take it.
        restaurantsToDisambiguate = [handleResult];
        lastAnalyzedRestaurant = handleResult;
        isRestaurantContextComputationCompleted = true;
    }
    console.log(`DISAMBIGUATION_DEBUG: Restaurants to disambiguate left ${(0, debugUtils_1.beautify)(restaurantsToDisambiguate)}`);
    console.log(`DISAMBIGUATION_DEBUG: Fields for disambiguation left ${(0, debugUtils_1.beautify)(fieldsForDisambiguation)}`);
    // If there is one restaurant left, take it and ask for confirmation
    if (restaurantsToDisambiguate.length === 1) {
        const finalRestaurant = restaurantsToDisambiguate[0];
        return handlerInput.responseBuilder
            .speak(`Can you confirm that you want to make a reservation to ${finalRestaurant.restaurant.name} in ${finalRestaurant.restaurant.address}, ${date} at ${time} for ${numPeople}?`)
            .addElicitSlotDirective('YesNoSlot')
            .getResponse();
    }
    // If there are two restaurants left, ask immediatly if the user wants to reserve to the one with the highest score
    if (restaurantsToDisambiguate.length === 2) {
        const restaurantWithHighestScore = getBestRestaurant(restaurantsToDisambiguate);
        lastAnalyzedRestaurant = restaurantWithHighestScore;
        return handlerInput.responseBuilder
            .speak(`Do you want to reserve to ${restaurantWithHighestScore.restaurant.name} in ${restaurantWithHighestScore.restaurant.address}?`)
            .addElicitSlotDirective('YesNoSlot')
            .getResponse();
    }
    // Otherwise (if there are more than 2 resturants) -> disambiguation
    // Take the most discriminative field and remove unwanted resturants until to remain with 1 (it will the one to confirm)
    const disambiguationField = getBestField(fieldsForDisambiguation);
    // If the best field is latLng, try to understand if there are some ways to disambiguate
    const restaurantWithHighestScore = getBestRestaurant(restaurantsToDisambiguate);
    if (disambiguationField.field === "latLng" && coordinates !== undefined) {
        // Check if there are different cities and, if so, try to understand if the user wants to reserve to the city of the best restaurant
        const allCities = [...new Set(restaurantsToDisambiguate.map(restaurant => restaurant.restaurant.city))];
        if (allCities.length > 1) {
            cityBestRestaurant = restaurantWithHighestScore.restaurant.city;
            return handlerInput.responseBuilder
                .speak(`Is the restaurant in ${getRestaurantCity(restaurantWithHighestScore)}?`)
                .addElicitSlotDirective('YesNoSlot')
                .getResponse();
        }
        // Check if there are different zones (in a certain city) and, if so, try to understand if the user wants to reserve to the city of the best restaurant
        const allZones = restaurantsToDisambiguate.map(restaurant => restaurant.restaurant.zone).filter(zone => !zone.toLowerCase().startsWith('via '));
        console.log(allZones);
        if (allZones.length > 1 && getRestaurantCity(restaurantWithHighestScore).toLowerCase() !== restaurantWithHighestScore.restaurant.zone.toLowerCase()) {
            zoneBestRestaurant = restaurantWithHighestScore.restaurant.zone;
            return handlerInput.responseBuilder
                .speak(`Is the restaurant in ${zoneBestRestaurant} neighboorhood, in ${getRestaurantCity(restaurantWithHighestScore)}?`)
                .addElicitSlotDirective('YesNoSlot')
                .getResponse();
        }
        // Otherwise, simply ask to confirm the best restaurant
        lastAnalyzedRestaurant = restaurantWithHighestScore;
        return handlerInput.responseBuilder
            .speak(`Do you want to reserve to ${restaurantWithHighestScore.restaurant.name} in ${restaurantWithHighestScore.restaurant.address}?`)
            .addElicitSlotDirective('YesNoSlot')
            .getResponse();
    }
    //TO DO: THIS SHOULDN'T EXIST. ALL POSSIBLE CASES MUST BE DONE.
    return handlerInput.responseBuilder
        .speak(`You reached the bottom. I can't make the reservation.`)
        .getResponse();
});
exports.handleSimilarRestaurants = handleSimilarRestaurants;
const getRestaurantCity = (restaurant) => {
    let city = restaurant.restaurant.city;
    if (city === "ome")
        city = "rome";
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
/**
 * Computes the aggregate score between the contextDistance and the nameDistance. The higher the score, the better.
 * @param context
 * @returns
 */
const computeAggregateScore = (context) => {
    const { contextDistance, nameDistance } = context;
    if (contextDistance == null) {
        const minNameDistance = Math.max(nameDistance, 0.05); // The name distance won't ever be 0 because of floats, so it has to be increased a little bit for the scaling to work
        return 1 - Math.min(Math.pow(minNameDistance, NULL_DISTANCE_SCALING_FACTOR), 1);
    }
    const normalizedContextDistance = normalizeContext(contextDistance);
    const avg = (1 - CONTEXT_WEIGHT) * nameDistance + CONTEXT_WEIGHT * normalizedContextDistance;
    return 1 - avg;
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
        latLng: computeLatLngVariance(allLatLng),
        city: computeStringArrayVariance(allCities),
        cuisine: computeStringArrayVariance(allCuisines),
        avgRating: computeSimpleVariance(allAvgRating),
    };
    console.log(`DEBUG VARIANCES (before normalization): ${(0, debugUtils_1.beautify)(variances)}`);
    const normalizedVariances = normalizeVariances(variances);
    console.log(`DEBUG NORMALIZED VARIANCES: ${(0, debugUtils_1.beautify)(normalizedVariances)}`);
    return normalizedVariances;
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
        const distance = (0, localizationFeatures_1.distanceBetweenCoordinates)({ latitude, longitude }, { latitude: avgLatitude, longitude: avgLongitude });
        return sum + distance * distance;
    }, 0);
    // Calculate the sum of distances
    const mean = values.reduce((sum, { latitude, longitude }) => {
        const distance = (0, localizationFeatures_1.distanceBetweenCoordinates)({ latitude, longitude }, { latitude: avgLatitude, longitude: avgLongitude });
        return sum + distance;
    }, 0) / values.length;
    const variance = sumSquaredDistances / (values.length - 1);
    const standardDeviation = Math.sqrt(variance);
    return { mean, std: standardDeviation, variance };
};
const computeStringArrayVariance = (values) => {
    const countUniqueStrings = (arr) => {
        const uniqueStrings = new Set(arr);
        return uniqueStrings.size;
    };
    // Calculate the average count of different strings
    const sumCounts = values.reduce((sum, arr) => sum + countUniqueStrings(arr), 0);
    const avgCount = sumCounts / values.length;
    // Calculate the sum of squared differences from the average count
    const sumSquaredDifferences = values.reduce((sum, arr) => {
        const difference = countUniqueStrings(arr) - avgCount;
        return sum + difference * difference;
    }, 0);
    const mean = values.reduce((sum, arr) => {
        const difference = countUniqueStrings(arr) - avgCount;
        return sum + difference * difference;
    }, 0) / values.length;
    // Calculate the variance
    const variance = sumSquaredDifferences / (values.length - 1);
    const standardDeviation = Math.sqrt(variance);
    return { mean, std: standardDeviation, variance };
};
const normalizeVariances = (variances) => {
    let { latLng, city, cuisine, avgRating } = variances;
    latLng = latLng;
    city = city;
    cuisine = cuisine;
    avgRating = avgRating;
    const zScore = (item) => {
        return (item.variance - item.mean) / item.std;
    };
    return {
        latLng: zScore(latLng),
        city: zScore(city),
        cuisine: zScore(cuisine),
        avgRating: zScore(avgRating),
    };
};
