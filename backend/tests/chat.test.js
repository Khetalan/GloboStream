const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Message = require('../models/Message');

// Configuration base de test
require('dotenv').config();
const TEST_DB_URI = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/dating-app-test$1');

let user1Token, user1Id;
let user2Token, user2Id;
let user3Token, user3Id;
let messageId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  await User.deleteMany({});
  await Message.deleteMany({});

  // Créer User 1
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'chat1@test.com',
      password: 'Password123',
      firstName: 'Alice',
      lastName: 'Chat',
      birthDate: '1990-05-15',
      gender: 'femme'
    });

  user1Token = res1.body.token;
  user1Id = res1.body.user.id;

  // Créer User 2
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'chat2@test.com',
      password: 'Password123',
      firstName: 'Bob',
      lastName: 'Chat',
      birthDate: '1992-08-20',
      gender: 'homme'
    });

  user2Token = res2.body.token;
  user2Id = res2.body.user.id;

  // Créer User 3
  const res3 = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'chat3@test.com',
      password: 'Password123',
      firstName: 'Charlie',
      lastName: 'Chat',
      birthDate: '1988-12-10',
      gender: 'homme'
    });

  user3Token = res3.body.token;
  user3Id = res3.body.user.id;

  // Créer un match entre User 1 et User 2
  await request(app)
    .post(`/api/swipe/like/${user2Id}`)
    .set('Authorization', `Bearer ${user1Token}`);

  await request(app)
    .post(`/api/swipe/like/${user1Id}`)
    .set('Authorization', `Bearer ${user2Token}`);

  // Créer un match entre User 1 et User 3
  await request(app)
    .post(`/api/swipe/like/${user3Id}`)
    .set('Authorization', `Bearer ${user1Token}`);

  await request(app)
    .post(`/api/swipe/like/${user1Id}`)
    .set('Authorization', `Bearer ${user3Token}`);
});

afterAll(async () => {
  await User.deleteMany({});
  await Message.deleteMany({});
  await mongoose.connection.close();
});

describe('API Chat - Messages', () => {
  test('POST /api/chat/:userId - envoyer un message', async () => {
    const res = await request(app)
      .post(`/api/chat/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Salut Bob !' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();
    expect(res.body.message.content).toBe('Salut Bob !');
    expect(res.body.message.type).toBe('text');

    messageId = res.body.message._id;
  });

  test('POST /api/chat/:userId - message vide (400)', async () => {
    const res = await request(app)
      .post(`/api/chat/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: '  ' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('vide');
  });

  test('POST /api/chat/:userId - pas de match (403)', async () => {
    // Créer un User 4 sans match
    const res4 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'chat4@test.com',
        password: 'Password123',
        firstName: 'David',
        lastName: 'Chat',
        birthDate: '1995-01-01',
        gender: 'homme'
      });

    const user4Id = res4.body.user.id;

    const res = await request(app)
      .post(`/api/chat/${user4Id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Test' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('matcher');
  });

  test('POST /api/chat/:userId - sans token (401)', async () => {
    const res = await request(app)
      .post(`/api/chat/${user2Id}`)
      .send({ content: 'Test' });

    expect(res.statusCode).toBe(401);
  });
});

describe('API Chat - Récupération', () => {
  test('GET /api/chat/:userId - obtenir messages conversation', async () => {
    const res = await request(app)
      .get(`/api/chat/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.messages).toBeDefined();
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBeGreaterThan(0);

    const firstMessage = res.body.messages[0];
    expect(firstMessage.content).toBe('Salut Bob !');
  });

  test('GET /api/chat/:userId - avec pagination', async () => {
    const res = await request(app)
      .get(`/api/chat/${user2Id}?limit=1&skip=0`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.messages.length).toBeLessThanOrEqual(1);
  });

  test('GET /api/chat/:userId - pas de match (403)', async () => {
    // Utiliser user4 créé précédemment
    const res4 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'chat4@test.com',
        password: 'Password123'
      });

    const user4Token = res4.body.token;

    const res = await request(app)
      .get(`/api/chat/${user1Id}`)
      .set('Authorization', `Bearer ${user4Token}`);

    expect(res.statusCode).toBe(403);
  });

  test('GET /api/chat/conversations - liste conversations', async () => {
    const res = await request(app)
      .get('/api/chat/conversations')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.conversations).toBeDefined();
    expect(Array.isArray(res.body.conversations)).toBe(true);
    expect(res.body.conversations.length).toBeGreaterThan(0);

    const firstConv = res.body.conversations[0];
    expect(firstConv.user).toBeDefined();
    expect(firstConv.lastMessage).toBeDefined();
    expect(firstConv.unreadCount).toBeDefined();
  });

  test('GET /api/chat/conversations - sans token (401)', async () => {
    const res = await request(app)
      .get('/api/chat/conversations');

    expect(res.statusCode).toBe(401);
  });
});

describe('API Chat - Marquage lecture', () => {
  test('PATCH /api/chat/:userId/read - marquer comme lu', async () => {
    // User 2 envoie un message à User 1
    await request(app)
      .post(`/api/chat/${user1Id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ content: 'Message de Bob' });

    // User 1 marque la conversation comme lue
    const res = await request(app)
      .patch(`/api/chat/${user2Id}/read`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('lus');
  });

  test('PATCH /api/chat/:userId/read - sans token (401)', async () => {
    const res = await request(app)
      .patch(`/api/chat/${user2Id}/read`);

    expect(res.statusCode).toBe(401);
  });
});

describe('API Chat - Suppression', () => {
  test('DELETE /api/chat/message/:messageId - supprimer message', async () => {
    const res = await request(app)
      .delete(`/api/chat/message/${messageId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('supprimé');
  });

  test('DELETE /api/chat/message/:messageId - message inexistant (404)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/chat/message/${fakeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(404);
  });

  test('DELETE /api/chat/message/:messageId - pas autorisé (403)', async () => {
    // User 2 envoie un message
    const msgRes = await request(app)
      .post(`/api/chat/${user1Id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ content: 'Message test suppression' });

    const msgId = msgRes.body.message._id;

    // User 1 essaie de supprimer le message de User 2
    const res = await request(app)
      .delete(`/api/chat/message/${msgId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(403);
  });

  test('DELETE /api/chat/message/:messageId - sans token (401)', async () => {
    const res = await request(app)
      .delete(`/api/chat/message/${messageId}`);

    expect(res.statusCode).toBe(401);
  });
});
