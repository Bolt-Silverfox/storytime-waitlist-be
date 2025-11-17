import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { WaitlistResponseDto } from './dto/waitlist-response.dto';

@Injectable()
export class WaitlistService {
  constructor(private readonly emailService: EmailService) {}

  async subscribe(
    createWaitlistDto: CreateWaitlistDto,
  ): Promise<WaitlistResponseDto> {
    const { email, name } = createWaitlistDto;

    // Here you would typically save to a database
    // For now, we'll just send the email

    await this.emailService.sendWelcomeEmail(email, name);

    return {
      message: 'Successfully added to waitlist',
      email,
      name,
    };
  }
}
