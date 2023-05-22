"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../shared/constants");
const getCoordinates = () => {
    if (constants_1.LOCALIZATION_ENABLED)
        return constants_1.TEST_LATLNG;
    else
        return undefined;
};
exports.default = getCoordinates;
