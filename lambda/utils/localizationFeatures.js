"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAddress = exports.distanceBetweenCoordinates = exports.getCoordinates = void 0;
const constants_1 = require("../shared/constants");
const getCoordinates = () => {
    if (constants_1.LOCALIZATION_ENABLED)
        return constants_1.TEST_LATLNG;
    else
        return undefined;
};
exports.getCoordinates = getCoordinates;
const distanceBetweenCoordinates = (origin, destination) => {
    const degToRad = (deg) => {
        return deg * (Math.PI / 180);
    };
    const earthRadius = 6371000; // in meters
    const { latitude: lat1, longitude: lon1 } = origin;
    const { latitude: lat2, longitude: lon2 } = destination;
    const dLat = degToRad(lat2 - lat1);
    const dLon = degToRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;
    return distance;
};
exports.distanceBetweenCoordinates = distanceBetweenCoordinates;
const parseAddress = (address, city, zone) => {
    const street = address.split(',')[0];
    let finalAddress = street;
    if (city !== "") {
        if (zone !== "" && city.toLowerCase().trim() !== zone.toLowerCase().trim() && !zone.toLowerCase().startsWith('via ')) {
            finalAddress = finalAddress + ' in ' + zone + ' neighborhood';
        }
        finalAddress = finalAddress + ' in ' + city;
    }
    else {
        if (zone !== "" && !zone.toLowerCase().startsWith('via ')) {
            finalAddress = finalAddress + ' in ' + zone;
        }
    }
    return finalAddress;
};
exports.parseAddress = parseAddress;
