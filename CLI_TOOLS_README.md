# Preset CLI Tools

This document describes the command-line tools available for building, cleaning, monitoring, and deploying the Preset project.

## Available Scripts

### 1. Build & Deploy Script (`build-deploy.sh`)

A comprehensive script for building, cleaning, and deploying the Preset project.

#### Usage
```bash
./build-deploy.sh [OPTIONS]
```

#### Options
- `--clean` - Clean build artifacts and dependencies
- `--install` - Install/update dependencies
- `--build` - Build the project using Turbo
- `--test` - Run tests
- `--lint` - Run linting
- `--deploy` - Deploy to Vercel
- `--monitor` - Monitor git status and recent commits
- `--status` - Show deployment status
- `--all` - Run clean, install, build, and deploy
- `--help` - Show help message

#### Examples
```bash
# Full build and deploy pipeline
./build-deploy.sh --all

# Clean and build only
./build-deploy.sh --clean --build

# Deploy only
./build-deploy.sh --deploy

# Monitor git status
./build-deploy.sh --monitor

# Check deployment status
./build-deploy.sh --status
```

### 2. Monitoring Script (`monitor.sh`)

A comprehensive monitoring script for continuous project health monitoring.

#### Usage
```bash
./monitor.sh [OPTIONS]
```

#### Options
- `--git` - Check git status only
- `--build` - Check build health only
- `--deploy` - Check deployment status only
- `--system` - Check system resources only
- `--all` - Run all checks
- `--continuous` - Run continuous monitoring (default: 30s interval)
- `--interval N` - Set monitoring interval in seconds (default: 30)
- `--help` - Show help message

#### Examples
```bash
# Run all checks once
./monitor.sh --all

# Monitor continuously every 30 seconds
./monitor.sh --continuous

# Monitor continuously every 60 seconds
./monitor.sh --continuous --interval 60

# Check git status only
./monitor.sh --git

# Check build health only
./monitor.sh --build
```

## Project Structure

The Preset project uses:
- **Turbo** for monorepo management
- **Next.js** for the web application
- **Vercel** for deployment
- **TypeScript** for type safety
- **ESLint** for code quality

## Build Process

1. **Clean**: Remove all build artifacts and dependencies
2. **Install**: Install/update all dependencies
3. **Build**: Build the project using Turbo
4. **Lint**: Run ESLint checks
5. **Test**: Run test suite
6. **Deploy**: Deploy to Vercel

## Environment Requirements

- Node.js >= 18
- npm >= 10.5.0
- Vercel CLI (for deployment)
- Git (for version control)

## Environment Variables

The project requires several environment variables for proper operation:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NANOBANANA_API_KEY`
- `PEXELS_API_KEY`
- `OPENAI_API_KEY`

## Deployment

The project is configured to deploy to Vercel with the following settings:
- Build command: `cd apps/web && npm run build`
- Output directory: `apps/web/.next`
- Install command: `cd apps/web && npm install`
- Framework: Next.js

## Monitoring Features

The monitoring script provides:
- Git status and commit history
- Build health checks
- Deployment status
- System resource monitoring
- Continuous monitoring capabilities

## Troubleshooting

### Common Issues

1. **Build Failures**: Run `./build-deploy.sh --clean --build` to clean and rebuild
2. **Deployment Issues**: Check environment variables and Vercel CLI installation
3. **Dependency Issues**: Run `./build-deploy.sh --clean --install`
4. **TypeScript Errors**: Run `npm run check-types` to identify issues

### Getting Help

- Run `./build-deploy.sh --help` for build script help
- Run `./monitor.sh --help` for monitoring script help
- Check the project's main README.md for additional documentation

## Quick Start

1. **Initial Setup**:
   ```bash
   ./build-deploy.sh --clean --install
   ```

2. **Development**:
   ```bash
   npm run dev
   ```

3. **Build and Deploy**:
   ```bash
   ./build-deploy.sh --all
   ```

4. **Monitor Project**:
   ```bash
   ./monitor.sh --continuous
   ```

## Best Practices

1. Always run `--clean` before major builds
2. Use `--monitor` to check git status before deploying
3. Run `--status` to check deployment health
4. Use continuous monitoring during development
5. Keep environment variables up to date
6. Regularly update dependencies with `--install`
