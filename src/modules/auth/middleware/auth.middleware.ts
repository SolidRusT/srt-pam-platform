import { Request } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthContext {
  playerId?: string;
  isAuthenticated: boolean;
}

export const getAuthContext = (req: Request): AuthContext => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { isAuthenticated: false };
    }

    const token = authHeader.split(' ')[1];
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