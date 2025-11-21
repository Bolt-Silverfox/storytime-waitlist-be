import { Injectable, ConflictException } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { WaitlistDal } from './waitlist-dal';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { WaitlistResponseDto } from './dto/waitlist-response.dto';
import { WaitlistUser } from './entities/waitlist.entity';

@Injectable()
export class WaitlistService {
  constructor(
    private readonly emailService: EmailService,
    private readonly waitlistDal: WaitlistDal,
  ) {}

  async subscribe(
    createWaitlistDto: CreateWaitlistDto,
  ): Promise<WaitlistResponseDto> {
    const { email, name } = createWaitlistDto;

    // Check if email already exists using DAL
    const existingUser =
      await this.waitlistDal.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already registered in waitlist');
    }

    // Save to database using DAL
    const user = await this.waitlistDal.createWaitlistEntry({
      email,
      name,
    });

    // Send welcome email (with error handling)
    try {
      await this.emailService.sendWelcomeEmail(email, name);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to send welcome email:', errMsg);
      // Continue anyway - user is still added to waitlist
    }

    return {
      email,
      name,
    };
  }

  async getAllEmails(): Promise<WaitlistUser[]> {
    const result = await this.waitlistDal.paginate({
      orderBy: { created_at: 'desc' },
      page: 1,
      limit: 1000,
    });

    return result.data as WaitlistUser[];
  }

  async getPaginatedEmails(page: number = 1, limit: number = 10) {
    return this.waitlistDal.paginate({
      orderBy: { created_at: 'desc' },
      page,
      limit,
    });
  }
}
