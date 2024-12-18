import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
  }

  async register(input: { email: string; password: string; username: string }) {
    // Check if user exists
    const existingPlayer = await prisma.player.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingPlayer) {
      throw new Error('Email or username already exists');
    }

    // Hash password
    const hashedPassword = await argon2.hash(input.password);

    // Create player
    const player = await prisma.player.create({
      data: {
        email: input.email,
        username: input.username,
        password: hashedPassword,
        profile: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(player.id);

    // Store refresh token
    await prisma.session.create({
      data: {
        playerId: player.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + this.parseTimeToMs(this.refreshTokenExpiresIn)),
      },
    });

    return {
      accessToken,
      refreshToken,
      player: {
        id: player.id,
        email: player.email,
        username: player.username,
      },
    };
  }

  async login(input: { email: string; password: string }) {
    // Find player
    const player = await prisma.player.findUnique({
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
    const { accessToken, refreshToken } = await this.generateTokens(player.id);

    // Store refresh token
    await prisma.session.create({
      data: {
        playerId: player.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + this.parseTimeToMs(this.refreshTokenExpiresIn)),
      },
    });

    return {
      accessToken,
      refreshToken,
      player: {
        id: player.id,
        email: player.email,
        username: player.username,
      },
    };
  }

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });
    return true;
  }

  private async generateTokens(playerId: string) {
    const accessToken = jwt.sign({ sub: playerId }, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = jwt.sign({ sub: playerId }, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  private parseTimeToMs(time: string): number {
    const unit = time.slice(-1);
    const value = parseInt(time.slice(0, -1));
    
    switch (unit) {
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value;
    }
  }
}