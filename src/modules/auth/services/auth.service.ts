import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';  // Added crypto import

const prisma = new PrismaClient();

interface TokenPayload {
  sub: string;        // Player ID
  jti?: string;       // JWT ID (used for refresh tokens)
  type: 'access' | 'refresh';
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
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

    // Store session
    await this.createSession(player.id, refreshToken);

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

  async login(input: { email: string; password: string }, clientInfo?: { userAgent?: string; ipAddress?: string }) {
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

    // Store session with client info
    await this.createSession(player.id, refreshToken, clientInfo);

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
    await this.revokeSession(refreshToken);
    return true;
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if session exists and is valid
      const session = await prisma.session.findFirst({
        where: {
          token: this.hashToken(token),
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!session) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new tokens
      const { accessToken, refreshToken } = await this.generateTokens(decoded.sub);

      // Update session with new refresh token
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: this.hashToken(refreshToken),
          expiresAt: new Date(Date.now() + this.parseTimeToMs(this.refreshTokenExpiresIn)),
        },
      });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async getActiveSessions(playerId: string) {
    return prisma.session.findMany({
      where: {
        playerId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async revokeSession(token: string) {
    await prisma.session.deleteMany({
      where: { token: this.hashToken(token) },
    });
    return true;
  }

  async revokeAllSessions(playerId: string, exceptTokenId?: string) {
    await prisma.session.deleteMany({
      where: {
        playerId,
        ...(exceptTokenId && { NOT: { id: exceptTokenId } }),
      },
    });
    return true;
  }

  private async createSession(playerId: string, refreshToken: string, clientInfo?: { userAgent?: string; ipAddress?: string }) {
    return prisma.session.create({
      data: {
        playerId,
        token: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.parseTimeToMs(this.refreshTokenExpiresIn)),
        userAgent: clientInfo?.userAgent,
        ipAddress: clientInfo?.ipAddress,
      },
    });
  }

  private async generateTokens(playerId: string) {
    // Generate access token
    const accessToken = jwt.sign(
      { 
        sub: playerId,
        type: 'access'
      } as TokenPayload,
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    // Generate refresh token with unique ID
    const jti = this.generateTokenId();
    const refreshToken = jwt.sign(
      { 
        sub: playerId,
        jti,
        type: 'refresh'
      } as TokenPayload,
      this.jwtSecret,
      { expiresIn: this.refreshTokenExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  private generateTokenId(): string {
    return randomBytes(16).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseTimeToMs(time: string): number {
    const unit = time.slice(-1);
    const value = parseInt(time.slice(0, -1));
    
    switch (unit) {
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value;
    }
  }
}