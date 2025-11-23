import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminService } from '../services/admin.service';

@ApiTags('admin')
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved' })
  async getMetrics() {
    return await this.adminService.getSystemMetrics();
  }

  @Get('health-check')
  @ApiOperation({ summary: 'Admin health check' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async healthCheck() {
    return await this.adminService.getHealthStatus();
  }

  @Post('seed-data')
  @ApiOperation({ summary: 'Seed default data' })
  @ApiResponse({ status: 200, description: 'Data seeded successfully' })
  async seedData() {
    return await this.adminService.seedDefaultData();
  }
}