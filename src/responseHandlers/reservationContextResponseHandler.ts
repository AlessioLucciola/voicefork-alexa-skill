import { HandlerInput } from 'ask-sdk-core'
import { Response } from 'ask-sdk-model'
import { ReservationContext, Restaurant, RestaurantSearchResult, RestaurantSlots } from '../shared/types'
import getCoordinates from '../utils/localizationFeatures'
import { searchRestaurants } from '../apiCalls'
import { getDistanceFromContext } from '../apiCalls'
import { TEST_LATLNG } from '../shared/constants'
import { getDateComponentsFromDate, convertAmazonDateTime } from '../utils/dateTimeUtils'
/**
 * Searches for the restaurants that match better the user query, and gives a score to each one of them based on the distance from the query and the context.
 * @param handlerInput
 * @param slots
 * @returns
 */
export const handleSimilarRestaurants = async (
    handlerInput: HandlerInput,
    slots: RestaurantSlots,
): Promise<Response> => {
    const { restaurantName, location, date, time, numPeople, yesNo } = slots
    const DISTANCE_THRESHOLD = 0.3
    const CONTEXT_SOFT_THRESHOLD = 2
    const CONTEXT_HARD_THRESHOLD = 0.5
    let searchResults: RestaurantSearchResult[] = []
    const coordinates = getCoordinates()
    if (!restaurantName || !date || !time || !numPeople) {
        //Ask for the data that's missing before disambiguation
        return handlerInput.responseBuilder.addDelegateDirective().getResponse()
    }

    if (coordinates) {
        const locationInfo = { location: coordinates, maxDistance: 40000 }
        searchResults = await searchRestaurants(restaurantName, locationInfo)
    } else {
        searchResults = await searchRestaurants(restaurantName, undefined, location ?? 'Rome')
    }

    let plausibleContexts: { restaurant: Restaurant; contextDistance: number; nameDistance: number }[] = []

    //Examine the search results
    for (let result of searchResults) {
        if (result.nameDistance > DISTANCE_THRESHOLD) continue

        const { id } = result.restaurant

        const { weekday: currentDay, hour: currentHour, minute: currentMinute } = getDateComponentsFromDate(Date())
        const currentTime = `${currentHour}:${currentMinute}`
        const reservationDateTime = convertAmazonDateTime(date, time)
        const reservationDateComponents = getDateComponentsFromDate(reservationDateTime)
        const { weekday: reservationDay, hour: reservationHour, minute: reservationMinute } = reservationDateComponents
        const reservationTime = `${reservationHour}:${reservationMinute}`

        const context: ReservationContext = {
            id_restaurant: id,
            n_people: parseInt(numPeople),
            reservationLocation: TEST_LATLNG, //TODO: for now because the context api only works with coordinates and not with the city
            currentDay,
            reservationDay,
            currentTime,
            reservationTime,
        }
        const contextDistance = await getDistanceFromContext(context)

        if (contextDistance !== null && contextDistance < CONTEXT_SOFT_THRESHOLD) {
            plausibleContexts.push({
                restaurant: result.restaurant,
                contextDistance,
                nameDistance: result.nameDistance,
            })
        }
    }
    //Examine the plausible restaurants
    console.log(JSON.stringify(plausibleContexts)) //TODO: debug

    return handlerInput.responseBuilder
        .speak(
            `I examined the results, they are ${plausibleContexts.length}, the top 3 are: ${JSON.stringify(
                plausibleContexts.slice(0, 3),
            )}`,
        )
        .getResponse()
}
