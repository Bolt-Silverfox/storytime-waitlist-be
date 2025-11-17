import { Injectable, ConflictException } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../database/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { WaitlistResponseDto } from './dto/waitlist-response.dto';
import { WaitlistUser } from './entities/waitlist.entity';

@Injectable()
export class WaitlistService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prismaService: PrismaService,
  ) {}

  async subscribe(
    createWaitlistDto: CreateWaitlistDto,
  ): Promise<WaitlistResponseDto> {
    const { email, name } = createWaitlistDto;

    // Check if email already exists
    const existingUser = await this.prismaService.waitlistUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered in waitlist');
    }

    // Save to database
    const user = await this.prismaService.waitlistUser.create({
      data: {
        email,
        name,
      },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(email, name);

    return {
      message: 'Successfully added to waitlist',
      email,
      name,
    };
  }

  async getAllEmails(): Promise<WaitlistUser[]> {
    return this.prismaService.waitlistUser.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
