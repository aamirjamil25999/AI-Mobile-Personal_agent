import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'my-phone-agent-api',
      timestamp: new Date().toISOString()
    };
  }
}
