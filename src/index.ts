declare global {
	interface Element { 
		$:ObitasDOM;
	}
	interface Text {
		$:ObitasDOM;
	}
}

const isArr = Array.isArray;
const arrFrom = Array.from;
const req = requestAnimationFrame;
const setAttr = (el:Element, key:string, value:string) => el.setAttribute(key, value);
const rmAttr = (el:Element, key:string) => el.removeAttribute(key);
const str = "string";
const num = "number";
const obj = "object";
const fn = "function";
const _cls = "class";
const _id = "id";
const _style = "style";
const cssMime = "text/css";
const empty = ()=>Object.create(null);
function isElm(e:any):e is Element { return e instanceof Element; }
function isPromise(e:any):e is Promise<any> { return e instanceof Promise; }
const header = "obt-";
const dK = Symbol("D");

const evkeys = [
	'created',
	'destroyed',
	'selected',
	'checked',
];

const attrEx:{[key:string]:string} = {
	xlinkHref:'xlink:href'
}

type StrKeyValuePair = string|{[key:string]:boolean}|StrKeyValuePair[];
type BoolKeyValuePair = string|{[key:string]:string}|BoolKeyValuePair[];

export interface ObitasElementTag {}
export interface ObitasAttribute {
	key?:string;
	class?:StrKeyValuePair;
	id?:StrKeyValuePair;
	style?:BoolKeyValuePair;
}

type PickOf<T, U extends string> = { [P in keyof T] : P extends U ? T[P] : never }[keyof T];
type ElmName = keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof ObitasElementTag;
type ElmClass<T extends ElmName> = PickOf<HTMLElementTagNameMap, T> | PickOf<SVGElementTagNameMap, T>;
type ElmAttr<T extends ElmName, Props = {}> = (Partial<Omit<{[key in keyof ElmClass<T>]:ElmClass<T>[key]; }, keyof ObitasAttribute>> & Props & ObitasAttribute);
type ElmKey = ElmName | Obitas | Element | null;
type Elm = Element|Text;
type Ref = { [key:string]:Element|ObitasDOM|Element[]|ObitasDOM[] };
type RefObitasDOM<T extends Element|ObitasDOM> = T extends Element ? ObitasDOM<any, any, any, T> : T;
//@ts-ignore
type ObitasRef<R extends Ref> = { [K in keyof R] : R[K] extends (infer E)[] ? RefObitasDOM<E>[] : RefObitasDOM<R[K]> };

const TEXT_TYPE = 3;

export interface CreateElementFn {
	<T extends ElmName, P, D>( tag:ElmKey, children?:ObitasDOMs[]): ObitasDOM;
	<T extends ElmName, P, D>( tag:ElmKey, props:ElmAttr<T, P>, children?:ObitasDOMs[]): ObitasDOM;
	<T extends ElmName, P, D>( tag:ElmKey, ...children:(ObitasDOMs[])): ObitasDOM
	<T extends ElmName, P, D>( tag:ElmKey, props:ElmAttr<T, P>, ...children:(ObitasDOMs[])): ObitasDOM
}

export interface ObitasDirective {
	(vnode:ObitasDOM, real:HTMLElement, key:string, value:any, oldValue:any):any;
}

type StartsWith<T, Start extends string> = T extends `${Start}${infer X}` ? X : never;
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

type EventProps<T, K extends keyof T = keyof T> = { [E in StartsWith<K, 'on'>] : T[K] extends Function ? T[K] : never };

type AppInit<Props, States, Refs extends Ref = never> = {
	name?:string;
	render(this:ObitasDOM<Props, States, Refs>, h:CreateElementFn): ObitasDOM;
	methods?:{[key:string|symbol]:Function};
	computed?:{[key:string|symbol]:(this:ObitasDOM)=>any};
	created?:(this:ObitasDOM<Props, States, Refs>)=>void;
	destroyed?:(this:ObitasDOM<Props, States, Refs>)=>void;
	style?:string;
} & (undefined extends Props ? {} : {
	props:((keyof Required<Props>)|{ name:(keyof Props), default?:any })[];
}) & (undefined extends States ? {} : {
	states(this:ObitasDOM<Props, States, Refs>):States|Promise<States>;
})

type ObitasDOMs = string|ObitasDOM|ObitasDOMs[]|undefined;

export const h:CreateElementFn = <T extends ElmName, P, D>(tag:ElmKey, props?:ElmAttr<T, P>, ...children:(ObitasDOMs[]))=>{
	const hasProps = typeof(props) === "object" && !ObitasDOM.is(props) && !isArr(props);
	const fill = (child:any, children:ObitasDOM[] = [])=>{
		if (isArr(child)) {
			for (const ch of child) fill(ch, children);
		} else {
			if (ObitasDOM.is(child)) { 
				children.push(child);
			} else if (child != null) {
				const ch = new ObitasDOM(null, empty(), []);
				ch[_content] = child;
				children.push(ch);
			}
		}
		return children;
	}
	return new ObitasDOM<P, D>( tag, hasProps ? props : empty(), fill(hasProps ? children : [props, ...children]) );
}

function isFn (p:string){
	return (typeof p === str && p.startsWith('on'));
}

function merge(a:any, b:any, c:any = empty()) {
	a = a || empty();
	b = b || empty();
	const merged = { ...a, ...b, ...c };
	for (const k of Obitas.mergeProps) if (a[k] != null || b[k] != null || c[k] != null) merged[k] = [a[k], b[k], c[k]];
	return merged;
}

function then<T>(value:T, cb:(value:(T extends Promise<infer U> ? U : T))=>any) {
	isPromise(value) ? value.then(cb) : cb(value as any);
}

function evt2opts(key:string){
	let e = key.slice(2);
	if (e.includes("-")) e = e.substring(0, e.indexOf("-"));
	return {
		key:e,
		opt:{
			capture:key.includes("-capture"),
			passive:key.includes("-passive"),
			once:key.includes("-once")
		}
	};
}

const stateHandler = {
	set:(t:any, p:string|number|symbol, v:any)=>{
		const pre = t[p];
		t[p] = v;
		if (pre !== v) t[dK]?.deref()?.dispatch();
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


export class ObitasDOM<P = any, D = any, R extends Ref = any, E extends Elm = Elm>{
	public readonly tag:ElmKey;
	public real!:E;
	protected allProps:ElmAttr<any, P>;
	public props!:P;
	public states!:D;
	public children:ObitasDOM[];
	public slots!:ObitasDOM[];
	public methods!:{[key:string]:Function};
	public computed!:{[key:string]:any};
	public refs!:ObitasRef<R>;
	public [_parent]?:ObitasDOM<any, any, any, any>;
	public [_content]?:any;
	public [_domProps]:any|null;
	public [_key]:any = null;
	public [_float]!:boolean;
	
	private [_busy] = false;
	private [_head]?:ObitasDOM;
	private [_tail]?:ObitasDOM;
	private [_events]:{[key:string]:Function[]} = {$:[]};
	private [_step] = 0;
	public get [_forward]():ObitasDOM|undefined { return this[_head] || this[_parent]; }

	public constructor(tag:ElmKey, props:ElmAttr<any, P>, children:ObitasDOM[]){
		this.tag = (typeof tag === "string" && Obitas.components[tag]) || tag;
		this.allProps = props || empty();
		this[_key] = props?.key;
		this.slots = [...children];
		this.children = children;

		const propProxy = (k:"methods"|"computed", handler:(self:ObitasDOM, f:Function)=>any)=> {
			return new Proxy(empty(), {
				get:(_, key)=>{
					let self:ObitasDOM|undefined = this;
					while (self) {
						var tag:ElmKey = self.tag;
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
		}
		this.methods = propProxy("methods", (self, fn)=>{ return (...args:any[])=>fn.apply(self, args); });
		this.computed = propProxy("computed", (self, fn)=>{ return fn.apply(self); });
	}

	public static is(value:any):value is ObitasDOM {return value instanceof ObitasDOM;}

		
	public get head(){
		let r:ObitasDOM = this;
		while (r[_head]) r = r[_head];
		return r;
	}
		
	public get tail(){
		let r:ObitasDOM = this;
		while (r[_tail]) r = r[_tail];
		return r;
	}
	public get [_root](): ObitasDOM {
		let r:ObitasDOM = this;
		do {
			if (Obitas.is(r?.tag)) break;
		} while (r = r[_forward] as any);
		return r;
	}
	
	private extract({real, callback, pre}:{real:Elm|undefined, pre:ObitasDOM|undefined, callback:(el?:Elm)=>void}) {
		const tag = this.tag;
		const props = this.allProps;
		this.refs = empty() as ObitasRef<R>;

		if (pre) {
			pre[_busy] = false;
			this[_events].destroyed = pre[_events].destroyed;
			this[_step] = pre[_step];
		}

		var tagIsObitas = Obitas.is(tag);
		var tagIsVDom = ObitasDOM.is(tag);
		
		if (!tagIsObitas && !tagIsVDom) { //実装DOM生成
			this[_domProps] = props;
			
			let n:ObitasDOM|undefined = this;
			while (n[_forward] && !n[_domProps]?.xmlns) n = n[_forward];
			const ns = n?.[_domProps]?.xmlns || (n?.real as HTMLElement)?.namespaceURI;
			
			const newReal = (()=>{
				if (isElm(tag)) return tag;
				if (isElm(this[_content])) return this[_content];
				if (!tag && real?.nodeType === TEXT_TYPE ) {
					const content = stringify(this[_content]);
					if (content !== real.textContent) real.textContent = content;
					return real;
				}
				if (real?.nodeName?.toLowerCase() === tag) return real;
				if (typeof tag === "string") {
					if ( typeof ns === "string") return window.document.createElementNS(ns, tag);
					else return window.document.createElement(tag);
				}
				return window.document.createTextNode(stringify(this[_content]));
			})();

			this.real = newReal as any;
			callback(newReal);

			
			if (isElm(newReal)) {
				let r:ObitasDOM|undefined = this;
				while (r = r[_forward]) {
					if (Obitas.is(r.tag)) {
						setAttr(newReal, r.tag.id, "");
						if (r.real != newReal) return;
					}
				};
			}

			return;
		}
		
		this[_domProps] = empty();
		this.props = empty() as P;
		const preTail = pre?.[_tail];

		const completed = (tail?:ObitasDOM)=>{
			this[_tail] = tail;
			if (!tail) return callback();

			tail[_head] = this;

			tail.extract({
				real,
				callback:(expanded)=>{
					this.real = expanded as E;
					this[_domProps] = tail[_domProps] = merge(this[_domProps], tail[_domProps]);
			
					this.children = tail.children;
					this.refs = tail.refs;
					callback(expanded);
				},
				pre: tail.tag === preTail?.tag ? preTail : void(0)
			});
		}
		
		//プロパティのアサイン
		for (const prop in props) {
			//@ts-ignore
			const value:any = props[prop];
			//@ts-ignore
			if (tagIsObitas && (tag).options.props?.includes(prop)) {
				if (isFn(prop) && typeof value == 'function') {
					this.on(prop.substring(2), value)
				} else {
					//@ts-ignore
					this.props[prop] = value;
				}
				continue;
			}
			this[_domProps][prop] = value;
		}
		
		if (tagIsVDom) { // ObitasDOM
			return completed(tag as any as ObitasDOM);
		}

		// Obitas
		//データのアサイン
		//@ts-ignore
		then(pre?.states || tag.options.states?.call(this), (states)=>{
			if (states) {
				this.states = pre?.states === states ? states : new Proxy(states, stateHandler);
				//@ts-ignore
				this.states[dK] = new WeakRef(this);
			} else {
				//@ts-ignore
				delete this.states;
			}
			
			//@ts-ignore
			then(tag.render( this, h ), completed);
		});
		
	}
	public off(key:"created"|"destroyed"|string, handler:(self:this)=>void){
		if (!this[_events][key]) return;
		if (!this[_events][key].includes(handler)) return;
		this[_events][key].splice(this[_events][key].indexOf(handler), 1);
	}
	public on(key:"created"|"destroyed"|string, handler:(self:this)=>void, force = false){
		if (typeof(handler) !== fn) return;
		const events = this[_events][key] = this[_events][key] || [];
		if (key === evkeys[0] && this[_step] > 0 && !force) {
			if (!events.includes(handler)) {
				handler(this);
				events.push(handler);
			}
			return;
		}else if (key === evkeys[1] && this[_step] > 1 && !force) {
			return;
		} else {
			if (!events.includes(handler)) events.push(handler);
		}
	}

	
	public emit<T extends EventProps<P>, K extends keyof T>(key:K, ...args:ArgumentTypes<T[K]>):void;
	public emit(key:string, ...args:any[]):void;
	public emit(key:string, ...args:any[]){
		const events = this[_events][key];
		if (!events) return;
		for (const event of events) event.call(this, ...args);
	}

	public dispatch(cb?:()=>void){
		const root:ObitasDOM = this[_root];
		if (cb) root[_events].$.push(cb);
		
		root[_busy] = true;
		req(()=>{
			if (!root[_busy] || root.tail !== root.real?.$?.tail || root.real?.isConnected === false) return;
			let r:ObitasDOM = root;
			while(r = r[_forward] as any) if (r[_busy]) return;
			
			root.real.$ = this;
			root.patch(root.real);
		});
	}

	public disconnect(){
		for (const child of this.children) child.disconnect();
		let r:ObitasDOM = this;
		while (r[_forward]) r = r[_forward];
		this._destroy();
		r.real?.remove();
	}

	private _patch({newElm, oldVDom}:{newElm:Elm|undefined, oldVDom?:ObitasDOM}, callback:(elm:Elm|undefined)=>void) {
		if (!newElm) {
			return callback(newElm);
		}
		newElm.$ = this.head;
		
		if ( newElm.nodeType === TEXT_TYPE ) return callback(newElm);
		
		const oldProps = oldVDom?.[_domProps] || empty();
		const newProps = this[_domProps];
		const mergedProps = {...oldProps, ...newProps};
		for (const key in mergedProps) {
			this.attr(newElm as Element, key, newProps[key], oldProps[key]);
		}

		
		const oldChildren = arrFrom(newElm.childNodes) as Elm[];
		const children = arrFrom(oldChildren);
		const newChildren = this.children;
		const targets = new WeakMap<ObitasDOM, ObitasDOM|null>();
		
		if (this.tag === 'option' && this[_parent]?.tag === 'select') {
			(this[_parent][_domProps].value === this[_domProps].value) ? setAttr(newElm as Element, evkeys[2], "") : rmAttr(newElm as Element, evkeys[2]);
		}
		
		const walk = (index:number, start:number):{sim:number, vdom:ObitasDOM|undefined}|void => {
			const current = newChildren[index];
			if (!current) return;
			const prev = newChildren[index - 1];
			const next = newChildren[index + 1];
			let i = start;
			let sim = 0;
			let oldVdoms:{sim:number, vdom:ObitasDOM}[] = [];
			for ( let j = start; j < oldChildren.length; ++j ) {
				const prevChildNode = oldChildren[j - 1] as Elm;
				const curChildNode = oldChildren[j] as Elm;
				const nextChildNode = oldChildren[j + 1] as Elm;
				let result = similar(prev, prevChildNode?.$, 0, 1) + similar(current, curChildNode?.$) + similar(next, nextChildNode?.$, 0, 1);
				result = Number.isNaN(result) ? -1 : result;
				
				if (result > sim) {
					i = j;
					oldVdoms.push({sim:result, vdom:curChildNode.$});
					if (result === Infinity) break;
					sim = result;
				}
			}
			let target = oldVdoms[oldVdoms.length-1];
			if (target && target.sim !== Infinity && i < oldChildren.length && next){
				const afterResultCurrent = similar(next, oldChildren[i]?.$);
				const afterResult = walk(index+1, i+1);
				if (afterResult && afterResult.vdom == null && afterResultCurrent >= target.sim) {
					target = oldVdoms[oldVdoms.length-2];
				}
			} else {
				walk(index+1, i+1);
			}
			if (target) targets.set(current, target.vdom);
			return target;
		}

		if (!isElm(this.tag) && typeof newProps.html !== str) {
			walk(0, 0);
			let prev:Elm|undefined = void(0);

			let t:ObitasDOM = Obitas.is(this.tag) ? this : this[_root];
			while (t[_tail] && Obitas.is(t[_tail].tag)) t = t[_tail];

			for (const newVDom of newChildren) {
				newVDom[_parent] = this.tail;

				const oldVDom = targets.get(newVDom);
				newVDom.patch(oldVDom?.real, (el)=>{
					if (!el) return;
					if (oldVDom) {
						children.splice(children.indexOf(oldVDom.real), 1);
						if (el !== oldVDom.real) oldVDom.real.replaceWith(el);
					} else {
						if (prev) prev.after(el);
						else (newElm as Element).prepend(el);
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
		
		this[_events].$.forEach((cb)=>cb());
		this[_events].$ = [];
		
		if (!oldVDom) this._create();
		callback(newElm);

		this[_busy] = false;
	}

	public create(callback?:(elm:Elm|undefined)=>void) {
		this.patch(void(0), callback);
	}

	public patch(elm:Elm|undefined, callback?:(elm:Elm|undefined)=>void) {
		const oldVDom = elm?.$;
		this.extract({
			real:elm, pre:oldVDom, 
			callback:(newElm)=>this._patch({newElm, oldVDom}, typeof(callback) === "function" ? callback : ()=>void(0)),
		});
	}

	private attr( real:Element, key:string, value:any, oldValue:any ){
		if (Obitas.directives[key]) {
			Obitas.directives[key](this, real, key, value, oldValue);
			return;
		}
		key = attrEx[key] || key;
		if (isFn(key)) {
			let {key:e, opt} = evt2opts(key);
			if (oldValue) real.removeEventListener(e, oldValue);
			if (value) {
				real.removeEventListener(e, value);
				real.addEventListener(e, value, opt);
			}
		} else {
			if (value != null) {
				if (typeof value === obj) {
					//@ts-ignore
					real[key] = value;
				} else {
					setAttr(real, key, (value === true) ? "" : value );
				}
			} else rmAttr( real, key );
		}
	}

	private _create(){
		if (this[_step] > 0) return;
		//@ts-ignore
		if (Obitas.is(this.tag)) this.tag.options?.created?.call(this);
		this.emit(evkeys[0], this);
		delete this[_events].created;
		this[_tail]?._create();
		this[_step] = 1;
	}

	private _destroy(){
		if (this[_step] != 1) return;
		this[_step] = 2;
		for (const child of this.children) child._destroy();

		this.emit(evkeys[1], this);
		delete this[_events].destroyed;
		//@ts-ignore
		if (Obitas.is(this.tag)) this.tag.options?.destroyed?.call(this);
		this[_tail]?._destroy();
	}
}


function similar(newV:ObitasDOM, oldV:ObitasDOM|undefined, min = -Infinity, max = Infinity):number {
	if (!newV || !oldV) return min;
	if (newV[_key] != null && oldV[_key] != null) {
		if (newV[_key] === oldV[_key]) return max;
		return min;
	}
	if (newV === oldV) return max;
	if (newV.real === oldV.real) return max;
	if ( newV.tag === oldV.tag ) {
		if (newV[_content] && newV[_content] === oldV[_content]) return max;
		if (typeof(newV[_content]) === str && typeof(oldV[_content]) === str) return max;
		if (isElm(newV.tag)) return max;
		return 1;
	}
	if (ObitasDOM.is(newV.tag) && ObitasDOM.is(oldV.tag)) return similar(newV.tag, oldV.tag, min, max);

	return min;
}


function parseStyle(p:any, style = ''){
	if (isArr(p)) {
		for (const c of p) style += parseStyle(c);
	} else if (typeof p === obj) {
		for (const styleName in p) {
			if ( p[styleName] != null ) style += `${styleName}:${p[styleName]};`;
		}
	} else if (p) style += p;
	return style;
}

function parseClass(p:any, cls:Set<string> = new Set()){
	if (isArr(p)) {
		for (const c of p) parseClass(c, cls);
	} else if (typeof p === obj) {
		for (const className in p) {
			if ( p[className] ) cls.add(className);
		}
	} else if(p) cls.add(p);
	return arrFrom(cls).join(' ');
}

function stringify(value:any):string {
	if ([str, obj, num, fn].includes(typeof value)) return value.toString();
	return JSON.stringify(value);
}

export class Obitas<Props = any,State = any, Refs extends Ref = never> {
	public static is(value:any): value is Obitas { return value instanceof Obitas; }
	public id:string;
	public constructor(app:AppInit<Props, State, Refs>){
		this.options = app;
		const id = this.id = header + (Math.random() + 1).toString(36).substring(5);
		if (app.style) {
			const insertStyle = window.document.createElement(_style);
			setAttr(insertStyle, header + 'style', '');
			setAttr(insertStyle, 'type', cssMime);
			insertStyle.appendChild(window.document.createTextNode(app.style));
			window.document.head.appendChild(insertStyle);
			setAttr(insertStyle, id, "");

			const walk = (rule:any)=>{
				if (rule instanceof CSSStyleRule) {
					rule.selectorText = rule.selectorText.replace(/(?<!:[-a-zA-Z0-9]*)[^>*+\s,:]+(?<!\\\\)(?=,|\s+|:|$)/gm, (_)=>`${_}[${id}]`).replace(/\\\\/gm, "");
					return;
				}
				if (isArr(rule.cssRules)) {
					for (const c of rule.cssRules) walk(c);
				}
			}
			//@ts-ignore
			for (const rule of insertStyle.sheet.cssRules){
				walk(rule);
			}
		}
	}
	public readonly options:AppInit<Props, State, Refs>;
	public create(props?:Props, ...children:ObitasDOM[]):ObitasDOM<Props, State> {
		//@ts-ignore
		return new ObitasDOM<Props, State>( this, props, children );
	}
	public render(dom:ObitasDOM<Props, State, Refs>, h:CreateElementFn) {
		return this.options.render.call(dom, h);
	}
	public connect(el:Elm|string, props?:Props, ...children:ObitasDOM[]){
		const elm = ( (typeof el === str) ? window.document.querySelector(el as string) : el ) as HTMLElement;
		if (!elm) throw new Error("invalid element.");
		
		//@ts-ignore
		const root = new ObitasDOM<Props,State>( this, props, children );
		root.patch(elm);

		return root;
	}
	public static mergeProps:Set<string> = new Set([_cls, _id, _style]);
	public static components:{[key:string]:Obitas} = {};
	public static directives:{[key:string]:(vnode:ObitasDOM, real:Element, key:string, value:any, oldValue:any)=>any} = {
		html(_:ObitasDOM, real:Element, __:string, value:any, oldValue:any){
			if (oldValue !== value) real.innerHTML = value;
		},
		ref(vnode:ObitasDOM, _:Element, __:string, value:any){
			const root = vnode[_forward]?.[_root];
			if (!root) return;
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
		key(vnode:ObitasDOM, _:Element, __:string, value:any){
			if (value) vnode[_key] = value;
			else delete vnode[_key];
			return;
		},
		style(_:ObitasDOM, real:Element, key:string, value:any){
			const style = parseStyle(value);
			if (style) {
				setAttr(real, _style, style);
			}
			else rmAttr(real, key);
			return;
		},
		id(_:ObitasDOM, real:Element, key:string, value:any){
			const id = parseClass(value);
			if (id) setAttr(real, _id, id);
			else rmAttr(real, key);
			return;
		},
		class(_:ObitasDOM, real:Element, key:string, value:any){
			const cls = parseClass(value);
			if (cls) setAttr(real, _cls, cls);
			else rmAttr(real, key);
			return;
		},
		checked(_:ObitasDOM, real:Element, __:string, value:any){
			if (value) setAttr(real, evkeys[3], "");
			else rmAttr(real, evkeys[3]);
			return;
		},
		float(vnode:ObitasDOM, _:Element, __:string, value:any){
			if (typeof(value) === 'boolean') vnode[_float] = value;
			else vnode[_float] = false;
			return;
		},
		hook(vnode:ObitasDOM, _:Element, __:string, value:any){
			value = isArr(value) ? value : [value];
			for (const v of value) {
				if (typeof v === fn) {
					v(vnode);
				}
			}
		},
		ondestroyed(vnode:ObitasDOM, _:Element, __:string, value:any, oldValue:any){
			if (oldValue) vnode.off(evkeys[1], oldValue);
			vnode.off(evkeys[1], value);
			vnode.on(evkeys[1], value, true);
		},
		oncreated(vnode:ObitasDOM, _:Element, __:string, value:any, oldValue:any){
			if (oldValue) vnode.off(evkeys[0], oldValue);
			vnode.off(evkeys[0], value);
			vnode.on(evkeys[0], value, true);
		},
	}
}