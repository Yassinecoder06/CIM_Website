import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { validateRegistration } from '../data/registration'
import { JoinPage } from './JoinPage'

const validValues = {
  fullName: 'Amina Ben Ali',
  fieldOfStudy: 'IIA' as const,
  levelOfStudy: '3' as const,
  facebookProfile: 'amina.engineers',
  email: 'amina@example.com',
  phone: '+216 20 000 000',
  comments: '',
  website: ''
}

describe('validateRegistration', () => {
  it('accepts the approved registration schema', () => {
    expect(validateRegistration(validValues)).toEqual({})
  })

  it('reports invalid required values', () => {
    const errors = validateRegistration({ ...validValues, fullName: '', email: 'not-an-email', fieldOfStudy: '' })
    expect(errors.fullName).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(errors.fieldOfStudy).toBeTruthy()
  })

  it('shows the website confirmation after an approved Apps Script message', () => {
    render(<MemoryRouter><JoinPage /></MemoryRouter>)
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://script.google.com',
        data: { source: 'cim-registration', status: 'success', message: 'Recorded for testing.' }
      }))
    })
    expect(screen.getByRole('status')).toHaveTextContent(/Welcome to CIM/i)
    expect(screen.getByText('Recorded for testing.')).toBeInTheDocument()
  })
})
