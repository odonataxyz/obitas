const isArr = Array.isArray;
const arrFrom = Array.from;
const req = requestAnimationFrame;
const setAttr = (el, key, value) => el.setAttribute(key, value);
const rmAttr = (el, key) => el.removeAttribute(key);
const str = "string";
const num = "number";
const obj = "object";
const fn = "function";
const _cls = "class";
const _id = "id";
const _style = "style";
const cssMime = "text/css";
const empty = () => Object.create(null);
function isElm(e) { return e instanceof Element; }
function isPromise(e) { return e instanceof Promise; }
const header = "obt-";
const dK = Symbol("D");
const evkeys = [
    'created',
    'destroyed',
    'selected',
    'checked',
];
const attrEx = {
    xlinkHref: 'xlink:href'
};
const TEXT_TYPE = 3;
export const h = (tag, props, ...children) => {
    const hasProps = typeof (props) === "object" && !ObitasDOM.is(props) && !isArr(props);
    const fill = (child, children = []) => {
        if (isArr(child)) {
            for (const ch of child)
                fill(ch, children);
        }
        else {
            if (ObitasDOM.is(child)) {
                children.push(child);
            }
            else if (child != null) {
                const ch = new ObitasDOM(null, empty(), []);
                ch[_content] = child;
                children.push(ch);
            }
        }
        return children;
    };
    return new ObitasDOM(tag, hasProps ? props : empty(), fill(hasProps ? children : [props, ...children]));
};
function isFn(p) {
    return (typeof p === str && p.startsWith('on'));
}
function merge(a, b, c = empty()) {
    a = a || empty();
    b = b || empty();
    const merged = { ...a, ...b, ...c };
    for (const k of Obitas.mergeProps)
        if (a[k] != null || b[k] != null || c[k] != null)
            merged[k] = [a[k], b[k], c[k]];
    return merged;
}
function then(value, cb) {
    isPromise(value) ? value.then(cb) : cb(value);
}
function evt2opts(key) {
    let e = key.slice(2);
    if (e.includes("-"))
        e = e.substring(0, e.indexOf("-"));
    return {
        key: e,
        opt: {
            capture: key.includes("-capture"),
            passive: key.includes("-passive"),
            once: key.includes("-once")
        }
    };
}
const stateHandler = {
    set: (t, p, v) => {
        const pre = t[p];
        t[p] = v;
        if (pre !== v)
            t[dK]?.deref()?.dispatch();
        return true;
    }
};
const _content = Symbol("c");
const _domProps = Symbol("d");
const _key = Symbol("k");
const _root = Symbol("r");
const _parent = Symbol("p");
const _float = Symbol("f");
const _head = Symbol("h");
const _tail = Symbol("t");
const _step = Symbol("s");
const _events = Symbol("e");
const _busy = Symbol("b");
const _forward = Symbol("f");
export class ObitasDOM {
    tag;
    real;
    allProps;
    props;
    states;
    children;
    slots;
    methods;
    computed;
    refs;
    [_parent];
    [_content];
    [_domProps];
    [_key] = null;
    [_float];
    [_busy] = false;
    [_head];
    [_tail];
    [_events] = { $: [] };
    [_step] = 0;
    get [_forward]() { return this[_head] || this[_parent]; }
    constructor(tag, props, children) {
        this.tag = (typeof tag === "string" && Obitas.components[tag]) || tag;
        this.allProps = props || empty();
        this[_key] = props?.key;
        this.slots = [...children];
        this.children = children;
        const propProxy = (k, handler) => {
            return new Proxy(empty(), {
                get: (_, key) => {
                    let self = this;
                    while (self) {
                        var tag = self.tag;
                        if (Obitas.is(tag)) {
                            const methods = tag.options[k];
                            if (methods && typeof methods[key] === fn) {
                                return handler(self, methods[key]);
                            }
                        }
                        self = self[_tail];
                    }
                }
            });
        };
        this.methods = propProxy("methods", (self, fn) => { return (...args) => fn.apply(self, args); });
        this.computed = propProxy("computed", (self, fn) => { return fn.apply(self); });
    }
    static is(value) { return value instanceof ObitasDOM; }
    get head() {
        let r = this;
        while (r[_head])
            r = r[_head];
        return r;
    }
    get tail() {
        let r = this;
        while (r[_tail])
            r = r[_tail];
        return r;
    }
    get [_root]() {
        let r = this;
        do {
            if (Obitas.is(r?.tag))
                break;
        } while (r = r[_forward]);
        return r;
    }
    extract({ real, callback, pre }) {
        const tag = this.tag;
        const props = this.allProps;
        this.refs = empty();
        if (pre) {
            pre[_busy] = false;
            this[_events].destroyed = pre[_events].destroyed;
            this[_step] = pre[_step];
        }
        var tagIsObitas = Obitas.is(tag);
        var tagIsVDom = ObitasDOM.is(tag);
        if (!tagIsObitas && !tagIsVDom) { //実装DOM生成
            this[_domProps] = props;
            let n = this;
            while (n[_forward] && !n[_domProps]?.xmlns)
                n = n[_forward];
            const ns = n?.[_domProps]?.xmlns || n?.real?.namespaceURI;
            const newReal = (() => {
                if (isElm(tag))
                    return tag;
                if (isElm(this[_content]))
                    return this[_content];
                if (!tag && real?.nodeType === TEXT_TYPE) {
                    const content = stringify(this[_content]);
                    if (content !== real.textContent)
                        real.textContent = content;
                    return real;
                }
                if (real?.nodeName?.toLowerCase() === tag)
                    return real;
                if (typeof tag === "string") {
                    if (typeof ns === "string")
                        return window.document.createElementNS(ns, tag);
                    else
                        return window.document.createElement(tag);
                }
                return window.document.createTextNode(stringify(this[_content]));
            })();
            this.real = newReal;
            callback(newReal);
            if (isElm(newReal)) {
                let r = this;
                while (r = r[_forward]) {
                    if (Obitas.is(r.tag)) {
                        setAttr(newReal, r.tag.id, "");
                        if (r.real != newReal)
                            return;
                    }
                }
                ;
            }
            return;
        }
        this[_domProps] = empty();
        this.props = empty();
        const preTail = pre?.[_tail];
        const completed = (tail) => {
            this[_tail] = tail;
            if (!tail)
                return callback();
            tail[_head] = this;
            tail.extract({
                real,
                callback: (expanded) => {
                    this.real = expanded;
                    this[_domProps] = tail[_domProps] = merge(this[_domProps], tail[_domProps]);
                    this.children = tail.children;
                    this.refs = tail.refs;
                    callback(expanded);
                },
                pre: tail.tag === preTail?.tag ? preTail : void (0)
            });
        };
        //プロパティのアサイン
        for (const prop in props) {
            //@ts-ignore
            const value = props[prop];
            //@ts-ignore
            if (tagIsObitas && (tag).options.props?.includes(prop)) {
                if (isFn(prop) && typeof value == 'function') {
                    this.on(prop.substring(2), value);
                }
                else {
                    //@ts-ignore
                    this.props[prop] = value;
                }
                continue;
            }
            this[_domProps][prop] = value;
        }
        if (tagIsVDom) { // ObitasDOM
            return completed(tag);
        }
        // Obitas
        //データのアサイン
        //@ts-ignore
        then(pre?.states || tag.options.states?.call(this), (states) => {
            if (states) {
                this.states = pre?.states === states ? states : new Proxy(states, stateHandler);
                //@ts-ignore
                this.states[dK] = new WeakRef(this);
            }
            else {
                //@ts-ignore
                delete this.states;
            }
            //@ts-ignore
            then(tag.render(this, h), completed);
        });
    }
    off(key, handler) {
        if (!this[_events][key])
            return;
        if (!this[_events][key].includes(handler))
            return;
        this[_events][key].splice(this[_events][key].indexOf(handler), 1);
    }
    on(key, handler, force = false) {
        if (typeof (handler) !== fn)
            return;
        const events = this[_events][key] = this[_events][key] || [];
        if (key === evkeys[0] && this[_step] > 0 && !force) {
            if (!events.includes(handler)) {
                handler(this);
                events.push(handler);
            }
            return;
        }
        else if (key === evkeys[1] && this[_step] > 1 && !force) {
            return;
        }
        else {
            if (!events.includes(handler))
                events.push(handler);
        }
    }
    emit(key, ...args) {
        const events = this[_events][key];
        if (!events)
            return;
        for (const event of events)
            event.call(this, ...args);
    }
    dispatch(cb) {
        const root = this[_root];
        if (cb)
            root[_events].$.push(cb);
        root[_busy] = true;
        req(() => {
            if (!root[_busy] || root.tail !== root.real?.$?.tail || root.real?.isConnected === false)
                return;
            let r = root;
            while (r = r[_forward])
                if (r[_busy])
                    return;
            root.real.$ = this;
            root.patch(root.real);
        });
    }
    disconnect() {
        for (const child of this.children)
            child.disconnect();
        let r = this;
        while (r[_forward])
            r = r[_forward];
        this._destroy();
        r.real?.remove();
    }
    _patch({ newElm, oldVDom }, callback) {
        if (!newElm) {
            return callback(newElm);
        }
        newElm.$ = this.head;
        if (newElm.nodeType === TEXT_TYPE)
            return callback(newElm);
        const oldProps = oldVDom?.[_domProps] || empty();
        const newProps = this[_domProps];
        const mergedProps = { ...oldProps, ...newProps };
        for (const key in mergedProps) {
            this.attr(newElm, key, newProps[key], oldProps[key]);
        }
        const oldChildren = arrFrom(newElm.childNodes);
        const children = arrFrom(oldChildren);
        const newChildren = this.children;
        const targets = new WeakMap();
        if (this.tag === 'option' && this[_parent]?.tag === 'select') {
            (this[_parent][_domProps].value === this[_domProps].value) ? setAttr(newElm, evkeys[2], "") : rmAttr(newElm, evkeys[2]);
        }
        const walk = (index, start) => {
            const current = newChildren[index];
            if (!current)
                return;
            const prev = newChildren[index - 1];
            const next = newChildren[index + 1];
            let i = start;
            let sim = 0;
            let oldVdoms = [];
            for (let j = start; j < oldChildren.length; ++j) {
                const prevChildNode = oldChildren[j - 1];
                const curChildNode = oldChildren[j];
                const nextChildNode = oldChildren[j + 1];
                let result = similar(prev, prevChildNode?.$, 0, 1) + similar(current, curChildNode?.$) + similar(next, nextChildNode?.$, 0, 1);
                result = Number.isNaN(result) ? -1 : result;
                if (result > sim) {
                    i = j;
                    oldVdoms.push({ sim: result, vdom: curChildNode.$ });
                    if (result === Infinity)
                        break;
                    sim = result;
                }
            }
            let target = oldVdoms[oldVdoms.length - 1];
            if (target && target.sim !== Infinity && i < oldChildren.length && next) {
                const afterResultCurrent = similar(next, oldChildren[i]?.$);
                const afterResult = walk(index + 1, i + 1);
                if (afterResult && afterResult.vdom == null && afterResultCurrent >= target.sim) {
                    target = oldVdoms[oldVdoms.length - 2];
                }
            }
            else {
                walk(index + 1, i + 1);
            }
            if (target)
                targets.set(current, target.vdom);
            return target;
        };
        if (!isElm(this.tag) && typeof newProps.html !== str) {
            walk(0, 0);
            let prev = void (0);
            let t = Obitas.is(this.tag) ? this : this[_root];
            while (t[_tail] && Obitas.is(t[_tail].tag))
                t = t[_tail];
            for (const newVDom of newChildren) {
                newVDom[_parent] = this.tail;
                const oldVDom = targets.get(newVDom);
                newVDom.patch(oldVDom?.real, (el) => {
                    if (!el)
                        return;
                    if (oldVDom) {
                        children.splice(children.indexOf(oldVDom.real), 1);
                        if (el !== oldVDom.real)
                            oldVDom.real.replaceWith(el);
                    }
                    else {
                        if (prev)
                            prev.after(el);
                        else
                            newElm.prepend(el);
                    }
                    prev = el;
                });
            }
            for (const child of children) {
                const rmVDom = child.$;
                if (!rmVDom || rmVDom[_float] !== true) {
                    rmVDom?._destroy();
                    child.remove();
                }
            }
        }
        this[_events].$.forEach((cb) => cb());
        this[_events].$ = [];
        if (!oldVDom)
            this._create();
        callback(newElm);
        this[_busy] = false;
    }
    create(callback) {
        this.patch(void (0), callback);
    }
    patch(elm, callback) {
        const oldVDom = elm?.$;
        this.extract({
            real: elm, pre: oldVDom,
            callback: (newElm) => this._patch({ newElm, oldVDom }, typeof (callback) === "function" ? callback : () => void (0)),
        });
    }
    attr(real, key, value, oldValue) {
        if (Obitas.directives[key]) {
            Obitas.directives[key](this, real, key, value, oldValue);
            return;
        }
        key = attrEx[key] || key;
        if (isFn(key)) {
            let { key: e, opt } = evt2opts(key);
            if (oldValue)
                real.removeEventListener(e, oldValue);
            if (value) {
                real.removeEventListener(e, value);
                real.addEventListener(e, value, opt);
            }
        }
        else {
            if (value != null) {
                if (typeof value === obj) {
                    //@ts-ignore
                    real[key] = value;
                }
                else {
                    setAttr(real, key, (value === true) ? "" : value);
                }
            }
            else
                rmAttr(real, key);
        }
    }
    _create() {
        if (this[_step] > 0)
            return;
        //@ts-ignore
        if (Obitas.is(this.tag))
            this.tag.options?.created?.call(this);
        this.emit(evkeys[0], this);
        delete this[_events].created;
        this[_tail]?._create();
        this[_step] = 1;
    }
    _destroy() {
        if (this[_step] != 1)
            return;
        this[_step] = 2;
        for (const child of this.children)
            child._destroy();
        this.emit(evkeys[1], this);
        delete this[_events].destroyed;
        //@ts-ignore
        if (Obitas.is(this.tag))
            this.tag.options?.destroyed?.call(this);
        this[_tail]?._destroy();
    }
}
function similar(newV, oldV, min = -Infinity, max = Infinity) {
    if (!newV || !oldV)
        return min;
    if (newV[_key] != null && oldV[_key] != null) {
        if (newV[_key] === oldV[_key])
            return max;
        return min;
    }
    if (newV === oldV)
        return max;
    if (newV.real === oldV.real)
        return max;
    if (newV.tag === oldV.tag) {
        if (newV[_content] && newV[_content] === oldV[_content])
            return max;
        if (typeof (newV[_content]) === str && typeof (oldV[_content]) === str)
            return max;
        if (isElm(newV.tag))
            return max;
        return 1;
    }
    if (ObitasDOM.is(newV.tag) && ObitasDOM.is(oldV.tag))
        return similar(newV.tag, oldV.tag, min, max);
    return min;
}
function parseStyle(p, style = '') {
    if (isArr(p)) {
        for (const c of p)
            style += parseStyle(c);
    }
    else if (typeof p === obj) {
        for (const styleName in p) {
            if (p[styleName] != null)
                style += `${styleName}:${p[styleName]};`;
        }
    }
    else if (p)
        style += p;
    return style;
}
function parseClass(p, cls = new Set()) {
    if (isArr(p)) {
        for (const c of p)
            parseClass(c, cls);
    }
    else if (typeof p === obj) {
        for (const className in p) {
            if (p[className])
                cls.add(className);
        }
    }
    else if (p)
        cls.add(p);
    return arrFrom(cls).join(' ');
}
function stringify(value) {
    if ([str, obj, num, fn].includes(typeof value))
        return value.toString();
    return JSON.stringify(value);
}
export class Obitas {
    static is(value) { return value instanceof Obitas; }
    id;
    constructor(app) {
        this.options = app;
        const id = this.id = header + (Math.random() + 1).toString(36).substring(5);
        if (app.style) {
            const insertStyle = window.document.createElement(_style);
            setAttr(insertStyle, header + 'style', '');
            setAttr(insertStyle, 'type', cssMime);
            insertStyle.appendChild(window.document.createTextNode(app.style));
            window.document.head.appendChild(insertStyle);
            setAttr(insertStyle, id, "");
            const walk = (rule) => {
                if (rule instanceof CSSStyleRule) {
                    rule.selectorText = rule.selectorText.replace(/(?<!:[-a-zA-Z0-9]*)[^>*+\s,:]+(?<!\\\\)(?=,|\s+|:|$)/gm, (_) => `${_}[${id}]`).replace(/\\\\/gm, "");
                    return;
                }
                if (isArr(rule.cssRules)) {
                    for (const c of rule.cssRules)
                        walk(c);
                }
            };
            //@ts-ignore
            for (const rule of insertStyle.sheet.cssRules) {
                walk(rule);
            }
        }
    }
    options;
    create(props, ...children) {
        //@ts-ignore
        return new ObitasDOM(this, props, children);
    }
    render(dom, h) {
        return this.options.render.call(dom, h);
    }
    connect(el, props, ...children) {
        const elm = ((typeof el === str) ? window.document.querySelector(el) : el);
        if (!elm)
            throw new Error("invalid element.");
        //@ts-ignore
        const root = new ObitasDOM(this, props, children);
        root.patch(elm);
        return root;
    }
    static mergeProps = new Set([_cls, _id, _style]);
    static components = {};
    static directives = {
        html(_, real, __, value, oldValue) {
            if (oldValue !== value)
                real.innerHTML = value;
        },
        ref(vnode, _, __, value) {
            const root = vnode[_forward]?.[_root];
            if (!root)
                return;
            if (isArr(root.refs[value])) {
                //@ts-ignore
                return root.refs[value].push(vnode);
            }
            if (root.refs[value]) {
                //@ts-ignore
                return root.refs[value] = [root.refs[value], vnode];
            }
            return root.refs[value] = vnode;
        },
        key(vnode, _, __, value) {
            if (value)
                vnode[_key] = value;
            else
                delete vnode[_key];
            return;
        },
        style(_, real, key, value) {
            const style = parseStyle(value);
            if (style) {
                setAttr(real, _style, style);
            }
            else
                rmAttr(real, key);
            return;
        },
        id(_, real, key, value) {
            const id = parseClass(value);
            if (id)
                setAttr(real, _id, id);
            else
                rmAttr(real, key);
            return;
        },
        class(_, real, key, value) {
            const cls = parseClass(value);
            if (cls)
                setAttr(real, _cls, cls);
            else
                rmAttr(real, key);
            return;
        },
        checked(_, real, __, value) {
            if (value)
                setAttr(real, evkeys[3], "");
            else
                rmAttr(real, evkeys[3]);
            return;
        },
        float(vnode, _, __, value) {
            if (typeof (value) === 'boolean')
                vnode[_float] = value;
            else
                vnode[_float] = false;
            return;
        },
        hook(vnode, _, __, value) {
            value = isArr(value) ? value : [value];
            for (const v of value) {
                if (typeof v === fn) {
                    v(vnode);
                }
            }
        },
        ondestroyed(vnode, _, __, value, oldValue) {
            if (oldValue)
                vnode.off(evkeys[1], oldValue);
            vnode.off(evkeys[1], value);
            vnode.on(evkeys[1], value, true);
        },
        oncreated(vnode, _, __, value, oldValue) {
            if (oldValue)
                vnode.off(evkeys[0], oldValue);
            vnode.off(evkeys[0], value);
            vnode.on(evkeys[0], value, true);
        },
    };
}
