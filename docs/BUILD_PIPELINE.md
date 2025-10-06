# 🏗️ Staryer Build Pipeline Documentation

## Overview

The Staryer build pipeline provides a comprehensive, automated testing and deployment workflow using GitHub Actions, ensuring code quality and functionality across all platform features.

## Pipeline Architecture

### Workflow Structure

```
┌─────────────────┐
│   Setup Stage   │ ── Environment validation, dependency installation
└─────────────────┘
         │
┌─────────────────┐
│ Lint & Build    │ ── Code quality checks, application compilation
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐ ┌──▼──────┐
│ Unit    │ │ E2E     │ ── Parallel test execution
│ Tests   │ │ Tests   │
└───┬────┘ └──┬──────┘
    │         │
    └────┬────┘
         │
┌─────────▼───────┐
│  Test Report    │ ── Artifact collection, report generation
└─────────────────┘
         │
┌─────────▼───────┐
│    Cleanup      │ ── Resource cleanup, status reporting
└─────────────────┘
```

### Key Features

- **🚀 Push-Button Execution** - Manual dispatch with customizable options
- **📊 Comprehensive Reporting** - Detailed test results with visual artifacts
- **🔄 Parallel Testing** - Role-based test execution for efficiency
- **📸 Visual Documentation** - Automatic screenshot capture
- **🛡️ Quality Gates** - Build and lint validation before testing

## Trigger Mechanisms

### Automatic Triggers

1. **Push to Main/Develop**
   ```yaml
   on:
     push:
       branches: [ main, develop ]
   ```

2. **Pull Request to Main**
   ```yaml
   on:
     pull_request:
       branches: [ main ]
   ```

### Manual Trigger (Push-Button)

Navigate to GitHub Actions → "Staryer - Build & Test Pipeline" → "Run workflow"

**Configuration Options:**

| Option | Values | Description |
|--------|--------|-------------|
| Test Suite | `all`, `unit`, `e2e`, `platform-owner`, `creator`, `end-user` | Which tests to run |
| Environment | `development`, `staging`, `production` | Target environment |

## Pipeline Stages

### 1. Setup & Validation

**Purpose:** Environment preparation and dependency management

**Actions:**
- Node.js environment setup
- Dependency installation with npm ci
- Test configuration validation
- Environment variable checks

**Outputs:**
- Test suite configuration
- Dependency cache

### 2. Lint & Build

**Purpose:** Code quality validation and application compilation

**Actions:**
- ESLint code quality checks
- Next.js application build
- Build artifact generation

**Quality Gates:**
- Linting must pass (warnings allowed)
- Build must complete successfully

**Artifacts:**
- `.next/` build directory
- Build logs and metrics

### 3. Unit Tests

**Purpose:** Component and utility function validation

**Configuration:**
- Jest test runner
- jsdom environment
- Coverage reporting

**Coverage Requirements:**
- Minimum coverage thresholds
- Coverage reports in HTML/JSON formats

**Artifacts:**
- Test results (JUnit XML)
- Coverage reports
- Test execution logs

### 4. E2E Tests (Parallel Matrix)

**Purpose:** End-to-end functionality validation across user roles

**Matrix Strategy:**
```yaml
strategy:
  fail-fast: false
  matrix:
    test-group: [auth, platform-owner, creator, end-user]
```

**Test Groups:**

#### Authentication Tests (`auth`)
- User registration and login
- Password reset flows
- Session management
- Role-based access control

#### Platform Owner Tests (`platform-owner`)
- Dashboard functionality
- Revenue analytics
- Creator management
- Platform configuration

#### Creator Tests (`creator`)
- Onboarding flow (7 steps)
- Product management
- Stripe Connect integration
- Branding and customization

#### End User Tests (`end-user`)
- Subscription flows
- Payment processing
- Usage tracking
- Plan management

**Screenshot Strategy:**
- Automatic captures at key steps
- Failure state documentation
- Full-page screenshots
- Timestamped naming

### 5. Test Report Generation

**Purpose:** Consolidate results and generate comprehensive reports

**Report Contents:**
- Build status summary
- Test execution results
- Coverage metrics
- Artifact inventory
- Failure analysis

**Artifacts:**
- Consolidated test report (Markdown)
- HTML test reports (Playwright)
- Coverage dashboards
- Screenshot galleries

### 6. Cleanup

**Purpose:** Resource cleanup and final status reporting

**Actions:**
- Temporary file cleanup
- Status aggregation
- Notification preparation

## Environment Configuration

### Required Secrets

Configure in GitHub repository settings → Secrets and variables → Actions:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_CLIENT_ID

# Additional Services
RESEND_API_KEY
OPENAI_API_KEY
NEXT_PUBLIC_POSTHOG_KEY
```

### Environment Variables

```bash
# Application
NODE_VERSION=18
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:32100
PORT=32100

# Testing
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SCREENSHOTS=true
PLAYWRIGHT_VIDEO=retain-on-failure
TEST_TIMEOUT=30000
```

## Artifact Management

### Artifact Types

1. **Build Artifacts**
   - Compiled Next.js application
   - Static assets and pages
   - Retention: 1 day

2. **Test Results**
   - Unit test reports and coverage
   - E2E test results per role
   - Retention: 7 days

3. **Visual Artifacts**
   - Screenshots from E2E tests
   - Video recordings (on failure)
   - Retention: 7 days

4. **Reports**
   - Consolidated test reports
   - Coverage dashboards
   - Retention: 30 days

### Artifact Structure

```
artifacts/
├── build-artifacts/
│   └── .next/
├── coverage-report/
│   ├── html/
│   └── coverage-final.json
├── e2e-results-{role}/
│   ├── test-results/
│   └── playwright-report/
├── e2e-screenshots-{role}/
│   └── screenshots/
└── test-report/
    └── TEST_REPORT.md
```

## Performance Optimization

### Parallel Execution

- **Unit tests:** Single job with Jest parallel execution
- **E2E tests:** Matrix strategy with 4 parallel jobs
- **Build caching:** npm cache and dependency optimization

### Resource Management

- **Browser Installation:** Cached between runs
- **Dependencies:** npm ci with package-lock.json
- **Artifacts:** Automatic cleanup and size optimization

### Execution Time

| Stage | Target Time | Optimization |
|-------|-------------|--------------|
| Setup | < 2 minutes | Dependency caching |
| Lint & Build | < 3 minutes | Build caching |
| Unit Tests | < 5 minutes | Parallel execution |
| E2E Tests | < 15 minutes | Matrix parallelization |
| Total | < 25 minutes | Overall optimization |

## Monitoring & Alerts

### Success Metrics

- **Build Success Rate:** Target 95%+
- **Test Reliability:** < 5% flake rate
- **Execution Time:** Consistent performance
- **Coverage:** Maintain thresholds

### Failure Handling

1. **Build Failures**
   - Automatic retry (1x)
   - Artifact preservation
   - Developer notification

2. **Test Failures**
   - Screenshot capture
   - Video recording
   - Log preservation
   - Detailed error reporting

3. **Infrastructure Issues**
   - GitHub Actions status monitoring
   - Dependency availability checks
   - Service health validation

## Customization & Extension

### Adding New Test Suites

1. **Create Test Files**
   ```bash
   mkdir -p tests/e2e/new-feature/
   touch tests/e2e/new-feature/feature.spec.ts
   ```

2. **Update Workflow Matrix**
   ```yaml
   matrix:
     test-group: [auth, platform-owner, creator, end-user, new-feature]
   ```

3. **Add Documentation**
   - Update test guide
   - Add feature descriptions

### Custom Test Configurations

1. **Environment-Specific Tests**
   ```yaml
   - name: Run staging tests
     if: inputs.environment == 'staging'
     run: npm run test:e2e:staging
   ```

2. **Feature Flags**
   ```yaml
   env:
     FEATURE_NEW_UI: ${{ inputs.environment == 'staging' }}
   ```

### Integration Extensions

1. **Additional Browsers**
   ```yaml
   strategy:
     matrix:
       browser: [chromium, firefox, webkit]
   ```

2. **Performance Testing**
   ```yaml
   - name: Performance tests
     run: npm run test:performance
   ```

## Troubleshooting

### Common Pipeline Issues

1. **Dependency Installation Failures**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Verify package-lock.json
   npm ci --no-optional
   ```

2. **Build Failures**
   ```bash
   # Check environment variables
   env | grep -E "(NEXT_|SUPABASE_|STRIPE_)"
   
   # Verify build locally
   npm run build
   ```

3. **Test Failures**
   ```bash
   # Run specific test group
   npm run test:e2e -- tests/e2e/auth/
   
   # Debug mode
   npm run test:e2e:debug
   ```

4. **Playwright Issues**
   ```bash
   # Reinstall browsers
   npx playwright install --with-deps
   
   # Check system dependencies
   npx playwright install-deps
   ```

### Pipeline Debugging

1. **Check Action Logs**
   - Navigate to GitHub Actions
   - Select failed workflow run
   - Review step-by-step logs

2. **Download Artifacts**
   - Screenshots for visual debugging
   - Test reports for detailed analysis
   - Build logs for compilation issues

3. **Local Reproduction**
   ```bash
   # Replicate pipeline steps locally
   npm ci
   npm run lint
   npm run build
   npm run test:all
   ```

## Best Practices

### Workflow Maintenance

1. **Regular Updates**
   - Keep action versions current
   - Update Node.js version
   - Refresh dependencies

2. **Performance Monitoring**
   - Track execution times
   - Monitor resource usage
   - Optimize slow stages

3. **Security**
   - Regular secret rotation
   - Dependency vulnerability scanning
   - Access control review

### Development Workflow

1. **Pre-commit Hooks**
   ```bash
   # Install husky for git hooks
   npm install --save-dev husky
   npx husky install
   npx husky add .husky/pre-commit "npm run lint"
   ```

2. **Local Testing**
   ```bash
   # Run full test suite before push
   npm run test:all
   ```

3. **Branch Protection**
   - Require status checks
   - Require up-to-date branches
   - Require review approvals

## Future Enhancements

### Planned Improvements

1. **Enhanced Reporting**
   - Slack/Discord notifications
   - Test trend analysis
   - Performance benchmarking

2. **Advanced Testing**
   - Visual regression testing
   - API endpoint testing
   - Load and stress testing

3. **Deployment Integration**
   - Automatic staging deployments
   - Blue-green deployment support
   - Rollback mechanisms

4. **Quality Gates**
   - Code complexity analysis
   - Security vulnerability scanning
   - License compliance checking

## Support & Maintenance

### Regular Tasks

- **Weekly:** Review test results and failure patterns
- **Monthly:** Update dependencies and action versions
- **Quarterly:** Performance optimization and cleanup

### Getting Help

1. **Documentation:** Check this guide and testing documentation
2. **Logs:** Review GitHub Actions logs and artifacts
3. **Local Testing:** Reproduce issues locally
4. **Team Support:** Reach out to the development team

This build pipeline ensures reliable, comprehensive testing of the Staryer platform while providing detailed feedback and visual documentation for all stakeholders.