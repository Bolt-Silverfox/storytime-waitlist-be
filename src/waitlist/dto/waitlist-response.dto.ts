import { ApiProperty } from '@nestjs/swagger';

export class WaitlistResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Successfully added to waitlist',
  })
  message: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name: string;
}
