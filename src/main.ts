import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('StoryTime Waitlist API')
    .setDescription('API for managing StoryTime waitlist subscriptions')
    .setVersion('1.0')
    .addTag('waitlist')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.setGlobalPrefix('api/v1');

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('Swagger docs available at: http://localhost:3000/docs');
}
bootstrap();
