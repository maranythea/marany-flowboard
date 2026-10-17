import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProjectsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
