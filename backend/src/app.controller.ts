import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('api')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async getHealth() {
    let dbStatus = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (err: any) {
      dbStatus = `error: ${err?.message || 'cannot reach db'}`;
    }

    return {
      status: 'ok',
      message: 'Flowboard API is running',
      database: dbStatus,
      hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    };
  }
}
