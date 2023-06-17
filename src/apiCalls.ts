import { LatLng } from './shared/types'
import { RESTAURANTS_URL, RESERVATIONS_URL } from './shared/urls'
import axios from 'axios'
import { RestaurantSearchResult, ReservationContext, ReservationData } from './shared/types'
import { MAX_DISTANCE, ROME_LATLNG } from './shared/constants'

export const searchNearbyRestaurants = async (
    query: string,
    coordinates: LatLng,
): Promise<RestaurantSearchResult[]> => {
    const { latitude, longitude } = coordinates
    const MAX_DISTANCE = 50000
    const LIMIT = 500
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
 * Returns the list of restaurants, sorted by their distance from the query.
 * If the latitude and longitude are defined, the response also includes the distance in meters from the restaurant.
 * @param query
 * @param locationInfo
 * @param city
 * @returns
 */
export const searchRestaurants = async (
    query: string,
    locationInfo?: { location: LatLng; maxDistance: number },
    city?: string,
): Promise<RestaurantSearchResult[]> => {
    let URL = ''
    const MAX_DISTANCE = 50000
    const LIMIT = 500
    if (locationInfo) {
        const { location, maxDistance } = locationInfo
        const { latitude, longitude } = location
        URL = `${RESTAURANTS_URL}/search-restaurants?query=${query}&latitude=${latitude}&longitude=${longitude}&maxDistance=${MAX_DISTANCE}&limit=${LIMIT}`
    } else {
        URL = `${RESTAURANTS_URL}/search-restaurants?query=${query}&city=${city}&limit=${LIMIT}`
    }
    console.log(`Made api call to ${URL}`)
    const data: RestaurantSearchResult[] = (await axios.get(URL)).data
    console.log(`${URL} returned ${JSON.stringify(data, null, 2)}`)
    return data
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
    console.log(`Made api call to ${URL}`)
    const data = (await axios.get(URL)).data
    console.log(`${URL} returned ${JSON.stringify(data, null, 2)}`)
    return data.distance
}

export const createReservation = async (reservation: ReservationData): Promise<number> => {
    const URL = `${RESERVATIONS_URL}/create-reservation`
    console.log(`Made api call to ${URL}`)
    const response = (await axios.post(URL, reservation))
    return response.status
}

export const getCityCoordinates = async (city: string): Promise<LatLng> => {
    const URL = `https://geocode.maps.co/search?city=${city}`
    const response = await axios.get(URL)
    console.log(`Made api call to ${URL}`)
    if (response.status === 200) {
        if (response.data.length > 0) {
            const lat = response.data[0].lat
            const lon = response.data[0].lon
            console.log(`${URL} returned these coordinates: lat = (${lat}), lon = (${lon})}`)
            const cityCoordinates: LatLng = {latitude: lat, longitude: lon}
            return cityCoordinates
        }
        console.log(`${city} not found. Setting coordinates to "Rome" ones.`)
        return ROME_LATLNG
    } else {
        console.log(`${URL} call returned an error. Setting coordinates to "Rome" ones.`)
        return ROME_LATLNG
    }
}