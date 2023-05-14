import { RequestHandler } from 'ask-sdk-core'
import { IntentRequest } from 'ask-sdk-model'
import { RestaurantSlots } from '../shared/types'
import { searchNearbyRestaurants } from '../apiCalls'
import { TEST_LATLNG } from '../shared/constants'

const MakeReservationIntentHandler: RequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request as IntentRequest
        const { type } = request
        if (type === 'IntentRequest') {
            const { name } = request.intent
            return type === 'IntentRequest' && name === 'MakeReservationIntent'
        }
        return false
    },
    async handle(handlerInput) {
        const { intent: currentIntent } = handlerInput.requestEnvelope.request as IntentRequest
        const slots = currentIntent?.slots

        const { restaurantName, date, time, numPeople, yesNo }: RestaurantSlots = {
            restaurantName: slots?.restaurantName.value,
            date: slots?.date.value,
            time: slots?.time.value,
            numPeople: slots?.numPeople.value,
            yesNo: slots?.yesNo.value,
        }
        //Get the restaurant list nearby the user
        const restaurants = await searchNearbyRestaurants(restaurantName ?? 'Marioncello', TEST_LATLNG)

        //TODO: just a test, if the restaurant is not exactly what the user says, then ask to repeat,
        // until the user says the exact name.
        if (
            restaurantName &&
            !yesNo &&
            !restaurants.map(item => item.restaurant.name.toLowerCase()).includes(restaurantName.toLowerCase())
        ) {
            return handlerInput.responseBuilder
                .speak(
                    `The restaurant ${restaurantName} doesn't exist, the most similar is ${restaurants[0].restaurant.name}!`,
                )
                .addElicitSlotDirective('YesNoSlot')
                .getResponse()
        }

        if (restaurantName && yesNo) {
            return handlerInput.responseBuilder
                .speak(`Your decision was ${yesNo}! The restuarnat is ${restaurantName}!`)
                .addDelegateDirective()
                .getResponse()
        }

        if (!restaurantName || !date || !time || !numPeople)
            return handlerInput.responseBuilder.addDelegateDirective().getResponse()

        return handlerInput.responseBuilder
            .speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`)
            .withShouldEndSession(true)
            .getResponse()
    },
}

export { MakeReservationIntentHandler }
