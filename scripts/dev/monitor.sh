#!/bin/bash

# Preset Monitoring Script
# Continuous monitoring of git status, build health, and deployment status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"
}

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to check git status
check_git_status() {
    print_header "GIT STATUS MONITORING"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        return 1
    fi
    
    # Current branch
    current_branch=$(git branch --show-current)
    print_status "Current branch: $current_branch"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "Uncommitted changes detected:"
        git status --porcelain
    else
        print_success "Working directory is clean"
    fi
    
    # Check if branch is up to date with remote
    git fetch --quiet
    local_commit=$(git rev-parse HEAD)
    remote_commit=$(git rev-parse origin/$current_branch 2>/dev/null || echo "no-remote")
    
    if [ "$remote_commit" != "no-remote" ] && [ "$local_commit" != "$remote_commit" ]; then
        print_warning "Local branch is not up to date with remote"
        print_status "Local:  $local_commit"
        print_status "Remote: $remote_commit"
    else
        print_success "Branch is up to date with remote"
    fi
    
    # Recent commits
    print_status "Recent commits:"
    git log --oneline -5 --graph --decorate
}

# Function to check build health
check_build_health() {
    print_header "BUILD HEALTH MONITORING"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found - dependencies may need installation"
    else
        print_success "Dependencies are installed"
    fi
    
    # Check if .next build directory exists
    if [ ! -d "apps/web/.next" ]; then
        print_warning "Build directory not found - project may need building"
    else
        print_success "Build directory exists"
    fi
    
    # Check package.json scripts
    print_status "Available npm scripts:"
    npm run --silent 2>/dev/null | grep -E "^\s+" | head -10 || print_warning "Could not read npm scripts"
    
    # Check for TypeScript errors
    print_status "Checking TypeScript compilation..."
    if npm run check-types > /dev/null 2>&1; then
        print_success "TypeScript compilation successful"
    else
        print_warning "TypeScript compilation has issues"
    fi
}

# Function to check deployment status
check_deployment_status() {
    print_header "DEPLOYMENT STATUS MONITORING"
    
    # Check if vercel CLI is available
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Install with: npm i -g vercel"
        return 1
    fi
    
    # Check recent deployments
    print_status "Recent deployments:"
    vercel ls 2>/dev/null | head -10 || print_warning "Could not fetch deployment status"
    
    # Check project status
    print_status "Project information:"
    vercel project ls 2>/dev/null || print_warning "Could not fetch project information"
}

# Function to check system resources
check_system_resources() {
    print_header "SYSTEM RESOURCES MONITORING"
    
    # Check disk space
    print_status "Disk usage:"
    df -h . | tail -1 | awk '{print "Used: " $3 " / " $2 " (" $5 ")"}'
    
    # Check memory usage
    print_status "Memory usage:"
    if command -v free &> /dev/null; then
        free -h | grep Mem | awk '{print "Used: " $3 " / " $2}'
    elif command -v vm_stat &> /dev/null; then
        # macOS memory check
        vm_stat | grep -E "(Pages free|Pages active|Pages inactive|Pages speculative|Pages wired down)" | head -5
    fi
    
    # Check CPU load
    print_status "CPU load:"
    if command -v uptime &> /dev/null; then
        uptime | awk -F'load average:' '{print "Load: " $2}'
    fi
}

# Function to run continuous monitoring
continuous_monitor() {
    local interval=${1:-30}  # Default 30 seconds
    
    print_header "CONTINUOUS MONITORING STARTED"
    print_status "Monitoring every $interval seconds. Press Ctrl+C to stop."
    
    while true; do
        clear
        echo -e "${CYAN}Preset Project Monitor - $(date)${NC}"
        echo ""
        
        check_git_status
        echo ""
        check_build_health
        echo ""
        check_deployment_status
        echo ""
        check_system_resources
        
        echo ""
        print_status "Next check in $interval seconds..."
        sleep $interval
    done
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --git           Check git status only"
    echo "  --build         Check build health only"
    echo "  --deploy        Check deployment status only"
    echo "  --system        Check system resources only"
    echo "  --all           Run all checks"
    echo "  --continuous    Run continuous monitoring (default: 30s interval)"
    echo "  --interval N    Set monitoring interval in seconds (default: 30)"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --all                    # Run all checks once"
    echo "  $0 --continuous             # Monitor continuously"
    echo "  $0 --continuous --interval 60  # Monitor every 60 seconds"
    echo "  $0 --git                   # Check git status only"
}

# Main script logic
main() {
    # If no arguments provided, run all checks
    if [ $# -eq 0 ]; then
        check_git_status
        echo ""
        check_build_health
        echo ""
        check_deployment_status
        echo ""
        check_system_resources
        exit 0
    fi
    
    local continuous=false
    local interval=30
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --git)
                check_git_status
                shift
                ;;
            --build)
                check_build_health
                shift
                ;;
            --deploy)
                check_deployment_status
                shift
                ;;
            --system)
                check_system_resources
                shift
                ;;
            --all)
                check_git_status
                echo ""
                check_build_health
                echo ""
                check_deployment_status
                echo ""
                check_system_resources
                shift
                ;;
            --continuous)
                continuous=true
                shift
                ;;
            --interval)
                interval="$2"
                shift 2
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
    
    # Run continuous monitoring if requested
    if [ "$continuous" = true ]; then
        continuous_monitor "$interval"
    fi
}

# Run main function with all arguments
main "$@"
