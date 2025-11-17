import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../database/prisma.service';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let prismaService: PrismaService;
  let emailService: EmailService;

  const mockPrismaService = {
    waitlistUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<WaitlistService>(WaitlistService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('subscribe', () => {
    const createWaitlistDto = {
      email: 'test@example.com',
      name: 'John Doe',
    };

    it('should successfully subscribe a new user', async () => {
      mockPrismaService.waitlistUser.findUnique.mockResolvedValue(null);
      mockPrismaService.waitlistUser.create.mockResolvedValue({
        id: '1',
        email: createWaitlistDto.email,
        name: createWaitlistDto.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.subscribe(createWaitlistDto);

      expect(mockPrismaService.waitlistUser.findUnique).toHaveBeenCalledWith({
        where: { email: createWaitlistDto.email },
      });
      expect(mockPrismaService.waitlistUser.create).toHaveBeenCalledWith({
        data: createWaitlistDto,
      });
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        createWaitlistDto.email,
        createWaitlistDto.name,
      );
      expect(result).toEqual({
        message: 'Successfully added to waitlist',
        email: createWaitlistDto.email,
        name: createWaitlistDto.name,
      });
    });

    it('should throw ConflictException for existing email', async () => {
      mockPrismaService.waitlistUser.findUnique.mockResolvedValue({
        id: '1',
        email: createWaitlistDto.email,
        name: 'Existing User',
      });

      await expect(service.subscribe(createWaitlistDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.waitlistUser.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe('getAllEmails', () => {
    it('should return all waitlist users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          name: 'User 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: 'User 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.waitlistUser.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllEmails();

      expect(mockPrismaService.waitlistUser.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockUsers);
    });
  });
});
