import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoriesGallery } from './MemoriesGallery'

describe('MemoriesGallery', () => {
  it('renders the supplied CIM memories in an accessible scrolling gallery', () => {
    render(<MemoriesGallery />)

    expect(screen.getByRole('heading', { name: /moments\s*we build together/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/scrolling gallery of cim club memories/i)).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(30)
    expect(screen.getByAltText(/vehicle production line/i)).toHaveAttribute('src', '/assets/memories/cim-memory-02.jpg')
    expect(screen.getByAltText(/event banner/i)).toHaveAttribute('src', '/assets/memories/cim-memory-30.jpg')
  })
})
