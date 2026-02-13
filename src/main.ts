import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/response.interceptor';
import { AllExceptionsFilter } from './common/exception.filter';
import { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService<Env, true>);

  const port = configService.get('PORT', { infer: true });
  const frontendUrl = configService.get('FRONTEND_URL', { infer: true });

  // Enable CORS with protection
  app.enableCors({
    origin: (origin, callback) => {
      // Match storytimeapp.me and all subdomains (e.g., www.storytimeapp.me, app.storytimeapp.me)
      const storytimePattern = /^https?:\/\/([a-z0-9-]+\.)*storytimeapp\.me$/i;
      // Match localhost on any port (e.g., localhost:3000, localhost:5173, 127.0.0.1:8080)
      const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

      const allowedOrigins = frontendUrl
        ? frontendUrl.split(',').map((o) => o.trim())
        : ['http://localhost:3000'];

      // Allow requests with no origin (mobile apps, Postman, etc.) in development
      if (!origin && configService.get('NODE_ENV') === 'development') {
        return callback(null, true);
      }

      if (
        !origin ||
        storytimePattern.test(origin) ||
        localhostPattern.test(origin) ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  });

  // Apply global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Apply global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

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

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/docs`);
}
bootstrap();
