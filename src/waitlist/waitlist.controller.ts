import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { WaitlistResponseDto } from './dto/waitlist-response.dto';
import { WaitlistUser } from './entities/waitlist.entity';

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
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async subscribe(
    @Body() createWaitlistDto: CreateWaitlistDto,
  ): Promise<WaitlistResponseDto> {
    return this.waitlistService.subscribe(createWaitlistDto);
  }

  @Get('emails')
  @ApiOperation({ summary: 'Get all waitlist emails (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of all waitlist users',
    type: [WaitlistUser],
  })
  async getAllEmails(): Promise<WaitlistUser[]> {
    return this.waitlistService.getAllEmails();
  }

  @Get('emails/paginated')
  async getPaginatedEmails(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.waitlistService.getPaginatedEmails(
      parseInt(page),
      parseInt(limit),
    );
  }
}
