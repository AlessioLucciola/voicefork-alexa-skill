const Alexa = require('ask-sdk-core');
const { format } = require('date-fns');

const StartMakeReservationIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
          request.intent.name === 'PlanMyTripIntent' &&
          request.dialogState === 'STARTED';
        },
    // canHandle(handlerInput) {
    //     return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
    //         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
    // },
    handle(handlerInput) {
    const speakOutput = 'Tell me the details of the reservatio.';
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

module.exports = {
    MakeReservationIntentHandler
}