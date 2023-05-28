"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTime = exports.convertAmazonDateTime = exports.getDateComponentsFromDate = void 0;
const luxon_1 = require("luxon");
const getDateComponentsFromDate = (dateTime) => {
    if (dateTime === undefined)
        dateTime = luxon_1.DateTime.now();
    else if (typeof dateTime === 'string') {
        dateTime = luxon_1.DateTime.fromISO(dateTime);
    }
    const { day, weekday, month, year, hour, minute } = dateTime;
    console.log(`I converted the date to ${dateTime}`);
    return { day, weekday, month, year, hour, minute };
};
exports.getDateComponentsFromDate = getDateComponentsFromDate;
const convertAmazonDateTime = (date, time) => {
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');
    const result = luxon_1.DateTime.local(+year, +month, +day, +hour, +minute);
    console.log(`I converted the Amazon date and time from ${date} and ${time} to ${result}`);
    return luxon_1.DateTime.local(+year, +month, +day, +hour, +minute);
};
exports.convertAmazonDateTime = convertAmazonDateTime;
const parseTime = (hour, minutes) => {
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
exports.parseTime = parseTime;
