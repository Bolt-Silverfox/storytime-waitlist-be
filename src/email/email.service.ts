import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

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

    this.loadTemplates();
  }

  private loadTemplates() {
    // Try dist directory first (production), then src directory (development/testing)
    let templateDir = path.join(process.cwd(), 'dist', 'waitlist', 'templates');
    
    if (!fs.existsSync(templateDir)) {
      templateDir = path.join(process.cwd(), 'src', 'waitlist', 'templates');
    }

    if (!fs.existsSync(templateDir)) {
      console.warn('Template directory not found, skipping template loading');
      return;
    }

    const templateFiles = fs
      .readdirSync(templateDir)
      .filter((file) => file.endsWith('.hbs'));

    templateFiles.forEach((file) => {
      const templateName = file.replace('.hbs', '');
      const templatePath = path.join(templateDir, file);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(templateContent);
      this.templates.set(templateName, compiledTemplate);
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const template = this.templates.get('welcome-email');
    if (!template) {
      throw new Error('Welcome email template not found');
    }

    const html = template({
      name,
      email,
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM', 'noreply@storytime.com'),
      to: email,
      subject: 'Welcome to StoryTime Waitlist!',
      html,
    });
  }
}
