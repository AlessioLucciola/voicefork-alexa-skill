"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeReservationIntentHandler = void 0;
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
        const { intent: currentIntent } = handlerInput.requestEnvelope.request;
        const slots = currentIntent === null || currentIntent === void 0 ? void 0 : currentIntent.slots;
        const { restaurantName, date, time, numPeople } = {
            restaurantName: slots === null || slots === void 0 ? void 0 : slots.restaurantName.value,
            date: slots === null || slots === void 0 ? void 0 : slots.date.value,
            time: slots === null || slots === void 0 ? void 0 : slots.time.value,
            numPeople: slots === null || slots === void 0 ? void 0 : slots.numPeople.value,
        };
        const apiResponse = [{ name: "blu bar" }, { name: "pizzeria da marione" }, { name: "pizzeria pizza più" }, { name: "pizzeria pulcinella" }];
        if (restaurantName && !apiResponse.map((item) => item.name).includes(restaurantName))
            return handlerInput.responseBuilder.speak(`The restaurant ${restaurantName} doesn't exist, say another restaurant`).addElicitSlotDirective("restaurantName").getResponse();
        if (!restaurantName || !date || !time || !numPeople)
            return handlerInput.responseBuilder.addDelegateDirective().getResponse();
        return handlerInput.responseBuilder.speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`).withShouldEndSession(true).getResponse();
    },
};
exports.MakeReservationIntentHandler = MakeReservationIntentHandler;
