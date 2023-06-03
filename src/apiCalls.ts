import { LatLng } from './shared/types'
import { RESTAURANTS_URL } from './shared/urls'
import axios from 'axios'
import { RestaurantSearchResult } from './shared/types'

export const searchRestaurants = async (
    query: string,
    coordinates: LatLng,
): Promise<RestaurantSearchResult[]> => {
    const { latitude, longitude } = coordinates
    
    const MAX_DISTANCE = 50000
    const LIMIT = 200
    // Search for the restaurants in a range of MAX_DISTANCE meters, ordered by simlarity to the query and capped at LIMIT results.
    const URL = `${RESTAURANTS_URL}search-restaurants?query=${query}&latitude=${latitude}&longitude=${longitude}&maxDistance=${MAX_DISTANCE}&limit=${LIMIT}`

    const config = {
        headers: {
            'ngrok-skip-browser-warning ': 'true',
        },
    }

    const searchResult: RestaurantSearchResult[] = (await axios.get(URL, config)).data
    return searchResult
}

export const searchRestaurantsByCity = async (
    location: string,
): Promise<RestaurantSearchResult[]> => {
    // Search for the restaurants in a range of MAX_DISTANCE meters, ordered by simlarity to the query and capped at LIMIT results.
    const URL = `${RESTAURANTS_URL}restaurants-by-city?city=${location}`

    const config = {
        headers: {
            'ngrok-skip-browser-warning ': 'true',
        },
    }

    const searchResult: RestaurantSearchResult[] = (await axios.get(URL, config)).data
    return searchResult
}