#!/bin/bash

# Preset Build, Clean, Monitor, and Deploy Script
# This script provides comprehensive build, clean, monitoring, and deployment capabilities

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean          Clean build artifacts and dependencies"
    echo "  --install        Install/update dependencies"
    echo "  --build          Build the project"
    echo "  --test           Run tests"
    echo "  --lint           Run linting"
    echo "  --deploy         Deploy to Vercel"
    echo "  --monitor        Monitor git status and recent commits"
    echo "  --status         Show deployment status"
    echo "  --all            Run clean, install, build, and deploy"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --all                    # Full build and deploy"
    echo "  $0 --clean --build          # Clean and build only"
    echo "  $0 --deploy                 # Deploy only"
    echo "  $0 --monitor                # Monitor git status"
}

# Function to clean build artifacts
clean_build() {
    print_status "Cleaning build artifacts and dependencies..."
    
    # Remove node_modules and build artifacts
    rm -rf node_modules apps/web/node_modules packages/*/node_modules
    rm -rf .next apps/web/.next dist apps/web/dist
    rm -rf .turbo
    
    # Clean npm cache
    npm cache clean --force
    
    print_success "Build artifacts cleaned successfully"
}

# Function to install dependencies
install_deps() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Function to build the project
build_project() {
    print_status "Building project with Turbo..."
    npm run build
    print_success "Project built successfully"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    npm run test
    print_success "Tests completed successfully"
}

# Function to run linting
run_lint() {
    print_status "Running linting..."
    npm run lint
    print_success "Linting completed successfully"
}

# Function to deploy to Vercel
deploy_project() {
    print_status "Deploying to Vercel..."
    
    # Check if vercel CLI is available
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Please install it first: npm i -g vercel"
        exit 1
    fi
    
    # Deploy to production
    vercel --prod
    
    print_success "Deployment initiated successfully"
}

# Function to monitor git status
monitor_git() {
    print_status "Monitoring git status..."
    
    echo ""
    echo "=== Git Status ==="
    git status
    
    echo ""
    echo "=== Recent Commits ==="
    git log --oneline -10
    
    echo ""
    echo "=== Branch Information ==="
    git branch -v
    
    echo ""
    echo "=== Remote Status ==="
    git remote -v
    
    print_success "Git monitoring completed"
}

# Function to show deployment status
show_deployment_status() {
    print_status "Checking deployment status..."
    
    if command -v vercel &> /dev/null; then
        echo ""
        echo "=== Recent Deployments ==="
        vercel ls
        
        echo ""
        echo "=== Project Information ==="
        vercel project ls
    else
        print_warning "Vercel CLI not found. Install it with: npm i -g vercel"
    fi
    
    print_success "Deployment status checked"
}

# Function to run all steps
run_all() {
    print_status "Running full build and deploy pipeline..."
    
    clean_build
    install_deps
    build_project
    run_lint
    deploy_project
    
    print_success "Full pipeline completed successfully"
}

# Main script logic
main() {
    # If no arguments provided, show usage
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                clean_build
                shift
                ;;
            --install)
                install_deps
                shift
                ;;
            --build)
                build_project
                shift
                ;;
            --test)
                run_tests
                shift
                ;;
            --lint)
                run_lint
                shift
                ;;
            --deploy)
                deploy_project
                shift
                ;;
            --monitor)
                monitor_git
                shift
                ;;
            --status)
                show_deployment_status
                shift
                ;;
            --all)
                run_all
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Run main function with all arguments
main "$@"
