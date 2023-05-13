"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const Alexa = require("ask-sdk-core");
const defaultIntents_1 = require("./IntentHandlers/defaultIntents");
const handlers_1 = require("./handlers");
const MakeReservationIntent_1 = require("./IntentHandlers/MakeReservationIntent");
/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(defaultIntents_1.LaunchRequestHandler, MakeReservationIntent_1.MakeReservationIntentHandler, defaultIntents_1.HelpIntentHandler, defaultIntents_1.CancelAndStopIntentHandler, defaultIntents_1.FallbackIntentHandler, handlers_1.SessionEndedRequestHandler, handlers_1.IntentReflectorHandler)
    .addErrorHandlers(handlers_1.ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent("sample/hello-world/v1.2")
    .lambda();
