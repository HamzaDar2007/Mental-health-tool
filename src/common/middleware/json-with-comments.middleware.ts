import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JsonWithCommentsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.headers['content-type']?.includes('application/json') && !req.body) {
      let body = '';
      
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        if (body.includes('//')) {
          try {
            // Strip single-line comments (// comment)
            const cleanedBody = body.replace(/\/\/.*$/gm, '');
            
            // Parse the cleaned JSON
            const parsedBody = JSON.parse(cleanedBody);
            
            // Replace the body with parsed JSON
            req.body = parsedBody;
          } catch (error) {
            // If parsing fails, keep original body
          }
        }
        next();
      });
    } else {
      next();
    }
  }
}