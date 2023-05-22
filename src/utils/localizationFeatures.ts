import { TEST_LATLNG, LOCALIZATION_ENABLED } from '../shared/constants'

const getCoordinates = () => {
    if (LOCALIZATION_ENABLED) return TEST_LATLNG
    else return undefined
}

export default getCoordinates