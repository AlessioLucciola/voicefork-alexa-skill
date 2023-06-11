"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpIntentHandler = exports.FallbackIntentHandler = exports.CancelAndStopIntentHandler = exports.LaunchRequestHandler = exports.ErrorHandler = exports.IntentReflectorHandler = exports.SessionEndedRequestHandler = void 0;
const Alexa = require("ask-sdk-core");
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    },
};
exports.SessionEndedRequestHandler = SessionEndedRequestHandler;
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents
 * by defining them above, then also adding them to the request handler chain below
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;
        return (handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse());
    },
};
exports.IntentReflectorHandler = IntentReflectorHandler;
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const errorMessage = error.message || 'Unknown error';
        const stackTrace = error.stack || 'No stack trace available';
        const speakOutput = `Sorry LOCAL, I had trouble doing what you asked. Please try again. Error: ${errorMessage}`;
        console.log(`~~~~ Error handled: ${errorMessage}`);
        console.log(`~~~~ Stack trace: ${stackTrace}`);
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
    },
};
exports.ErrorHandler = ErrorHandler;
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to Local VoiceFork, tell me the details of the reservation!';
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
    },
};
exports.LaunchRequestHandler = LaunchRequestHandler;
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
                Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'));
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder.speak(speakOutput).getResponse();
    },
};
exports.CancelAndStopIntentHandler = CancelAndStopIntentHandler;
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent');
    },
    handle(handlerInput) {
        const speakOutput = "Sorry, I don't know about that. Please try again.";
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
    },
};
exports.FallbackIntentHandler = FallbackIntentHandler;
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';
        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
    },
};
exports.HelpIntentHandler = HelpIntentHandler;
