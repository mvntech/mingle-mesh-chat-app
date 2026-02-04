import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { healthCheck } from '../controllers/health.js';

jest.mock('mongoose', () => ({
    connection: {
        readyState: 0
    }
}));

jest.mock('../config/sentry.js', () => ({
    __esModule: true,
    default: {
        Handlers: {
            requestHandler: () => (req, res, next) => next(),
            errorHandler: () => (err, req, res, next) => next(err),
        },
        setupExpressErrorHandler: jest.fn(),
        init: jest.fn(),
    },
    initSentry: jest.fn(),
}));

jest.mock('../config/validateEnv.js', () => ({
    validateEnvironment: jest.fn(),
}));

describe('Health Check Endpoint', () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        app = express();
        app.get('/health', healthCheck);
    });

    it('should return 200 OK when database is connected', async () => {
        mongoose.connection.readyState = 1;
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('healthy');
        expect(res.body.mongodb).toBe('connected');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
    });

    it('should return 503 Service Unavailable when database is disconnected', async () => {
        mongoose.connection.readyState = 0;
        const res = await request(app).get('/health');
        expect(res.status).toBe(503);
        expect(res.body.status).toBe('unhealthy');
        expect(res.body.reason).toBe('database');
        expect(res.body.mongodb).toBe('disconnected');
    });
});
