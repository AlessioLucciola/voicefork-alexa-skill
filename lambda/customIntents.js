const Alexa = require('ask-sdk-core');
const { format } = require('date-fns');

const MakeReservationIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hi, tell me the details of the reservation!';
        
        const currentDate = Date()
        const formattedDate = format(currentDate, 'EEEE, MMMM do, yyyy');
        const speechOutput = `Today is ${formattedDate}.`;

        return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

module.exports = {
    MakeReservationIntentHandler
}