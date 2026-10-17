import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const bcryptService = bcrypt as unknown as {
  hash: (value: string, saltRounds: number) => Promise<string>;
  compare: (value: string, encrypted: string) => Promise<boolean>;
};

const DEFAULT_GOOGLE_CLIENT_ID =
  '583062011127-4uad5tcgiutk2ncq3p9etg3vh8f2jlrf.apps.googleusercontent.com';

@Injectable()
export class AuthService {
  private get googleClientId(): string {
    return (
      process.env.GOOGLE_CLIENT_ID?.trim() || DEFAULT_GOOGLE_CLIENT_ID
    );
  }

  private get googleClient(): OAuth2Client {
    return new OAuth2Client(this.googleClientId);
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // =========================================================
  // SEED INITIAL NOTIFICATIONS FOR NEW USERS
  // =========================================================
  private async seedInitialNotifications(userId: number): Promise<void> {
    try {
      await this.prisma.notification.createMany({
        data: [
          {
            userId,
            title: 'Welcome to FlowBoard Life OS',
            message:
              'Your personal workspace is ready. Track tasks, projects, habits, and goals.',
            type: 'info',
            isRead: false,
          },
          {
            userId,
            title: 'Nova AI Assistant is Online',
            message:
              'Nova AI is calibrated to help organize your schedule and break down complex projects.',
            type: 'ai',
            isRead: false,
          },
          {
            userId,
            title: 'Quick Command Palette (⌘K)',
            message:
              'Press ⌘K or Ctrl+K anytime to quickly search and jump anywhere in your workspace.',
            type: 'tip',
            isRead: false,
          },
        ],
      });
    } catch (error) {
      console.warn('Could not seed initial notifications:', error);
    }
  }

  // =========================================================
  // EMAIL / PASSWORD REGISTER
  // =========================================================

  async register(data: RegisterDto) {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Email is already registered. Please sign in.',
      );
    }

    const hashedPassword = await bcryptService.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    await this.seedInitialNotifications(user.id);

    return this.createLoginResponse(user.id, user.name, user.email);
  }

  // =========================================================
  // EMAIL / PASSWORD LOGIN
  // =========================================================

  async login(data: LoginDto) {
    const email = data.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account was registered using Google. Please sign in with Google.',
      );
    }

    const passwordMatches = await bcryptService.compare(
      data.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createLoginResponse(user.id, user.name, user.email);
  }

  // =========================================================
  // GOOGLE REGISTER
  // =========================================================

  async googleRegister(data: GoogleLoginDto) {
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: data.credential,
        audience: this.googleClientId,
      });

      payload = ticket.getPayload();
    } catch (googleError: any) {
      console.error('Google registration token verification failed:', googleError);
      throw new UnauthorizedException(
        googleError?.message || 'Google token verification failed',
      );
    }

    if (!payload) {
      throw new UnauthorizedException('Invalid Google account');
    }

    const email = payload.email?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException('Google account email is missing');
    }

    try {
      // Check whether user account already exists.
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return this.createLoginResponse(
          existingUser.id,
          existingUser.name,
          existingUser.email,
        );
      }

      const name =
        (payload.name ??
          [payload.given_name, payload.family_name]
            .filter(Boolean)
            .join(' ')) ||
        email.split('@')[0];

      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: '',
        },
      });

      await this.seedInitialNotifications(user.id);

      return this.createLoginResponse(user.id, user.name, user.email);
    } catch (dbError: any) {
      console.error('Database operation failed during Google registration:', dbError);
      throw new InternalServerErrorException(
        'Database operation failed: ' + (dbError?.message || 'cannot reach database'),
      );
    }
  }

  // =========================================================
  // GOOGLE LOGIN
  // =========================================================

  async googleLogin(data: GoogleLoginDto) {
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: data.credential,
        audience: this.googleClientId,
      });

      payload = ticket.getPayload();
    } catch (googleError: any) {
      console.error('Google login token verification failed:', googleError);
      throw new UnauthorizedException(
        googleError?.message || 'Google token verification failed',
      );
    }

    if (!payload) {
      throw new UnauthorizedException('Invalid Google account');
    }

    const email = payload.email?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException('Google account email is missing');
    }

    try {
      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      // If user was deleted from database, automatically recreate it for Google sign-in
      if (!user) {
        const name =
          (payload.name ??
            [payload.given_name, payload.family_name]
              .filter(Boolean)
              .join(' ')) ||
          email.split('@')[0];

        user = await this.prisma.user.create({
          data: {
            name,
            email,
            password: '',
          },
        });

        await this.seedInitialNotifications(user.id);
      }

      return await this.createLoginResponse(user.id, user.name, user.email);
    } catch (dbError: any) {
      console.error('Database operation failed during Google login:', dbError);
      throw new InternalServerErrorException(
        'Database operation failed: ' + (dbError?.message || 'cannot reach database'),
      );
    }
  }

  // =========================================================
  // GET GOOGLE PROFILE
  // =========================================================

  async getGoogleProfile(data: GoogleLoginDto) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: data.credential,
        audience: this.googleClientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid Google account');
      }

      if (!payload.email) {
        throw new UnauthorizedException('Google account email is missing');
      }

      return {
        firstName: payload.given_name ?? '',
        lastName: payload.family_name ?? '',
        email: payload.email.trim().toLowerCase(),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Google profile verification failed:', error);

      throw new UnauthorizedException('Unable to verify Google account');
    }
  }

  private async createLoginResponse(
    userId: number,
    name: string,
    email: string,
  ) {
    const payload = {
      sub: userId,
      email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: userId,
        name,
        email,
      },
    };
  }
}
