"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVATIONS_URL = exports.USERS_URL = exports.RESTAURANTS_URL = void 0;
// This has to be changed each time ngrok is restarted
const NGROK_URL = ' https://41e3-80-183-230-87.ngrok-free.app';
exports.RESTAURANTS_URL = `${NGROK_URL}/restaurants/`;
exports.USERS_URL = `${NGROK_URL}/users/`;
exports.RESERVATIONS_URL = `${NGROK_URL}/reservations/`;
