// const Alexa = require("ask-sdk-core")
// const { format } = require("date-fns")

// const StartedMakeReservationIntentHandler = {
// 	canHandle(handlerInput) {
// 		const request = handlerInput.requestEnvelope.request
// 		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && request.dialogState === "STARTED"
// 	},
// 	handle(handlerInput) {
// 		const currentIntent = handlerInput.requestEnvelope.request.intent
// 		return handlerInput.responseBuilder.addDelegateDirective(currentIntent).getResponse()
// 	},
// }

// const ResolveRestaurantNameMakeReservationIntentHandler = {
// 	canHandle(handlerInput) {
// 		const request = handlerInput.requestEnvelope.request
// 		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && (!request.intent.slots.restaurantName || !request.intent.slots.restaurantName.value)
// 	},
// 	handle(handlerInput) {
// 		const currentIntent = handlerInput.requestEnvelope.request.intent
// 		return handlerInput.responseBuilder
// 			.speak("What is the name of the place?")
// 			.reprompt("Please, tell me the name of the place you want to make a reservation for")
// 			.addElicitSlotDirective("restaurantName")
// 			.addDelegateDirective(currentIntent)
// 			.getResponse()
// 	},
// }

// const InProgressMakeReservationIntentHandler = {
// 	canHandle(handlerInput) {
// 		const request = handlerInput.requestEnvelope.request
// 		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && request.dialogState === "IN_PROGRESS"
// 	},
// 	handle(handlerInput) {
// 		const currentIntent = handlerInput.requestEnvelope.request.intent
// 		currentIntent.slots.restaurantName.value = "mariettone" // Set the restaurant name
// 		return handlerInput.responseBuilder.addDelegateDirective(currentIntent).getResponse()
// 	},
// }

// const CompletedMakeReservationIntentHandler = {
// 	canHandle(handlerInput) {
// 		const request = handlerInput.requestEnvelope.request
// 		return request.type === "IntentRequest" && request.intent.name === "MakeReservationIntent" && request.dialogState === "COMPLETED"
// 	},
// 	handle(handlerInput) {
// 		const speakOutput = "Reservation completed."
// 		return handlerInput.responseBuilder.speak(speakOutput).getResponse()
// 	},
// }

// module.exports = {
// 	StartedMakeReservationIntentHandler,
// 	ResolveRestaurantNameMakeReservationIntentHandler,
// 	InProgressMakeReservationIntentHandler,
// 	CompletedMakeReservationIntentHandler,
// }

const Alexa = require("ask-sdk-core")

const StartGameIntentHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" && Alexa.getIntentName(handlerInput.requestEnvelope) === "StartGameIntent"
	},
	async handle(handlerInput) {
		const { requestEnvelope, responseBuilder } = handlerInput
		const filledSlots = Alexa.getSlotValues(requestEnvelope.request.intent.slots)

		// Check if the dialog is still in progress
		if (!filledSlots.isComplete) {
			const restaurantNameSlot = filledSlots.restaurantName
			if (!restaurantNameSlot.isMatch || !isValidRestaurant(restaurantNameSlot.resolved)) {
				// If the restaurant name is not valid or not provided, prompt for it
				return responseBuilder.addElicitSlotDirective("restaurantName").getResponse()
			} else {
				// Restaurant name is valid, proceed with other slots
				// Prompt for date
				if (!filledSlots.date.isMatch) {
					return responseBuilder.addElicitSlotDirective("date").getResponse()
				}

				// Prompt for time
				if (!filledSlots.time.isMatch) {
					return responseBuilder.addElicitSlotDirective("time").getResponse()
				}

				// Prompt for number of people
				if (!filledSlots.numPeople.isMatch) {
					return responseBuilder.addElicitSlotDirective("numPeople").getResponse()
				}
			}
		}

		// Dialog is complete, proceed with your logic
		const restaurantName = filledSlots.restaurantName.resolved
		const date = filledSlots.date.resolved
		const time = filledSlots.time.resolved
		const numPeople = filledSlots.numPeople.resolved

		// ... Perform logic with the resolved slots ...

		return responseBuilder.getResponse()
	},
}

// Helper function to check if the restaurant name is valid
function isValidRestaurant(restaurantName) {
	// ... Implement your validation logic here ...
	// Check if the restaurant name is in the desired list or fetch it from an API
	return restaurantName == "da marione"
	return true // Return true if the restaurant is valid, otherwise false
}

// Add the intent handler to your skill's skillBuilder
const skillBuilder = Alexa.SkillBuilders.custom()
exports.handler = skillBuilder
	.addRequestHandlers(
		StartGameIntentHandler
		// Add other intent handlers here
	)
	.lambda()
