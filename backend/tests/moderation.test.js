const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

// Configuration base de test
require('dotenv').config();
const TEST_DB_URI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');

let userToken, userId;
let modToken, modId;
let adminToken, adminId;
let superAdminToken, superAdminId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  await User.deleteMany({});

  // Créer User normal
  const resUser = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'user@test.com',
      password: 'Password123',
      firstName: 'Normal',
      lastName: 'User',
      birthDate: '1990-01-01',
      gender: 'homme'
    });

  userToken = resUser.body.token;
  userId = resUser.body.user.id;

  // Créer Modérateur (privilegeLevel 1)
  const resMod = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'mod@test.com',
      password: 'Password123',
      firstName: 'Mod',
      lastName: 'Test',
      birthDate: '1990-01-01',
      gender: 'homme'
    });

  modToken = resMod.body.token;
  modId = resMod.body.user.id;

  // Promouvoir en modérateur manuellement
  const modUser = await User.findById(modId);
  modUser.privilegeLevel = 1;
  modUser.moderationPermissions = {
    canBanUsers: true,
    canDeleteContent: true,
    canManageStreams: true,
    canViewReports: true,
    canIssueWarnings: true
  };
  await modUser.save();

  // Créer Admin (privilegeLevel 2)
  const resAdmin = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'admin@test.com',
      password: 'Password123',
      firstName: 'Admin',
      lastName: 'Test',
      birthDate: '1990-01-01',
      gender: 'homme'
    });

  adminToken = resAdmin.body.token;
  adminId = resAdmin.body.user.id;

  const adminUser = await User.findById(adminId);
  adminUser.privilegeLevel = 2;
  adminUser.moderationPermissions = {
    canBanUsers: true,
    canDeleteContent: true,
    canManageStreams: true,
    canViewReports: true,
    canIssueWarnings: true
  };
  await adminUser.save();

  // Créer Super Admin (privilegeLevel 3)
  const resSuperAdmin = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'superadmin@test.com',
      password: 'Password123',
      firstName: 'SuperAdmin',
      lastName: 'Test',
      birthDate: '1990-01-01',
      gender: 'homme'
    });

  superAdminToken = resSuperAdmin.body.token;
  superAdminId = resSuperAdmin.body.user.id;

  const superAdminUser = await User.findById(superAdminId);
  superAdminUser.privilegeLevel = 3;
  superAdminUser.moderationPermissions = {
    canBanUsers: true,
    canDeleteContent: true,
    canManageStreams: true,
    canViewReports: true,
    canIssueWarnings: true
  };
  await superAdminUser.save();
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('API Moderation - Routes Modérateur', () => {
  test('GET /api/moderation/reports - obtenir rapports (modérateur)', async () => {
    const res = await request(app)
      .get('/api/moderation/reports')
      .set('Authorization', `Bearer ${modToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.reports).toBeDefined();
  });

  test('GET /api/moderation/reports - accès refusé (utilisateur normal)', async () => {
    const res = await request(app)
      .get('/api/moderation/reports')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('POST /api/moderation/warn/:userId - avertir utilisateur', async () => {
    const res = await request(app)
      .post(`/api/moderation/warn/${userId}`)
      .set('Authorization', `Bearer ${modToken}`)
      .send({ reason: 'Comportement inapproprié' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Avertissement');
    expect(res.body.warnings).toBeDefined();
  });

  test('POST /api/moderation/ban/:userId - bannir utilisateur', async () => {
    const res = await request(app)
      .post(`/api/moderation/ban/${userId}`)
      .set('Authorization', `Bearer ${modToken}`)
      .send({ reason: 'Spam', duration: 7 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('banni');
  });

  test('POST /api/moderation/ban/:userId - impossible de bannir admin', async () => {
    const res = await request(app)
      .post(`/api/moderation/ban/${adminId}`)
      .set('Authorization', `Bearer ${modToken}`)
      .send({ reason: 'Test' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('administrateur');
  });

  test('POST /api/moderation/unban/:userId - débannir utilisateur', async () => {
    const res = await request(app)
      .post(`/api/moderation/unban/${userId}`)
      .set('Authorization', `Bearer ${modToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('débanni');
  });

  test('POST /api/moderation/stream/:streamId/stop - arrêter stream', async () => {
    const res = await request(app)
      .post('/api/moderation/stream/test123/stop')
      .set('Authorization', `Bearer ${modToken}`)
      .send({ reason: 'Contenu inapproprié' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/moderation/stats - obtenir stats modération', async () => {
    const res = await request(app)
      .get('/api/moderation/stats')
      .set('Authorization', `Bearer ${modToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.privilegeLevel).toBe(1);
    expect(res.body.permissions).toBeDefined();
    expect(res.body.stats).toBeDefined();
  });

  test('POST /api/moderation/warn/:userId - utilisateur inexistant (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/moderation/warn/${fakeId}`)
      .set('Authorization', `Bearer ${modToken}`)
      .send({ reason: 'Test' });

    expect(res.statusCode).toBe(404);
  });
});

describe('API Moderation - Routes Admin', () => {
  test('POST /api/moderation/promote/:userId - promouvoir en modérateur', async () => {
    // Créer un nouvel utilisateur à promouvoir
    const newUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'topromote@test.com',
        password: 'Password123',
        firstName: 'To',
        lastName: 'Promote',
        birthDate: '1990-01-01',
        gender: 'homme'
      });

    const newUserId = newUserRes.body.user.id;

    const res = await request(app)
      .post(`/api/moderation/promote/${newUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        permissions: {
          canBanUsers: true,
          canViewReports: true
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('modérateur');
    expect(res.body.user.privilegeLevel).toBe(1);
  });

  test('POST /api/moderation/promote/:userId - déjà modérateur (400)', async () => {
    const res = await request(app)
      .post(`/api/moderation/promote/${modId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('déjà modérateur');
  });

  test('POST /api/moderation/demote/:userId - révoquer modérateur', async () => {
    // Créer un utilisateur et le promouvoir en modérateur d'abord
    const newUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'todemote@test.com',
        password: 'Password123',
        firstName: 'To',
        lastName: 'Demote',
        birthDate: '1990-01-01',
        gender: 'homme'
      });

    const newUserId = newUserRes.body.user.id;

    // Le promouvoir
    await request(app)
      .post(`/api/moderation/promote/${newUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        permissions: { canViewReports: true }
      });

    // Maintenant le révoquer
    const res = await request(app)
      .post(`/api/moderation/demote/${newUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.privilegeLevel).toBe(0);
  });

  test('POST /api/moderation/demote/:userId - impossible de révoquer admin (403)', async () => {
    const res = await request(app)
      .post(`/api/moderation/demote/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('PATCH /api/moderation/permissions/:userId - modifier permissions', async () => {
    const res = await request(app)
      .patch(`/api/moderation/permissions/${modId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        permissions: {
          canBanUsers: false,
          canViewReports: true
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.permissions).toBeDefined();
  });

  test('GET /api/moderation/moderators - liste modérateurs', async () => {
    const res = await request(app)
      .get('/api/moderation/moderators')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.moderators).toBeDefined();
    expect(Array.isArray(res.body.moderators)).toBe(true);
    expect(res.body.moderators.length).toBeGreaterThan(0);
  });

  test('GET /api/moderation/stats/global - statistiques globales', async () => {
    const res = await request(app)
      .get('/api/moderation/stats/global')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalUsers).toBeDefined();
    expect(res.body.bannedUsers).toBeDefined();
    expect(res.body.moderators).toBeDefined();
  });

  test('GET /api/moderation/users - liste utilisateurs avec pagination', async () => {
    const res = await request(app)
      .get('/api/moderation/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.totalPages).toBeDefined();
    expect(res.body.currentPage).toBe('1');
  });

  test('GET /api/moderation/users - avec filtres', async () => {
    const res = await request(app)
      .get('/api/moderation/users?privilegeLevel=1&isBanned=false')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
  });

  test('POST /api/moderation/promote/:userId - accès refusé (modérateur)', async () => {
    const res = await request(app)
      .post(`/api/moderation/promote/${userId}`)
      .set('Authorization', `Bearer ${modToken}`)
      .send({});

    expect(res.statusCode).toBe(403);
  });
});

describe('API Moderation - Routes Super Admin', () => {
  test('POST /api/moderation/promote-admin/:userId - promouvoir en admin', async () => {
    // Créer un nouvel utilisateur à promouvoir en admin
    const newUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'topromoteadmin@test.com',
        password: 'Password123',
        firstName: 'To',
        lastName: 'PromoteAdmin',
        birthDate: '1990-01-01',
        gender: 'homme'
      });

    const newUserId = newUserRes.body.user.id;

    const res = await request(app)
      .post(`/api/moderation/promote-admin/${newUserId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('administrateur');
    expect(res.body.user.privilegeLevel).toBe(2);
  });

  test('POST /api/moderation/promote-admin/:userId - accès refusé (admin)', async () => {
    const res = await request(app)
      .post(`/api/moderation/promote-admin/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('POST /api/moderation/promote-admin/:userId - utilisateur inexistant (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/moderation/promote-admin/${fakeId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('API Moderation - Authentification', () => {
  test('GET /api/moderation/reports - sans token (401)', async () => {
    const res = await request(app)
      .get('/api/moderation/reports');

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/moderation/warn/:userId - sans token (401)', async () => {
    const res = await request(app)
      .post(`/api/moderation/warn/${userId}`)
      .send({ reason: 'Test' });

    expect(res.statusCode).toBe(401);
  });
});
