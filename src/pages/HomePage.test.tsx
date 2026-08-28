import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('HomePage archive', () => {
  it('starts the What we do readout on Instrumentation', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    expect(screen.getByText('AREA 03')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Instrumentation' })).toHaveLength(2)
  })

  it('filters the verified archive by activity type', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Training' }))
    expect(screen.getByRole('heading', { name: /Introduction to PLCs/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'SolidWorks Day' })).not.toBeInTheDocument()
  })
})
