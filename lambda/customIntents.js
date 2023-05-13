const Alexa = require('ask-sdk-core');

const MakeReservationIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hi, tell me the details of the reservation!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

module.exports = {
    MakeReservationIntentHandler
}