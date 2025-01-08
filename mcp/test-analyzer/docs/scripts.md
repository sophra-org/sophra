# Test Analyzer Scripts

This document outlines all available scripts and workflows for the Test Analyzer system.

## Setup and Database Management

### Initial Setup

```bash
# Set up Prisma and generate client
pnpm test-analyzer:prisma:setup
```

### Database Management

```bash
# Development migrations
pnpm test:analyze:setup

# Deploy migrations
pnpm test:analyze:migrate

# Reset database (use with caution!)
pnpm test:analyze:reset

# Open Prisma Studio
pnpm test-analyzer:prisma:studio
```

## Analysis Workflows

### Interactive Mode

```bash
# Full interactive UI with file selection
pnpm mcp-analyze:interactive
```

### Automated Workflows

#### Full Analysis

```bash
# Complete analysis cycle
pnpm test:analyze:full
# Steps: analyze -> fix -> generate -> report
```

#### Coverage Focus

```bash
# Coverage-driven analysis and improvement
pnpm test:analyze:coverage
# Steps: analyze with coverage -> fix -> generate coverage tests
```

#### Pattern Analysis

```bash
# Pattern-based analysis and fixes
pnpm test:analyze:patterns
# Steps: analyze patterns -> fix based on patterns
```

#### Performance Analysis

```bash
# Performance optimization
pnpm test:analyze:perf
# Steps: analyze performance -> fix performance issues
```

#### Continuous Monitoring

```bash
# Watch mode for continuous analysis
pnpm test:analyze:watch
# Steps: watch files -> analyze -> fix (continuous)
```

### Debug Mode

```bash
# Verbose logging for troubleshooting
pnpm test:analyze:debug
```

## Build and Development

### Building

```bash
# Build the test analyzer
pnpm test-analyzer:build
pnpm mcp:build  # Alternative with installation
```

### Development

```bash
# Run in development mode
pnpm test-analyzer:dev
```

## Usage Examples

### Basic Analysis

```bash
# Analyze a specific test file
pnpm test:analyze path/to/your.test.ts

# Analyze with coverage
pnpm test:analyze:coverage path/to/your.test.ts

# Interactive analysis
pnpm mcp-analyze:interactive
```

### Advanced Workflows

#### Coverage Improvement

```bash
# 1. Start with coverage analysis
pnpm test:analyze:coverage

# 2. Review generated tests
pnpm test:analyze:report

# 3. Apply fixes
pnpm test:analyze fix
```

#### Pattern Detection

```bash
# 1. Analyze patterns
pnpm test:analyze:patterns

# 2. Review suggestions
pnpm test:analyze:report

# 3. Apply pattern-based fixes
pnpm test:analyze fix --patterns
```

#### Continuous Monitoring

```bash
# Start watch mode
pnpm test:analyze:watch

# With performance focus
pnpm test:analyze:watch --performance
```

## Tips and Best Practices

1. **Database Management**

   - Always backup before running `test:analyze:reset`
   - Use `test-analyzer:prisma:studio` to inspect database state

2. **Analysis Workflow**

   - Start with interactive mode to understand available options
   - Use `test:analyze:coverage` for initial codebase assessment
   - Switch to specific workflows based on findings

3. **Debugging**

   - Use `test:analyze:debug` for detailed logging
   - Check Prisma Studio for database state
   - Review generated reports for analysis details

4. **Performance**
   - Use watch mode for large codebases
   - Focus on critical tests first
   - Combine with coverage analysis for optimal results
