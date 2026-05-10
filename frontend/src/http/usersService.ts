import { httpClient } from './httpClient';
import type { AdminUser, PaginatedResponse } from '../types';

export const usersService = {
  listUsers(page: number, limit: number): Promise<PaginatedResponse<AdminUser>> {
    return httpClient.get<PaginatedResponse<AdminUser>>(`/users?page=${page}&limit=${limit}`);
  }
};
