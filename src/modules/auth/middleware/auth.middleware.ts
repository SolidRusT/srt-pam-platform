import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { redisService } from '../../../shared/services/redis.service';

export interface AuthContext {
  playerId?: string;
  isAuthenticated: boolean;
}

export const getAuthContext = async (req: Request): Promise<AuthContext> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { isAuthenticated: false };
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const isBlacklisted = await redisService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      console.log('Token is blacklisted');
      return { isAuthenticated: false };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as { sub: string; type: string };
    
    if (decoded.type !== 'access') {
      return { isAuthenticated: false };
    }

    return {
      playerId: decoded.sub,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { isAuthenticated: false };
  }
};