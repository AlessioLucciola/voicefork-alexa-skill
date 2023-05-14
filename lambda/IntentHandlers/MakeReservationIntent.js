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
exports.MakeReservationIntentHandler = void 0;
const axios_1 = require("axios");
const MakeReservationIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const { type } = request;
        if (type === "IntentRequest") {
            const { name } = request.intent;
            return type === "IntentRequest" && name === "MakeReservationIntent";
        }
        return false;
    },
    handle(handlerInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const { intent: currentIntent } = handlerInput.requestEnvelope.request;
            const slots = currentIntent === null || currentIntent === void 0 ? void 0 : currentIntent.slots;
            const { restaurantName, date, time, numPeople } = {
                restaurantName: slots === null || slots === void 0 ? void 0 : slots.restaurantName.value,
                date: slots === null || slots === void 0 ? void 0 : slots.date.value,
                time: slots === null || slots === void 0 ? void 0 : slots.time.value,
                numPeople: slots === null || slots === void 0 ? void 0 : slots.numPeople.value,
            };
            const apiResponse = [{ name: "blu bar" }, { name: "pizzeria da marione" }, { name: "pizzeria pizza più" }, { name: "pizzeria pulcinella" }];
            if (restaurantName && !apiResponse.map((item) => item.name).includes(restaurantName)) {
                const config = {
                    headers: {
                        "ngrok-skip-browser-warning ": "true",
                    },
                };
                const URL = `https://c714-2001-b07-a5a-64c2-10c6-c32f-6448-a932.ngrok-free.app/users/get-all-users`;
                const randomUser = (yield axios_1.default.get(URL, config)).data[0];
                return handlerInput.responseBuilder
                    .speak(`The restaurant ${restaurantName} doesn't exist, say another restaurant dear ${randomUser.name}`)
                    .addElicitSlotDirective("restaurantName")
                    .getResponse();
            }
            if (!restaurantName || !date || !time || !numPeople)
                return handlerInput.responseBuilder.addDelegateDirective().getResponse();
            return handlerInput.responseBuilder.speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`).withShouldEndSession(true).getResponse();
        });
    },
};
exports.MakeReservationIntentHandler = MakeReservationIntentHandler;
