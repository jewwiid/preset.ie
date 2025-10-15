# Testing & Quality Assurance - Preset Platform

## 🧪 Testing Strategy Overview

Preset implements a comprehensive testing strategy that ensures code quality, reliability, and maintainability across all layers of the application. The testing approach follows industry best practices and covers unit, integration, end-to-end, and performance testing.

## 🏗️ Testing Architecture

### **Testing Pyramid**
```
        /\
       /  \
      / E2E \     ← End-to-End Tests (Few)
     /______\
    /        \
   /Integration\  ← Integration Tests (Some)
  /____________\
 /              \
/   Unit Tests   \  ← Unit Tests (Many)
/________________\
```

### **Testing Layers**
1. **Unit Tests**: Individual functions, components, and classes
2. **Integration Tests**: API endpoints, database interactions, service integrations
3. **End-to-End Tests**: Complete user workflows and scenarios
4. **Performance Tests**: Load testing, stress testing, and optimization
5. **Security Tests**: Authentication, authorization, and data protection

## 🔧 Testing Tools & Frameworks

### **Frontend Testing**
- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing utilities
- **Cypress**: End-to-end testing framework
- **Storybook**: Component development and testing
- **MSW (Mock Service Worker)**: API mocking

### **Backend Testing**
- **Jest**: Node.js testing framework
- **Supertest**: HTTP assertion library
- **PostgreSQL Test Containers**: Database testing
- **Stripe Test Mode**: Payment testing
- **Supabase Test Client**: Backend service testing

### **Mobile Testing**
- **Expo Testing**: React Native testing utilities
- **Detox**: End-to-end mobile testing
- **Flipper**: Mobile debugging and testing

## 📝 Unit Testing

### **Component Testing**
Testing React components with React Testing Library.

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### **Hook Testing**
Testing custom React hooks.

```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { supabase } from './supabase';

// Mock Supabase
jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('handles successful sign in', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockSession = { user: mockUser };
    
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: mockSession,
      error: null
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('handles sign in error', async () => {
    const mockError = { message: 'Invalid credentials' };
    
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: null,
      error: mockError
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrongpassword');
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });

    expect(result.current.error).toBe(mockError.message);
  });
});
```

### **Service Testing**
Testing business logic and services.

```typescript
// GigService.test.ts
import { GigService } from './GigService';
import { supabase } from './supabase';

jest.mock('./supabase');

describe('GigService', () => {
  let gigService: GigService;

  beforeEach(() => {
    gigService = new GigService();
    jest.clearAllMocks();
  });

  describe('createGig', () => {
    it('creates a gig successfully', async () => {
      const mockGig = {
        title: 'Test Gig',
        description: 'Test Description',
        location_text: 'Test Location',
        start_time: '2024-01-01T10:00:00Z',
        comp_type: 'paid',
        comp_amount: 100
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: '1', ...mockGig }],
            error: null
          })
        })
      });

      const result = await gigService.createGig(mockGig);

      expect(result).toEqual({ id: '1', ...mockGig });
      expect(supabase.from).toHaveBeenCalledWith('gigs');
    });

    it('handles creation error', async () => {
      const mockError = { message: 'Database error' };
      
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await expect(gigService.createGig({})).rejects.toThrow('Database error');
    });
  });

  describe('getGigs', () => {
    it('fetches gigs with filters', async () => {
      const mockGigs = [
        { id: '1', title: 'Gig 1' },
        { id: '2', title: 'Gig 2' }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockGigs,
                  error: null
                })
              })
            })
          })
        })
      });

      const result = await gigService.getGigs({
        status: 'published',
        startDate: '2024-01-01'
      });

      expect(result).toEqual(mockGigs);
    });
  });
});
```

## 🔗 Integration Testing

### **API Endpoint Testing**
Testing API endpoints with Supertest.

```typescript
// gigs.test.ts
import request from 'supertest';
import { app } from '../app';
import { supabase } from '../supabase';

jest.mock('../supabase');

describe('Gigs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/gigs', () => {
    it('returns gigs for authenticated user', async () => {
      const mockGigs = [
        { id: '1', title: 'Test Gig 1' },
        { id: '2', title: 'Test Gig 2' }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockGigs,
                error: null
              })
            })
          })
        })
      });

      const response = await request(app)
        .get('/api/gigs')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.gigs).toEqual(mockGigs);
    });

    it('returns 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/gigs')
        .expect(401);
    });
  });

  describe('POST /api/gigs', () => {
    it('creates a new gig', async () => {
      const newGig = {
        title: 'New Gig',
        description: 'New Description',
        location_text: 'New Location',
        start_time: '2024-01-01T10:00:00Z',
        comp_type: 'paid',
        comp_amount: 100
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: '1', ...newGig }],
            error: null
          })
        })
      });

      const response = await request(app)
        .post('/api/gigs')
        .set('Authorization', 'Bearer valid-token')
        .send(newGig)
        .expect(201);

      expect(response.body.gig).toEqual({ id: '1', ...newGig });
    });

    it('validates required fields', async () => {
      const invalidGig = {
        title: '', // Empty title
        description: 'Valid description'
      };

      await request(app)
        .post('/api/gigs')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidGig)
        .expect(400);
    });
  });
});
```

### **Database Integration Testing**
Testing database interactions with test containers.

```typescript
// database.test.ts
import { createConnection, getConnection } from 'typeorm';
import { Gig } from '../entities/Gig';
import { User } from '../entities/User';

describe('Database Integration', () => {
  beforeAll(async () => {
    await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'test',
      password: 'test',
      database: 'test',
      entities: [Gig, User],
      synchronize: true,
      dropSchema: true
    });
  });

  afterAll(async () => {
    await getConnection().close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await getConnection().synchronize(true);
  });

  it('creates and retrieves gig', async () => {
    const gigRepository = getConnection().getRepository(Gig);
    
    const gig = new Gig();
    gig.title = 'Test Gig';
    gig.description = 'Test Description';
    gig.location_text = 'Test Location';
    gig.start_time = new Date('2024-01-01T10:00:00Z');
    gig.comp_type = 'paid';
    gig.comp_amount = 100;
    
    await gigRepository.save(gig);
    
    const savedGig = await gigRepository.findOne({ where: { id: gig.id } });
    expect(savedGig).toBeDefined();
    expect(savedGig.title).toBe('Test Gig');
  });

  it('handles database constraints', async () => {
    const gigRepository = getConnection().getRepository(Gig);
    
    const gig = new Gig();
    // Missing required fields
    
    await expect(gigRepository.save(gig)).rejects.toThrow();
  });
});
```

## 🎭 End-to-End Testing

### **Cypress E2E Tests**
Complete user workflow testing.

```typescript
// cypress/e2e/gig-creation.cy.ts
describe('Gig Creation Flow', () => {
  beforeEach(() => {
    cy.login('contributor@example.com', 'password');
    cy.visit('/dashboard');
  });

  it('creates a new gig successfully', () => {
    // Navigate to create gig page
    cy.get('[data-testid="create-gig-button"]').click();
    cy.url().should('include', '/gigs/create');

    // Fill out gig form
    cy.get('[data-testid="gig-title"]').type('Photography Gig');
    cy.get('[data-testid="gig-description"]').type('Looking for a professional photographer for a wedding shoot');
    cy.get('[data-testid="gig-location"]').type('Dublin, Ireland');
    cy.get('[data-testid="gig-date"]').type('2024-06-15');
    cy.get('[data-testid="gig-time"]').type('10:00');
    cy.get('[data-testid="comp-type"]').select('paid');
    cy.get('[data-testid="comp-amount"]').type('500');

    // Submit form
    cy.get('[data-testid="submit-gig"]').click();

    // Verify success
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.url().should('include', '/gigs/');
  });

  it('validates required fields', () => {
    cy.get('[data-testid="create-gig-button"]').click();
    
    // Try to submit without filling required fields
    cy.get('[data-testid="submit-gig"]').click();
    
    // Check for validation errors
    cy.get('[data-testid="title-error"]').should('be.visible');
    cy.get('[data-testid="description-error"]').should('be.visible');
    cy.get('[data-testid="location-error"]').should('be.visible');
  });
});

// cypress/e2e/application-flow.cy.ts
describe('Application Flow', () => {
  beforeEach(() => {
    cy.login('talent@example.com', 'password');
    cy.visit('/gigs');
  });

  it('applies to a gig successfully', () => {
    // Find and click on a gig
    cy.get('[data-testid="gig-card"]').first().click();
    
    // Click apply button
    cy.get('[data-testid="apply-button"]').click();
    
    // Fill application form
    cy.get('[data-testid="application-note"]').type('I am very interested in this opportunity');
    cy.get('[data-testid="portfolio-link"]').type('https://portfolio.example.com');
    
    // Submit application
    cy.get('[data-testid="submit-application"]').click();
    
    // Verify success
    cy.get('[data-testid="application-success"]').should('be.visible');
  });

  it('views application status', () => {
    cy.visit('/applications');
    
    // Check application status
    cy.get('[data-testid="application-card"]').should('be.visible');
    cy.get('[data-testid="application-status"]').should('contain', 'pending');
  });
});
```

### **Mobile E2E Testing**
Testing mobile app workflows with Detox.

```typescript
// e2e/gig-creation.e2e.js
describe('Gig Creation Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('creates a new gig', async () => {
    // Login
    await element(by.id('email-input')).typeText('contributor@example.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('login-button')).tap();

    // Navigate to create gig
    await element(by.id('create-gig-tab')).tap();
    await element(by.id('create-gig-button')).tap();

    // Fill form
    await element(by.id('title-input')).typeText('Mobile Photography Gig');
    await element(by.id('description-input')).typeText('Looking for mobile photographer');
    await element(by.id('location-input')).typeText('Cork, Ireland');
    await element(by.id('date-picker')).tap();
    await element(by.text('15')).tap();
    await element(by.id('time-picker')).tap();
    await element(by.text('10:00')).tap();

    // Submit
    await element(by.id('submit-button')).tap();

    // Verify success
    await expect(element(by.id('success-message'))).toBeVisible();
  });
});
```

## 🚀 Performance Testing

### **Load Testing**
Testing application performance under load.

```typescript
// performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],   // Error rate under 10%
  },
};

export default function() {
  // Test gig listing
  let response = http.get('https://api.preset.ie/gigs');
  check(response, {
    'gig listing status is 200': (r) => r.status === 200,
    'gig listing response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test gig creation
  let payload = JSON.stringify({
    title: 'Load Test Gig',
    description: 'Performance test gig',
    location_text: 'Test Location',
    start_time: '2024-01-01T10:00:00Z',
    comp_type: 'paid',
    comp_amount: 100
  });

  response = http.post('https://api.preset.ie/gigs', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'gig creation status is 201': (r) => r.status === 201,
    'gig creation response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

### **Database Performance Testing**
Testing database query performance.

```typescript
// performance/db-performance.test.ts
import { performance } from 'perf_hooks';
import { GigService } from '../services/GigService';

describe('Database Performance', () => {
  let gigService: GigService;

  beforeEach(() => {
    gigService = new GigService();
  });

  it('gig listing query performance', async () => {
    const start = performance.now();
    
    await gigService.getGigs({
      page: 1,
      limit: 20,
      filters: {
        status: 'published',
        location: 'Dublin'
      }
    });
    
    const end = performance.now();
    const duration = end - start;
    
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('gig search query performance', async () => {
    const start = performance.now();
    
    await gigService.searchGigs('photography', {
      page: 1,
      limit: 20
    });
    
    const end = performance.now();
    const duration = end - start;
    
    expect(duration).toBeLessThan(200); // Should complete in under 200ms
  });
});
```

## 🔒 Security Testing

### **Authentication Testing**
Testing authentication and authorization.

```typescript
// security/auth.test.ts
import request from 'supertest';
import { app } from '../app';

describe('Authentication Security', () => {
  it('prevents unauthorized access to protected routes', async () => {
    await request(app)
      .get('/api/gigs')
      .expect(401);
  });

  it('validates JWT tokens', async () => {
    await request(app)
      .get('/api/gigs')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('prevents SQL injection in gig search', async () => {
    const maliciousQuery = "'; DROP TABLE gigs; --";
    
    await request(app)
      .get(`/api/gigs/search?q=${encodeURIComponent(maliciousQuery)}`)
      .set('Authorization', 'Bearer valid-token')
      .expect(400);
  });

  it('prevents XSS in gig descriptions', async () => {
    const maliciousDescription = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/gigs')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Test Gig',
        description: maliciousDescription,
        location_text: 'Test Location',
        start_time: '2024-01-01T10:00:00Z',
        comp_type: 'paid',
        comp_amount: 100
      });

    // Description should be sanitized
    expect(response.body.gig.description).not.toContain('<script>');
  });
});
```

### **Data Protection Testing**
Testing data privacy and protection.

```typescript
// security/data-protection.test.ts
describe('Data Protection', () => {
  it('encrypts sensitive user data', async () => {
    const userData = {
      email: 'test@example.com',
      phone: '+1234567890',
      address: '123 Main St'
    };

    const encrypted = await encryptSensitiveData(userData);
    
    expect(encrypted.email).not.toBe(userData.email);
    expect(encrypted.phone).not.toBe(userData.phone);
  });

  it('implements proper data retention', async () => {
    const oldGig = await createGig({
      created_at: new Date('2020-01-01'),
      status: 'completed'
    });

    await cleanupOldData();
    
    const gig = await getGig(oldGig.id);
    expect(gig).toBeNull();
  });

  it('anonymizes user data on deletion', async () => {
    const user = await createUser({
      email: 'test@example.com',
      display_name: 'Test User'
    });

    await deleteUser(user.id);
    
    const anonymizedUser = await getUser(user.id);
    expect(anonymizedUser.email).toBe('deleted@example.com');
    expect(anonymizedUser.display_name).toBe('Deleted User');
  });
});
```

## 📊 Test Coverage & Reporting

### **Coverage Configuration**
Jest coverage configuration.

```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']
};
```

### **Coverage Reports**
Generating and viewing coverage reports.

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html

# Generate coverage badge
npm run test:coverage:badge
```

## 🚀 Continuous Integration

### **GitHub Actions Workflow**
Automated testing pipeline.

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run check-types
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

## 🎯 Testing Best Practices

### **Test Organization**
- **Arrange-Act-Assert**: Structure tests clearly
- **Single Responsibility**: One test per scenario
- **Descriptive Names**: Clear test descriptions
- **Test Data**: Use factories and fixtures
- **Mocking**: Mock external dependencies

### **Test Maintenance**
- **Regular Updates**: Keep tests current with code changes
- **Refactoring**: Improve test quality over time
- **Documentation**: Document complex test scenarios
- **Performance**: Monitor test execution time
- **Coverage**: Maintain high coverage standards

### **Quality Gates**
- **Coverage Threshold**: Minimum 80% coverage
- **Performance Benchmarks**: Response time limits
- **Security Checks**: Automated security scanning
- **Code Quality**: Linting and formatting checks
- **Dependency Updates**: Regular dependency updates

---

This comprehensive testing strategy ensures Preset maintains high quality, reliability, and security standards. The multi-layered approach covers all aspects of the application, from individual components to complete user workflows, providing confidence in the platform's stability and performance.
