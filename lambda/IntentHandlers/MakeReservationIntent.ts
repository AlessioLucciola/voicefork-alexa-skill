import { RequestHandler } from "ask-sdk-core"
import { Slot } from "ask-sdk-model"

const StartedMakeReservationIntentHandler: RequestHandler = {
	canHandle(handlerInput) {
		const { dialogState, type, name }: any = handlerInput.requestEnvelope.request
		return type === "IntentRequest" && name === "MakeReservationIntent" && dialogState === "STARTED"
	},
	handle(handlerInput) {
		return handlerInput.responseBuilder.addDelegateDirective().getResponse()
	},
}

const VerifyRestaurantNameReservationHandler: RequestHandler = {
	canHandle(handlerInput) {
		const { dialogState, type, name }: any = handlerInput.requestEnvelope.request
		let slots:
			| {
					[key: string]: Slot
			  }
			| undefined

		if (handlerInput.requestEnvelope.request.type === "IntentRequest") {
			slots = handlerInput.requestEnvelope.request.intent.slots
		} else {
			slots = {}
		}
		return type === "IntentRequest" && name === "MakeReservationIntent" && slots!.restaurantName.value !== undefined
	},
	handle(handlerInput) {
		let slots:
			| {
					[key: string]: Slot
			  }
			| undefined

		if (handlerInput.requestEnvelope.request.type === "IntentRequest") {
			slots = handlerInput.requestEnvelope.request.intent.slots
		} else {
			slots = {}
		}
		const restaurantName = slots?.restaurantName

		if (restaurantName?.value == "marione") return handlerInput.responseBuilder.speak("Ok, marioneeeee").addDelegateDirective().getResponse()

		return handlerInput.responseBuilder
			.speak("The restaurant name is not valid (you have to say marione!) What is the name of the place?")
			.reprompt("Please, tell me the name of the place you want to make a reservation for")
			.addElicitSlotDirective("restaurantName")
			.getResponse()
	},
}

const CompletedMakeReservationIntentHandler: RequestHandler = {
	canHandle(handlerInput) {
		const { dialogState, type, name }: any = handlerInput.requestEnvelope.request
		return type === "IntentRequest" && name === "MakeReservationIntent" && dialogState === "COMPLETED"
	},
	handle(handlerInput) {
		const speakOutput = "Reservation completed."
		return handlerInput.responseBuilder.speak(speakOutput).withShouldEndSession(true).getResponse()
	},
}

export { StartedMakeReservationIntentHandler, VerifyRestaurantNameReservationHandler, CompletedMakeReservationIntentHandler }
