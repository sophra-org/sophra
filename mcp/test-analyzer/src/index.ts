#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TestAnalyzer } from './analyzers/test-analyzer.js';
import { CoverageAnalyzer } from './analyzers/coverage-analyzer.js';
import { TestGenerator } from './generators/test-generator.js';
import { writeFileSync } from 'fs';

class TestAnalyzerServer {
  private server: Server;
  private testAnalyzer: TestAnalyzer | null = null;
  private coverageAnalyzer: CoverageAnalyzer | null = null;
  private testGenerator: TestGenerator | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'test-analyzer',
        version: '0.1.0',
        description: 'Test analysis and generation tools'
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_test_failures',
          description: 'Analyze failing tests to identify patterns and suggest fixes',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: { type: 'string' },
              testOutput: { type: 'string' }
            },
            required: ['projectPath', 'testOutput']
          }
        },
        {
          name: 'analyze_coverage',
          description: 'Analyze test coverage and suggest improvements',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: { type: 'string' },
              coverageReport: { type: 'object' }
            },
            required: ['projectPath', 'coverageReport']
          }
        },
        {
          name: 'get_coverage_priorities',
          description: 'Get prioritized list of modules needing coverage improvements',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: { type: 'string' }
            },
            required: ['projectPath']
          }
        },
        {
          name: 'generate_test',
          description: 'Generate a test file for a given source file',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: { type: 'string' },
              targetFile: { type: 'string' }
            },
            required: ['projectPath', 'targetFile']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!request.params.name) {
        throw new McpError(ErrorCode.InvalidParams, 'Tool name is required');
      }

      const args = request.params.arguments;
      switch (request.params.name) {
        case 'analyze_test_failures': {
          if (typeof args !== 'object' || args === null) {
            throw new McpError(ErrorCode.InvalidParams, 'Arguments must be an object');
          }
          if (typeof args.projectPath !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'projectPath must be a string');
          }
          if (typeof args.testOutput !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'testOutput must be a string');
          }
          
          if (!this.testAnalyzer) {
            this.testAnalyzer = new TestAnalyzer(args.projectPath);
          }
          const result = await this.testAnalyzer.analyzeFailure(args.projectPath, args.testOutput);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        }

        case 'analyze_coverage': {
          if (typeof args !== 'object' || args === null) {
            throw new McpError(ErrorCode.InvalidParams, 'Arguments must be an object');
          }
          if (typeof args.projectPath !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'projectPath must be a string');
          }
          if (typeof args.coverageReport !== 'object' || args.coverageReport === null) {
            throw new McpError(ErrorCode.InvalidParams, 'coverageReport must be an object');
          }
          
          if (!this.coverageAnalyzer) {
            this.coverageAnalyzer = new CoverageAnalyzer(args.projectPath);
          }
          const result = await this.coverageAnalyzer.analyzeCoverage(args.coverageReport);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        }

        case 'get_coverage_priorities': {
          if (typeof args !== 'object' || args === null) {
            throw new McpError(ErrorCode.InvalidParams, 'Arguments must be an object');
          }
          if (typeof args.projectPath !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'projectPath must be a string');
          }
          
          if (!this.coverageAnalyzer) {
            this.coverageAnalyzer = new CoverageAnalyzer(args.projectPath);
          }
          const priorities = this.coverageAnalyzer.getPriorityModules();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(priorities, null, 2)
            }]
          };
        }

        case 'generate_test': {
          if (typeof args !== 'object' || args === null) {
            throw new McpError(ErrorCode.InvalidParams, 'Arguments must be an object');
          }
          if (typeof args.projectPath !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'projectPath must be a string');
          }
          if (typeof args.targetFile !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'targetFile must be a string');
          }
          
          if (!this.testGenerator) {
            this.testGenerator = new TestGenerator(args.projectPath);
          }
          const generated = await this.testGenerator.generateTest(args.targetFile);
          writeFileSync(generated.filePath, generated.content, 'utf-8');
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                message: `Test file generated at: ${generated.filePath}`,
                testContent: generated.content
              }, null, 2)
            }]
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: []
    }));

    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: []
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async () => {
      throw new McpError(ErrorCode.MethodNotFound, 'No resources available');
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Test Analyzer MCP server running on stdio');
  }
}

const server = new TestAnalyzerServer();
server.run().catch(console.error);
