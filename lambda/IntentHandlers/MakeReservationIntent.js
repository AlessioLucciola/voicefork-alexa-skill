const Alexa = require("ask-sdk-core")
const { format } = require("date-fns")

const StartedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request
		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && request.dialogState === "STARTED"
	},
	handle(handlerInput) {
		const speakOutput = "Welcome to voicefork!"
		return handlerInput.responseBuilder
			.speak(speakOutput)
			.addDelegateDirective({
				name: "MakeReservationIntent",
				confirmationStatus: "NONE",
				slots: {},
			})
			.getResponse()
	},
}

const ResolveRestaurantNameMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request
		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && (!request.intent.slots.restaurantName || !request.intent.slots.restaurantName.value)
	},
	handle(handlerInput) {
		const currentIntent = handlerInput.requestEnvelope.request.intent
		return handlerInput.responseBuilder
			.speak("What is the name of the place?")
			.reprompt("Please, tell me the name of the place you want to make a reservation for")
			.addElicitSlotDirective("restaurantName")
			.addDelegateDirective(currentIntent)
			.getResponse()
	},
}

const InProgressMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request
		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && request.dialogState === "IN_PROGRESS"
	},
	handle(handlerInput) {
		const currentIntent = handlerInput.requestEnvelope.request.intent
		currentIntent.slots.restaurantName.value = "mariettone" // Set the restaurant name
		return handlerInput.responseBuilder.addDelegateDirective(currentIntent).getResponse()
	},
}

const CompletedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request
		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && request.dialogState === "COMPLETED"
	},
	handle(handlerInput) {
		const speakOutput = "Reservation completed."
		return handlerInput.responseBuilder.speak(speakOutput).withShouldEndSession(true).getResponse()
	},
}

module.exports = {
	StartedMakeReservationIntentHandler,
	ResolveRestaurantNameMakeReservationIntentHandler,
	InProgressMakeReservationIntentHandler,
	CompletedMakeReservationIntentHandler,
}
