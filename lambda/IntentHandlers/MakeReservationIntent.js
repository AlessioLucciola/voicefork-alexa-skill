const Alexa = require("ask-sdk-core")
const { format } = require("date-fns")

const MakeReservationIntentHandler = {
	canHandle(handlerInput) {
		const { dialogState, type } = handlerInput.requestEnvelope.request
		const { name } = handlerInput.requestEnvelope.request.intent
		return type === "IntentRequest" && name === "MakeReservationIntent"
	},
	handle(handlerInput) {
		const currentIntent = handlerInput.requestEnvelope.request.intent

		const { restaurantName, date, time, numPeople } = currentIntent.slots

		if (!restaurantName || !date || !time || !numPeople) return handlerInput.responseBuilder.speak("Missing parameters,").reprompt("Again missing parameters,").addDelegateDirective().getResponse()

		// if (resturantName != "marione")
		// 	return handlerInput.responseBuilder.speak("You have to say marione!").reprompt("Again, You have to say marione!").addElicitSlotDirective("restaurantName").getResponse()

		return handlerInput.responseBuilder.speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`).withShouldEndSession(true).getResponse()
	},
}

// const VerifyRestaurantNameReservationHandler = {
// 	canHandle(handlerInput) {
// 		// const { dialogState, type } = handlerInput.requestEnvelope.request
// 		// const { name } = handlerInput.requestEnvelope.request.intent
// 		// let restaurantName
// 		// if (type === "IntentRequest") restaurantName = handlerInput.requestEnvelope.request?.intent?.slots?.restaurantName
// 		// return type === "IntentRequest" && name === "MakeReservationIntent" && restaurantName !== undefined
// 		return (
// 			handlerInput.requestEnvelope.request.type === "IntentRequest" &&
// 			handlerInput.requestEnvelope.request.intent.name === "MakeReservationIntent" &&
// 			handlerInput.requestEnvelope.request.intent.slots.restaurantName.value
// 		)
// 	},
// 	handle(handlerInput) {
// 		const currentIntent = handlerInput.requestEnvelope.request.intent
// 		const { restaurantName } = currentIntent.slots
// 		if (restaurantName.value == "marione") return handlerInput.responseBuilder.speak("Ok, marioneeeee").addDelegateDirective(currentIntent).getResponse()

// 		return handlerInput.responseBuilder
// 			.speak("The restaurant name is not valid (you have to say marione!) What is the name of the place?")
// 			.addElicitSlotDirective("restaurantName", currentIntent)
// 			.getResponse()
// 	},
// }

// const CompletedMakeReservationIntentHandler = {
// 	canHandle(handlerInput) {
// 		const { dialogState, type } = handlerInput.requestEnvelope.request
// 		const { name } = handlerInput.requestEnvelope.request.intent
// 		return type === "IntentRequest" && name === "MakeReservationIntent" && dialogState === "COMPLETED"
// 	},
// 	handle(handlerInput) {
// 		const speakOutput = "Reservation completed."
// 		return handlerInput.responseBuilder.speak(speakOutput).withShouldEndSession(true).getResponse()
// 	},
// }

module.exports = {
	MakeReservationIntentHandler,
}
