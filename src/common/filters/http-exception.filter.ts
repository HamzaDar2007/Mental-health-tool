import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    };

    // Log error details
    this.logger.error(
      `HTTP ${status} Error: ${exception.message}`,
      exception.stack,
      `${request.method} ${request.url}`
    );

    // Don't expose internal errors to client
    if (status >= 500) {
      errorResponse.message = 'Internal server error';
    }

    response.status(status).json(errorResponse);
  }
}