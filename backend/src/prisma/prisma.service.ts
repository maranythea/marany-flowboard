import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
      await this.ensureTablesExist();
    } catch (error) {
      this.logger.error('Failed to connect to database during initialization:', error);
    }
  }

  private async ensureTablesExist() {
    try {
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "email" TEXT NOT NULL UNIQUE,
            "password" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Project" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
            "title" TEXT NOT NULL,
            "message" TEXT NOT NULL,
            "type" TEXT NOT NULL DEFAULT 'info',
            "isRead" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
      `);

      this.logger.log('Database tables verified/created successfully');
    } catch (err) {
      this.logger.warn('Auto table creation skipped or failed:', err);
    }
  }
}
