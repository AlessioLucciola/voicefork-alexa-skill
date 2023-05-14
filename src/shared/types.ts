export type RestaurantSlots = {
	restaurantName: string | undefined
	date: string | undefined
	time: string | undefined
	numPeople: string | undefined
}

export type LatLng = {
	latitude: number
	longitude: number
}

//This reflects the backend prisma Restaurant type, so it has to be changed whenever that is changed
export type Restaurant = {
	id: number
	imageName: string
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
