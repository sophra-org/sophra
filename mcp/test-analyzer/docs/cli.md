# Test Analyzer CLI

An interactive command-line tool for analyzing, fixing, and generating tests in your codebase.

## Installation

The test analyzer is installed as part of the main project setup:

```bash
pnpm install
```

## Environment Setup

1. Create a `.env` file in the root directory:

```env
# Database connection (required)
TEST_ANALYZER_DATABASE_URL="postgresql://user:password@localhost:5432/test_analyzer"

# Optional settings
ANALYSIS_BATCH_SIZE=10  # Maximum number of files to analyze in parallel
CLEANUP_INTERVAL=3600   # Cleanup interval in seconds (default: 1 hour)
```

2. Initialize the database:

```bash
pnpm test:analyze:setup
```

## Usage

### Basic Usage

To start the CLI in interactive mode:

```bash
pnpm test:analyze
```

### Command Chaining

You can chain multiple operations in a specific order:

```bash
# Analyze and then generate tests
pnpm test:analyze analyze generate

# Full workflow: analyze, fix issues, generate new tests
pnpm test:analyze analyze fix generate

# Custom workflow with specific options
pnpm test:analyze analyze --coverage fix --flaky generate --type=coverage
```

### Available Commands

- `analyze`: Analyze test files for issues and patterns
- `fix`: Apply fixes to identified issues
- `generate`: Generate new tests based on analysis
- `report`: Generate a report of test health
- `watch`: Watch mode for continuous analysis

### Command Options

#### analyze

- `--coverage`: Focus on coverage analysis
- `--patterns`: Focus on pattern detection
- `--performance`: Focus on performance issues

#### fix

- `--flaky`: Focus on fixing flaky tests
- `--coverage`: Fix coverage gaps
- `--patterns`: Fix anti-patterns

#### generate

- `--type=<type>`: Type of tests to generate (coverage|enhancement|regression|edge)
- `--target=<path>`: Target specific area for test generation

### Workflow Examples

1. Coverage Improvement Workflow:

   ```bash
   pnpm test:analyze analyze --coverage fix --coverage generate --type=coverage
   ```

2. Performance Optimization:

   ```bash
   pnpm test:analyze analyze --performance fix
   ```

3. Pattern-based Enhancement:

   ```bash
   pnpm test:analyze analyze --patterns fix --patterns generate --type=enhancement
   ```

4. Continuous Monitoring:
   ```bash
   pnpm test:analyze watch analyze fix
   ```

## Available Scripts

The following scripts are available in the root package.json:

```bash
# Start the interactive CLI
pnpm test:analyze

# Run with debug output
pnpm test:analyze:debug

# Database management
pnpm test:analyze:setup     # Initialize/update database with migrations
pnpm test:analyze:migrate   # Deploy migrations to production
pnpm test:analyze:reset     # Reset the database (caution: deletes all data)
```

## Features

### Test File Scanning

The CLI automatically scans your codebase for test files (matching `**/*.test.ts` pattern). For each test file, it:

- Counts the number of tests in the file
- Identifies if it's a new or existing test file
- Shows basic metrics like test count and status
- Detects test type (unit, integration, e2e) based on file naming

### Interactive Test Selection

After scanning, you'll be presented with an interactive menu to:

- Select multiple test files for analysis using space bar
- See which files are new [NEW]
- View the number of tests in each file
- Filter by test type or pattern

### Analysis Process

For each selected test file, the analyzer will:

1. Create or update the test file record in the database
2. Run a comprehensive analysis including:
   - Test coverage metrics
   - Pass/fail rates
   - Performance metrics
   - Code patterns and anti-patterns
   - Potential improvements
   - Flaky test detection
   - Test reliability scoring
   - Historical trend analysis

### Database Features

The analyzer maintains detailed test information:

#### Test File Records

- Basic metadata (file path, name, first seen date)
- Test metrics (total runs, pass rates, coverage)
- Health indicators (flaky tests, critical tests)
- Historical data (average metrics, trends)

#### Analysis History

- Pattern detection results
- Anti-pattern identification
- Improvement suggestions
- Coverage gaps
- Performance bottlenecks

#### Session Management

- Analysis sessions tracking
- Operation history
- Decision records
- Context preservation

## Example Workflow

1. Start the CLI:

   ```bash
   pnpm cli
   ```

2. The tool will scan your codebase and show available test files:

   ```
   ? Select test files to analyze:
   ❯ ◯ user.test.ts (12 tests)
     ◯ auth.test.ts (8 tests) [NEW]
     ◯ api.test.ts (15 tests)
   ```

3. Use space bar to select files, enter to confirm
4. Watch the analysis progress for each selected file
5. Review the results and suggested improvements

## Analysis Output

For each analyzed file, you'll see:

- Analysis progress with spinner
- Success/failure status
- Basic metrics and health indicators
- Any errors or issues encountered

### Detailed Results Include:

- Test Health Score (EXCELLENT, GOOD, FAIR, POOR, CRITICAL)
- Coverage Analysis
  - Current coverage percentage
  - Uncovered lines and functions
  - Coverage trends
- Performance Metrics
  - Average execution time
  - Performance regression detection
- Pattern Analysis
  - Identified test patterns
  - Anti-patterns found
  - Suggested improvements
- Reliability Indicators
  - Flaky test detection
  - Stability score
  - Historical pass/fail rates

## Error Handling

The CLI provides clear error messages for common issues:

- File not found
- Parse errors
- Analysis failures
- Database connection issues
- Invalid test patterns
- Coverage calculation errors

## Tips

- Use space bar to select multiple files
- Look for the [NEW] indicator for newly discovered test files
- The analysis is persisted, so you can track improvements over time
- Files are analyzed sequentially to avoid overwhelming the system
- Regular analysis helps track test health over time
- Use the health score to prioritize improvements
- Check historical data to identify trending issues

## Troubleshooting

### Common Issues

1. Database Connection:

   - Ensure your database is running
   - Check your DATABASE_URL in .env
   - Run `pnpm test-analyzer:prisma:migrate:status` to verify migrations

2. File Scanning:

   - Make sure test files end with `.test.ts`
   - Check file permissions
   - Verify the paths are not excluded in .gitignore

3. Analysis Failures:
   - Check test file syntax
   - Ensure all dependencies are installed
   - Look for circular dependencies

### Debug Mode

To run the CLI in debug mode, use the debug script from the root:

```bash
pnpm test:analyze:debug
```

This will show additional information about:

- File scanning process
- Database operations
- Analysis steps
- Error details

## Advanced Usage

### Custom Workflows

You can create custom workflows by combining commands:

```bash
# Create a custom workflow script in package.json
"scripts": {
  "test:analyze:coverage": "pnpm test:analyze analyze --coverage fix --coverage generate --type=coverage",
  "test:analyze:patterns": "pnpm test:analyze analyze --patterns fix --patterns",
  "test:analyze:full": "pnpm test:analyze analyze fix generate report"
}
```

### Session Management

Commands in a chain share the same analysis session, allowing for:

- Consistent context across operations
- Cumulative improvements
- Comprehensive reporting
- Progress tracking

### Workflow State

The CLI maintains state throughout the workflow:

- Analysis results are carried forward
- Fix suggestions are tracked
- Generated tests are validated
- Reports include all operations
