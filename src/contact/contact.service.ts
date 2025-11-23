import { Injectable } from '@nestjs/common';
import { CreateContactDto } from '../contact/dto/create-contact.dto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    ) {}

  async handleContact(payload: CreateContactDto) {
    const { name, email, message } = payload;

    await this.prisma.contactMessage.create({
      data: { name, email, message },
    });

    await this.emailService.sendContactEmail(name, email, message);

    return { message: 'Contact message sent successfully' };
  }
}
