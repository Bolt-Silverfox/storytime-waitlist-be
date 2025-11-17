import { Module } from '@nestjs/common';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { EmailModule } from '../email/email.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [EmailModule, DatabaseModule],
  controllers: [WaitlistController],
  providers: [WaitlistService],
})
export class WaitlistModule {}
