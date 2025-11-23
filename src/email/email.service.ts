import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { StorytimeWelcome } from './templates/storytime-welcome';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const encryption = this.configService.get('MAIL_ENCRYPTION', 'TLS');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get('MAIL_PORT', 587),
      secure: encryption.toUpperCase() === 'SSL', // true for SSL (465), false for TLS (587)
      auth: {
        user: this.configService.get('MAIL_USERNAME'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = await render(StorytimeWelcome({ username: name, email }));

    await this.transporter.sendMail({
      from: `"${this.configService.get('MAIL_FROM_NAME', 'StoryTime')}" <${this.configService.get('MAIL_FROM_ADDRESS', 'noreply@storytime.com')}>`,
      to: email,
      subject: 'Welcome to StoryTime Waitlist!',
      html,
    });
  }

  async sendContactEmail(name: string, senderEmail: string, message: string): Promise<void> {
    const html = `
      <h2>New Contact Message</h2>
      <p><b>From:</b> ${name} (${senderEmail})</p>
      <p><b>Message:</b></p>
      <p>${message}</p>
    `;

    await this.transporter.sendMail({
      from: `"StoryTime Contact" <${this.configService.get('MAIL_FROM_ADDRESS')}>`,
      to: this.configService.get('MAIL_FROM_ADDRESS'),
      subject: 'New Contact Request',
      html,
    });
    console.log('Contact email sent successfully!');
}
}
