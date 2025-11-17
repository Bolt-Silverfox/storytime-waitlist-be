import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { EmailService } from '../email/email.service';
import { WaitlistDal } from './waitlist-dal';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let emailService: EmailService;
  let waitlistDal: WaitlistDal;

  const mockWaitlistDal = {
    findByEmail: jest.fn(),
    createWaitlistEntry: jest.fn(),
    paginate: jest.fn(),
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        { provide: WaitlistDal, useValue: mockWaitlistDal },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<WaitlistService>(WaitlistService);
    waitlistDal = module.get<WaitlistDal>(WaitlistDal);
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
      mockWaitlistDal.findByEmail.mockResolvedValue(null);
      mockWaitlistDal.createWaitlistEntry.mockResolvedValue({
        id: '1',
        email: createWaitlistDto.email,
        name: createWaitlistDto.name,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.subscribe(createWaitlistDto);

      expect(mockWaitlistDal.findByEmail).toHaveBeenCalledWith(
        createWaitlistDto.email,
      );
      expect(mockWaitlistDal.createWaitlistEntry).toHaveBeenCalledWith(
        createWaitlistDto,
      );
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        createWaitlistDto.email,
        createWaitlistDto.name,
      );
      expect(result).toEqual({
        email: createWaitlistDto.email,
        name: createWaitlistDto.name,
      });
    });

    it('should throw ConflictException for existing email', async () => {
      mockWaitlistDal.findByEmail.mockResolvedValue({
        id: '1',
        email: createWaitlistDto.email,
        name: 'Existing User',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.subscribe(createWaitlistDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockWaitlistDal.createWaitlistEntry).not.toHaveBeenCalled();
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
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: 'User 2',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockPaginatedResult = {
        data: mockUsers,
        paginationMeta: {
          page: 1,
          limit: 1000,
          total: 2,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
      };

      mockWaitlistDal.paginate.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllEmails();

      expect(mockWaitlistDal.paginate).toHaveBeenCalledWith({
        orderBy: { created_at: 'desc' },
        page: 1,
        limit: 1000,
      });
      expect(result).toEqual(mockUsers);
    });
  });
});
