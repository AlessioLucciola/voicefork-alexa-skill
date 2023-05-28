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
const apiCalls_2 = require("../apiCalls");
const constants_1 = require("../shared/constants");
const dateTimeUtils_1 = require("../utils/dateTimeUtils");
/**
 * Searches for the restaurants that match better the user query, and gives a score to each one of them based on the distance from the query and the context.
 * @param handlerInput
 * @param slots
 * @returns
 */
const handleSimilarRestaurants = (handlerInput, slots) => __awaiter(void 0, void 0, void 0, function* () {
    const { restaurantName, location, date, time, numPeople, yesNo } = slots;
    const DISTANCE_THRESHOLD = 0.3;
    const CONTEXT_SOFT_THRESHOLD = 2;
    const CONTEXT_HARD_THRESHOLD = 0.5;
    let searchResults = [];
    const coordinates = (0, localizationFeatures_1.default)();
    if (!restaurantName || !date || !time || !numPeople) {
        //Ask for the data that's missing before disambiguation
        return handlerInput.responseBuilder.addDelegateDirective().getResponse();
    }
    if (coordinates) {
        const locationInfo = { location: coordinates, maxDistance: 40000 };
        searchResults = yield (0, apiCalls_1.searchRestaurants)(restaurantName, locationInfo);
    }
    else {
        searchResults = yield (0, apiCalls_1.searchRestaurants)(restaurantName, undefined, location !== null && location !== void 0 ? location : 'Rome');
    }
    let plausibleContexts = [];
    //Examine the search results
    for (let result of searchResults) {
        if (result.nameDistance > DISTANCE_THRESHOLD)
            continue;
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
        const contextDistance = yield (0, apiCalls_2.getDistanceFromContext)(context);
        plausibleContexts.push({
            restaurant: result.restaurant,
            contextDistance: contextDistance,
            nameDistance: result.nameDistance,
        });
    }
    console.log(JSON.stringify(plausibleContexts, null, 2)); //TODO: debug
    let scores = [];
    for (let context of plausibleContexts) {
        scores.push({
            restaurant: context.restaurant,
            score: computeAggregateScore(context),
        });
    }
    //Examine the plausible restaurants
    console.log(JSON.stringify(scores, null, 2)); //TODO: debug
    return handlerInput.responseBuilder
        .speak(`I examined the results, they are ${scores.length}, the top 3 are: ${JSON.stringify(scores.slice(0, 3))}`)
        .getResponse();
});
exports.handleSimilarRestaurants = handleSimilarRestaurants;
const computeAggregateScore = (context) => {
    const { contextDistance, nameDistance } = context;
    const NAME_WEIGHT = 0.7;
    const CONTEXT_WEIGHT = 0.3;
    if (contextDistance == null) {
        return Math.min(nameDistance * 1.2, 1); //TODO: doesn't work so well
    }
    const normalizedContextDistance = normalizeContext(contextDistance);
    const avg = NAME_WEIGHT * nameDistance + CONTEXT_WEIGHT * normalizedContextDistance;
    return avg;
};
const normalizeContext = (inputValue) => {
    // Map that regulates the normalization. The values in between are interpolated.
    const valueMap = [
        [0, 0],
        [0.1, 0.01],
        [0.2, 0.05],
        [0.3, 0.1],
        [0.5, 0.3],
        [1, 0.4],
        [2, 0.5],
        [3, 0.6],
        [20, 0.8],
        [100, 1],
    ];
    // Sort the input values
    const sortedValues = valueMap.map(([inputValue]) => inputValue).sort((a, b) => a - b);
    // Find the index of inputValue in the sorted list
    const index = sortedValues.findIndex(value => inputValue <= value);
    if (index === 0) {
        // If inputValue is less than the smallest value in the list, return the normalized value of the smallest value
        return valueMap[0][1];
    }
    else if (index === -1) {
        // If inputValue is greater than the largest value in the list, return the normalized value of the largest value
        return valueMap[valueMap.length - 1][1];
    }
    else {
        // Interpolate between the normalized values based on the index
        const [prevValue, prevNormalizedValue] = valueMap[index - 1];
        const [nextValue, nextNormalizedValue] = valueMap[index];
        const t = (inputValue - prevValue) / (nextValue - prevValue);
        return prevNormalizedValue + (nextNormalizedValue - prevNormalizedValue) * t;
    }
};
