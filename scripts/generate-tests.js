const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Check for required environment variable
if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
    process.exit(1);
}

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Files to process with their coverage metrics
const FILES = [
    {
        path: "src/lib/nous/engine/service.ts",
        totalLines: 429,
        coverage: 9.55,
        uncoveredLines: 384,
        branches: 53
    },
    {
        path: "src/lib/cortex/elasticsearch/services.ts",
        totalLines: 343,
        coverage: 20.11,
        uncoveredLines: 257,
        branches: 110
    },
    {
        path: "src/lib/nous/engine/real-time-learner.ts",
        totalLines: 113,
        coverage: 13.27,
        uncoveredLines: 98,
        branches: 30
    },
    {
        path: "src/lib/nous/learn/pipeline.ts",
        totalLines: 70,
        coverage: 58.57,
        uncoveredLines: 25,
        branches: 15
    },
    {
        path: "src/lib/cortex/core/client.ts",
        totalLines: 64,
        coverage: 23.43,
        uncoveredLines: 48,
        branches: 20
    },
    {
        path: "src/lib/shared/database/client.ts",
        totalLines: 62,
        coverage: 30.64,
        uncoveredLines: 43,
        branches: 18
    },
    {
        path: "src/lib/shared/engine/adaptation-engine.ts",
        totalLines: 48,
        coverage: 8.33,
        uncoveredLines: 44,
        branches: 15
    },
    {
        path: "src/lib/shared/engine/learning-engine.ts",
        totalLines: 27,
        coverage: 14.81,
        uncoveredLines: 23,
        branches: 10
    },
    {
        path: "src/lib/shared/engine/processors/strategy-processor.ts",
        totalLines: 33,
        coverage: 15.15,
        uncoveredLines: 28,
        branches: 12
    },
    {
        path: "src/lib/shared/engine/processors/time-based-processor.ts",
        totalLines: 26,
        coverage: 7.69,
        uncoveredLines: 24,
        branches: 8
    },
    {
        path: "src/lib/shared/engine/processors/performance-processor.ts",
        totalLines: 22,
        coverage: 13.63,
        uncoveredLines: 19,
        branches: 7
    }
];

async function findRelatedFiles(sourcePath) {
    const libDir = path.join(path.dirname(path.dirname(path.dirname(sourcePath))));
    const cmd = `find ${libDir} -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*"`;
    
    try {
        const files = execSync(cmd).toString().split('\n').filter(Boolean);
        return files.filter(file => file !== sourcePath);
    } catch (error) {
        console.error('Error finding related files:', error);
        return [];
    }
}

async function callAnthropic(content, prompt) {
    try {
        console.log('Sending request to Anthropic API...');
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 8000,
            temperature: 0.5,
            system: "You are a Jest testing expert. You will generate comprehensive test suites that focus on edge cases, error handling, and thorough coverage.",
            messages: [
                {
                    role: 'user',
                    content: `Here is the TypeScript file content:\n\n${content}\n\n${prompt}`
                }
            ]
        });

        console.log('Response received:', JSON.stringify(message, null, 2));

        if (!message.content || message.content.length === 0) {
            throw new Error('Invalid response format from API');
        }

        const testCode = message.content[0].text;
        // Extract code between triple backticks if present
        const codeMatch = testCode.match(/```typescript\n([\s\S]*?)```/);
        if (codeMatch) {
            return codeMatch[1];
        }
        
        // Otherwise extract from first import statement
        const importMatch = testCode.match(/^import[\s\S]*$/m);
        return importMatch ? importMatch[0] : testCode;

    } catch (error) {
        console.error('Error calling Anthropic API:', error);
        throw error;
    }
}

async function truncateContent(content, maxLength = 8000) {
    if (content.length <= maxLength) return content;
    
    // Keep the first 60% and last 40% of the content
    const firstPart = Math.floor(maxLength * 0.6);
    const lastPart = maxLength - firstPart;
    
    return content.substring(0, firstPart) +
        '\n// ... truncated for length ...\n' +
        content.substring(content.length - lastPart);
}

async function processFile(fileInfo) {
    console.log('----------------------------------------');
    console.log(`Processing: ${fileInfo.path}`);
    console.log(`Total lines: ${fileInfo.totalLines}`);
    console.log(`Current coverage: ${fileInfo.coverage}%`);
    console.log(`Uncovered lines: ${fileInfo.uncoveredLines}`);
    console.log(`Number of branches: ${fileInfo.branches}`);

    // Create the full test directory path
    const testDir = path.join('tests', path.dirname(fileInfo.path));
    const testFile = path.join(testDir, path.basename(fileInfo.path, '.ts') + '.coverage.test.ts');
    
    console.log(`Creating test directory: ${testDir}`);
    console.log(`Will write to: ${testFile}`);

    try {
        // Ensure all parent directories exist
        await fs.mkdir(testDir, { recursive: true });

        // Read source file
        console.log('Reading source file...');
        const sourceContent = await fs.readFile(fileInfo.path, 'utf8');
        let content = '\n```typescript\n' + await truncateContent(sourceContent) + '\n```\n';

        // Read related files
        console.log('Reading related files...');
        const relatedFiles = await findRelatedFiles(fileInfo.path);
        let remainingLength = 12000 - content.length; // Reserve some tokens for the prompt
        const avgFileLength = Math.floor(remainingLength / relatedFiles.length);

        for (const file of relatedFiles) {
            if (remainingLength <= 0) break;
            
            const relatedContent = await fs.readFile(file, 'utf8');
            const truncatedContent = await truncateContent(relatedContent, avgFileLength);
            content += `\nRelated file ${file}:\n\`\`\`typescript\n${truncatedContent}\n\`\`\`\n`;
            remainingLength -= truncatedContent.length;
        }

        const prompt = `Generate a comprehensive jest test suite for the TypeScript file above.

Coverage details:
- Total lines: ${fileInfo.totalLines}
- Current coverage: ${fileInfo.coverage}%
- Uncovered lines: ${fileInfo.uncoveredLines}
- Number of branches: ${fileInfo.branches}

Requirements:
1. Focus on testing the ${fileInfo.uncoveredLines} uncovered lines
2. Test all ${fileInfo.branches} branches thoroughly
3. Include tests for:
   - Complex logic paths
   - Error handling cases
   - Edge cases
   - Async operations
   - Service interactions
4. Use jest-mock-extended for mocking
5. Follow TypeScript best practices
6. Include beforeEach and afterEach hooks
7. Group tests logically with describe blocks
8. Add timeout configurations where needed
9. Mock external dependencies properly
10. Validate both success and failure paths

Only output the test code, no explanations.`;

        console.log('Generating test file...');
        const testCode = await callAnthropic(content, prompt);
        await fs.writeFile(testFile, testCode);

        console.log(`✓ Test generation complete: ${testFile}`);
        console.log('----------------------------------------');

    } catch (error) {
        console.error(`Error processing ${fileInfo.path}:`, error);
    }

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
}

async function main() {
    console.log('Starting test generation for all components...');
    console.log(`Total files to process: ${FILES.length}`);
    console.log('');

    for (const fileInfo of FILES) {
        await processFile(fileInfo);
    }

    console.log('All test files generated successfully!');
    console.log('Please review and run the tests to verify coverage improvements.');
}

main().catch(error => {
    console.error('Error in main process:', error);
    process.exit(1);
}); 