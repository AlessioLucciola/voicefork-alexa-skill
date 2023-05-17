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
            // const slots = currentIntent?.slots
            // const { attributesManager } = handlerInput
            // const { restaurantName, date, time, numPeople, yesNo }: RestaurantSlots = {
            //     restaurantName: slots?.restaurantName.value,
            //     date: slots?.date.value,
            //     time: slots?.time.value,
            //     numPeople: slots?.numPeople.value,
            //     yesNo: slots?.YesNoSlot.value,
            // }
            return handlerInput.responseBuilder
                .speak('Hey! You are in the local development')
                .addDelegateDirective()
                .getResponse();
            //         //Get the restaurant list nearby the user
            //         const restaurants = await searchNearbyRestaurants(restaurantName ?? 'Marioncello', TEST_LATLNG)
            //         //TODO: Just a test: If the user has already responded to the restaurant disambiguation prompt, show the results.
            //         if (restaurantName && yesNo) {
            //             const { disRestaurantName } = attributesManager.getSessionAttributes() //TODO: restaurantName remains unchanged
            //             return handlerInput.responseBuilder
            //                 .speak(`Your decision was ${yesNo}! The restuarnat is ${disRestaurantName}!`)
            //                 .addDelegateDirective()
            //                 .getResponse()
            //         }
            //         //TODO: Just a test: if the restaurant is not exactly what the user says, then ask if the best match is the wanted restaurant
            //         if (
            //             restaurantName &&
            //             !yesNo &&
            //             !restaurants.map(item => item.restaurant.name.toLowerCase()).includes(restaurantName.toLowerCase())
            //         ) {
            //             const mostSimilarRestaurantName = restaurants[0].restaurant.name
            //             attributesManager.setSessionAttributes({ disRestaurantName: mostSimilarRestaurantName })
            //             return handlerInput.responseBuilder
            //                 .speak(
            //                     `The restaurant ${restaurantName} doesn't exist, the most similar is ${mostSimilarRestaurantName}, did you mean that?`,
            //                 )
            //                 .addElicitSlotDirective('YesNoSlot')
            //                 .getResponse()
            //         }
            //         if (!restaurantName || !date || !time || !numPeople)
            //             return handlerInput.responseBuilder.addDelegateDirective().getResponse()
            //         return handlerInput.responseBuilder
            //             .speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`)
            //             .withShouldEndSession(true)
            //             .getResponse()
        });
    },
};
exports.MakeReservationIntentHandler = MakeReservationIntentHandler;
