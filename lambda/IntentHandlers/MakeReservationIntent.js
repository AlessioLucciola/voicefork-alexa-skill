const Alexa = require("ask-sdk-core")
const { format } = require("date-fns")

const StartedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const { dialogState, type, name } = handlerInput.requestEnvelope.request
		return type === "IntentRequest" && name === "MakeReservationIntent" && dialogState !== "COMPLETED"
	},
	handle(handlerInput) {
		return handlerInput.responseBuilder
			.speak("What is the name of the place?")
			.reprompt("Please, tell me the name of the place you want to make a reservation for")
			.addDelegateDirective()
			.getResponse()
	},
}

const VerifyRestaurantNameReservationHandler = {
	canHandle(handlerInput) {
		const { dialogState, type, name } = handlerInput.requestEnvelope.request
		const { restauantName } = handlerInput.requestEnvelope.request.intent.slots
		return type === "IntentRequest" && name === "MakeReservationIntent" && restauantName.value
	},
	handle(handlerInput) {
		const { restauantName } = request.intent.slots

		if (restauantName.value == "marione") return handlerInput.responseBuilder.speak("Ok, marioneeeee").addDelegateDirective().getResponse()

		return handlerInput.responseBuilder
			.speak("The restaurant name is not valid (you have to say marione!) What is the name of the place?")
			.reprompt("Please, tell me the name of the place you want to make a reservation for")
			.addElicitSlotDirective("restaurantName")
			.getResponse()
	},
}

const CompletedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const { dialogState, type, name } = handlerInput.requestEnvelope.request
		return type === "IntentRequest" && name === "MakeReservationIntent" && dialogState === "COMPLETED"
	},
	handle(handlerInput) {
		const speakOutput = "Reservation completed."
		return handlerInput.responseBuilder.speak(speakOutput).withShouldEndSession(true).getResponse()
	},
}

module.exports = {
	StartedMakeReservationIntentHandler,
	CompletedMakeReservationIntentHandler,
}
