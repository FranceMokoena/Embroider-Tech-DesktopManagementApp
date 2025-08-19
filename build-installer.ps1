# EmbroideryTech Installer Builder - PowerShell Script
# This script creates a professional Windows installer for the EmbroideryTech Management System

param(
    [switch]$Clean,
    [switch]$SkipDeps,
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check Node.js version
function Test-NodeVersion {
    try {
        $nodeVersion = node --version
        $version = $nodeVersion.TrimStart('v')
        $majorVersion = [int]($version.Split('.')[0])
        
        if ($majorVersion -lt 14) {
            Write-ColorOutput "WARNING: Node.js version $version detected. Version 14 or higher is recommended." "Yellow"
            return $false
        }
        return $true
    }
    catch {
        Write-ColorOutput "ERROR: Node.js is not installed or not accessible" "Red"
        return $false
    }
}

# Main execution
try {
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "    EmbroideryTech Installer Builder" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    Write-Host ""

    # Check prerequisites
    Write-ColorOutput "Checking prerequisites..." "Yellow"
    
    if (-not (Test-Command "node")) {
        throw "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    }
    
    if (-not (Test-Command "npm")) {
        throw "npm is not installed or not accessible"
    }
    
    if (-not (Test-NodeVersion)) {
        Write-ColorOutput "Continuing with current Node.js version..." "Yellow"
    }

    # Clean previous builds if requested
    if ($Clean) {
        Write-ColorOutput "Cleaning previous builds..." "Yellow"
        if (Test-Path "dist") {
            Remove-Item "dist" -Recurse -Force
        }
        if (Test-Path "build") {
            Remove-Item "build" -Recurse -Force
        }
    }

    # Install dependencies
    if (-not $SkipDeps) {
        Write-ColorOutput "Installing dependencies..." "Yellow"
        
        # Check if electron-builder is installed
        $electronBuilderInstalled = npm list electron-builder 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Installing electron-builder..." "Yellow"
            npm install --save-dev electron-builder
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to install electron-builder"
            }
        }
        
        # Install main dependencies
        Write-ColorOutput "Installing main dependencies..." "Yellow"
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install main dependencies"
        }
        
        # Install backend dependencies
        Write-ColorOutput "Installing backend dependencies..." "Yellow"
        Push-Location "desktop-backend"
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install backend dependencies"
        }
        Pop-Location
    }

    # Build React application
    Write-ColorOutput "Building React application..." "Yellow"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build React application"
    }

    # Create installer
    Write-ColorOutput "Creating Windows installer..." "Yellow"
    npm run create-installer
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create installer"
    }

    # Check if installer was created
    $installerFiles = Get-ChildItem "dist" -Filter "*.exe" -ErrorAction SilentlyContinue
    if ($installerFiles) {
        Write-Host ""
        Write-ColorOutput "========================================" "Green"
        Write-ColorOutput "    SUCCESS: Installer Created!" "Green"
        Write-ColorOutput "========================================" "Green"
        Write-Host ""
        Write-ColorOutput "Installer location: dist\" "White"
        Write-Host ""
        
        foreach ($file in $installerFiles) {
            Write-ColorOutput "  - $($file.Name)" "White"
        }
        
        Write-Host ""
        Write-ColorOutput "The installer is ready for distribution!" "Green"
        Write-Host ""
        
        # Open dist folder
        Write-ColorOutput "Opening dist folder..." "Yellow"
        Start-Process "dist"
        
    } else {
        throw "Installer file not found. Check the dist\ directory for any generated files."
    }

    Write-Host ""
    Write-ColorOutput "Build completed successfully!" "Green"
    
} catch {
    Write-Host ""
    Write-ColorOutput "========================================" "Red"
    Write-ColorOutput "    ERROR: Build Failed" "Red"
    Write-ColorOutput "========================================" "Red"
    Write-Host ""
    Write-ColorOutput $_.Exception.Message "Red"
    Write-Host ""
    Write-ColorOutput "Please check the error message above and try again." "Yellow"
    exit 1
}

# Keep console open if running interactively
if ($Host.Name -eq "ConsoleHost") {
    Write-Host ""
    Write-ColorOutput "Press any key to continue..." "Gray"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
