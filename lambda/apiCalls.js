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
exports.getCityCoordinates = exports.getDistanceFromContext = exports.searchRestaurants = exports.searchNearbyRestaurants = void 0;
const urls_1 = require("./shared/urls");
const axios_1 = require("axios");
const constants_1 = require("./shared/constants");
const searchNearbyRestaurants = (query, coordinates) => __awaiter(void 0, void 0, void 0, function* () {
    const { latitude, longitude } = coordinates;
    const LIMIT = 500;
    // Search for the restaurants in a range of MAX_DISTANCE meters, ordered by simlarity to the query and capped at LIMIT results.
    const URL = `${urls_1.RESTAURANTS_URL}/search-restaurants?query=${query}&latitude=${latitude}&longitude=${longitude}&maxDistance=${constants_1.MAX_DISTANCE}&limit=${LIMIT}`;
    const config = {
        headers: {
            'ngrok-skip-browser-warning ': 'true',
        },
    };
    const searchResult = (yield axios_1.default.get(URL, config)).data;
    return searchResult;
});
exports.searchNearbyRestaurants = searchNearbyRestaurants;
/**
 * Returns the list of restaurants, sorted by their distance from the query.
 * If the latitude and longitude are defined, the response also includes the distance in meters from the restaurant.
 * @param query
 * @param locationInfo
 * @param city
 * @returns
 */
const searchRestaurants = (query, locationInfo, city) => __awaiter(void 0, void 0, void 0, function* () {
    let URL = '';
    const LIMIT = 500;
    if (locationInfo) {
        const { location, maxDistance } = locationInfo;
        const { latitude, longitude } = location;
        URL = `${urls_1.RESTAURANTS_URL}/search-restaurants?query=${query}&latitude=${latitude}&longitude=${longitude}&maxDistance=${constants_1.MAX_DISTANCE}&limit=${LIMIT}`;
    }
    else {
        URL = `${urls_1.RESTAURANTS_URL}/search-restaurants?query=${query}&city=${city}&limit=${LIMIT}`;
    }
    console.log(`Made api call to ${URL}`);
    const data = (yield axios_1.default.get(URL)).data;
    console.log(`${URL} returned ${JSON.stringify(data, null, 2)}`);
    return data;
});
exports.searchRestaurants = searchRestaurants;
/**
 * Given a context, it returns the distance from the context for that id_restaurant.
 * //TODO: For how the API are implemented now, the user is not even considered and we assume there is only one user.
 * @param context
 * @returns
 */
const getDistanceFromContext = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_restaurant, n_people, reservationLocation, currentDay, reservationDay, currentTime, reservationTime } = context;
    const { latitude, longitude } = reservationLocation;
    const URL = `${urls_1.RESERVATIONS_URL}/get-distance-context?id_restaurant=${id_restaurant}&n_people=${n_people}&latitude=${latitude}&longitude=${longitude}&currentDay=${currentDay}&reservationDay=${reservationDay}&currentTime=${currentTime}&reservationTime=${reservationTime}`;
    console.log(`Made api call to ${URL}`);
    const data = (yield axios_1.default.get(URL)).data;
    console.log(`${URL} returned ${JSON.stringify(data, null, 2)}`);
    return data.distance;
});
exports.getDistanceFromContext = getDistanceFromContext;
const getCityCoordinates = (city) => __awaiter(void 0, void 0, void 0, function* () {
    const URL = `https://geocode.maps.co/search?city=${city}`;
    const response = yield axios_1.default.get(URL);
    console.log(`Made api call to ${URL}`);
    if (response.status === 200) {
        if (response.data.length > 0) {
            const lat = response.data[0].lat;
            const lon = response.data[0].lon;
            console.log(`${URL} returned these coordinates: lat = (${lat}), lon = (${lon})}`);
            const cityCoordinates = { latitude: lat, longitude: lon };
            return cityCoordinates;
        }
        console.log(`${city} not found. Setting coordinates to "Rome" ones.`);
        return constants_1.ROME_LATLNG;
    }
    else {
        console.log(`${URL} call returned an error. Setting coordinates to "Rome" ones.`);
        return constants_1.ROME_LATLNG;
    }
});
exports.getCityCoordinates = getCityCoordinates;
