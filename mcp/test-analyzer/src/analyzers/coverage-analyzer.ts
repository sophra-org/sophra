import { CoverageSnapshot } from '../persistence/types.js';
import { PersistentStore } from '../persistence/store.js';

interface ModuleCoverage {
  path: string;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  uncoveredLines: number[];
  risk: 'high' | 'medium' | 'low';
  priority: number;
}

export class CoverageAnalyzer {
  private store: PersistentStore;
  private readonly TARGET_COVERAGE = 90;

  constructor(projectRoot: string) {
    this.store = new PersistentStore(projectRoot);
  }

  async analyzeCoverage(coverageReport: any): Promise<CoverageSnapshot> {
    const moduleAnalysis = this.analyzeModules(coverageReport);
    const snapshot: CoverageSnapshot = {
      timestamp: new Date().toISOString(),
      overall: this.calculateOverallCoverage(moduleAnalysis),
      byModule: this.formatModuleCoverage(moduleAnalysis),
      newTests: [] // Will be populated when new tests are generated
    };

    this.store.addCoverageSnapshot(snapshot);
    return snapshot;
  }

  private analyzeModules(coverageReport: any): ModuleCoverage[] {
    const modules: ModuleCoverage[] = [];

    for (const [path, data] of Object.entries<any>(coverageReport)) {
      const coverage = {
        statements: data.statements.pct || 0,
        branches: data.branches.pct || 0,
        functions: data.functions.pct || 0,
        lines: data.lines.pct || 0
      };

      const uncoveredLines = this.getUncoveredLines(data.lines.details);
      const risk = this.assessRisk(coverage, path);
      const priority = this.calculatePriority(coverage, risk, path);

      modules.push({
        path,
        coverage,
        uncoveredLines,
        risk,
        priority
      });
    }

    return modules.sort((a, b) => b.priority - a.priority);
  }

  private getUncoveredLines(lineDetails: any[]): number[] {
    return lineDetails
      .filter(detail => detail.hit === 0)
      .map(detail => detail.line);
  }

  private assessRisk(coverage: ModuleCoverage['coverage'], path: string): ModuleCoverage['risk'] {
    // Higher risk for customer-facing and core functionality
    const isCustomerFacing = path.includes('/api/') || path.includes('/pages/');
    const isCore = path.includes('/core/') || path.includes('/services/');
    
    const avgCoverage = Object.values(coverage).reduce((a, b) => a + b, 0) / 4;
    
    if (isCustomerFacing || isCore) {
      if (avgCoverage < 70) return 'high';
      if (avgCoverage < 85) return 'medium';
      return 'low';
    }

    if (avgCoverage < 50) return 'high';
    if (avgCoverage < 75) return 'medium';
    return 'low';
  }

  private calculatePriority(
    coverage: ModuleCoverage['coverage'],
    risk: ModuleCoverage['risk'],
    path: string
  ): number {
    const avgCoverage = Object.values(coverage).reduce((a, b) => a + b, 0) / 4;
    const coverageGap = this.TARGET_COVERAGE - avgCoverage;
    
    // Risk multiplier
    const riskMultiplier = {
      high: 1.5,
      medium: 1.0,
      low: 0.5
    }[risk];

    // Path importance multiplier
    let pathMultiplier = 1.0;
    if (path.includes('/api/')) pathMultiplier *= 1.3;
    if (path.includes('/core/')) pathMultiplier *= 1.2;
    if (path.includes('/services/')) pathMultiplier *= 1.1;

    return coverageGap * riskMultiplier * pathMultiplier;
  }

  private calculateOverallCoverage(modules: ModuleCoverage[]): number {
    const totals = modules.reduce(
      (acc, module) => {
        acc.statements += module.coverage.statements;
        acc.branches += module.coverage.branches;
        acc.functions += module.coverage.functions;
        acc.lines += module.coverage.lines;
        acc.count++;
        return acc;
      },
      { statements: 0, branches: 0, functions: 0, lines: 0, count: 0 }
    );

    return Object.entries(totals)
      .filter(([key]) => key !== 'count')
      .reduce((acc, [_, value]) => acc + (value / totals.count), 0) / 4;
  }

  private formatModuleCoverage(modules: ModuleCoverage[]): CoverageSnapshot['byModule'] {
    return modules.reduce((acc, module) => {
      acc[module.path] = {
        statements: module.coverage.statements,
        branches: module.coverage.branches,
        functions: module.coverage.functions,
        lines: module.coverage.lines,
        uncoveredLines: module.uncoveredLines
      };
      return acc;
    }, {} as CoverageSnapshot['byModule']);
  }

  getPriorityModules(): { path: string; priority: number; risk: string }[] {
    const history = this.store.getCoverageHistory();
    if (!history.length) return [];

    const latestSnapshot = history[history.length - 1];
    return Object.entries(latestSnapshot.byModule).map(([path, coverage]) => ({
      path,
      priority: this.calculatePriority(
        {
          statements: coverage.statements,
          branches: coverage.branches,
          functions: coverage.functions,
          lines: coverage.lines
        },
        this.assessRisk(
          {
            statements: coverage.statements,
            branches: coverage.branches,
            functions: coverage.functions,
            lines: coverage.lines
          },
          path
        ),
        path
      ),
      risk: this.assessRisk(
        {
          statements: coverage.statements,
          branches: coverage.branches,
          functions: coverage.functions,
          lines: coverage.lines
        },
        path
      )
    })).sort((a, b) => b.priority - a.priority);
  }
}
