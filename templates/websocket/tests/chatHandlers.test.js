/**
 * Chat Handlers Tests
 *
 * Test chat event handlers
 * @author {{author}}
 */

const { 
  joinChat, 
  leaveChat, 
  sendMessage, 
  handleTyping, 
  getChatHistory 
} = require('../src/sockets/chatHandlers');

// Mock socket object
const createMockSocket = (userId = 'user123') => ({
  id: 'socket123',
  userId,
  join: jest.fn(),
  leave: jest.fn(),
  to: jest.fn(() => ({
    emit: jest.fn()
  })),
  emit: jest.fn()
});

describe('Chat Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('joinChat', () => {
    test('should join chat room successfully', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = { roomId: 'room123' };

      await joinChat(socket, data, callback);

      expect(socket.join).toHaveBeenCalledWith('chat:room123');
      expect(callback).toHaveBeenCalledWith({
        success: true,
        roomId: 'room123',
        participants: 1,
        timestamp: expect.any(String)
      });
    });

    test('should require room ID', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = {};

      await joinChat(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        error: 'Room ID is required'
      });
    });

    test('should work without callback', async () => {
      const socket = createMockSocket();
      const data = { roomId: 'room123' };

      await expect(joinChat(socket, data)).resolves.not.toThrow();
    });
  });

  describe('leaveChat', () => {
    test('should leave chat room successfully', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = { roomId: 'room123' };

      // First join the room
      await joinChat(socket, data);
      
      // Then leave it
      await leaveChat(socket, data, callback);

      expect(socket.leave).toHaveBeenCalledWith('chat:room123');
      expect(callback).toHaveBeenCalledWith({
        success: true,
        roomId: 'room123',
        timestamp: expect.any(String)
      });
    });

    test('should require room ID', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = {};

      await leaveChat(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        error: 'Room ID is required'
      });
    });
  });

  describe('sendMessage', () => {
    test('should send message successfully', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = {
        roomId: 'room123',
        message: 'Hello world!',
        type: 'text'
      };

      await sendMessage(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: expect.objectContaining({
          id: expect.any(String),
          userId: 'user123',
          roomId: 'room123',
          message: 'Hello world!',
          type: 'text',
          timestamp: expect.any(String)
        }),
        timestamp: expect.any(String)
      });
    });

    test('should require room ID and message', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();

      // Missing room ID
      await sendMessage(socket, { message: 'Hello' }, callback);
      expect(callback).toHaveBeenCalledWith({
        error: 'Room ID and message are required'
      });

      callback.mockClear();

      // Missing message
      await sendMessage(socket, { roomId: 'room123' }, callback);
      expect(callback).toHaveBeenCalledWith({
        error: 'Room ID and message are required'
      });
    });

    test('should reject long messages', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = {
        roomId: 'room123',
        message: 'a'.repeat(1001), // Too long
        type: 'text'
      };

      await sendMessage(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        error: 'Message too long (max 1000 characters)'
      });
    });

    test('should validate message type', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = {
        roomId: 'room123',
        message: 'Hello',
        type: 'invalid'
      };

      await sendMessage(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        error: 'Invalid message type'
      });
    });

    test('should default to text message type', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = {
        roomId: 'room123',
        message: 'Hello'
      };

      await sendMessage(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: expect.objectContaining({
          type: 'text'
        }),
        timestamp: expect.any(String)
      });
    });
  });

  describe('handleTyping', () => {
    test('should handle typing indicator', async () => {
      const socket = createMockSocket();
      const mockTo = { emit: jest.fn() };
      socket.to.mockReturnValue(mockTo);
      const callback = jest.fn();
      const data = {
        roomId: 'room123',
        isTyping: true
      };

      await handleTyping(socket, data, callback);

      expect(socket.to).toHaveBeenCalledWith('chat:room123');
      expect(mockTo.emit).toHaveBeenCalledWith('chat:typing', {
        userId: 'user123',
        roomId: 'room123',
        isTyping: true,
        timestamp: expect.any(String)
      });
      expect(callback).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String)
      });
    });

    test('should require room ID', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = { isTyping: true };

      await handleTyping(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        error: 'Room ID is required'
      });
    });
  });

  describe('getChatHistory', () => {
    test('should get chat history', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      
      // Use a unique room ID for this test
      const uniqueRoomId = `room-${Math.random().toString(36).substr(2, 9)}`;
      
      // First send some messages to create history
      await sendMessage(socket, {
        roomId: uniqueRoomId,
        message: 'Message 1'
      });
      await sendMessage(socket, {
        roomId: uniqueRoomId,
        message: 'Message 2'
      });

      // Then get history
      const data = { roomId: uniqueRoomId };
      await getChatHistory(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        success: true,
        roomId: uniqueRoomId,
        messages: expect.arrayContaining([
          expect.objectContaining({
            message: 'Message 1'
          }),
          expect.objectContaining({
            message: 'Message 2'
          })
        ]),
        total: 2,
        limit: 50,
        offset: 0,
        timestamp: expect.any(String)
      });
    });

    test('should require room ID', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = {};

      await getChatHistory(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        error: 'Room ID is required'
      });
    });

    test('should handle pagination', async () => {
      const socket = createMockSocket();
      const callback = jest.fn();
      const data = {
        roomId: 'room123',
        limit: 1,
        offset: 0
      };

      await getChatHistory(socket, data, callback);

      expect(callback).toHaveBeenCalledWith({
        success: true,
        roomId: 'room123',
        messages: expect.any(Array),
        total: expect.any(Number),
        limit: 1,
        offset: 0,
        timestamp: expect.any(String)
      });
    });
  });
});