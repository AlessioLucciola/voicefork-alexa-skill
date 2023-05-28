"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVATIONS_URL = exports.USERS_URL = exports.RESTAURANTS_URL = void 0;
// This has to be changed each time ngrok is restarted
const NGROK_URL = 'https://b955-2001-b07-a5a-64c2-1c35-800d-9c8c-3f5e.ngrok-free.app';
exports.RESTAURANTS_URL = `${NGROK_URL}/restaurants/`;
exports.USERS_URL = `${NGROK_URL}/users/`;
exports.RESERVATIONS_URL = `${NGROK_URL}/reservations/`;
