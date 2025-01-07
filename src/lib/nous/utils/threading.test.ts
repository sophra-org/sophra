import { describe, it, expect, vi } from 'vitest'
import { ThreadPool, type Task } from './threading'

describe('ThreadPool', () => {
  it('should execute tasks immediately when capacity available', async () => {
    const pool = new ThreadPool(2)
    const task: Task<number> = async () => 42
    const result = await pool.execute(task)
    expect(result).toBe(42)
  })

  it('should queue tasks when at capacity', async () => {
    const pool = new ThreadPool(1)
    const results: number[] = []
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const task1: Task<number> = async () => {
      await delay(100)
      results.push(1)
      return 1
    }

    const task2: Task<number> = async () => {
      results.push(2)
      return 2
    }

    // Start both tasks
    const promise1 = pool.execute(task1)
    const promise2 = pool.execute(task2)

    // Wait for both to complete
    await Promise.all([promise1, promise2])

    // Task2 should be queued and run after task1
    expect(results).toEqual([1, 2])
  })

  it('should handle multiple concurrent tasks', async () => {
    const pool = new ThreadPool(3)
    const results: number[] = []

    const createTask = (n: number): Task<number> => async () => {
      results.push(n)
      return n
    }

    const tasks = [1, 2, 3, 4, 5].map(createTask)
    const promises = tasks.map(task => pool.execute(task))
    const taskResults = await Promise.all(promises)

    expect(taskResults).toEqual([1, 2, 3, 4, 5])
    expect(results.length).toBe(5)
  })

  it('should handle task failures', async () => {
    const pool = new ThreadPool(1)
    const error = new Error('Task failed')
    const task: Task<never> = async () => {
      throw error
    }

    await expect(pool.execute(task)).rejects.toThrow(error)
  })

  it('should process queued tasks after failure', async () => {
    const pool = new ThreadPool(1)
    const results: number[] = []
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const failingTask: Task<never> = async () => {
      await delay(100)
      throw new Error('Task failed')
    }

    const successTask: Task<number> = async () => {
      results.push(1)
      return 1
    }

    // Start both tasks
    const promise1 = pool.execute(failingTask).catch(() => {})
    const promise2 = pool.execute(successTask)

    // Wait for both to complete
    await Promise.all([promise1, promise2])

    // successTask should still run after failingTask
    expect(results).toEqual([1])
  })

  it('should shutdown gracefully', async () => {
    const pool = new ThreadPool(1)
    const results: number[] = []

    const task: Task<number> = async () => {
      results.push(1)
      return 1
    }

    // Start a task
    const promise = pool.execute(task)
    pool.shutdown()

    // Task should still complete
    await promise
    expect(results).toEqual([1])

    // New tasks should run directly
    const result = await pool.execute(async () => 2)
    expect(result).toBe(2)
  })
}) 