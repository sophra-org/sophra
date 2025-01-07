# Generate-CodeDocs.ps1

param (
    [Parameter(Mandatory=$true)]
    [string]$SourceDirectory,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDirectory = "C:/Users/sophra-dev/Documents/sophra-docs/docs",
    
    [Parameter(Mandatory=$false)]
    [string[]]$FileTypes = @("*.ts", "*.tsx"),
    
    [Parameter(Mandatory=$false)]
    [string]$ReadmePath = "README.md",

    [Parameter(Mandatory=$false)]
    [string]$MintlifyPath = "C:\Users\sophra-dev\Documents\sophra-docs\mintlify-starter-temp",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

# Read core documentation
$readmeContent = if (Test-Path $ReadmePath) {
    Get-Content $ReadmePath -Raw
} else {
    "README.md not found"
}

$docStyle = @"
Documentation Requirements:

1. Structure:
   - Title (derived from filename)
   - Overview (2-3 paragraphs explaining purpose and role in Sophra)
   - Technical Details
   - Usage Examples
   - API Reference
   - Integration Guide
   - Related Components
   - System Impact

2. Required Elements:
   - Type definitions with full context
   - Function signatures with usage patterns
   - Return types and error states
   - Error handling strategies
   - Integration patterns
   - Performance considerations
   - Security implications
   - Data flow diagrams
   - Be precise in how you use markdown; do not use "n-backticks"
   - Do not repeat the title in the first header.
   - Do not be redundant in your documentation.
"@

function Get-RelativePath {
    param (
        [string]$FullPath,
        [string]$BasePath
    )
    return $FullPath.Substring($BasePath.Length).TrimStart('\', '/')
}

function Get-FileImports {
    param (
        [string]$FilePath
    )
    try {
        if (Test-Path -LiteralPath $FilePath) {
            $content = Get-Content -LiteralPath $FilePath -Raw
            $imports = [regex]::Matches($content, 'import.*?[\''"](@/[^\''"]+)[\''"]') | 
                ForEach-Object { $_.Groups[1].Value }
            return $imports
        }
        else {
            Write-Warning ('Could not access file: ' + $FilePath)
            return @()
        }
    }
    catch {
        Write-Warning "Error reading imports from $FilePath`: $_"
        return @()
    }
}

function Find-FileUsages {
    param (
        [string]$SearchPath,
        [string]$TargetFile
    )
    try {
        $escapedTarget = [regex]::Escape($TargetFile)
        $files = Get-ChildItem -Path $SearchPath -Include $FileTypes -Recurse
        $usages = @()
        
        foreach ($file in $files) {
            try {
                if (Test-Path -LiteralPath $file.FullName) {
                    $content = Get-Content -LiteralPath $file.FullName -Raw
                    if ($content -match $escapedTarget) {
                        $usages += $file.FullName
                    }
                }
            }
            catch {
                Write-Warning "Skipping file analysis for: $($file.FullName)"
            }
        }
        return $usages
    }
    catch {
        Write-Warning "Error in Find-FileUsages: $_"
        return @()
    }
}

function Generate-FileDoc {
    param (
        [string]$FilePath,
        [string]$OutputDir,
        [string]$BaseSourceDir
    )
    
    $relativePath = Get-RelativePath -FullPath $FilePath -BasePath $BaseSourceDir
    $outputPath = Join-Path $OutputDir ($relativePath -replace '\.(ts|tsx)$', '.md')
    $outputDir = Split-Path $outputPath -Parent
    
    # Check if documentation already exists
    if ((Test-Path -LiteralPath $outputPath) -and -not $Force) {
        Write-Host ('Documentation exists for: ' + $relativePath + ' - Skipping') -ForegroundColor Yellow
        return
    }

    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)
    $fileType = [System.IO.Path]::GetExtension($FilePath)
    
    # Get imports and usages
    $imports = Get-FileImports -FilePath $FilePath
    $usages = Find-FileUsages -SearchPath $BaseSourceDir -TargetFile $relativePath
    
    $contextPrompt = @"
First, analyze the codebase context:
1. Review all imports and exports in $relativePath
2. Identify all files that import this component
3. Map out the dependency chain
4. Locate associated test files
5. Find configuration files that affect this component

Core Context:
$readmeContent

Current File: $relativePath
File Type: $fileType

File Dependencies:
$(($imports | ForEach-Object { "- $_" }) -join "`n")

Used By:
$(($usages | ForEach-Object { "- $_" }) -join "`n")

Requirements:
1. Opening Overview (minimum 400 words, 4-5 paragraphs):
   - Begin with a technical, detailed explanation of the component's role
   - Explain its integration with Sophra's core systems 
   - Discuss key architectural decisions and implications
   - Detail performance characteristics and optimization strategies
   - Describe unique features and technical capabilities
   - Use technical, precise language while maintaining clarity

2. Required Sections (each should be detailed and specific):
   - Exported Components
     * Full TypeScript interfaces with field explanations
     * Detailed method signatures and return types
     * Configuration options and defaults
   
   - Implementation Examples
     * Real-world usage patterns from the codebase
     * Integration examples with other Sophra components
     * Configuration examples for different environments
   
   - Sophra Integration Details
     * Specific interaction patterns with other services
     * Data flow and state management
     * Event handling and propagation
   
   - Error Handling
     * Comprehensive error scenarios
     * Recovery strategies
     * Logging and monitoring integration
   
   - Data Flow
     * Detailed mermaid sequence diagrams
     * State transitions
     * Async operation patterns
   
   - Performance Considerations
     * Optimization strategies
     * Caching mechanisms
     * Resource utilization patterns
   
   - Security Implementation
     * Authentication integration
     * Authorization checks
     * Data protection measures
   
   - Configuration
     * Environment variables
     * Runtime options
     * Integration settings

3. Required Mintlify Components:
   - Use <Card>, <CodeGroup>, <Note>, <AccordionGroup> extensively
   - Include actual code examples
   - Create comprehensive diagrams
   - Document all integration points
   - Include specific metrics

Output Format:
---
title: [Descriptive Component Title]
description: [One-line technical description]
---

[Comprehensive opening overview]

## Exported Components
[Detailed exports section]

## Implementation Examples
[Multiple detailed examples]

[Additional sections...]

Important:
- Be technically precise and detailed
- Use actual code from the context
- Create comprehensive diagrams
- Document all integration points
- Include specific metrics
- Remove any BOS markers
- Don't repeat the title
- Be creative with component usage
- Add depth to the template structure
"@

    try {
        Write-Host ('Analyzing dependencies for: ' + $relativePath) -ForegroundColor Yellow
        Write-Host ('Found ' + $imports.Count + ' imports and ' + $usages.Count + ' usages') -ForegroundColor Cyan
        Write-Host 'Generating documentation with expanded context...' -ForegroundColor Cyan
        
        # Generate documentation using Cody with expanded context and multiple path patterns
        $codyResponse = (cody chat --context-file  $MintlifyPath --context-file $FilePath --context-file $ReadmePath --context-file 'src/*.ts' --context-file './src/*.ts' --context-file 'src/**/*.ts' --context-file './src/**/*.ts' -m $contextPrompt) | Out-String
        
        if ($codyResponse) {
            # Save the raw content exactly as received
            [System.IO.File]::WriteAllText($outputPath, $codyResponse, [System.Text.Encoding]::UTF8)
            Write-Host ('Successfully generated: ' + $outputPath) -ForegroundColor Green
            return $true
        }
        return $false
    }
    catch {
        Write-Error ('Error generating documentation for ' + $relativePath + ': ' + $_)
        return $false
    }
}

# Main execution
try {
    Write-Host 'Starting documentation generation with enhanced context...' -ForegroundColor Cyan
    Write-Host ('Source Directory: ' + $SourceDirectory) -ForegroundColor Cyan
    Write-Host ('Output Directory: ' + $OutputDirectory) -ForegroundColor Cyan
    
    # Create output directory
    if (-not (Test-Path $OutputDirectory)) {
        New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    }

    # Analyze existing documentation
    $existingDocs = Get-ChildItem -Path $OutputDirectory -Filter '*.md' -Recurse
    Write-Host ([Environment]::NewLine)
    Write-Host ('Found ' + $existingDocs.Count + ' existing documentation files') -ForegroundColor Cyan
    
    # Process each file type
    $totalNewDocs = 0
    $totalSkipped = 0
    foreach ($fileType in $FileTypes) {
        $files = Get-ChildItem -Path $SourceDirectory -Filter $fileType -Recurse
        $totalFiles = $files.Count
        $currentFile = 0
        
        foreach ($file in $files) {
            $currentFile++
            Write-Host ([Environment]::NewLine + 'Processing file ' + $currentFile + ' of ' + $totalFiles) -ForegroundColor Yellow
            
            if (Generate-FileDoc -FilePath $file.FullName -OutputDir $OutputDirectory -BaseSourceDir $SourceDirectory) {
                $totalNewDocs++
            } else {
                $totalSkipped++
            }
            
            # Add small delay to prevent rate limiting
            Start-Sleep -Milliseconds 500
        }
    }
    
    Write-Host ([Environment]::NewLine + 'Documentation generation complete!') -ForegroundColor Green
    Write-Host ('Location: ' + $OutputDirectory) -ForegroundColor Cyan
    Write-Host 'Summary:' -ForegroundColor Yellow
    Write-Host ('- Existing docs: ' + $existingDocs.Count) -ForegroundColor Yellow
    Write-Host ('- New docs generated: ' + $totalNewDocs) -ForegroundColor Green
    Write-Host ('- Files skipped: ' + $totalSkipped) -ForegroundColor Yellow
}
catch {
    Write-Error ('Error during documentation generation: ' + $_)
}