import { TEST_LATLNG, LOCALIZATION_ENABLED } from '../shared/constants'
import { LatLng } from '../shared/types'

export const getCoordinates = () => {
    if (LOCALIZATION_ENABLED) return TEST_LATLNG
    else return undefined
}

export const distanceBetweenCoordinates = (origin: LatLng, destination: LatLng): number => {
    const degToRad = (deg: number): number => {
        return deg * (Math.PI / 180)
    }

    const earthRadius = 6371000 // in meters
    const { latitude: lat1, longitude: lon1 } = origin
    const { latitude: lat2, longitude: lon2 } = destination
    const dLat = degToRad(lat2 - lat1)
    const dLon = degToRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = earthRadius * c
    return distance
}

export const parseAddress = (address: string, city: string, zone: string): string => {
    const street = address.split(',')[0]
    const finalAddress = city !== '' ? street + ' in ' + city : street + ' in ' + zone
    return finalAddress
}
