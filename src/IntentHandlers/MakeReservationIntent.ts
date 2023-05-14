import { RequestHandler } from "ask-sdk-core"
import { IntentRequest } from "ask-sdk-model"
import { RestaurantSlots } from "../shared/types"
import axios from "axios"

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
	async handle(handlerInput) {
		const { intent: currentIntent } = handlerInput.requestEnvelope.request as IntentRequest

		const config = {
			headers: {
				"ngrok-skip-browser-warning ": "true",
			},
		}
		const URL = `https://c714-2001-b07-a5a-64c2-10c6-c32f-6448-a932.ngrok-free.app//users/get-all-users`
		const randomUser = (await axios.get(URL, config)).data[0]

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

		return handlerInput.responseBuilder.speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}, ${randomUser.name}`).withShouldEndSession(true).getResponse()
	},
}

export { MakeReservationIntentHandler }
