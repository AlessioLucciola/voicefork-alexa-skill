import { HandlerInput, RequestHandler } from 'ask-sdk-core'
import { IntentRequest } from 'ask-sdk-model'
import { LatLng, RestaurantSlots } from '../shared/types'
import { searchNearbyRestaurants } from '../apiCalls'
import getCoordinates from '../utils/localizationFeatures'

const MakeReservationIntentHandler: RequestHandler = {
    canHandle(handlerInput: HandlerInput) {
        const request = handlerInput.requestEnvelope.request as IntentRequest
        const { type } = request
        if (type === 'IntentRequest') {
            const { name } = request.intent
            return type === 'IntentRequest' && name === 'MakeReservationIntent'
        }
        return false
    },
    async handle(handlerInput: HandlerInput) {
        const { intent: currentIntent } = handlerInput.requestEnvelope.request as IntentRequest
        const slots = currentIntent?.slots

        const { attributesManager } = handlerInput

        const coordinates = getCoordinates()

        const slotValues: RestaurantSlots = {
            restaurantName: slots?.restaurantName.value,
            location: slots?.location.value,
            date: slots?.date.value,
            time: slots?.time.value,
            numPeople: slots?.numPeople.value,
            yesNo: slots?.YesNoSlot.value,
        }

        const { restaurantName, location, date, time, numPeople, yesNo } = slotValues

        if (!restaurantName || !date || !time || !numPeople) {
            //Ask for the data that's missing before disambiguation
            return handlerInput.responseBuilder.addDelegateDirective().getResponse()
        }

        const findNearbyRestaurants = async (coordinates: LatLng) => {
            return await searchNearbyRestaurants(restaurantName !== undefined ? restaurantName : '', coordinates)
        }

        const findSimilarRestaurant = (restaurants: any) => {
            //TODO: Just a test: if the restaurant is not exactly what the user says, then ask if the best match is the wanted restaurant
            if (
                restaurantName &&
                !yesNo &&
                !restaurants
                    .map((item: any) => item.restaurant.name.toLowerCase())
                    .includes(restaurantName.toLowerCase())
            ) {
                const mostSimilarRestaurantName = restaurants[0].restaurant.name
                attributesManager.setSessionAttributes({ disRestaurantName: mostSimilarRestaurantName })
                return handlerInput.responseBuilder
                    .speak(
                        `The restaurant ${restaurantName} doesn't exist, the most similar is ${mostSimilarRestaurantName}, did you mean that?`,
                    )
                    .addElicitSlotDirective('YesNoSlot')
                    .getResponse()
            }
            return
        }

        //Get the restaurant list nearby the user
        if (restaurantName) {
            if (coordinates !== undefined && location !== undefined) {
                // TO DO: Caso in cui ho le coordinate dell'utente ma voglio comunque prenotare altrove
                return handlerInput.responseBuilder
                    .speak(`You are in the case in which you have the coordinates but you want to reserve elsewhere`)
                    .getResponse()
            } else if (coordinates !== undefined && location === undefined) {
                const restaurants = findNearbyRestaurants(coordinates)
                findSimilarRestaurant(restaurants)
            } else if (coordinates === undefined && location !== undefined) {
                // TO DO: Caso in cui non ho le coordinate dell'utente ma mi è stata detta la città
                return handlerInput.responseBuilder
                    .speak(
                        `You are in the case in which you don't have the coordinates but you already have the city. In case you only have to solve the disambiguation if necessary.`,
                    )
                    .getResponse()
            } else {
                return handlerInput.responseBuilder
                    .speak(
                        `Sorry, I can't get your location. Can you please tell me the name of the city you want to reserve to?`,
                    )
                    .reprompt(`Please, tell me the name of a city like "Rome" or "Milan" in which the restaurant is.`)
                    .addElicitSlotDirective('location')
                    .getResponse()
            }
        }

        //TODO: Just a test: If the user has already responded to the restaurant disambiguation prompt, show the results.
        if (restaurantName && yesNo) {
            const { disRestaurantName } = attributesManager.getSessionAttributes() //TODO: restaurantName remains unchanged
            return handlerInput.responseBuilder
                .speak(`Your decision was ${yesNo}! The restaurant is ${disRestaurantName}!`)
                .addDelegateDirective()
                .getResponse()
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

        if (!restaurantName || !date || !time || !numPeople)
            return handlerInput.responseBuilder.addDelegateDirective().getResponse()

        return handlerInput.responseBuilder
            .speak(`Final reservation details: ${restaurantName}, ${date}, ${time}, ${numPeople}`)
            .withShouldEndSession(true)
            .getResponse()
    },
}

export { MakeReservationIntentHandler }