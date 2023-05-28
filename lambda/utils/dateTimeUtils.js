"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertAmazonDateTime = exports.getDateComponentsFromDate = void 0;
const luxon_1 = require("luxon");
const getDateComponentsFromDate = (dateTime) => {
    let parsedDateTime = dateTime;
    switch (typeof dateTime) {
        case typeof Date:
            parsedDateTime = luxon_1.DateTime.fromJSDate(dateTime);
            break;
        case typeof String:
            parsedDateTime = luxon_1.DateTime.fromISO(dateTime);
            break;
    }
    const { day, weekday, month, year, hour, minute, second } = parsedDateTime;
    return { day, weekday, month, year, hour, minute, second };
};
exports.getDateComponentsFromDate = getDateComponentsFromDate;
const convertAmazonDateTime = (date, time) => {
    const [year, month, day] = date.split('-');
    const [hour, minute, second] = time.split(':');
    return luxon_1.DateTime.local(+year, +month, +day, +hour, +minute, +second);
};
exports.convertAmazonDateTime = convertAmazonDateTime;
