const Alexa = require("ask-sdk-core")
const { format } = require("date-fns")

const StartedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const requestEnvelope = handlerInput.requestEnvelope
		return Alexa.getRequestType(requestEnvelope) == "IntentRequest" && Alexa.getIntentName(requestEnvelope) == "MakeReservationIntent" && Alexa.getDialogState(requestEnvelope) == "STARTED"
	},
	handle(handlerInput) {
		const speakOutput = "Welcome to voicefork!"
		const currentIntent = handlerInput.requestEnvelope.request.intent
		return handlerInput.responseBuilder.speak(speakOutput).addDelegateDirective(currentIntent).getResponse()
	},
}

const InProgressMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const requestEnvelope = handlerInput.requestEnvelope
		return Alexa.getRequestType(requestEnvelope) == "IntentRequest" && Alexa.getIntentName(requestEnvelope) == "MakeReservationIntent" && Alexa.getDialogState(requestEnvelope)
	},
	handle(handlerInput) {
		const currentIntent = handlerInput.requestEnvelope.request.intent
		const { restauantName } = request.intent.slots

		if (restauantName.value == "marione") return handlerInput.responseBuilder.speak("Ok, marioneeeee").addDelegateDirective(currentIntent).getResponse()

		return handlerInput.responseBuilder
			.speak("The restaurant name is not valid (you have to say marione!) What is the name of the place?")
			.reprompt("Please, tell me the name of the place you want to make a reservation for")
			.addElicitSlotDirective("restaurantName")
			.addDelegateDirective(currentIntent)
			.getResponse()
	},
}

const CompletedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const requestEnvelope = handlerInput.requestEnvelope
		return Alexa.getRequestType(requestEnvelope) == "IntentRequest" && Alexa.getIntentName(requestEnvelope) == "MakeReservationIntent" && Alexa.getDialogState(requestEnvelope) == "CONFIRMED"
	},
	handle(handlerInput) {
		const speakOutput = "Reservation completed."
		return handlerInput.responseBuilder.speak(speakOutput).withShouldEndSession(true).getResponse()
	},
}

module.exports = {
	StartedMakeReservationIntentHandler,
	InProgressMakeReservationIntentHandler,
	CompletedMakeReservationIntentHandler,
}
