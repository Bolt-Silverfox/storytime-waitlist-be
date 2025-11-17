import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WaitlistModule } from './waitlist/waitlist.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WaitlistModule,
    EmailModule,
  ],
})
export class AppModule {}
