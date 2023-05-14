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
const apiCalls_1 = require("../apiCalls");
const constants_1 = require("../shared/constants");
const MakeReservationIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const { type } = request;
        if (type === 'IntentRequest') {
            const { name } = request.intent;
            return type === 'IntentRequest' && name === 'MakeReservationIntent';
        }
        return false;
    },
    handle(handlerInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const { intent: currentIntent } = handlerInput.requestEnvelope.request;
            const slots = currentIntent === null || currentIntent === void 0 ? void 0 : currentIntent.slots;
            const { restaurantName, date, time, numPeople, yesNo } = {
                restaurantName: slots === null || slots === void 0 ? void 0 : slots.restaurantName.value,
                date: slots === null || slots === void 0 ? void 0 : slots.date.value,
                time: slots === null || slots === void 0 ? void 0 : slots.time.value,
                numPeople: slots === null || slots === void 0 ? void 0 : slots.numPeople.value,
                yesNo: slots === null || slots === void 0 ? void 0 : slots.YesNoSlot.value,
            };
            //Get the restaurant list nearby the user
            const restaurants = yield (0, apiCalls_1.searchNearbyRestaurants)(restaurantName !== null && restaurantName !== void 0 ? restaurantName : 'Marioncello', constants_1.TEST_LATLNG);
            //TODO: Just a test: If the user has already responded to the restaurant disambiguation prompt, show the results.
            if (restaurantName && yesNo) {
                return handlerInput.responseBuilder
                    .speak(`Your decision was ${yesNo}! The restuarnat is ${restaurantName}!`)
                    .addDelegateDirective()
                    .getResponse();
            }
            //TODO: Just a test: if the restaurant is not exactly what the user says, then ask if the best match is the wanted restaurant
            if (restaurantName &&
                !yesNo &&
                !restaurants.map(item => item.restaurant.name.toLowerCase()).includes(restaurantName.toLowerCase())) {
                return handlerInput.responseBuilder
                    .speak(`The restaurant ${restaurantName} doesn't exist, the most similar is ${restaurants[0].restaurant.name}!`)
                    .addElicitSlotDirective('YesNoSlot')
                    .getResponse();
            }
            if (!restaurantName || !date || !time || !numPeople)
                return handlerInput.responseBuilder.addDelegateDirective().getResponse();
            return handlerInput.responseBuilder
                .speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`)
                .withShouldEndSession(true)
                .getResponse();
        });
    },
};
exports.MakeReservationIntentHandler = MakeReservationIntentHandler;
