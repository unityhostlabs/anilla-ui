/** Shortcut for all standard browser events including Window-specific ones */
type BrowserEvents = GlobalEventHandlersEventMap & WindowEventHandlersEventMap;

/** Your reusable handler using the shortcut */
type DOMEventHandler<K extends keyof BrowserEvents> = 
    (this: any, ev: BrowserEvents[K]) => any;

/** Transition options type definition */
type TransitionOptions = {
    transitionEnter?: string | null;
    transitionEnterFrom?: string | null;
    transitionEnterTo?: string | null;
    transitionLeave?: string | null;
    transitionLeaveFrom?: string | null;
    transitionLeaveTo?: string | null;
};