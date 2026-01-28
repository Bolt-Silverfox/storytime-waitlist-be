import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WaitlistModule } from './waitlist/waitlist.module';
import { EmailModule } from './email/email.module';
import { DatabaseModule } from './database/database.module';
import { ContactModule } from './contact/contact.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    WaitlistModule,
    EmailModule,
    DatabaseModule,
    ContactModule,
  ],
})
export class AppModule {}
