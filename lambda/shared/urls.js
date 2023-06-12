"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVATIONS_URL = exports.USERS_URL = exports.RESTAURANTS_URL = void 0;
// This has to be changed each time ngrok is restarted
const NGROK_URL = 'https://0c3f-82-49-177-27.ngrok-free.app';
exports.RESTAURANTS_URL = `${NGROK_URL}/restaurants`;
exports.USERS_URL = `${NGROK_URL}/users`;
exports.RESERVATIONS_URL = `${NGROK_URL}/reservations`;
