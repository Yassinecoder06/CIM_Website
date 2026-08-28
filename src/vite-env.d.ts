/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'needle-engine': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        contactshadows?: string
        'focus-rect'?: string
        'loading-blur'?: string
        src?: string
      }
    }
  }
}
