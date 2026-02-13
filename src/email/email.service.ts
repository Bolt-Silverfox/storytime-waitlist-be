import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.validation';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { StorytimeWelcome } from './templates/storytime-welcome';
import { ContactConfirmation } from './templates/contact-confirmation';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService<Env, true>) {
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
      from: `"${this.configService.get('MAIL_FROM_NAME', 'StoryTime')}" <${this.configService.get('MAIL_FROM_ADDRESS', 'team@storytimeapp.me')}>`,
      to: email,
      subject: 'Welcome to StoryTime Waitlist!',
      html,
    });
  }

  async sendContactConfirmationEmail(
    email: string,
    name: string,
  ): Promise<void> {
    const html = await render(ContactConfirmation({ name }));

    await this.transporter.sendMail({
      from: `"${this.configService.get('MAIL_FROM_NAME', 'StoryTime')}" <${this.configService.get('MAIL_FROM_ADDRESS', 'team@storytimeapp.me')}>`,
      to: email,
      subject: "We've Received Your Message - StoryTime",
      html,
    });
  }

  /**
   * Escapes HTML special characters to prevent HTML injection
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async sendContactNotificationEmail(
    name: string,
    email: string,
    message: string,
  ): Promise<void> {
    const adminEmail = this.configService.get(
      'MAIL_FROM_ADDRESS',
      'team@storytimeapp.me',
    );

    // Escape user input to prevent HTML injection
    const escapedName = this.escapeHtml(name);
    const escapedEmail = this.escapeHtml(email);
    const escapedMessage = this.escapeHtml(message).replace(/\n/g, '<br>');

    // For subject line, strip newlines but don't HTML escape to avoid displaying entities
    const subjectName = name.replace(/[\r\n]+/g, ' ').trim();

    await this.transporter.sendMail({
      from: `"${this.configService.get('MAIL_FROM_NAME', 'StoryTime')}" <${this.configService.get('MAIL_FROM_ADDRESS', 'team@storytimeapp.me')}>`,
      to: adminEmail,
      subject: `New Contact Form Submission from ${subjectName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapedName}</p>
        <p><strong>Email:</strong> ${escapedEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${escapedMessage}</p>
      `,
    });
  }
}
