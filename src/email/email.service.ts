import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { StorytimeWelcome } from './templates/storytime-welcome';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const encryption = this.configService.get<string>('MAIL_ENCRYPTION', 'TLS');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: Number(this.configService.get('MAIL_PORT')),
      secure: encryption.toUpperCase() === 'SSL', // SSL = port 465, TLS = port 587
      auth: {
        user: this.configService.get('MAIL_USERNAME'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = await render(StorytimeWelcome({ username: name, email }));

    await this.transporter.sendMail({
      from: `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM_ADDRESS')}>`,
      to: email,
      subject: 'Welcome to StoryTime Waitlist!',
      html,
    });
  }
}
