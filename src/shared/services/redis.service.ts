import Redis from 'ioredis';

class RedisService {
  private static instance: RedisService;
  private client: Redis;

  private constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.client.on('error', (error) => {
      console.error('Redis Error:', error);
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Add a token to the blacklist
   * @param token The token to blacklist
   * @param expiresIn Time in seconds until the token expires
   */
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.client.set(key, '1', 'EX', expiresIn);
  }

  /**
   * Check if a token is blacklisted
   * @param token The token to check
   * @returns boolean indicating if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.client.get(key);
    return result !== null;
  }

  /**
   * Calculate remaining time until token expires
   * @param token JWT token
   * @returns number of seconds until expiration
   */
  getTokenExpiryTime(token: string): number {
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const expiryTime = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      return Math.max(expiryTime - now, 0);
    } catch (error) {
      return 0;
    }
  }
}

export const redisService = RedisService.getInstance();
