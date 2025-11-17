import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { StorytimeWelcome } from './templates/storytime-welcome';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get('EMAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = await render(StorytimeWelcome({ username: name, email }));

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM', 'noreply@storytime.com'),
      to: email,
      subject: 'Welcome to StoryTime Waitlist!',
      html,
    });
  }
}
