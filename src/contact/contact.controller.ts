import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit contact form' })
  @ApiResponse({
    status: 200,
    description: 'Contact form submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input' })
  async submitContactForm(
    @Body() createContactDto: CreateContactDto,
  ): Promise<{ message: string }> {
    await this.contactService.submitContactForm(createContactDto);
    return {
      message:
        'Thank you for contacting us. We will get back to you as soon as possible.',
    };
  }
}
