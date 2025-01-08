import { readFileSync } from 'fs';
import { PersistentStore } from '../persistence/store.js';
import path from 'path';
export class TestGenerator {
    constructor(projectRoot) {
        this.store = new PersistentStore(projectRoot);
    }
    async generateTest(targetFile) {
        const sourceCode = readFileSync(targetFile, 'utf-8');
        const fileExt = path.extname(targetFile);
        const isTypescript = fileExt === '.ts' || fileExt === '.tsx';
        // Extract exports and function definitions
        const exportMatches = sourceCode.match(/export\s+(const|function|class|interface|type)\s+(\w+)/g) || [];
        const functionMatches = sourceCode.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g) || [];
        const methodMatches = sourceCode.match(/(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)/g) || [];
        // Generate test file path
        const testPath = targetFile.replace(/\.(ts|tsx|js|jsx)$/, '.test$1');
        // Start building test content
        let testContent = this.generateTestHeader(targetFile, isTypescript);
        // Add imports
        const importPath = path.relative(path.dirname(testPath), targetFile).replace(/\.(ts|js)x?$/, '');
        testContent += this.generateImports(importPath, exportMatches);
        // Generate test cases
        testContent += this.generateTestCases(exportMatches, functionMatches, methodMatches, sourceCode);
        return {
            filePath: testPath,
            content: testContent
        };
    }
    generateTestHeader(targetFile, isTypescript) {
        return `${isTypescript ? '/// <reference types="vitest" />\n' : ''}
import { describe, it, expect${isTypescript ? ', vi' : ''} } from 'vitest';

// Tests for ${path.basename(targetFile)}
`;
    }
    generateImports(importPath, exports) {
        if (!exports.length)
            return '\n';
        const importNames = exports
            .map(exp => exp.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/)?.[1])
            .filter(Boolean);
        return `import { ${importNames.join(', ')} } from '${importPath}';\n\n`;
    }
    generateTestCases(exports, functions, methods, sourceCode) {
        let testContent = '';
        // Generate tests for exported items
        exports.forEach(exp => {
            const match = exp.match(/export\s+(const|function|class|interface|type)\s+(\w+)/);
            if (!match)
                return;
            const [_, type, name] = match;
            if (type === 'interface' || type === 'type')
                return; // Skip type definitions
            testContent += this.generateTestSuite(name, type, sourceCode);
        });
        // Generate tests for non-exported functions
        functions.forEach(func => {
            const match = func.match(/function\s+(\w+)/);
            if (!match)
                return;
            const [_, name] = match;
            if (!exports.some(e => e.includes(name))) { // Only if not already covered by exports
                testContent += this.generateTestSuite(name, 'function', sourceCode);
            }
        });
        return testContent;
    }
    generateTestSuite(name, type, sourceCode) {
        let suite = `\ndescribe('${name}', () => {\n`;
        if (type === 'class') {
            suite += this.generateClassTests(name, sourceCode);
        }
        else if (type === 'function' || type === 'const') {
            suite += this.generateFunctionTests(name, sourceCode);
        }
        suite += '});\n';
        return suite;
    }
    generateClassTests(className, sourceCode) {
        let tests = '';
        // Constructor test
        tests += `  it('should create an instance', () => {
    const instance = new ${className}();
    expect(instance).toBeInstanceOf(${className});
  });\n\n`;
        // Find methods
        const classBlock = sourceCode.match(new RegExp(`class\\s+${className}\\s*{([^}]+)}`));
        if (classBlock) {
            const methods = classBlock[1].match(/(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)/g) || [];
            methods.forEach(method => {
                const methodName = method.match(/(?:public|private|protected)?\s*(?:async\s+)?(\w+)/)?.[1];
                if (!methodName || methodName === 'constructor')
                    return;
                tests += this.generateMethodTest(className, methodName, method);
            });
        }
        return tests;
    }
    generateMethodTest(className, methodName, methodSignature) {
        const isAsync = methodSignature.includes('async');
        const params = (methodSignature.match(/\((.*?)\)/) || ['', ''])[1];
        const paramList = params.split(',').map(p => p.trim()).filter(Boolean);
        let test = `  it('should handle ${methodName}', ${isAsync ? 'async ' : ''}() => {
    const instance = new ${className}();
    const params = ${this.generateMockParams(paramList)};
`;
        if (isAsync) {
            test += `    const result = await instance.${methodName}(${this.generateParamNames(paramList)});
    expect(result).toBeDefined();`;
        }
        else {
            test += `    const result = instance.${methodName}(${this.generateParamNames(paramList)});
    expect(result).toBeDefined();`;
        }
        test += '\n  });\n\n';
        return test;
    }
    generateFunctionTests(funcName, sourceCode) {
        const funcMatch = sourceCode.match(new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${funcName}\\s*\\(([^)]*)\\)`));
        if (!funcMatch)
            return '';
        const params = funcMatch[1];
        const paramList = params.split(',').map(p => p.trim()).filter(Boolean);
        const isAsync = sourceCode.includes(`async function ${funcName}`);
        let test = `  it('should handle basic case', ${isAsync ? 'async ' : ''}() => {
    const params = ${this.generateMockParams(paramList)};
`;
        if (isAsync) {
            test += `    const result = await ${funcName}(${this.generateParamNames(paramList)});
    expect(result).toBeDefined();`;
        }
        else {
            test += `    const result = ${funcName}(${this.generateParamNames(paramList)});
    expect(result).toBeDefined();`;
        }
        test += '\n  });\n\n';
        return test;
    }
    generateMockParams(params) {
        if (!params.length)
            return '{}';
        const mocks = params.map(param => {
            const name = param.split(':')[0].trim();
            return `      ${name}: vi.fn()`;
        });
        return `{
${mocks.join(',\n')}
    }`;
    }
    generateParamNames(params) {
        return params
            .map(p => p.split(':')[0].trim())
            .map(name => `params.${name}`)
            .join(', ');
    }
}
