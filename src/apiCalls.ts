import { LatLng } from './shared/types'
import { RESTAURANTS_URL, RESERVATIONS_URL } from './shared/urls'
import axios from 'axios'
import { RestaurantSearchResult, ReservationContext } from './shared/types'

export const searchNearbyRestaurants = async (
    query: string,
    coordinates: LatLng,
): Promise<RestaurantSearchResult[]> => {
    const { latitude, longitude } = coordinates
    const MAX_DISTANCE = 50000
    const LIMIT = 100
    // Search for the restaurants in a range of MAX_DISTANCE meters, ordered by simlarity to the query and capped at LIMIT results.
    const URL = `${RESTAURANTS_URL}/search-restaurants?query=${query}&latitude=${latitude}&longitude=${longitude}&maxDistance=${MAX_DISTANCE}&limit=${LIMIT}`

    const config = {
        headers: {
            'ngrok-skip-browser-warning ': 'true',
        },
    }

    const searchResult: RestaurantSearchResult[] = (await axios.get(URL, config)).data
    return searchResult
}

/**
 * Given a context, it returns the distance from the context for that id_restaurant.
 * //TODO: For how the API are implemented now, the user is not even considered and we assume there is only one user.
 * @param context
 * @returns
 */
export const getDistanceFromContext = async (context: ReservationContext): Promise<number | null> => {
    const { id_restaurant, n_people, reservationLocation, currentDay, reservationDay, currentTime, reservationTime } =
        context
    const { latitude, longitude } = reservationLocation
    const URL = `${RESERVATIONS_URL}/get-distance-context?id_restaurant=${id_restaurant}&n_people=${n_people}&latitude=${latitude}&longitude=${longitude}&currentDay=${currentDay}&reservationDay=${reservationDay}&currentTime=${currentTime}&reservationTime=${reservationTime}`
    const data = (await axios.get(URL)).data

    return data.distance
}
