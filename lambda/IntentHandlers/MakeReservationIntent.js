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
const reservationContextResponseHandler_1 = require("../responseHandlers/reservationContextResponseHandler");
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
            const attributesManager = handlerInput.attributesManager;
            const sessionAttributes = attributesManager.getSessionAttributes();
            //const retrievedRestaurantsList = sessionAttributes.restaurantList
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            const slotValues = {
                restaurantName: slots === null || slots === void 0 ? void 0 : slots.restaurantName.value,
                location: slots === null || slots === void 0 ? void 0 : slots.location.value,
                date: slots === null || slots === void 0 ? void 0 : slots.date.value,
                time: slots === null || slots === void 0 ? void 0 : slots.time.value,
                numPeople: slots === null || slots === void 0 ? void 0 : slots.numPeople.value,
                yesNo: slots === null || slots === void 0 ? void 0 : slots.YesNoSlot.value,
            };
            const { restaurantName, date, time, numPeople } = slotValues;
            if (!restaurantName || !date || !time || !numPeople) {
                //Ask for the data that's missing before disambiguation
                return handlerInput.responseBuilder.addDelegateDirective().getResponse();
            }
            if (restaurantName && date && time && numPeople) {
                //I have all the fields, I find the restaurants similar to those in the query
                return yield (0, reservationContextResponseHandler_1.handleSimilarRestaurants)(handlerInput, slotValues);
            }
            if (time !== undefined && date !== undefined) {
                const reservationDate = new Date(date + ' ' + time);
                if (reservationDate < new Date()) {
                    //Check if the user is trying to reserve a table for a date in the past (but with time)
                    return handlerInput.responseBuilder
                        .speak(`Sorry, it seems that you are trying to reserve a table for a date in the past. You want to reserve a table at ${time} in which day?`)
                        .reprompt(`Do you want to reserve a table for tomorrow or another day?`)
                        .addElicitSlotDirective('date')
                        .getResponse();
                }
            }
            if (date !== undefined) {
                const currentDate = new Date();
                if (currentDate > new Date(date)) {
                    //Check if the user is trying to reserve a table for a date in the past
                    return handlerInput.responseBuilder
                        .speak("Sorry, you can't reserve a table for a date in the past. Please, when do you want to reserve a table?")
                        .addElicitSlotDirective('date')
                        .getResponse();
                }
            }
            //Just for debugging
            // if (!restaurantName || !date || !time || !numPeople) {
            //     console.log('DEBUG: INSIDE GENERIC RESOLUTION')
            //     return handlerInput.responseBuilder.addDelegateDirective().getResponse()
            // }
            return handlerInput.responseBuilder
                //Display the final reservation details
                .speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`)
                .withShouldEndSession(true)
                .getResponse();
        });
    },
};
exports.MakeReservationIntentHandler = MakeReservationIntentHandler;
