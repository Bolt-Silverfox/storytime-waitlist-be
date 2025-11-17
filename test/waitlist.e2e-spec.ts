import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { EmailService } from '../src/email/email.service';

describe('Waitlist (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const mockEmailService = {
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as main.ts
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
    await prisma.waitlistUser.deleteMany();
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
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('name', 'John Doe');
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
        .expect(409);
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
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toHaveProperty('email');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('id');
        });
    });
  });
});
