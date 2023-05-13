const Alexa = require('ask-sdk-core');
const { format } = require('date-fns');

const StaredtMakeReservationIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
          request.intent.name === 'MakeReservationIntent' &&
          request.dialogState === 'STARTED';
        },
    // canHandle(handlerInput) {
    //     return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
    //         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
    // },
    handle(handlerInput) {
    const speakOutput = 'Tell me the details of the reservation.';
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

const InProgressMakeReservationIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
          request.intent.name === 'MakeReservationIntent' &&
          request.dialogState === 'IN_PROGRESS';
        },
    // canHandle(handlerInput) {
    //     return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
    //         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
    // },
    handle(handlerInput) {
    const speakOutput = 'Reservation in progress';
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

const CompletedMakeReservationIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
          request.intent.name === 'MakeReservationIntent' &&
          request.dialogState === 'COMPLETED';
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