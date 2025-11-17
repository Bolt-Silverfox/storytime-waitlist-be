import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { EmailService } from '../src/email/email.service';
import { ResponseInterceptor } from '../src/common/response.interceptor';
import { AllExceptionsFilter } from '../src/common/exception.filter';

describe('Waitlist (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const mockEmailService = {
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    // Set up test database schema
    const { execSync } = require('child_process');

    // Push schema to test database (or run migrations)
    try {
      execSync('npx prisma db push --force-reset', {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      });
      console.log('✅ Test database schema initialized');
    } catch (error) {
      console.log('Database setup failed, continuing with tests...');
    }
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as main.ts
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');

    await app.init();

    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.waitlistUser.deleteMany();
    } catch (error) {
      // Ignore if table doesn't exist
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/waitlist/subscribe (POST)', () => {
    it('should successfully subscribe a user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/waitlist/subscribe')
        .send({
          email: 'test@example.com',
          name: 'John Doe',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.data).toHaveProperty('email', 'test@example.com');
          expect(res.body.data).toHaveProperty('name', 'John Doe');
          expect(res.body.message).toBe('Operation completed successfully');
          expect(res.body.error).toBeNull();
        });
    });

    it('should reject duplicate email', async () => {
      // First subscription
      await request(app.getHttpServer())
        .post('/api/v1/waitlist/subscribe')
        .send({
          email: 'duplicate@example.com',
          name: 'First User',
        })
        .expect(201);

      // Second subscription with same email
      return request(app.getHttpServer())
        .post('/api/v1/waitlist/subscribe')
        .send({
          email: 'duplicate@example.com',
          name: 'Second User',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.data).toBeNull();
          expect(res.body.message).toBe('Email already registered in waitlist');
          expect(res.body.error).toBeDefined();
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/waitlist/subscribe')
        .send({
          email: 'invalid-email',
          name: 'John Doe',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.data).toBeNull();
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message).toContain('email must be an email');
          expect(res.body.error).toBe('Bad Request');
        });
    });

    it('should reject missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/waitlist/subscribe')
        .send({
          email: 'test@example.com',
          // name is missing
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.data).toBeNull();
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message).toContain('name should not be empty');
          expect(res.body.message).toContain('name must be a string');
          expect(res.body.error).toBe('Bad Request');
        });
    });
  });

  describe('/api/v1/waitlist/emails (GET)', () => {
    beforeEach(async () => {
      // Add test data
      await prisma.waitlistUser.createMany({
        data: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' },
        ],
      });
    });

    it('should return all emails', () => {
      return request(app.getHttpServer())
        .get('/api/v1/waitlist/emails')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data).toHaveLength(2);
          expect(res.body.data[0]).toHaveProperty('email');
          expect(res.body.data[0]).toHaveProperty('name');
          expect(res.body.data[0]).toHaveProperty('id');
          expect(res.body.message).toBe('Operation completed successfully');
          expect(res.body.error).toBeNull();
        });
    });
  });
});
