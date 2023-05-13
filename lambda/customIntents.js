const Alexa = require('ask-sdk-core');
const { format } = require('date-fns');

const MakeReservationIntentHandler = {
    
    canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'PlanMyTripIntent' &&
      request.dialogState === 'IN_PROGRESS';
  },
    // canHandle(handlerInput) {
    //     return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
    //         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
    // },
    handle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const { intent } = request;
    const { slots } = intent;

    const dateSlotValue = slots['date'].value;

    if (!dateSlotValue) {
      // Date slot not yet filled
      const speakOutput = 'Tell me the date of the reservation.';
      return handlerInput.responseBuilder.speak(speakOutput).getResponse();
    }

    // Date slot is filled
    const date = new Date(dateSlotValue);
    const formattedDate = format(date, 'EEEE, MMMM do, yyyy');
    const speakOutput = `The date of the reservation is ${formattedDate}. Now, please provide the remaining details.`;

    // Handle the remaining reservation details here

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

module.exports = {
    MakeReservationIntentHandler
}