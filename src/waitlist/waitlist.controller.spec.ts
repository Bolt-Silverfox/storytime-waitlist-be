import { Test, TestingModule } from '@nestjs/testing';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../database/prisma.service';

describe('WaitlistController', () => {
  let controller: WaitlistController;

  const mockWaitlistService = {
    subscribe: jest.fn().mockResolvedValue({
      email: 'test@example.com',
      name: 'John Doe',
    }),
    getAllEmails: jest
      .fn()
      .mockResolvedValue([
        { id: '1', email: 'test@example.com', name: 'John Doe' },
      ]),
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
  };

  const mockPrismaService = {
    waitlistUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WaitlistController],
      providers: [
        { provide: WaitlistService, useValue: mockWaitlistService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<WaitlistController>(WaitlistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
