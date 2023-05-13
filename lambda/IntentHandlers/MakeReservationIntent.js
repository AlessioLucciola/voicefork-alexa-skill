const Alexa = require("ask-sdk-core")
const { format } = require("date-fns")

const StartedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const { dialogState, type } = handlerInput.requestEnvelope.request
		const { name } = handlerInput.requestEnvelope.request.intent
		return type === "IntentRequest" && name === "MakeReservationIntent" && dialogState === "STARTED"
	},
	handle(handlerInput) {
		return handlerInput.responseBuilder.addDelegateDirective().getResponse()
	},
}

const VerifyRestaurantNameReservationHandler = {
	canHandle(handlerInput) {
		const { dialogState, type } = handlerInput.requestEnvelope.request
		const { name } = handlerInput.requestEnvelope.request.intent
		let restaurantName
		if (type === "IntentRequest") restaurantName = handlerInput.requestEnvelope.request?.intent?.slots?.restaurantName
		return type === "IntentRequest" && name === "MakeReservationIntent" && restaurantName !== undefined && dialogState == "IN_PROGRESS"
	},
	handle(handlerInput) {
		const { restaurantName } = handlerInput.requestEnvelope.request.intent.slots

		if (restaurantName.value == "marione") return handlerInput.responseBuilder.speak("Ok, marioneeeee").addDelegateDirective().getResponse()

		return handlerInput.responseBuilder.speak("The restaurant name is not valid (you have to say marione!) What is the name of the place?").addElicitSlotDirective("restaurantName").getResponse()
	},
}

const CompletedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const { dialogState, type } = handlerInput.requestEnvelope.request
		const { name } = handlerInput.requestEnvelope.request.intent
		return type === "IntentRequest" && name === "MakeReservationIntent" && dialogState === "COMPLETED"
	},
	handle(handlerInput) {
		const speakOutput = "Reservation completed."
		return handlerInput.responseBuilder.speak(speakOutput).withShouldEndSession(true).getResponse()
	},
}

module.exports = {
	StartedMakeReservationIntentHandler,
	VerifyRestaurantNameReservationHandler,
	CompletedMakeReservationIntentHandler,
}
