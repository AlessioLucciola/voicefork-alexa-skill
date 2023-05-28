import { HandlerInput } from 'ask-sdk-core'
import { ReservationContext, Restaurant, RestaurantSearchResult, Slots } from '../shared/types'
import getCoordinates from './localizationFeatures'
import { searchRestaurants } from '../apiCalls'
import { getDistanceFromContext } from '../apiCalls'
import { TEST_LATLNG } from '../shared/constants'

export const handleSimilarRestaurants = async (handlerInput: HandlerInput, slots: Slots) => {
    const { restaurantName, location, date, time, numPeople, yesNo } = slots
    const DISTANCE_THRESHOLD = 0.3
    const CONTEXT_THRESHOLD = 0.6

    let searchResults: RestaurantSearchResult[] = []
    const coordinates = getCoordinates()
    if (!restaurantName || !date || !time || !numPeople) return null //If the restaurant name is still not provided, this cannot be handled.

    if (coordinates) {
        //TODO: remove this ??, now just for testing purposes
        const locationInfo = { location: coordinates, maxDistance: 40000 }
        searchResults = await searchRestaurants(restaurantName.value ?? 'Pizzeria triticum', locationInfo)
    } else {
        searchResults = await searchRestaurants(
            restaurantName.value ?? 'Pizzeria triticum',
            undefined,
            location.value ?? 'Rome',
        )
    }

    let plausibleContexts: { restaurant: Restaurant; contextDistance: number }[] = []

    //Examine the search results
    for (let result of searchResults) {
        if (result.nameDistance > DISTANCE_THRESHOLD) continue

        const { id } = result.restaurant
        //TODO: so many fake values omg!
        const context: ReservationContext = {
            id_restaurant: id,
            n_people: parseInt(numPeople.value!),
            reservationLocation: TEST_LATLNG, //TODO: for now because the context api only
            currentDay: 1,
            reservationDay: 1,
            currentTime: '10:10',
            reservationTime: '10:10',
        }
        const contextDistance = await getDistanceFromContext(context)

        if (contextDistance !== null && contextDistance < CONTEXT_THRESHOLD) {
            plausibleContexts.push({ restaurant: result.restaurant, contextDistance })
        }
    }

    handlerInput.responseBuilder.speak('')
}
