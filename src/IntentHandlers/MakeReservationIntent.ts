import { RequestHandler } from "ask-sdk-core"
import { IntentRequest } from "ask-sdk-model"
import { RestaurantSlots } from "../shared/types"

const MakeReservationIntentHandler: RequestHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request as IntentRequest
		const { type } = request
		if (type === "IntentRequest") {
			const { name } = request.intent
			return type === "IntentRequest" && name === "MakeReservationIntent"
		}
		return false
	},
	handle(handlerInput) {
		const { intent: currentIntent } = handlerInput.requestEnvelope.request as IntentRequest

		const slots = currentIntent?.slots

		const { restaurantName, date, time, numPeople }: RestaurantSlots = {
			restaurantName: slots?.restaurantName.value,
			date: slots?.date.value,
			time: slots?.time.value,
			numPeople: slots?.numPeople.value,
		}

		const apiResponse = [{ name: "blu bar" }, { name: "pizzeria da marione" }, { name: "pizzeria pizza più" }, { name: "pizzeria pulcinella" }]

		if (restaurantName && !apiResponse.map((item) => item.name).includes(restaurantName))
			return handlerInput.responseBuilder.speak(`The restaurant ${restaurantName} doesn't exist, say another restaurant`).addElicitSlotDirective("restaurantName").getResponse()

		if (!restaurantName || !date || !time || !numPeople) return handlerInput.responseBuilder.addDelegateDirective().getResponse()

		return handlerInput.responseBuilder.speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`).withShouldEndSession(true).getResponse()
	},
}

export { MakeReservationIntentHandler }
