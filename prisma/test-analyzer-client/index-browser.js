
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.1.0
 * Query Engine version: 4123509d24aa4dede1e864b46351bf2790323b69
 */
Prisma.prismaVersion = {
  client: "6.1.0",
  engine: "4123509d24aa4dede1e864b46351bf2790323b69"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AnalysisSessionScalarFieldEnum = {
  id: 'id',
  startedAt: 'startedAt',
  endedAt: 'endedAt',
  status: 'status',
  context: 'context',
  decisions: 'decisions',
  operations: 'operations'
};

exports.Prisma.TestFileScalarFieldEnum = {
  id: 'id',
  filePath: 'filePath',
  fileName: 'fileName',
  firstSeen: 'firstSeen',
  lastUpdated: 'lastUpdated',
  totalRuns: 'totalRuns',
  avgPassRate: 'avgPassRate',
  currentPassRate: 'currentPassRate',
  avgDuration: 'avgDuration',
  currentCoverage: 'currentCoverage',
  avgCoverage: 'avgCoverage',
  totalFixes: 'totalFixes',
  flakyTests: 'flakyTests',
  metadata: 'metadata',
  healthScore: 'healthScore',
  totalTests: 'totalTests',
  criticalTests: 'criticalTests',
  lastFailureReason: 'lastFailureReason'
};

exports.Prisma.TestAnalysisScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  testFileId: 'testFileId',
  patterns: 'patterns',
  antiPatterns: 'antiPatterns',
  suggestions: 'suggestions',
  context: 'context',
  timestamp: 'timestamp'
};

exports.Prisma.TestPatternScalarFieldEnum = {
  id: 'id',
  type: 'type',
  pattern: 'pattern',
  context: 'context',
  successRate: 'successRate',
  usageCount: 'usageCount',
  lastUsed: 'lastUsed',
  createdAt: 'createdAt'
};

exports.Prisma.FixPatternScalarFieldEnum = {
  id: 'id',
  problem: 'problem',
  solution: 'solution',
  context: 'context',
  successRate: 'successRate',
  usageCount: 'usageCount',
  lastUsed: 'lastUsed',
  createdAt: 'createdAt'
};

exports.Prisma.TestExecutionScalarFieldEnum = {
  id: 'id',
  testFileId: 'testFileId',
  executedAt: 'executedAt',
  passed: 'passed',
  duration: 'duration',
  errorMessage: 'errorMessage',
  testResults: 'testResults',
  environment: 'environment',
  commitHash: 'commitHash',
  performance: 'performance'
};

exports.Prisma.TestCoverageScalarFieldEnum = {
  id: 'id',
  testFileId: 'testFileId',
  measuredAt: 'measuredAt',
  coveragePercent: 'coveragePercent',
  linesCovered: 'linesCovered',
  linesUncovered: 'linesUncovered',
  branchCoverage: 'branchCoverage',
  functionCoverage: 'functionCoverage',
  suggestedAreas: 'suggestedAreas',
  coverageType: 'coverageType'
};

exports.Prisma.TestFixScalarFieldEnum = {
  id: 'id',
  testFileId: 'testFileId',
  appliedAt: 'appliedAt',
  fixType: 'fixType',
  problem: 'problem',
  solution: 'solution',
  successful: 'successful',
  confidenceScore: 'confidenceScore',
  beforeState: 'beforeState',
  afterState: 'afterState',
  patternUsed: 'patternUsed',
  impactScore: 'impactScore'
};

exports.Prisma.TestGenerationScalarFieldEnum = {
  id: 'id',
  testFileId: 'testFileId',
  generatedAt: 'generatedAt',
  generationType: 'generationType',
  newTests: 'newTests',
  accepted: 'accepted',
  targetArea: 'targetArea',
  coverageImprovement: 'coverageImprovement',
  generationStrategy: 'generationStrategy',
  context: 'context'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.SessionStatus = exports.$Enums.SessionStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.TestHealthScore = exports.$Enums.TestHealthScore = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  POOR: 'POOR',
  CRITICAL: 'CRITICAL'
};

exports.PatternType = exports.$Enums.PatternType = {
  TEST_STRUCTURE: 'TEST_STRUCTURE',
  ASSERTION_STYLE: 'ASSERTION_STYLE',
  MOCK_USAGE: 'MOCK_USAGE',
  SETUP_PATTERN: 'SETUP_PATTERN',
  ERROR_HANDLING: 'ERROR_HANDLING',
  ASYNC_PATTERN: 'ASYNC_PATTERN'
};

exports.FixType = exports.$Enums.FixType = {
  ASSERTION: 'ASSERTION',
  SETUP: 'SETUP',
  TEARDOWN: 'TEARDOWN',
  ASYNC: 'ASYNC',
  MOCK: 'MOCK',
  TIMING: 'TIMING',
  DEPENDENCY: 'DEPENDENCY',
  LOGIC: 'LOGIC',
  OTHER: 'OTHER'
};

exports.GenerationType = exports.$Enums.GenerationType = {
  COVERAGE_GAP: 'COVERAGE_GAP',
  ENHANCEMENT: 'ENHANCEMENT',
  REGRESSION: 'REGRESSION',
  EDGE_CASE: 'EDGE_CASE'
};

exports.Prisma.ModelName = {
  AnalysisSession: 'AnalysisSession',
  TestFile: 'TestFile',
  TestAnalysis: 'TestAnalysis',
  TestPattern: 'TestPattern',
  FixPattern: 'FixPattern',
  TestExecution: 'TestExecution',
  TestCoverage: 'TestCoverage',
  TestFix: 'TestFix',
  TestGeneration: 'TestGeneration'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
