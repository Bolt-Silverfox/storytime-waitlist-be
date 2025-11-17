import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { WaitlistResponseDto } from './dto/waitlist-response.dto';

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to waitlist' })
  @ApiResponse({
    status: 201,
    description: 'Successfully added to waitlist',
    type: WaitlistResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async subscribe(
    @Body() createWaitlistDto: CreateWaitlistDto,
  ): Promise<WaitlistResponseDto> {
    return this.waitlistService.subscribe(createWaitlistDto);
  }
}
