#!/bin/bash

# Verify cody CLI is installed
if ! command -v cody &> /dev/null; then
    echo "Error: cody CLI is not installed. Install it with: npm install -g @sourcegraph/cody"
    exit 1
fi

# Files array with format: "filepath|total_lines|coverage_percent|uncovered_lines|branches"
FILES=(
    "src/lib/nous/engine/service.ts|429|9.55|384|53"
    "src/lib/cortex/elasticsearch/services.ts|343|20.11|257|110"
    "src/lib/nous/engine/real-time-learner.ts|113|13.27|98|30"
    "src/lib/nous/learn/pipeline.ts|70|58.57|25|15"
    "src/lib/cortex/core/client.ts|64|23.43|48|20"
    "src/lib/shared/database/client.ts|62|30.64|43|18"
    "src/lib/shared/engine/adaptation-engine.ts|48|8.33|44|15"
    "src/lib/shared/engine/learning-engine.ts|27|14.81|23|10"
    "src/lib/shared/engine/processors/strategy-processor.ts|33|15.15|28|12"
    "src/lib/shared/engine/processors/time-based-processor.ts|26|7.69|24|8"
    "src/lib/shared/engine/processors/performance-processor.ts|22|13.63|19|7"
)

process_file() {
    # Parse the pipe-delimited string
    IFS='|' read -r source_file total_lines coverage_percent uncovered_lines branches <<< "$1"
    
    local output_dir="tests/$(dirname "$source_file")"
    local test_file="${output_dir}/$(basename "$source_file" .ts).coverage.test.ts"
    
    # Create output directory
    mkdir -p "$output_dir"
    
    echo "----------------------------------------"
    echo "Processing: $source_file"
    echo "Total lines: $total_lines"
    echo "Current coverage: $coverage_percent%"
    echo "Uncovered lines: $uncovered_lines"
    echo "Number of branches: $branches"
    echo "Output to: $test_file"
    
    # Extract lib directory path from source file
    local lib_dir=$(dirname $(dirname $(dirname "$source_file")))
    
    # Build context files string
    local context_files=("$source_file")
    while IFS= read -r -d '' file; do
        if [[ "$file" != "$source_file" ]]; then
            context_files+=("$file")
        fi
    done < <(find "$lib_dir" -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" -print0)
    
    # Build the context-file arguments
    local context_args=""
    for file in "${context_files[@]}"; do
        context_args+="--context-file \"$file\" "
    done
    
    # Enhanced prompt with detailed coverage info and testing requirements
    eval "cody chat \
        $context_args \
        -m \"Generate a comprehensive jest test suite for $source_file.
Coverage details:
- Total lines: $total_lines
- Current coverage: $coverage_percent%
- Uncovered lines: $uncovered_lines
- Number of branches: $branches

Requirements:
1. Focus on testing the $uncovered_lines uncovered lines
2. Test all $branches branches thoroughly
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

Only output the test code, no explanations.\" \
        | sed -n '/\`\`\`typescript/,/\`\`\`/p' | sed '1d;\$d' > \"$test_file\""
        
    echo "✓ Test generation complete: $test_file"
    echo "----------------------------------------"
    
    # Add small delay to avoid rate limiting
    sleep 3
}

# Main execution
echo "Starting test generation for all components..."
echo "Total files to process: ${#FILES[@]}"
echo ""

for file_info in "${FILES[@]}"; do
    process_file "$file_info"
done

echo "All test files generated successfully!"
echo "Please review and run the tests to verify coverage improvements."

