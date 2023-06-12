"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distanceBetweenCoordinates = void 0;
const constants_1 = require("../shared/constants");
const getCoordinates = () => {
    if (constants_1.LOCALIZATION_ENABLED)
        return constants_1.ROME_LATLNG;
    else
        return undefined;
};
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
exports.default = getCoordinates;
