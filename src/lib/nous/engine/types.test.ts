import { describe, it, expect } from 'vitest'
import {
  EngineStatus,
  EngineOperationType,
  EngineOperationStatus,
  EngineOptimizationType,
  EngineRiskLevel,
  TestMetrics,
  VariantAnalysis,
  ImpactAnalysis,
} from './types'

describe('Engine Types', () => {
  describe('EngineStatus', () => {
    it('should have all required statuses', () => {
      expect(Object.values(EngineStatus)).toContain('INITIALIZING')
      expect(Object.values(EngineStatus)).toContain('READY')
      expect(Object.values(EngineStatus)).toContain('LEARNING')
      expect(Object.values(EngineStatus)).toContain('OPTIMIZING')
      expect(Object.values(EngineStatus)).toContain('PAUSED')
      expect(Object.values(EngineStatus)).toContain('ERROR')
    })
  })

  describe('EngineOperationType', () => {
    it('should have all required operation types', () => {
      expect(Object.values(EngineOperationType)).toContain('LEARNING')
      expect(Object.values(EngineOperationType)).toContain('OPTIMIZATION')
      expect(Object.values(EngineOperationType)).toContain('VALIDATION')
      expect(Object.values(EngineOperationType)).toContain('ROLLBACK')
    })
  })

  describe('EngineOperationStatus', () => {
    it('should have all required operation statuses', () => {
      expect(Object.values(EngineOperationStatus)).toContain('PENDING')
      expect(Object.values(EngineOperationStatus)).toContain('IN_PROGRESS')
      expect(Object.values(EngineOperationStatus)).toContain('COMPLETED')
      expect(Object.values(EngineOperationStatus)).toContain('FAILED')
      expect(Object.values(EngineOperationStatus)).toContain('CANCELLED')
    })
  })

  describe('EngineOptimizationType', () => {
    it('should have all required optimization types', () => {
      expect(Object.values(EngineOptimizationType)).toContain('WEIGHT_ADJUSTMENT')
      expect(Object.values(EngineOptimizationType)).toContain('CACHE_OPTIMIZATION')
      expect(Object.values(EngineOptimizationType)).toContain('QUERY_TRANSFORMATION')
      expect(Object.values(EngineOptimizationType)).toContain('INDEX_OPTIMIZATION')
      expect(Object.values(EngineOptimizationType)).toContain('FEEDBACK_LOOP')
    })
  })

  describe('EngineRiskLevel', () => {
    it('should have all required risk levels', () => {
      expect(Object.values(EngineRiskLevel)).toContain('LOW')
      expect(Object.values(EngineRiskLevel)).toContain('MEDIUM')
      expect(Object.values(EngineRiskLevel)).toContain('HIGH')
      expect(Object.values(EngineRiskLevel)).toContain('CRITICAL')
    })

    it('should maintain risk level order', () => {
      const riskLevels = [
        EngineRiskLevel.LOW,
        EngineRiskLevel.MEDIUM,
        EngineRiskLevel.HIGH,
        EngineRiskLevel.CRITICAL,
      ]

      expect(riskLevels.indexOf(EngineRiskLevel.LOW)).toBeLessThan(riskLevels.indexOf(EngineRiskLevel.MEDIUM))
      expect(riskLevels.indexOf(EngineRiskLevel.MEDIUM)).toBeLessThan(riskLevels.indexOf(EngineRiskLevel.HIGH))
      expect(riskLevels.indexOf(EngineRiskLevel.HIGH)).toBeLessThan(riskLevels.indexOf(EngineRiskLevel.CRITICAL))
    })
  })

  describe('TestMetrics', () => {
    it('should validate test metrics structure', () => {
      const metrics: TestMetrics = {
        latency: 100,
        errorRate: 0.01,
        throughput: 1000,
        cpuUsage: 0.5,
        memoryUsage: 0.7,
      }

      expect(metrics).toHaveProperty('latency')
      expect(metrics).toHaveProperty('errorRate')
      expect(metrics).toHaveProperty('throughput')
      expect(metrics).toHaveProperty('cpuUsage')
      expect(metrics).toHaveProperty('memoryUsage')
    })
  })

  describe('VariantAnalysis', () => {
    it('should validate variant analysis structure', () => {
      const analysis: VariantAnalysis = {
        metrics: {
          latency: 100,
          errorRate: 0.01,
          throughput: 1000,
          cpuUsage: 0.5,
          memoryUsage: 0.7,
        },
        sampleSize: 1000,
        confidence: 0.95
      }

      expect(analysis).toHaveProperty('metrics')
      expect(analysis).toHaveProperty('confidence')
      expect(analysis).toHaveProperty('sampleSize')
      expect(analysis.metrics).toHaveProperty('latency')
    })
  })

  describe('ImpactAnalysis', () => {
    it('should validate impact analysis structure', () => {
      const analysis: ImpactAnalysis = {
        weightedImprovement: 0.2,
        improvements: {
          latency: 0.2,
          throughput: 0.15,
          errorRate: 0.1
        },
        significance: 0.95,
        confidence: 0.9,
        loadFactor: 0.8,
        isSignificant: true,
        value: 0.25
      }

      expect(analysis).toHaveProperty('weightedImprovement')
      expect(analysis).toHaveProperty('improvements')
      expect(analysis).toHaveProperty('significance')
      expect(analysis).toHaveProperty('confidence')
      expect(analysis).toHaveProperty('loadFactor')
      expect(analysis).toHaveProperty('isSignificant')
      expect(analysis).toHaveProperty('value')
    })

    it('should validate impact analysis value ranges', () => {
      const analysis: ImpactAnalysis = {
        weightedImprovement: 0.2,
        improvements: {
          latency: 0.2,
          throughput: 0.15,
          errorRate: 0.1
        },
        significance: 0.95,
        confidence: 0.9,
        loadFactor: 0.8,
        isSignificant: true,
        value: 0.25
      }

      expect(analysis.weightedImprovement).toBeGreaterThanOrEqual(0)
      expect(analysis.weightedImprovement).toBeLessThanOrEqual(1)
      expect(analysis.significance).toBeGreaterThanOrEqual(0)
      expect(analysis.significance).toBeLessThanOrEqual(1)
      expect(analysis.confidence).toBeGreaterThanOrEqual(0)
      expect(analysis.confidence).toBeLessThanOrEqual(1)
      expect(analysis.loadFactor).toBeGreaterThanOrEqual(0)
      expect(analysis.loadFactor).toBeLessThanOrEqual(1)
    })
  })
}) 