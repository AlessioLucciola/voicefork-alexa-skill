import { Slot } from 'ask-sdk-model'

export type RestaurantSlots = {
    restaurantName: string | undefined
    location: string | undefined
    date: string | undefined
    time: string | undefined
    numPeople: string | undefined
    yesNo: string | undefined
}

export type LatLng = {
    latitude: number
    longitude: number
}

//This reflects the backend prisma Restaurant type, so it has to be changed whenever that is changed
export type Restaurant = {
    id: number
    imageName: string
    embeddingName: string
    name: string
    address: string
    latitude: number
    longitude: number
    country: string
    region: string
    province: string
    city: string
    tags: string
    cuisines: string
    specialDiets: string
    priceLevel: string
    meals: string
    avgRating: number
    vegetarianFriendly: boolean
    veganFriendly: boolean
    glutenFree: boolean
    reviewsNumber: number
}

//This is the type of the SearchRestaurants API response, so has to be changed accordingly.
export type RestaurantSearchResult = {
    restaurant: Restaurant
    nameDistance: number
    locationDistance?: number
}

export type ReservationContext = {
    id_restaurant: number
    n_people: number
    reservationLocation: LatLng
    centroidDistance?: number
    timeDistanceFromCurrent?: number
    timeDistanceFromReservation?: number
    currentDay: number
    reservationDay: number
    currentTime?: string
    reservationTime?: string
}

//This represents the slots that the skill supports, and they have to be updated accordingly.
export type Slots = {
    restaurantName: Slot
    location: Slot
    date: Slot
    time: Slot
    numPeople: Slot
    yesNo: Slot
}
