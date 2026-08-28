import type { ReactNode } from 'react'

type TechnicalLabelProps = {
  children: ReactNode
  tone?: 'blue' | 'yellow' | 'light'
  className?: string
}

export function TechnicalLabel({ children, tone = 'blue', className = '' }: TechnicalLabelProps) {
  return <span className={`technical-label technical-label--${tone} ${className}`}>{children}</span>
}
