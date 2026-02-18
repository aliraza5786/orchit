// Temporary ambient module to satisfy TypeScript when importing the
// ESM build of Toast UI Calendar. The library does not ship with its own
// types, and the `@types` namespace has no package for it, so we provide a
// minimal declaration here.  
//
// You can enhance these definitions later if you need better type safety.

declare module "@toast-ui/calendar/dist/toastui-calendar.mjs" {
  // The default export is the Calendar constructor.  We declare it as `any`
  // to keep things simple; consuming code (like `TimelineView.vue`) already
  // treats it dynamically and uses `any`-compatible APIs.
  export default class Calendar {
    constructor(element: HTMLElement | string, options?: any);
    // Some commonly used instance methods are declared here to reduce `any`
    // usage in the component. Add more as needed.
    createEvents(events: any[]): void;
    clear(): void;
    changeView(view: string): void;
    today(): void;
    prev(): void;
    next(): void;
    getDate(): Date | string;
    setTheme(theme: any): void;
    render(): void;
    destroy(): void;
  }
}
