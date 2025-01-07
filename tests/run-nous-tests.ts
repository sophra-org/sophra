import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const config = defineConfig({
  test: {
    include: ['src/lib/nous/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
  },
})

async function runTests() {
  try {
    const { run } = await import('vitest/node')
    const testResults = await run([], config)
    
    if (testResults.errors.length > 0) {
      console.log('\nFailed Tests:')
      testResults.errors.forEach(error => {
        console.log(`\n${error.file}:`)
        console.log(`  - ${error.message}`)
      })
      process.exit(1)
    } else {
      console.log('\nAll tests passed!')
      process.exit(0)
    }
  } catch (error) {
    console.error('Error running tests:', error)
    process.exit(1)
  }
}

runTests() 