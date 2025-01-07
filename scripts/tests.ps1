# Generate-CodyTests.ps1

param (
    [Parameter(Mandatory=$false)]
    [string]$SourceDirectory = "src/app/api",
    
    [Parameter(Mandatory=$false)]
    [string]$FilePattern = "*.ts",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDirectory = "tests/app/api",
    
    [Parameter(Mandatory=$false)]
    [int]$BatchSize = 50,  # Number of files to process in one batch
    
    [Parameter(Mandatory=$false)]
    [switch]$UseRepoContext
)

# Verify ANTHROPIC_API_KEY exists
if (-not $env:ANTHROPIC_API_KEY) {
    Write-Error "ANTHROPIC_API_KEY environment variable is not set"
    exit 1
}

# Enhanced test generation prompt
$basePrompt = @"
Generate a comprehensive test suite for this file using jest. 

Follow these exact patterns:
1. Use these import paths:
- @app/* for src/app/*
- @prisma for database client
- Use jest-mock-extended for complex mocks

2. Test structure:
- Mock setup in beforeEach
- Mock cleanup in afterEach
- Group tests by method using describe
- Use clear it() descriptions
- Test both success and error cases
- Include type assertions where appropriate

3. Mocking patterns:
- Use DeepMockProxy for complex objects like PrismaClient
- Use mockReset in afterEach
- Use proper type assertions with 'as' when needed
- Mock at the appropriate scope (beforeEach or test level)

4. Assertions:
- Use expect.objectContaining for partial object matches
- Use expect.any(Type) for dynamic values
- Include error case assertions
- Check for proper mock calls

Here's the source code to test:

{0}

Generate a test suite following these patterns exactly.
"@

# Function to create a batch request for Anthropic API
function Create-BatchRequest {
    param (
        [string[]]$FilePaths,
        [string]$BasePrompt
    )
    
    $script:pathMapping = @{}  # Store mapping in script scope
    $requests = @()
    foreach ($file in $FilePaths) {
        try {
            # Handle paths with square brackets by using -LiteralPath
            $fileContent = Get-Content -LiteralPath $file -Raw -ErrorAction Stop
            $prompt = $BasePrompt -f $fileContent
            
            # Create a safe custom_id by replacing invalid characters and limiting length
            $customId = $file.Replace("\", "_").Replace("/", "_").Replace("[", "_").Replace("]", "_").Replace(".", "_")
            $customId = $customId -replace "[^a-zA-Z0-9_-]", "_"
            if ($customId.Length -gt 64) {
                $customId = $customId.Substring(0, 64)
            }
            
            # Store mapping between custom_id and original path
            $script:pathMapping[$customId] = $file
            
            $request = @{
                custom_id = $customId
                params = @{
                    model = "claude-3-5-sonnet-20240620"
                    max_tokens = 4000
                    messages = @(
                        @{
                            role = "user"
                            content = $prompt
                        }
                    )
                }
            }
            $requests += $request
        }
        catch {
            Write-Warning "Failed to read file: $file - $_"
            continue
        }
    }
    
    return $requests
}

# Function to submit batch to Anthropic API
function Submit-Batch {
    param (
        [array]$Requests
    )
    
    $headers = @{
        "x-api-key" = $env:ANTHROPIC_API_KEY
        "content-type" = "application/json"
        "anthropic-version" = "2023-06-01"
    }
    
    $body = @{
        requests = $Requests
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages/batches" `
        -Method Post `
        -Headers $headers `
        -Body $body
        
    return $response.id
}

# Function to check batch status
function Get-BatchStatus {
    param (
        [string]$BatchId
    )
    
    $headers = @{
        "x-api-key" = $env:ANTHROPIC_API_KEY
        "anthropic-version" = "2023-06-01"
    }
    
    $response = Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages/batches/$BatchId" `
        -Method Get `
        -Headers $headers
        
    return $response
}

# Function to get batch results
function Get-BatchResults {
    param (
        [string]$ResultsUrl
    )
    
    $headers = @{
        "x-api-key" = $env:ANTHROPIC_API_KEY
        "anthropic-version" = "2023-06-01"
    }
    
    $response = Invoke-RestMethod -Uri $ResultsUrl `
        -Method Get `
        -Headers $headers
        
    return $response
}

# Function to write test file
function Write-TestFile {
    param (
        [string]$SourcePath,
        [string]$TestContent,
        [string]$OutputDirectory
    )
    
    try {
        # Get the relative path from the source directory to maintain structure
        $sourceDirPath = (Get-Item -LiteralPath $SourceDirectory).FullName
        $relativeFilePath = $SourcePath.Substring($sourceDirPath.Length).TrimStart('\', '/')
        $testFilePath = Join-Path $OutputDirectory $relativeFilePath
        $testFilePath = [System.IO.Path]::ChangeExtension($testFilePath, ".test.ts")
        
        # Ensure the parent directory exists
        $testFileDir = Split-Path $testFilePath -Parent
        if (-not (Test-Path -LiteralPath $testFileDir)) {
            New-Item -ItemType Directory -Path $testFileDir -Force | Out-Null
        }
        
        # Extract TypeScript code from the response
        if ($TestContent -match '```typescript\s*([\s\S]*?)\s*```') {
            $testCode = $matches[1].Trim()
            [System.IO.File]::WriteAllText($testFilePath, $testCode, [System.Text.Encoding]::UTF8)
            Write-Host "Successfully wrote test to: $testFilePath" -ForegroundColor Green
            return $true
        }
        
        Write-Warning "Could not extract TypeScript code for: $SourcePath"
        return $false
    }
    catch {
        Write-Error "Error writing test file for $SourcePath`: $_"
        return $false
    }
}

# Main execution flow
Write-Host "Starting test generation using Anthropic API..." -ForegroundColor Cyan

# Get all source files
$sourceFiles = Get-ChildItem -Path $SourceDirectory -Filter $FilePattern -Recurse -Force
$totalFiles = $sourceFiles.Count
$processedFiles = 0
$successCount = 0
$failureCount = 0

# Process files in batches
for ($i = 0; $i -lt $sourceFiles.Count; $i += $BatchSize) {
    $batchFiles = $sourceFiles[$i..([Math]::Min($i + $BatchSize - 1, $sourceFiles.Count - 1))]
    Write-Host "`nProcessing batch $([Math]::Floor($i/$BatchSize) + 1) of $([Math]::Ceiling($sourceFiles.Count/$BatchSize))..." -ForegroundColor Cyan
    
    # Create and submit batch
    $requests = Create-BatchRequest -FilePaths $batchFiles.FullName -BasePrompt $basePrompt
    if ($requests.Count -eq 0) {
        Write-Warning "No valid requests in this batch, skipping..."
        continue
    }
    
    $batchId = Submit-Batch -Requests $requests
    Write-Host "Batch submitted with ID: $batchId" -ForegroundColor Cyan
    
    # Wait for batch completion with timeout
    $startTime = Get-Date
    $timeout = New-TimeSpan -Hours 4  # Maximum wait time of 4 hours
    $lastStatus = $null
    $statusCheckCount = 0
    
    do {
        Start-Sleep -Seconds 10
        $status = Get-BatchStatus -BatchId $batchId
        $currentTime = Get-Date
        $elapsedTime = $currentTime - $startTime
        
        # Only show status if it changed or every 30 seconds
        $statusChanged = ($lastStatus.processing_status -ne $status.processing_status) -or 
                        ($lastStatus.request_counts.processing -ne $status.request_counts.processing) -or
                        ($lastStatus.request_counts.succeeded -ne $status.request_counts.succeeded) -or
                        ($lastStatus.request_counts.errored -ne $status.request_counts.errored)
        
        if ($statusChanged -or ($statusCheckCount % 3 -eq 0)) {
            Write-Host "Batch $batchId status after $($elapsedTime.ToString('hh\:mm\:ss')):" -ForegroundColor Yellow
            Write-Host "  Status: $($status.processing_status)" -ForegroundColor Yellow
            Write-Host "  Processing: $($status.request_counts.processing)" -ForegroundColor Yellow
            Write-Host "  Succeeded: $($status.request_counts.succeeded)" -ForegroundColor Yellow
            Write-Host "  Errored: $($status.request_counts.errored)" -ForegroundColor Yellow
            Write-Host "  Expired: $($status.request_counts.expired)" -ForegroundColor Yellow
            
            if ($status.results_url) {
                Write-Host "  Results URL available" -ForegroundColor Green
            }
        }
        
        $lastStatus = $status
        $statusCheckCount++
        
        # Check for timeout
        if ($elapsedTime -gt $timeout) {
            Write-Warning "Batch processing timeout after $($timeout.TotalHours) hours"
            break
        }
        
    } while ($status.processing_status -eq "in_progress")
    
    # Process results
    if ($status.results_url) {
        $results = Get-BatchResults -ResultsUrl $status.results_url
        
        foreach ($result in $results) {
            # Get original file path from mapping
            $sourcePath = $script:pathMapping[$result.custom_id]
            if ($result.result.type -eq "succeeded") {
                $success = Write-TestFile -SourcePath $sourcePath -TestContent $result.result.message.content[0].text -OutputDirectory $OutputDirectory
                if ($success) { $successCount++ } else { $failureCount++ }
            } else {
                Write-Warning "Failed to generate test for: $sourcePath - $($result.result.error.message)"
                $failureCount++
            }
            $processedFiles++
        }
    }
    
    Write-Host "Progress: $processedFiles/$totalFiles files processed" -ForegroundColor Cyan
}

# Report final results
Write-Host "`nTest generation complete!" -ForegroundColor Green
Write-Host "Successfully generated: $successCount tests" -ForegroundColor Green
if ($failureCount -gt 0) {
    Write-Host "Failed to generate: $failureCount tests" -ForegroundColor Red
}