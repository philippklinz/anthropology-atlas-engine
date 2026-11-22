// Panel geometry is a local display preference, not a historical navigation step.
export const DEFAULT_TIMELINE_HEIGHT = 232;
export class AtlasLayout {
    constructor(shell, onResize = () => {}, storage) {
        this.shell = shell;
        this.onResize = onResize;
        this.open = false;
        this.height = DEFAULT_TIMELINE_HEIGHT;
        this.abort = new AbortController();
        try {
            this.storage = storage ?? window.localStorage;
            const saved = Number(this.storage.getItem('atlas.timelineHeight.v1'));
            if (Number.isFinite(saved) && saved > 0) this.height = saved;
        } catch { /* Storage is optional, including in private browsing. */ }
        const options = {signal: this.abort.signal};
        shell.addEventListener('click', e => {
            if (e.target.closest('#menu-button')) this.setOpen(!this.open);
            else if (e.target.closest('#menu-close, #menu-backdrop')) this.setOpen(false);
            else if (this.open && e.target.closest('#sidebar a[href]') && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) this.setOpen(false);
        }, options);
        document.addEventListener('keydown', e => {
            if (!this.open) return;
            if (e.key === 'Escape') { e.preventDefault(); this.setOpen(false); }
            if (e.key === 'Tab') {
                const items = [...this.get('sidebar').querySelectorAll('a[href], button, input, summary')].filter(el => !el.disabled && el.getClientRects().length);
                const first = items[0], last = items.at(-1);
                if (e.shiftKey && (document.activeElement === first || !this.get('sidebar').contains(document.activeElement))) { e.preventDefault(); last?.focus(); }
                else if (!e.shiftKey && (document.activeElement === last || !this.get('sidebar').contains(document.activeElement))) { e.preventDefault(); first?.focus(); }
            }
        }, options);
        this.observer = new ResizeObserver(() => this.schedule());
        this.observer.observe(shell);
    }
    get(id) { return this.shell.querySelector('#' + id); }
    setOpen(open, focus = true) {
        this.open = open;
        const sidebar = this.get('sidebar');
        sidebar.classList.toggle('open', open);
        sidebar.inert = !open;
        sidebar.setAttribute('aria-hidden', String(!open));
        sidebar.setAttribute('role', 'dialog');
        if (open) sidebar.setAttribute('aria-modal', 'true');
        else sidebar.removeAttribute('aria-modal');
        this.get('menu-backdrop').hidden = !open;
        const button = this.get('menu-button');
        button?.setAttribute('aria-expanded', String(open));
        button?.setAttribute('aria-label', open ? this.messages?.closeNavigation : this.messages?.openNavigation);
        for (const id of ['topbar', 'main', 'timebar']) this.get(id).inert = open;
        cancelAnimationFrame(this.focusFrame);
        if (focus) {
            (open ? this.get('menu-close') : button)?.focus();
            // During the opening visibility transition the first focus can be ignored.
            if (open) this.focusFrame = requestAnimationFrame(() => {
                if (this.open && !sidebar.contains(document.activeElement)) this.get('menu-close')?.focus();
            });
        }
    }
    bounds() {
        const controls = this.get('time-controls')?.offsetHeight ?? 76;
        const minimum = controls + 14 + 80;
        return {minimum, maximum: Math.max(minimum, this.shell.clientHeight - this.get('topbar').offsetHeight - 180)};
    }
    apply() {
        const {minimum, maximum} = this.bounds();
        this.actualHeight = Math.round(Math.max(minimum, Math.min(maximum, this.height)));
        this.shell.style.setProperty('--timeline-height', this.actualHeight + 'px');
        const grip = this.get('timeline-resizer');
        if (grip) {
            grip.setAttribute('aria-valuemin', String(minimum));
            grip.setAttribute('aria-valuemax', String(maximum));
            grip.setAttribute('aria-valuenow', String(this.actualHeight));
            grip.setAttribute('aria-valuetext', `${this.actualHeight} px`);
        }
        this.onResize();
    }
    schedule() {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.apply());
    }
    save() {
        try { this.storage?.setItem('atlas.timelineHeight.v1', String(this.height)); } catch { /* Optional preference. */ }
    }
    sync(messages) {
        this.messages = messages;
        this.setOpen(this.open, false);
        const grip = this.get('timeline-resizer');
        if (!grip) return;
        grip.setAttribute('aria-label', messages.resizeTimeline);
        grip.title = messages.resizeTimelineHint;
        if (this.grip !== grip) {
            this.grip = grip;
            const options = {signal: this.abort.signal};
            grip.addEventListener('pointerdown', e => {
                if (!e.isPrimary || e.button !== 0) return;
                e.preventDefault();
                grip.focus();
                this.drag = {id: e.pointerId, y: e.clientY, height: this.actualHeight};
                grip.setPointerCapture(e.pointerId);
                this.shell.classList.add('timeline-resizing');
            }, options);
            grip.addEventListener('pointermove', e => {
                if (this.drag?.id !== e.pointerId) return;
                const {minimum, maximum} = this.bounds();
                this.height = Math.max(minimum, Math.min(maximum, this.drag.height + this.drag.y - e.clientY));
                this.schedule();
            }, options);
            const end = e => {
                if (this.drag?.id !== e.pointerId) return;
                if (e.type === 'pointercancel') this.height = this.drag.height;
                this.drag = undefined;
                this.shell.classList.remove('timeline-resizing');
                this.apply();
                this.save();
            };
            for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) grip.addEventListener(type, end, options);
            grip.addEventListener('keydown', e => {
                const {minimum, maximum} = this.bounds();
                if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
                e.preventDefault();
                this.height = e.key === 'Home' ? minimum : e.key === 'End' ? maximum : Math.max(minimum, Math.min(maximum, this.actualHeight + (e.key === 'ArrowUp' ? 24 : -24)));
                this.apply(); this.save();
            }, options);
            grip.addEventListener('dblclick', () => { this.height = DEFAULT_TIMELINE_HEIGHT; this.apply(); this.save(); }, options);
            this.observer.observe(this.get('time-controls'));
        }
        this.schedule();
    }
    destroy() {
        this.abort.abort(); this.observer.disconnect(); cancelAnimationFrame(this.frame); cancelAnimationFrame(this.focusFrame);
    }
}
