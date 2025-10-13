export interface SelectOption {
    label: string
    value: string
    icon?: string
  }
  
  // e.g., in `src/types/google.d.ts`
export {};

declare global {
  interface Window {
    google: any; // or better typing if needed
  }
}

declare global {
  interface Window {
    AppleID: any; // or better typing if needed
  }
}
