import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly emailService: EmailService) {}

  async submitContactForm(createContactDto: CreateContactDto): Promise<void> {
    const { name, email, message } = createContactDto;

    // Send confirmation email to the user
    try {
      await this.emailService.sendContactConfirmationEmail(email, name);
      this.logger.log(`Contact confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send contact confirmation email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Send notification email to the team
    try {
      await this.emailService.sendContactNotificationEmail(
        name,
        email,
        message,
      );
      this.logger.log(`Contact notification email sent to admin`);
    } catch (error) {
      this.logger.error(
        `Failed to send contact notification email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
