import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string;  // Player ID
  email: string;
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  private generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  async register(input: { email: string; password: string; username: string }) {
    // Check if user exists
    const existingPlayer = await this.prisma.player.findFirst({
      where: {
        OR: [
          { email: input.email },
          { username: input.username }
        ]
      }
    });

    if (existingPlayer) {
      throw new Error('Email or username already exists');
    }

    // Hash password
    const hashedPassword = await argon2.hash(input.password);

    // Create player
    const player = await this.prisma.player.create({
      data: {
        email: input.email,
        username: input.username,
        password: hashedPassword,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens({
      sub: player.id,
      email: player.email,
    });

    // Create session
    await this.prisma.session.create({
      data: {
        playerId: player.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      player,
    };
  }

  async login(input: { email: string; password: string }) {
    // Find player
    const player = await this.prisma.player.findUnique({
      where: { email: input.email },
    });

    if (!player) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const validPassword = await argon2.verify(player.password, input.password);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens({
      sub: player.id,
      email: player.email,
    });

    // Create session
    await this.prisma.session.create({
      data: {
        playerId: player.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      player,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: { token: refreshToken },
    });
    return true;
  }
}