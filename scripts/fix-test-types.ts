import { Project, Node, SourceFile, SyntaxKind } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

// Only include test files
const testFiles = project.getSourceFiles().filter(file => {
  const filePath = file.getFilePath();
  return (
    filePath.includes('/tests/') ||
    filePath.includes('/__tests__/') ||
    filePath.includes('/__mocks__/') ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.spec.ts')
  );
});

function addMissingTestTypes(sourceFile: SourceFile) {
  // Add common Jest imports if missing
  if (!sourceFile.getImportDeclaration(imp => imp.getModuleSpecifierValue() === '@jest/globals')) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@jest/globals',
      namedImports: ['jest', 'describe', 'it', 'expect', 'beforeEach', 'afterEach'],
    });
  }

  // Collect all jest.fn() calls first
  const jestFnCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => call.getText().includes('jest.fn()'))
    .map(call => ({
      node: call,
      parent: call.getParent(),
      text: call.getText()
    }));

  // Then process them safely
  jestFnCalls.forEach(({ node, parent, text }) => {
    if (parent && !parent.getType().getText().includes('Mock')) {
      try {
        node.replaceWithText(`jest.fn() as jest.Mock`);
      } catch (e) {
        console.log(`Warning: Could not process node in ${sourceFile.getFilePath()}`);
      }
    }
  });

  // Add type annotations to test data
  sourceFile.getVariableDeclarations().forEach(declaration => {
    try {
      const initializer = declaration.getInitializer();
      if (initializer && !declaration.getTypeNode()) {
        const type = initializer.getType();
        if (type.isObject()) {
          declaration.setType(type.getText());
        }
      }
    } catch (e) {
      console.log(`Warning: Could not process declaration in ${sourceFile.getFilePath()}`);
    }
  });
}

function fixMockImplementations(sourceFile: SourceFile) {
  // Collect all mockImplementation calls first
  const mockCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => call.getText().includes('mockImplementation'))
    .map(call => ({
      node: call,
      parent: call.getParent(),
      text: call.getText()
    }));

  // Then process them safely
  mockCalls.forEach(({ node, parent, text }) => {
    if (parent) {
      try {
        const type = parent.getType();
        if (type.getCallSignatures().length > 0) {
          const returnType = type.getCallSignatures()[0].getReturnType();
          if (returnType.getText() === 'void' || returnType.getText() === 'any') {
            node.replaceWithText(`mockImplementation(async () => {})`);
          }
        }
      } catch (e) {
        console.log(`Warning: Could not process mock in ${sourceFile.getFilePath()}`);
      }
    }
  });
}

function addTestUtilityTypes(sourceFile: SourceFile) {
  // Add common test utility types if they're used but not defined
  const fileContent = sourceFile.getText();
  if (fileContent.includes('MockedFunction') && !fileContent.includes('type MockedFunction')) {
    try {
      sourceFile.addTypeAlias({
        name: 'MockedFunction',
        type: '<T extends (...args: any[]) => any> = jest.Mock<ReturnType<T>, Parameters<T>>',
        isExported: true,
      });
    } catch (e) {
      console.log(`Warning: Could not add utility types in ${sourceFile.getFilePath()}`);
    }
  }
}

// Process each test file
console.log('Starting to process test files...');
testFiles.forEach(sourceFile => {
  const filePath = sourceFile.getFilePath();
  console.log(`Processing ${filePath}`);
  
  try {
    addMissingTestTypes(sourceFile);
    fixMockImplementations(sourceFile);
    addTestUtilityTypes(sourceFile);
    
    // Save changes
    sourceFile.saveSync();
    console.log(`Successfully processed ${filePath}`);
  } catch (e) {
    console.error(`Error processing ${filePath}:`, e);
  }
});

// Save all changes
try {
  project.saveSync();
  console.log('Successfully saved all changes');
} catch (e) {
  console.error('Error saving project changes:', e);
}

console.log('Finished processing test files');
