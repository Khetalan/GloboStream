const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

// Configuration base de test
require('dotenv').config();
const TEST_DB_URI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  await User.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('API Auth - Inscription', () => {
  test('POST /api/auth/register - inscription réussie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'jest-test@test.com',
        password: 'Password123',
        firstName: 'Jest',
        lastName: 'Test',
        birthDate: '1995-06-15',
        gender: 'homme'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.displayName).toBe('Jest Test');
  });

  test('POST /api/auth/register - email déjà utilisé', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'jest-test@test.com',
        password: 'Password123',
        firstName: 'Duplicate',
        birthDate: '1995-06-15',
        gender: 'homme'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('déjà utilisé');
  });

  test('POST /api/auth/register - mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'shortpw@test.com',
        password: '123',
        firstName: 'Short',
        birthDate: '1995-06-15',
        gender: 'homme'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('6 caractères');
  });

  test('POST /api/auth/register - mineur interdit', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'minor@test.com',
        password: 'Password123',
        firstName: 'Minor',
        birthDate: '2015-01-01',
        gender: 'homme'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('18 ans');
  });

  test('POST /api/auth/register - champs requis manquants', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(res.statusCode).toBe(400);
  });
});

describe('API Auth - Connexion', () => {
  test('POST /api/auth/login - connexion réussie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jest-test@test.com',
        password: 'Password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  test('POST /api/auth/login - mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jest-test@test.com',
        password: 'WrongPassword'
      });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/login - email inexistant', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noexist@test.com',
        password: 'Password123'
      });

    expect(res.statusCode).toBe(401);
  });
});

describe('API Auth - Token', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jest-test@test.com', password: 'Password123' });
    token = res.body.token;
  });

  test('GET /api/auth/verify - token valide', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  test('GET /api/auth/verify - token manquant', async () => {
    const res = await request(app)
      .get('/api/auth/verify');

    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/verify - token invalide', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer invalid-token-123');

    expect(res.statusCode).toBe(401);
  });
});
