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
    // Array of possible template directory paths
    const possiblePaths = [
      path.join(process.cwd(), 'dist', 'waitlist', 'templates'),
      path.join(process.cwd(), 'src', 'waitlist', 'templates'),
      path.join(__dirname, '..', 'waitlist', 'templates'), // Relative to email service
      path.join(__dirname, '..', '..', 'waitlist', 'templates'), // One more level up
    ];

    let templateDir: string | null = null;

    // Find the first existing directory
    for (const dir of possiblePaths) {
      if (fs.existsSync(dir)) {
        templateDir = dir;
        console.log(`✓ Found template directory: ${templateDir}`);
        break;
      }
    }

    if (!templateDir) {
      console.error(
        '❌ Template directory not found in any of these locations:',
      );
      possiblePaths.forEach((p) => console.error(`   - ${p}`));
      return;
    }

    const templateFiles = fs
      .readdirSync(templateDir)
      .filter((file) => file.endsWith('.hbs'));

    if (templateFiles.length === 0) {
      console.warn(`⚠ No .hbs template files found in ${templateDir}`);
      return;
    }

    templateFiles.forEach((file) => {
      const templateName = file.replace('.hbs', '');
      const templatePath = path.join(templateDir, file);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(templateContent);
      this.templates.set(templateName, compiledTemplate);
      console.log(`✓ Loaded template: ${templateName}`);
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const template = this.templates.get('welcome-email');
    if (!template) {
      console.error('Available templates:', Array.from(this.templates.keys()));
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
