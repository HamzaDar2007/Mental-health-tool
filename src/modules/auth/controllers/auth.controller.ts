import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() body: { username: string; password: string }) {
    // Simple hardcoded admin check for development
    if (body.username === 'admin' && body.password === 'admin123') {
      const token = await this.authService.generateToken({ 
        sub: 'admin', 
        username: 'admin',
        role: 'admin' 
      });
      return { access_token: token };
    }
    throw new Error('Invalid credentials');
  }
}