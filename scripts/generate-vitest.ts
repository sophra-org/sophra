import { Project, SourceFile, Node } from 'ts-morph';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { glob } from 'glob';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const project = new Project({
  tsConfigFilePath: path.resolve(process.cwd(), 'tsconfig.json'),
});

// Helper to truncate text to approximate token count
function truncateToTokens(text: string, maxTokens: number): string {
  // Rough approximation: 1 token ≈ 4 characters for English text
  const charsPerToken = 4;
  const maxChars = maxTokens * charsPerToken;
  
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n... (truncated for length)';
}

async function getProjectContext(targetFile: string): Promise<string> {
  // Read tsconfig.json
  const tsConfig = await fs.readFile('tsconfig.json', 'utf-8');
  const packageJson = await fs.readFile('package.json', 'utf-8');

  // Get type definitions that are imported by the target file
  const sourceFile = project.getSourceFile(targetFile);
  const imports = sourceFile?.getImportDeclarations() || [];
  const relevantTypeFiles = new Set<string>();
  
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier.includes('@/types') || moduleSpecifier.includes('types/')) {
      const resolvedPath = path.resolve(path.dirname(targetFile), moduleSpecifier + '.ts');
      relevantTypeFiles.add(resolvedPath);
    }
  }

  // Get type definitions
  const typeFiles = await glob('src/types/**/*.ts');
  const typeDefinitions = await Promise.all(typeFiles
    .filter(file => relevantTypeFiles.has(file))
    .map(async file => ({
      path: file,
      content: await fs.readFile(file, 'utf-8'),
    })));

  // Get shared utilities that are imported
  const relevantSharedFiles = new Set<string>();
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier.includes('@shared') || moduleSpecifier.includes('lib/shared')) {
      const resolvedPath = path.resolve(path.dirname(targetFile), moduleSpecifier + '.ts');
      relevantSharedFiles.add(resolvedPath);
    }
  }

  const sharedFiles = await glob('src/lib/shared/**/*.ts');
  const sharedCode = await Promise.all(sharedFiles
    .filter(file => relevantSharedFiles.has(file))
    .map(async file => ({
      path: file,
      content: await fs.readFile(file, 'utf-8'),
    })));

  // Build context without markdown, just the essential information
  const context = `
// TypeScript Configuration
${tsConfig}

// Dependencies
${JSON.stringify({ 
  dependencies: JSON.parse(packageJson).dependencies,
  devDependencies: JSON.parse(packageJson).devDependencies
}, null, 2)}

// Type Definitions
${typeDefinitions.map(file => `
// ${file.path}
${file.content}`).join('\n')}

// Shared Utilities
${sharedCode.map(file => `
// ${file.path}
${file.content}`).join('\n')}`;

  // Truncate to stay within limits, leaving room for the source code and prompt
  return truncateToTokens(context, 150000);
}

async function generateTestWithAI(sourceCode: string, exportedSymbols: string[], projectContext: string): Promise<string> {
  const prompt = `You are an expert TypeScript developer tasked with generating comprehensive Vitest test cases.

Project Context (including types, shared utilities, and core functionality):
${projectContext}

For the following TypeScript code:

${sourceCode}

Generate comprehensive Vitest test cases for the exported symbols: ${exportedSymbols.join(', ')}

Requirements:
1. Cover all main functionality with realistic test scenarios
2. Include edge cases and error handling based on the codebase's patterns
3. Use actual types and interfaces from the project
4. Follow the project's existing patterns and best practices
5. Mock all external dependencies correctly (use vi.mock())
6. Ensure proper typing for all test cases
7. Handle async functions and promises correctly
8. Test both success and failure scenarios
9. Use shared utilities and helper functions from the codebase
10. Match the project's error handling patterns

Return ONLY the TypeScript test code without any markdown formatting or explanations. The response should start with 'import' and contain only valid TypeScript code.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (!content || content.type !== 'text') {
    throw new Error('Invalid response from Anthropic API');
  }

  // Clean up any potential markdown or explanations
  let testCode = content.text.trim();
  if (testCode.startsWith('```typescript')) {
    testCode = testCode.replace(/^```typescript\n/, '').replace(/```$/, '');
  } else if (testCode.startsWith('```')) {
    testCode = testCode.replace(/^```\n/, '').replace(/```$/, '');
  }

  return testCode;
}

async function generateTestFile(sourceFile: SourceFile, projectContext: string): Promise<string> {
  const sourceCode = sourceFile.getFullText();
  const exportedSymbols = Array.from(sourceFile.getExportedDeclarations().keys());
  
  if (exportedSymbols.length === 0) {
    return '';
  }

  try {
    const testCode = await generateTestWithAI(sourceCode, exportedSymbols, projectContext);
    return testCode;
  } catch (error) {
    console.error(`Error generating test for ${sourceFile.getFilePath()}:`, error);
    throw error;
  }
}

async function generateTests() {
  try {
    const files = await glob('src/**/*.ts', {
      ignore: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.d.ts'],
    });

    console.log(`\n📝 Found ${files.length} files to process\n`);

    for (const file of files) {
      console.log(`⚡ Processing ${file}...`);
      console.log('🔍 Gathering relevant project context...');
      const projectContext = await getProjectContext(file);
      console.log('✅ Context gathered');

      const sourceFile = project.addSourceFileAtPath(file);
      const testContent = await generateTestFile(sourceFile, projectContext);
      
      if (!testContent) {
        console.log(`⏭️  Skipping ${file} - no exported symbols found`);
        continue;
      }

      // Create test file path in tests directory mirroring src structure
      const relativePath = path.relative('src', file);
      const testPath = path.join('tests', relativePath.replace(/\.ts$/, '.test.ts'));
      const testDir = path.dirname(testPath);

      if (!existsSync(testDir)) {
        await fs.mkdir(testDir, { recursive: true });
      }

      await fs.writeFile(testPath, testContent);
      console.log(`✨ Generated test file: ${testPath}`);
    }

    console.log('\n🎉 Test generation completed successfully!');
  } catch (error) {
    console.error('\n❌ Error generating tests:', error);
    process.exit(1);
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

generateTests(); 