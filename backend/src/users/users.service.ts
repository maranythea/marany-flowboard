import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const bcryptService = bcrypt as unknown as {
  hash: (value: string, saltOrRounds: number | string) => Promise<string>;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(user: CreateUserDto) {
    const hashedPassword = await bcryptService.hash(user.password, 10);

    return this.prisma.user.create({
      data: {
        name: user.name.trim(),
        email: user.email.trim().toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateUser(id: number, user: UpdateUserDto) {
    await this.getUserById(id);

    const data: Record<string, unknown> = {};
    if (user.name !== undefined) data['name'] = user.name.trim();
    if (user.email !== undefined) data['email'] = user.email.trim().toLowerCase();
    if (user.password) {
      data['password'] = await bcryptService.hash(user.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: number) {
    await this.getUserById(id);

    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

