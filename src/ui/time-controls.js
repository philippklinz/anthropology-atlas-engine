import { BP_REFERENCE_YEAR, MAX_BP, MAX_YEAR, MIN_YEAR, calendarDate, formatDisplayYear, formatRange, isDeepYear, yearFromBP } from '../domain/time.js';
import { messages } from '../i18n/messages.js';
import { YearPlayback } from '../state/playback.js';

export class TimeControls {
    constructor(container, { preview, apply, finish, discard, reset, error }) {
        this.container = container;
        this.finish = finish;
        this.clock = new YearPlayback(year => preview(year, 'playback'), () => this.pause(), error);
        container.innerHTML = `
            <div class="time-position"><span id="time-label" class="eyebrow"></span><strong class="current-year"></strong></div>
            <div id="playback-controls">
                <button id="time-play" type="button" aria-controls="map timeline"><span class="transport-icon" aria-hidden="true"></span><span class="transport-label"></span></button>
                <label for="year-scrubber" class="sr-only"></label><input id="year-scrubber" type="range" step="1" aria-controls="map timeline">
            </div>
            <button id="selection-time" class="selection-time-reset" type="button"></button>
            <form id="year-form"><button type="button" id="previous">−</button><label for="year" class="sr-only"></label><input id="year" type="number" required>
                <label for="era" class="sr-only"></label><select id="era"><option value="bp"></option><option value="ce"></option><option value="bce"></option></select>
                <button type="submit"></button><button type="button" id="next">+</button></form>
            <p class="time-hint"></p>`;
        this.find = selector => container.querySelector(selector);
        this.scrubber = this.find('#year-scrubber');
        this.input = this.find('#year');
        this.era = this.find('#era');
        const form = this.find('#year-form');
        const enteredYear = () => {
            const value = this.input.valueAsNumber;
            return this.era.value === 'bp' ? yearFromBP(value) : this.era.value === 'bce' ? 1 - value : value;
        };
        this.find('#time-play').onclick = () => {
            if (this.clock.playing) this.pause();
            else if (form.reportValidity()) {
                const year = enteredYear();
                if (year < this.range.min || year > this.range.max) {
                    this.setRange({...this.range, min: Math.min(year, this.range.min), max: Math.max(year, this.range.max)});
                }
                this.clock.start(year, this.range, year === this.year);
                this.updateTransport();
            }
        };
        const scrubKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']);
        let keyboardScrub = false;
        this.scrubber.onkeydown = event => {
            if (scrubKeys.has(event.key)) keyboardScrub = true;
        };
        const finishKeys = () => {
            if (!keyboardScrub) return;
            keyboardScrub = false;
            this.pause();
        };
        this.scrubber.onkeyup = event => { if (scrubKeys.has(event.key)) finishKeys(); };
        this.scrubber.onblur = finishKeys;
        this.scrubber.oninput = () => {
            this.cancel();
            void preview(this.scrubber.valueAsNumber).catch(error);
        };
        this.scrubber.onchange = () => { if (!keyboardScrub) this.pause(); };
        this.scrubber.addEventListener('pointercancel', () => { this.cancel(); discard(); });
        this.find('#selection-time').onclick = reset;
        this.era.onchange = () => this.inputBounds();
        form.onfocusin = () => { if (this.clock.playing) this.pause(); };
        form.onsubmit = e => {
            e.preventDefault();
            apply(enteredYear());
        };
        this.find('#previous').onclick = () => apply(Math.max(MIN_YEAR, this.year - this.step));
        this.find('#next').onclick = () => apply(Math.min(MAX_YEAR, this.year + this.step));
    }
    inputBounds() {
        this.input.min = this.era.value === 'bp' ? 0 : 1;
        this.input.max = this.era.value === 'bp' ? MAX_BP : this.era.value === 'bce' ? 1 - MIN_YEAR : MAX_YEAR;
    }
    cancel() {
        this.clock.cancel();
        this.updateTransport();
    }
    pause() {
        this.cancel();
        this.finish();
    }
    updateTransport() {
        const playing = this.clock.playing, de = this.language === 'de', button = this.find('#time-play');
        button.querySelector('.transport-icon').textContent = playing ? 'Ⅱ' : '▶';
        button.querySelector('.transport-label').textContent = playing ? 'Pause' : de ? 'Abspielen' : 'Play';
        button.ariaLabel = playing ? (de ? 'Wiedergabe pausieren' : 'Pause playback') : (de ? 'Zeit abspielen' : 'Play through time');
        button.title = button.ariaLabel;
    }
    showYear(year, time = {year}) {
        const m = messages[this.language], de = this.language === 'de', deep = isDeepYear(year);
        this.year = year;
        this.step = deep ? 1000 : 1;
        this.find('.current-year').textContent = 'year' in time ? formatDisplayYear(year, this.language) : formatRange(time, this.language);
        this.scrubber.value = String(year);
        this.scrubber.setAttribute('aria-valuetext', formatDisplayYear(year, this.language));
        this.input.value = deep ? BP_REFERENCE_YEAR - year : year <= 0 ? 1 - year : year;
        this.era.value = deep ? 'bp' : year <= 0 ? 'bce' : 'ce';
        this.inputBounds();
        this.find('#previous').ariaLabel = deep ? (de ? '1.000 Jahre früher' : '1,000 years earlier') : m.previous;
        this.find('#next').ariaLabel = deep ? (de ? '1.000 Jahre später' : '1,000 years later') : m.next;
        this.find('#previous').disabled = year <= MIN_YEAR;
        this.find('#next').disabled = year >= MAX_YEAR;
        this.find('.time-hint').textContent = deep
            ? (de ? 'BP = Jahre vor 1950 · Schraffur: Datierungsbereich, keine Dauer · ‹: ältere Grenze offen' : 'BP = years before 1950 · Hatching: dating range, not duration · ‹: older limit unknown')
            : m.gap;
    }
    setRange(range) {
        this.range = range;
        this.find('#time-play').disabled = !range || range.min === range.max;
        this.scrubber.disabled = this.find('#time-play').disabled;
        if (range) {
            this.scrubber.min = range.min;
            this.scrubber.max = range.max;
        }
    }
    update(state, range, mapVisible) {
        this.language = state.language;
        this.setRange(range);
        const de = this.language === 'de', m = messages[this.language];
        this.find('#time-label').textContent = m.time;
        this.find('label[for="year-scrubber"]').textContent = de ? 'Kartenjahr wählen' : 'Choose map year';
        this.find('#selection-time').textContent = de ? 'Gesamter Zeitraum' : 'Full date range';
        this.find('label[for="year"]').textContent = m.year;
        this.find('label[for="era"]').textContent = de ? 'Zeitrechnung' : 'Era';
        this.era.options[0].textContent = de ? 'Jahre BP' : 'years BP';
        this.era.options[1].textContent = m.ce;
        this.era.options[2].textContent = m.bce;
        this.find('#year-form [type="submit"]').textContent = m.apply;
        this.find('#playback-controls').hidden = !mapVisible || !range;
        this.updateTransport();
        this.showYear('year' in state.time ? state.time.year : calendarDate(state.time.from).year, state.time);
    }
}
