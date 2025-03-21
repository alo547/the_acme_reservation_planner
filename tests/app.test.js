const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test_secret';

const tokenInstructor4 = jwt.sign({ id: 4 }, SECRET);
const tokenInstructor5 = jwt.sign({ id: 5 }, SECRET);

describe('API Endpoints', () => {
    it('GET /api/customers', async () => {
        const response = await request(app).get('/api/customers');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
});
    it('POST /api/customers', async () => {
        const response = await request(app).post('/api/customers');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message');
    });

    it('GET /api/restaurants', async () => {
        const response = await request(app).get('/api/restaurants');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /api/restaurants', async () => {
        const response = await request(app).post('/api/restaurants');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message');
    });

    it('GET /api/reservations', async () => {
        const response = await request(app).get('/api/reservations');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /api/customer/:id/reservations', async () => {
        const response = await request(app).post('/api/customer/:id/reservations');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message');
    });

    it('DELETE /api/customer/:id/reservations/:id', async () => {
        const response = await request(app).delete('/api/customer/:id/reservations/:id');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message');
    });
});


describe('Authorization Tests', () => {
    it('Instructor 4 cannot access students of Instructor 5', async () => {
        const response = await request(app)
            .get('/api/instructor/5/students')
            .set('Authorization', `Bearer ${tokenInstructor4}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Access denied');
    });

    it('Instructor 5 can access students of Instructor 5', async () => {
        const response = await request(app)
            .get('/api/instructor/5/students')
            .set('Authorization', `Bearer ${tokenInstructor5}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.error).toBe('Access denied');
    });
});

