declare global {
    interface Element {
        $: ObitasDOM;
    }
    interface Text {
        $: ObitasDOM;
    }
}
type StrKeyValuePair = string | {
    [key: string]: boolean;
} | StrKeyValuePair[];
type BoolKeyValuePair = string | {
    [key: string]: string;
} | BoolKeyValuePair[];
export interface ObitasElementTag {
}
export interface ObitasAttribute {
    key?: string;
    class?: StrKeyValuePair;
    id?: StrKeyValuePair;
    style?: BoolKeyValuePair;
}
type PickOf<T, U extends string> = {
    [P in keyof T]: P extends U ? T[P] : never;
}[keyof T];
type ElmName = keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof ObitasElementTag;
type ElmClass<T extends ElmName> = PickOf<HTMLElementTagNameMap, T> | PickOf<SVGElementTagNameMap, T>;
type ElmAttr<T extends ElmName, Props = {}> = (Partial<Omit<{
    [key in keyof ElmClass<T>]: ElmClass<T>[key];
}, keyof ObitasAttribute>> & Props & ObitasAttribute);
type ElmKey = ElmName | Obitas | Element | null;
type Elm = Element | Text;
type Ref = {
    [key: string]: Element | ObitasDOM | Element[] | ObitasDOM[];
};
type RefObitasDOM<T extends Element | ObitasDOM> = T extends Element ? ObitasDOM<any, any, any, T> : T;
type ObitasRef<R extends Ref> = {
    [K in keyof R]: R[K] extends (infer E)[] ? RefObitasDOM<E>[] : RefObitasDOM<R[K]>;
};
export interface CreateElementFn {
    <T extends ElmName, P, D>(tag: ElmKey, children?: ObitasDOMs[]): ObitasDOM;
    <T extends ElmName, P, D>(tag: ElmKey, props: ElmAttr<T, P>, children?: ObitasDOMs[]): ObitasDOM;
    <T extends ElmName, P, D>(tag: ElmKey, ...children: (ObitasDOMs[])): ObitasDOM;
    <T extends ElmName, P, D>(tag: ElmKey, props: ElmAttr<T, P>, ...children: (ObitasDOMs[])): ObitasDOM;
}
export interface ObitasDirective {
    (vnode: ObitasDOM, real: HTMLElement, key: string, value: any, oldValue: any): any;
}
type StartsWith<T, Start extends string> = T extends `${Start}${infer X}` ? X : never;
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
type EventProps<T, K extends keyof T = keyof T> = {
    [E in StartsWith<K, 'on'>]: T[K] extends Function ? T[K] : never;
};
type AppInit<Props, States, Refs extends Ref = never> = {
    name?: string;
    render(this: ObitasDOM<Props, States, Refs>, h: CreateElementFn): ObitasDOM;
    methods?: {
        [key: string | symbol]: Function;
    };
    computed?: {
        [key: string | symbol]: (this: ObitasDOM) => any;
    };
    created?: (this: ObitasDOM<Props, States, Refs>) => void;
    destroyed?: (this: ObitasDOM<Props, States, Refs>) => void;
    style?: string;
} & (undefined extends Props ? {} : {
    props: ((keyof Required<Props>) | {
        name: (keyof Props);
        default?: any;
    })[];
}) & (undefined extends States ? {} : {
    states(this: ObitasDOM<Props, States, Refs>): States | Promise<States>;
});
type ObitasDOMs = string | ObitasDOM | ObitasDOMs[] | undefined;
export declare const h: CreateElementFn;
declare const _content: unique symbol;
declare const _domProps: unique symbol;
declare const _key: unique symbol;
declare const _root: unique symbol;
declare const _parent: unique symbol;
declare const _float: unique symbol;
declare const _head: unique symbol;
declare const _tail: unique symbol;
declare const _step: unique symbol;
declare const _events: unique symbol;
declare const _busy: unique symbol;
declare const _forward: unique symbol;
export declare class ObitasDOM<P = any, D = any, R extends Ref = any, E extends Elm = Elm> {
    readonly tag: ElmKey;
    real: E;
    protected allProps: ElmAttr<any, P>;
    props: P;
    states: D;
    children: ObitasDOM[];
    slots: ObitasDOM[];
    methods: {
        [key: string]: Function;
    };
    computed: {
        [key: string]: any;
    };
    refs: ObitasRef<R>;
    [_parent]?: ObitasDOM<any, any, any, any>;
    [_content]?: any;
    [_domProps]: any | null;
    [_key]: any;
    [_float]: boolean;
    private [_busy];
    private [_head]?;
    private [_tail]?;
    private [_events];
    private [_step];
    get [_forward](): ObitasDOM | undefined;
    constructor(tag: ElmKey, props: ElmAttr<any, P>, children: ObitasDOM[]);
    static is(value: any): value is ObitasDOM;
    get head(): ObitasDOM<any, any, any, Elm>;
    get tail(): ObitasDOM<any, any, any, Elm>;
    get [_root](): ObitasDOM;
    private extract;
    off(key: "created" | "destroyed" | string, handler: (self: this) => void): void;
    on(key: "created" | "destroyed" | string, handler: (self: this) => void, force?: boolean): void;
    emit<T extends EventProps<P>, K extends keyof T>(key: K, ...args: ArgumentTypes<T[K]>): void;
    emit(key: string, ...args: any[]): void;
    dispatch(cb?: () => void): void;
    disconnect(): void;
    private _patch;
    create(callback?: (elm: Elm | undefined) => void): void;
    patch(elm: Elm | undefined, callback?: (elm: Elm | undefined) => void): void;
    private attr;
    private _create;
    private _destroy;
}
export declare class Obitas<Props = any, State = any, Refs extends Ref = never> {
    static is(value: any): value is Obitas;
    id: string;
    constructor(app: AppInit<Props, State, Refs>);
    readonly options: AppInit<Props, State, Refs>;
    create(props?: Props, ...children: ObitasDOM[]): ObitasDOM<Props, State>;
    render(dom: ObitasDOM<Props, State, Refs>, h: CreateElementFn): ObitasDOM<any, any, any, Elm>;
    connect(el: Elm | string, props?: Props, ...children: ObitasDOM[]): ObitasDOM<Props, State, any, Elm>;
    static mergeProps: Set<string>;
    static components: {
        [key: string]: Obitas;
    };
    static directives: {
        [key: string]: (vnode: ObitasDOM, real: Element, key: string, value: any, oldValue: any) => any;
    };
}
export {};
//# sourceMappingURL=index.d.ts.map