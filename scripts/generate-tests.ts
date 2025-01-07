import fs from 'fs/promises';
import path from 'path';
import { Anthropic } from '@anthropic-ai/sdk';
import { glob } from 'glob';
import prettier from 'prettier';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface TestGenerationResult {
  filePath: string;
  testPath: string;
  success: boolean;
  error?: string;
}

async function generateTest(filePath: string): Promise<TestGenerationResult> {
  try {
    const sourceCode = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Create new test path under /tests directory
    const srcRelativePath = path.relative('src', filePath);
    const testPath = path.join('tests', srcRelativePath.replace(/\.tsx?$/, '.test.ts'));

    // Skip if test file already exists
    if (await fs.access(testPath).catch(() => false)) {
      return {
        filePath,
        testPath,
        success: false,
        error: 'Test file already exists'
      };
    }

    const prompt = `Please generate a comprehensive Jest test file for the following TypeScript code. Focus on high coverage and testing edge cases. Include mocks where necessary. The file path is: ${relativePath}

Source code:
\`\`\`typescript
${sourceCode}
\`\`\`

Please respond with ONLY the test code, no explanations. Use the following format:
\`\`\`typescript
// Test code here
\`\`\``;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Let's add type checking to see what we're working with
    if (!response.content[0] || typeof response.content[0] !== 'object') {
      throw new Error('Invalid response format');
    }

    // Access the message content based on the ContentBlock type
    const contentBlock = response.content[0];
    const testCode = ('text' in contentBlock ? contentBlock.text : '')
      .replace(/```typescript\n/, '')
      .replace(/```\n?$/, '');

    // Format the test code
    const formattedCode = await prettier.format(testCode, {
      parser: 'typescript',
      semi: true,
      singleQuote: true,
    });

    // Create test directory if it doesn't exist
    const testDir = path.dirname(testPath);
    await fs.mkdir(testDir, { recursive: true });

    // Write the test file
    await fs.writeFile(testPath, formattedCode);

    return {
      filePath,
      testPath,
      success: true
    };
  } catch (error) {
    // Update error case to use new test path structure
    const srcRelativePath = path.relative('src', filePath);
    const testPath = path.join('tests', srcRelativePath.replace(/\.tsx?$/, '.test.ts'));
    return {
      filePath,
      testPath,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function main() {
  // Get all TypeScript files in src directory
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'src/**/__tests__/**',
      'src/**/__mocks__/**'
    ]
  });

  const results: TestGenerationResult[] = [];
  const batchSize = 3; // Adjust based on API rate limits

  // Process files in batches
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(generateTest));
    results.push(...batchResults);

    // Progress update
    console.log(`Processed ${i + batch.length}/${files.length} files`);
  }

  // Generate summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\nTest Generation Summary:');
  console.log(`Total files processed: ${results.length}`);
  console.log(`Successfully generated: ${successful}`);
  console.log(`Failed: ${failed}`);

  // Log failures in detail
  if (failed > 0) {
    console.log('\nFailures:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`\n${r.filePath}:`);
        console.log(`Error: ${r.error}`);
      });
  }

  // Run ESLint on generated tests
  if (successful > 0) {
    console.log('\nRunning ESLint on generated tests...');
    const { ESLint } = require('eslint');
    const eslint = new ESLint();

    const testFiles = results
      .filter(r => r.success)
      .map(r => r.testPath);

    const lintResults = await eslint.lintFiles(testFiles);
    await ESLint.outputFixes(lintResults);

    const formatter = await eslint.loadFormatter('stylish');
    const resultText = await formatter.format(lintResults);
    console.log(resultText);
  }
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 