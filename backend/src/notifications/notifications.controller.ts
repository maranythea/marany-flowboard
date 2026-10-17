import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@CurrentUser() user: JwtPayload) {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.notificationsService.getNotifications(user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.notificationsService.markAllAsRead(user.userId);
  }
}
