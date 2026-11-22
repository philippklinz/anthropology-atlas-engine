import { calendarDate, isDeepYear, MIN_YEAR, DEEP_TIME_YEAR, MAX_YEAR, yearRange } from '../domain/time.js';
// A linear display projection only. Historical queries always use unscaled epoch days.
// 1,000 historical days occupy one renderer day, keeping Date safely in range.
export function timelineProjection(time) {
    const deep = isDeepYear('year' in time ? time.year : calendarDate(time.from).year);
    const millisecondsPerDay = 86400000 / (deep ? 1000 : 1);
    return {
        deep,
        toDate: day => new Date(day * millisecondsPerDay),
        fromDate: date => Math.round(Number(date) / millisecondsPerDay),
        min: new Date(yearRange(deep ? MIN_YEAR : DEEP_TIME_YEAR).from * millisecondsPerDay),
        max: new Date(yearRange(MAX_YEAR).to * millisecondsPerDay),
        zoomMin: (deep ? 365 : 1) * millisecondsPerDay
    };
}
