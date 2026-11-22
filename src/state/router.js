import { decodeState, encodeState, normalizeState } from './state.js';
export class Router {
    state;
    preview;
    onChange;
    defaults;
    constructor(defaults, onChange, onError, chapters = []) {
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
        let last = '';
        const navigate = () => { if (location.href === last)
            return; last = location.href; restore(); };
        addEventListener('popstate', navigate);
        addEventListener('hashchange', navigate);
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
        });
        restore();
    }
    commit(state) {
        const normalized = normalizeState(state), hash = encodeState(normalized);
        this.preview = undefined;
        if (location.hash === hash)
            return;
        history.pushState(null, '', hash);
        this.state = normalized;
        this.onChange(normalized, []);
    }
    commitPreview() { if (this.preview)
        this.commit(this.preview); }
}
