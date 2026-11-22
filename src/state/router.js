import { decodeState, encodeState, normalizeState } from './state.js';
export class Router {
    state;
    preview;
    onChange;
    defaults;
    constructor(defaults, onChange, onError, chapters = []) {
        this.abort = new AbortController();
        const options = {signal:this.abort.signal};
        this.defaults = defaults;
        this.state = defaults;
        this.onChange = onChange;
        const restore = () => { try {
            const { state, warnings } = decodeState(location.hash, this.defaults, chapters);
            this.preview = undefined;
            this.state = state;
            const hash = encodeState(state);
            if (location.hash !== hash)
                history.replaceState(null, '', hash);
            this.onChange(state, warnings);
        }
        catch (e) {
            onError(e);
        } };
        this.lastURL = '';
        const navigate = () => { if (location.href === this.lastURL)
            return; restore(); this.lastURL = location.href; };
        addEventListener('popstate', navigate, options);
        addEventListener('hashchange', navigate, options);
        document.addEventListener('click', e => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented)
                return;
            const a = e.target.closest('a[href]');
            if (!a || a.target || a.hasAttribute('download'))
                return;
            const u = new URL(a.href);
            if (u.origin !== location.origin || u.pathname !== location.pathname || u.search !== location.search || !u.hash.startsWith('#/'))
                return;
            e.preventDefault();
            try {
                this.commit(decodeState(u.hash, this.defaults, chapters).state);
            }
            catch (err) {
                onError(err);
            }
        }, options);
        restore();
        this.lastURL = location.href;
    }
    commit(state) {
        const normalized = normalizeState(state), hash = encodeState(normalized);
        this.preview = undefined;
        if (location.hash === hash)
            return;
        history.pushState(null, '', hash);
        this.lastURL = location.href;
        this.state = normalized;
        this.onChange(normalized, []);
    }
    destroy() { this.abort.abort(); }
    commitPreview() { if (this.preview)
        this.commit(this.preview); }
}
