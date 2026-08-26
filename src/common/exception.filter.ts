// File: src/common/exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

export interface ErrorResponse {
  status: string;
  data: null;
  message: string;
  error: string | object;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Unknown error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || 'Error occurred';
        error = responseObj.error || responseObj.message || 'Error details';
      }
    } else if (exception instanceof Error) {
      message = 'Internal server error';
      error = exception.message;
    }

    // Report server-side failures to Sentry; skip expected 4xx client errors.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.captureException(exception);
    }

    const errorResponse: ErrorResponse = {
      status: 'error',
      data: null,
      message,
      error,
    };

    response.status(status).json(errorResponse);
  }
}
