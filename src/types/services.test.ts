import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Services } from './services';
import axios, { AxiosInstance } from 'axios';

vi.mock('axios');

describe('Services', () => {
  let services: Services;
  let mockAxios: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    mockAxios = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as jest.Mocked<AxiosInstance>;

    services = new Services(mockAxios);
  });

  describe('getUsers', () => {
    it('should fetch users successfully', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ];
      mockAxios.get.mockResolvedValueOnce({ data: mockUsers });

      // Act
      const result = await services.getUsers();

      // Assert
      expect(result).toEqual(mockUsers);
      expect(mockAxios.get).toHaveBeenCalledWith('/users');
    });

    it('should handle empty users list', async () => {
      // Arrange
      mockAxios.get.mockResolvedValueOnce({ data: [] });

      // Act
      const result = await services.getUsers();

      // Assert
      expect(result).toEqual([]);
      expect(mockAxios.get).toHaveBeenCalledWith('/users');
    });

    it('should handle network errors', async () => {
      // Arrange
      const error = new Error('Network Error');
      mockAxios.get.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(services.getUsers()).rejects.toThrow('Network Error');
      expect(mockAxios.get).toHaveBeenCalledWith('/users');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const newUser = { name: 'John Doe' };
      const createdUser = { id: 1, name: 'John Doe' };
      mockAxios.post.mockResolvedValueOnce({ data: createdUser });

      // Act
      const result = await services.createUser(newUser);

      // Assert
      expect(result).toEqual(createdUser);
      expect(mockAxios.post).toHaveBeenCalledWith('/users', newUser);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidUser = { name: '' };
      const error = new Error('Validation Error');
      mockAxios.post.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(services.createUser(invalidUser)).rejects.toThrow('Validation Error');
      expect(mockAxios.post).toHaveBeenCalledWith('/users', invalidUser);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = 1;
      const updatedUser = { name: 'John Updated' };
      const result = { id: 1, name: 'John Updated' };
      mockAxios.put.mockResolvedValueOnce({ data: result });

      // Act
      const response = await services.updateUser(userId, updatedUser);

      // Assert
      expect(response).toEqual(result);
      expect(mockAxios.put).toHaveBeenCalledWith(`/users/${userId}`, updatedUser);
    });

    it('should handle non-existent user', async () => {
      // Arrange
      const userId = 999;
      const updatedUser = { name: 'John Updated' };
      const error = new Error('User not found');
      mockAxios.put.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(services.updateUser(userId, updatedUser)).rejects.toThrow('User not found');
      expect(mockAxios.put).toHaveBeenCalledWith(`/users/${userId}`, updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = 1;
      mockAxios.delete.mockResolvedValueOnce({});

      // Act
      await services.deleteUser(userId);

      // Assert
      expect(mockAxios.delete).toHaveBeenCalledWith(`/users/${userId}`);
    });

    it('should handle deletion of non-existent user', async () => {
      // Arrange
      const userId = 999;
      const error = new Error('User not found');
      mockAxios.delete.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(services.deleteUser(userId)).rejects.toThrow('User not found');
      expect(mockAxios.delete).toHaveBeenCalledWith(`/users/${userId}`);
    });
  });
});