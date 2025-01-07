import { describe, it, expect } from 'vitest'
import { createSignalResponse } from './signal-response'

describe('Signal Response', () => {
  it('should create successful response', async () => {
    const data = { message: 'test' }
    const response = createSignalResponse(data, { timestamp: new Date().toISOString() })
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.data).toEqual(data)
    expect(body.metadata.timestamp).toBeDefined()
  })

  it('should include metadata', async () => {
    const data = { message: 'test' }
    const metadata = {
      timestamp: new Date().toISOString(),
      count: 1,
      page: 1,
      pageSize: 10,
      totalCount: 100,
      processingStatus: 'complete'
    }

    const response = createSignalResponse(data, metadata)
    const body = await response.json()

    expect(body.metadata.count).toBe(1)
    expect(body.metadata.page).toBe(1)
    expect(body.metadata.pageSize).toBe(10)
    expect(body.metadata.totalCount).toBe(100)
    expect(body.metadata.processingStatus).toBe('complete')
  })

  it('should handle custom options', async () => {
    const data = { message: 'test' }
    const response = createSignalResponse(
      data,
      { timestamp: new Date().toISOString() },
      { success: false, status: 400 }
    )
    const body = await response.json()

    expect(body.success).toBe(false)
    expect(response.status).toBe(400)
  })

  it('should use default options', async () => {
    const data = { message: 'test' }
    const response = createSignalResponse(data, { timestamp: new Date().toISOString() })
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(response.status).toBe(200)
  })
})