import { DateTime } from 'luxon'
import { DateComponents } from '../shared/types'

export const getDateComponentsFromDate = (dateTime?: DateTime | string): DateComponents => {
    if (dateTime === undefined) dateTime = DateTime.now()
    else if (typeof dateTime === 'string') {
        dateTime = DateTime.fromISO(dateTime)
    }
    const { day, weekday, month, year, hour, minute } = dateTime
    console.log(`I converted the date to ${dateTime}`)
    return { day, weekday, month, year, hour, minute }
}

export const convertAmazonDateTime = (date: string, time: string): DateTime => {
    const [year, month, day] = date.split('-')
    const [hour, minute] = time.split(':')

    const result = DateTime.local(+year, +month, +day, +hour, +minute)
    console.log(`I converted the Amazon date and time from ${date} and ${time} to ${result}`)

    return DateTime.local(+year, +month, +day, +hour, +minute)
}

export const parseTime = (hour: number, minutes: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
