import { RequestHandler } from 'ask-sdk-core'
import { IntentRequest } from 'ask-sdk-model'
import { RestaurantSlots } from '../shared/types'
import { searchNearbyRestaurants, searchRestaurantsByCity } from '../apiCalls'
import getCoordinates from '../utils/localizationFeatures'

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

        const coordinates = getCoordinates()
        let restaurantsList: any = []
        let restaurantNameRes: any = []
        let solveRestaurantName = false

        const { restaurantName, location, date, time, numPeople, yesNo }: RestaurantSlots = {
            restaurantName: slots?.restaurantName.value,
            location: slots?.location.value,
            date: slots?.date.value,
            time: slots?.time.value,
            numPeople: slots?.numPeople.value,
            yesNo: slots?.YesNoSlot.value,
        }

        const findSimilarRestaurant = (restaurantName: string, restaurants: any) => {
            if (!restaurants || restaurants.length === 0) {
                //TO DO: SAREBBE DA MIGLIORARE DANDO LA POSSIBILITA' DI SPECIFICARE UNA NUOVA LOCATION MA SE SI AGGIUNGE UN "addElicitSlotDirective(location)" -> BUG.
                return handlerInput.responseBuilder
                .speak(
                    `Sorry but I didn't find any restaurants with that name in your location.`
                )
                .getResponse()
            } else {
                let restaurantNameInResults: any = []
                restaurants.map((item: any) => {
                    if (item.restaurant.name.toLowerCase().includes(restaurantName.toLowerCase())) {
                        restaurantNameInResults.push(item)
                    }
                })

                //sessionAttributes.restaurantsList = restaurants //Lista di tutti i ristoranti trovati
                //sessionAttributes.restaurantNamesInResults = restaurantNameInResults //Lista dei ristoranti trovati in cui apparte il nome dato in input
                //sessionAttributes.solveRestaurantName = true //Mi porta nel caso in cui va risolto il nome del ristorante
                //attributesManager.setSessionAttributes(sessionAttributes)
                restaurantsList = restaurants
                restaurantNameRes = restaurantNameInResults
                solveRestaurantName = true
                solveRestaurantNameError()
            }
            return
        }

        const solveRestaurantNameError = () => {
            if (restaurantNameRes.length > 0) {
                //Caso in cui ho trovato risultati in cui appare il nome del ristorante
                //Per ora prendo quello più simile ma forse si può fare qualcosa con il contesto o la distanza
                if (!restaurantNameRes[0].restaurant.name.toLowerCase() === restaurantsList[0].restaurant.name.toLowerCase()) {
                    // Ci sarebbe da aggiornare lo slot con il nome del nuovo ristorante in qualche modo
                    // Prendo il ristorante più simile
                    sessionAttributes.restaurant = restaurantsList[0]
                } else {
                    //Prendo il ristorante con esattamente lo stesso nome
                    sessionAttributes.restaurant = restaurantNameRes[0]
                }
            } else {
                //Caso in cui non appare il nome del ristorante ma la lista è comunque non vuota quindi propongo quello più simile
                const mostSimilarRestaurantName = restaurantsList[0].restaurant.name
                sessionAttributes.restaurant = restaurantsList[0]
                return handlerInput.responseBuilder
                .speak(
                    `The restaurant ${restaurantName} doesn't exist, the most similar is ${mostSimilarRestaurantName}, did you mean that?`,
                )
                .addElicitSlotDirective('YesNoSlot')
                .getResponse()
            }
            return
        }

        const getRestaurants = async (restaurantName: string) => {
            if (coordinates !== undefined && location !== undefined) {
                // Caso in cui HO le coordinate dell'utente MA voglio comunque prenotare altrove
                const restaurants = await searchRestaurantsByCity(restaurantName, location)
                findSimilarRestaurant(restaurantName, restaurants)
            } else if (coordinates !== undefined && location === undefined) {
                // Caso in cui HO le coordinate dell'utente e NON mi è stata detta la città (quindi devo cercare vicino all'utente)
                const restaurants = await searchNearbyRestaurants(restaurantName, coordinates)
                findSimilarRestaurant(restaurantName, restaurants)
            } else if (coordinates === undefined && location !== undefined ) {
                // Caso in cui NON HO le coordinate dell'utente MA mi è stata detta la città
                const restaurants = await searchRestaurantsByCity(restaurantName, location)
                findSimilarRestaurant(restaurantName, restaurants)
            } else {
                // Altrimenti (non ho né coordinate, né città)..
                return handlerInput.responseBuilder
                .speak(
                    `Sorry, I can't get your location. Can you please tell me the name of the city you want to reserve to?`
                )
                .reprompt(`Please, tell me the name of a city like "Rome" or "Milan" in which the restaurant is.`)
                .addElicitSlotDirective('location')
                .getResponse()
            }
            return
        }

        //Get the list of restaurants and solve the possible disambiguation
        if (restaurantName !== undefined && (solveRestaurantName)) {
            if (solveRestaurantName) {
                // Caso in cui il nome detto dall'utente non è corretto e va proposto un nuovo nome
                return handlerInput.responseBuilder
                .speak(
                    `Caso in cui il nome detto dall'utente non è corretto e va proposto un nuovo nome`
                )
                .getResponse()
                //solveRestaurantNameError(sessionAttributes.similarRestaurants)
            } else if (sessionAttributes.restaurantDisambiguation) {
                // Caso in cui si deve risolvere la disambiguazione
                return handlerInput.responseBuilder
                .speak(
                    `Caso in cui si deve risolvere la disambiguazione`
                )
                .getResponse()
            } else if (yesNo === undefined) {
                // Caso in cui l'utente ha detto il nome del ristorante ma si deve ancora ottenere la lista
                getRestaurants(restaurantName) //Richiama l'API che prende la lista dei ristoranti
            }
        }

        if (time !== undefined && date !== undefined) {
            const reservationDate = new Date(date + " " + time)
            if (reservationDate < new Date()) {
                return handlerInput.responseBuilder
                .speak(
                    `Sorry, it seems that you are trying to reserve a table for a date in the past. You want to reserve a table at ${time} in which day?`
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
                    'Sorry, you can\'t reserve a table for a date in the past. Please, when do you want to reserve a table?',
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