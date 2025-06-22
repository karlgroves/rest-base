/**
 * Authentication Tests
 *
 * Test authentication middleware
 * @author {{author}}
 */

const { 
  generateToken, 
  verifyToken, 
  hasRole 
} = require('../src/middleware/auth');

describe('Authentication Middleware', () => {
  describe('generateToken', () => {
    test('should generate valid JWT token', () => {
      const payload = { userId: '123', email: 'test@example.com', role: 'user' };
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should generate token with custom expiration', () => {
      const payload = { userId: '123' };
      const token = generateToken(payload, '1h');
      
      expect(token).toBeDefined();
      
      const decoded = verifyToken(token);
      expect(decoded).toBeTruthy();
      expect(decoded.userId).toBe('123');
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', () => {
      const payload = { userId: '123', email: 'test@example.com', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded.userId).toBe('123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('user');
    });

    test('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    test('should return null for malformed token', () => {
      const decoded = verifyToken('not.a.jwt');
      expect(decoded).toBeNull();
    });
  });

  describe('hasRole', () => {
    test('should check user role correctly', () => {
      const userSocket = { userRole: 'user' };
      const moderatorSocket = { userRole: 'moderator' };
      const adminSocket = { userRole: 'admin' };

      // User role checks
      expect(hasRole(userSocket, 'user')).toBe(true);
      expect(hasRole(userSocket, 'moderator')).toBe(false);
      expect(hasRole(userSocket, 'admin')).toBe(false);

      // Moderator role checks
      expect(hasRole(moderatorSocket, 'user')).toBe(true);
      expect(hasRole(moderatorSocket, 'moderator')).toBe(true);
      expect(hasRole(moderatorSocket, 'admin')).toBe(false);

      // Admin role checks
      expect(hasRole(adminSocket, 'user')).toBe(true);
      expect(hasRole(adminSocket, 'moderator')).toBe(true);
      expect(hasRole(adminSocket, 'admin')).toBe(true);
    });

    test('should handle missing role', () => {
      const socket = {};
      expect(hasRole(socket, 'user')).toBe(false);
    });

    test('should handle unknown role', () => {
      const socket = { userRole: 'unknown' };
      expect(hasRole(socket, 'user')).toBe(false);
    });
  });

  describe('Token Expiration', () => {
    test('should handle expired tokens', () => {
      // Create an already expired token by manipulating JWT directly
      const expiredPayload = { 
        userId: '123',
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600  // 1 hour ago
      };
      
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET, { noTimestamp: true });
      const decoded = verifyToken(expiredToken);
      
      expect(decoded).toBeNull();
    });
  });
});