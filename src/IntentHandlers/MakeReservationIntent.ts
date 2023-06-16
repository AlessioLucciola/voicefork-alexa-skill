import { RequestHandler } from 'ask-sdk-core'
import { IntentRequest } from 'ask-sdk-model'
import { RestaurantSlots } from '../shared/types'
import { handleSimilarRestaurants } from '../responseHandlers/reservationContextResponseHandler'

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

        const attributesManager = handlerInput.attributesManager
        const sessionAttributes = attributesManager.getSessionAttributes()
        //const retrievedRestaurantsList = sessionAttributes.restaurantList
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes)

        const slotValues: RestaurantSlots = {
            restaurantName: slots?.restaurantName.value,
            location: slots?.location.value,
            date: slots?.date.value,
            time: slots?.time.value,
            numPeople: slots?.numPeople.value,
            yesNo: slots?.YesNoSlot.value,
        }

        const { restaurantName, date, time, numPeople} = slotValues

        if (!restaurantName || !date || !time || !numPeople) {
            //Ask for the data that's missing before disambiguation
            return handlerInput.responseBuilder.addDelegateDirective().getResponse()
        }

        if (restaurantName && date && time && numPeople) {
            return await handleSimilarRestaurants(handlerInput, slotValues)
        }

        if (time !== undefined && date !== undefined) {
            const reservationDate = new Date(date + ' ' + time)
            if (reservationDate < new Date()) {
                return handlerInput.responseBuilder
                    .speak(
                        `Sorry, it seems that you are trying to reserve a table for a date in the past. You want to reserve a table at ${time} in which day?`,
                    )
                    .reprompt(`Do you want to reserve a table for tomorrow or another day?`)
                    .addElicitSlotDirective('date')
                    .getResponse()
            }
        }

        if (date !== undefined) {
            const currentDate = new Date()
            if (currentDate > new Date(date)) {
                return handlerInput.responseBuilder
                    .speak(
                        "Sorry, you can't reserve a table for a date in the past. Please, when do you want to reserve a table?",
                    )
                    .addElicitSlotDirective('date')
                    .getResponse()
            }
        }

        if (!restaurantName || !date || !time || !numPeople) {
            console.log('DEBUG: INSIDE GENERIC RESOLUTION')
            return handlerInput.responseBuilder.addDelegateDirective().getResponse()
        }

        return handlerInput.responseBuilder
            .speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`)
            .withShouldEndSession(true)
            .getResponse()
    },
}

export { MakeReservationIntentHandler }
