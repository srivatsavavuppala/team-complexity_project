const request = require('supertest');
const app = require('../index');

describe('API Health Check', () => {
  test('GET /api/health should return 200', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.message).toContain('AI Recruitment Helper API');
  });
});

describe('Authentication', () => {
  test('POST /api/auth/register should create a new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'recruiter'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.message).toBe('User created successfully');
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(userData.email);
  });

  test('POST /api/auth/login should authenticate user', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body.message).toBe('Login successful');
    expect(response.body.token).toBeDefined();
  });
});

describe('Protected Routes', () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = response.body.token;
  });

  test('GET /api/candidates should require authentication', async () => {
    await request(app)
      .get('/api/candidates')
      .expect(401);
  });

  test('GET /api/candidates should work with valid token', async () => {
    await request(app)
      .get('/api/candidates')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});