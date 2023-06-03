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
exports.searchRestaurantsByCity = exports.searchRestaurants = void 0;
const urls_1 = require("./shared/urls");
const axios_1 = require("axios");
const searchRestaurants = (query, coordinates) => __awaiter(void 0, void 0, void 0, function* () {
    const { latitude, longitude } = coordinates;
    const MAX_DISTANCE = 50000;
    const LIMIT = 200;
    // Search for the restaurants in a range of MAX_DISTANCE meters, ordered by simlarity to the query and capped at LIMIT results.
    const URL = `${urls_1.RESTAURANTS_URL}search-restaurants?query=${query}&latitude=${latitude}&longitude=${longitude}&maxDistance=${MAX_DISTANCE}&limit=${LIMIT}`;
    const config = {
        headers: {
            'ngrok-skip-browser-warning ': 'true',
        },
    };
    const searchResult = (yield axios_1.default.get(URL, config)).data;
    return searchResult;
});
exports.searchRestaurants = searchRestaurants;
const searchRestaurantsByCity = (location) => __awaiter(void 0, void 0, void 0, function* () {
    // Search for the restaurants in a range of MAX_DISTANCE meters, ordered by simlarity to the query and capped at LIMIT results.
    const URL = `${urls_1.RESTAURANTS_URL}restaurants-by-city?city=${location}`;
    const config = {
        headers: {
            'ngrok-skip-browser-warning ': 'true',
        },
    };
    const searchResult = (yield axios_1.default.get(URL, config)).data;
    return searchResult;
});
exports.searchRestaurantsByCity = searchRestaurantsByCity;
