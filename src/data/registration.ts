import type { RegistrationPayload } from './content'

export type FieldErrors = Partial<Record<keyof RegistrationPayload, string>>

export function validateRegistration(values: RegistrationPayload): FieldErrors {
  const errors: FieldErrors = {}
  if (values.fullName.trim().length < 2) errors.fullName = 'Enter your full name.'
  if (!values.fieldOfStudy) errors.fieldOfStudy = 'Select your field of study.'
  if (!values.levelOfStudy) errors.levelOfStudy = 'Select your level of study.'
  if (!values.facebookProfile.trim()) errors.facebookProfile = 'Enter your Facebook profile or handle.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.'
  if (values.phone.trim().length < 6) errors.phone = 'Enter a valid phone number.'
  return errors
}
