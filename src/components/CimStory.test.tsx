import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CimStory } from './CimStory'

vi.mock('./cim-story/CimBikeScene', () => ({
  CimBikeScene: () => <div data-testid="cim-bike-scene" />
}))

describe('CimStory', () => {
  it('maps the six authored timeline markers to a CIM motorcycle story', () => {
    render(<CimStory />)

    expect(screen.getByRole('heading', { name: /a machine is.*lesson in motion/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/interactive 3d motorcycle engineering scene/i)).toBeInTheDocument()
    expect(screen.getByText(/motorcycle is not the subject of cim/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /system view/i })).toHaveAttribute('aria-current', 'step')
    expect(document.querySelectorAll('[data-timeline-marker]')).toHaveLength(6)
    expect(document.querySelector('#system-view')).toHaveAttribute('data-timeline-marker', '0')
    expect(document.querySelector('#disassemble')).toHaveAttribute('data-timeline-marker', '18.2')
    expect(document.querySelector('#reassemble')).toHaveAttribute('data-timeline-marker', '29')
  })

  it('lets keyboard-accessible story controls move readers to a chapter', () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })

    render(<CimStory />)
    fireEvent.click(screen.getByRole('button', { name: /automation/i }))

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })
})
