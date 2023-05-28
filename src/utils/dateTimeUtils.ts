import { DateTime } from 'luxon'
import { DateComponents } from '../shared/types'

export const getDateComponentsFromDate = (dateTime: Date | DateTime | string): DateComponents => {
    let parsedDateTime: DateTime = dateTime as DateTime
    switch (typeof dateTime) {
        case typeof Date:
            parsedDateTime = DateTime.fromJSDate(dateTime as Date)
            break
        case typeof String:
            parsedDateTime = DateTime.fromISO(dateTime as string)
            break
    }

    const { day, weekday, month, year, hour, minute, second } = parsedDateTime
    return { day, weekday, month, year, hour, minute, second }
}

export const convertAmazonDateTime = (date: string, time: string): DateTime => {
    const [year, month, day] = date.split('-')
    const [hour, minute, second] = time.split(':')

    return DateTime.local(+year, +month, +day, +hour, +minute, +second)
}
