"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beautify = void 0;
const beautify = (object) => {
    return JSON.stringify(object, null, 2);
};
exports.beautify = beautify;
