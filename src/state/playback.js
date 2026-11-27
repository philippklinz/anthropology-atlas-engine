import { calendarDate, normalizeTime } from '../domain/time.js';

// The initial windows of all selected chapters define one shared transport.
// Legacy chapters without a window can still use their dated records.
export function playbackWindow(chapters, times, state, belongs) {
    const windows = [], withoutInterval = [];
    const changes = new Set();
    for (const chapter of chapters) {
        if (!state.chapters.includes(chapter.id)) continue;
        const initial = normalizeTime(chapter.initialState.time);
        const window = initial.bound ?? initial.possible;
        if (window) windows.push(window);
        if (!window || chapter.initialState.time.kind !== 'interval') withoutInterval.push(chapter.id);
        for (const step of chapter.steps ?? []) {
            const span = normalizeTime(step.state.time);
            const dates = span.bound ?? span.possible;
            if (dates) {
                changes.add(calendarDate(dates.from).year);
                changes.add(calendarDate(dates.to - 1).year);
            }
        }
    }
    for (const [id, time] of Object.entries(times)) {
        if (!time.possible || !belongs(id, state.chapters)) continue;
        const { from, to } = time.bound ?? time.possible;
        const first = calendarDate(from).year, last = calendarDate(to - 1).year;
        if (withoutInterval.length && belongs(id, withoutInterval)) windows.push({ from, to });
        changes.add(first);
        changes.add(last);
        changes.add(last + 1);
    }
    if (!windows.length) return null;
    const year = 'year' in state.time ? state.time.year : calendarDate(state.time.from).year;
    const end = 'year' in state.time ? year : calendarDate(state.time.to - 1).year;
    let min = year, max = end;
    for (const window of windows) {
        min = Math.min(min, calendarDate(window.from).year);
        max = Math.max(max, calendarDate(window.to - 1).year);
    }
    return { min, max, stops: [...changes].filter(y => y > min && y <= max).sort((a, b) => a - b) };
}

// A long chapter advances in larger steps. Always land on the beginning/end
// of an indexed record so even a single-year observation gets a frame.
export function nextPlaybackYear(year, range) {
    const stride = Math.max(1, Math.ceil((range.max - range.min) / 360));
    const nextStop = range.stops.find(stop => stop > year);
    return Math.min(range.max, year + stride, nextStop ?? range.max);
}

export class YearPlayback {
    constructor(show, onFinish, onError, interval = 240) {
        this.show = show;
        this.onFinish = onFinish;
        this.onError = onError;
        this.interval = interval;
        this.run = 0;
        this.playing = false;
    }
    start(year, range, replayAtEnd = true) {
        this.cancel();
        if (!range || range.min >= range.max) return;
        this.playing = true;
        const run = this.run;
        const frame = async current => {
            try {
                await this.show(current);
                if (this.run !== run) return;
                if (current === range.max) {
                    this.cancel();
                    this.onFinish();
                } else {
                    // Give readers time to see a short-lived feature or pause at a chapter station.
                    const delay = current === range.min || range.stops.includes(current) ? this.interval * 4 : this.interval;
                    this.timer = setTimeout(() => frame(nextPlaybackYear(current, range)), delay);
                }
            } catch (error) {
                if (this.run !== run) return;
                this.cancel();
                this.onError(error);
            }
        };
        void frame(replayAtEnd && year >= range.max ? range.min : Math.max(range.min, Math.min(range.max, year)));
    }
    cancel() {
        this.run++;
        clearTimeout(this.timer);
        this.playing = false;
    }
}
