const Alexa = require("ask-sdk-core")
const { format } = require("date-fns")

//Test

const StartedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request
		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && request.dialogState === "STARTED"
	},
	// canHandle(handlerInput) {
	//     return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
	//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
	// },
	handle(handlerInput) {
		const currentIntent = handlerInput.requestEnvelope.request.intent
		// const speakOutput = 'Tell me the details of the reservation.';
		return handlerInput.responseBuilder.addDelegateDirective(currentIntent).getResponse()
	},
}

const ResolveRestaurantNameMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request
		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && !request.intent.slots.restaurantName.value
	},
	// canHandle(handlerInput) {
	//     return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
	//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
	// },
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
	// canHandle(handlerInput) {
	//     return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
	//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
	// },
	handle(handlerInput) {
		const currentIntent = handlerInput.requestEnvelope.request.intent
		currentIntent.slots.restaurantName = "mariettone"
		// const speakOutput = 'Reservation in progress';
		return handlerInput.responseBuilder.addDelegateDirective().getResponse()
	},
}

const CompletedMakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request
		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && request.dialogState === "COMPLETED"
	},
	// canHandle(handlerInput) {
	//     return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
	//         && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MakeReservationIntent';
	// },
	handle(handlerInput) {
		const speakOutput = "Reservation completed."
		return handlerInput.responseBuilder.speak(speakOutput).getResponse()
	},
}

module.exports = {
	StartedMakeReservationIntentHandler,
	ResolveRestaurantNameMakeReservationIntentHandler,
	InProgressMakeReservationIntentHandler,
	CompletedMakeReservationIntentHandler,
}
