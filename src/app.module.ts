import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WaitlistModule } from './waitlist/waitlist.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [WaitlistModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
