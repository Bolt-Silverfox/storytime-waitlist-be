import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from './api-response.dto';

export class PaginatedResponseDto<T> extends ApiResponseDto<T[]> {
  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 10,
      total: 50,
      total_pages: 5,
      has_next: true,
      has_previous: false,
    },
  })
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}
