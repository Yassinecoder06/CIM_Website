import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CimBikeScene } from './CimBikeScene'

vi.mock('@needle-tools/engine', () => ({}))

describe('CimBikeScene', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:cim-bike-scene'),
      revokeObjectURL: vi.fn()
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the CIM loader visible until the buffered scene finishes loading', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer)
    }))

    const { container } = render(<CimBikeScene reducedMotion={false} />)

    expect(screen.getByRole('status', { name: /cim 3d scene/i })).toBeInTheDocument()
    await waitFor(() => expect(container.querySelector('needle-engine')).toHaveAttribute('src', '["blob:cim-bike-scene"]'))

    fireEvent(container.querySelector('needle-engine')!, new Event('loadfinished'))

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  })

  it('uses the static bike fallback when the 3D asset cannot be retrieved', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

    const { container } = render(<CimBikeScene reducedMotion={false} />)

    await waitFor(() => expect(container.querySelector('.cim-bike-scene__fallback')).toBeInTheDocument())
  })
})
