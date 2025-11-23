import { Injectable } from '@nestjs/common';
import { CreateContactDto } from '../contact/dto/create-contact.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class ContactService {
  constructor(private readonly emailService: EmailService) {}

  async handleContact(payload: CreateContactDto) {
    const { name, email, message } = payload;

    await this.emailService.sendContactEmail(name, email, message);

    return { message: 'Contact message sent successfully' };
  }
}
