import { httpClient } from './httpClient';
import type {
  AdminUser,
  DeletedUser,
  PaginatedResponse,
  GetRolesResponseData,
  GetUserRolesResponseData,
  RestoreUserResponseData,
  UpdateUserRolesRequest,
  UpdateUserRolesResponseData
} from '../types';

export const usersService = {
  listUsers(page: number, limit: number): Promise<PaginatedResponse<AdminUser>> {
    return httpClient.get<PaginatedResponse<AdminUser>>(`/users?page=${page}&limit=${limit}`);
  },
  listDeletedUsers(page: number, limit: number): Promise<PaginatedResponse<DeletedUser>> {
    return httpClient.get<PaginatedResponse<DeletedUser>>(`/users/deleted?page=${page}&limit=${limit}`);
  },
  deleteUser(id: string): Promise<unknown> {
    return httpClient.delete(`/users/${id}`);
  },
  restoreUser(id: string): Promise<RestoreUserResponseData> {
    return httpClient.patch<RestoreUserResponseData>(`/users/${id}/restore`);
  },
  getRoles(): Promise<GetRolesResponseData> {
    return httpClient.get<GetRolesResponseData>('/roles');
  },
  getUserRoles(userId: string): Promise<GetUserRolesResponseData> {
    return httpClient.get<GetUserRolesResponseData>(`/users/${userId}/roles`);
  },
  updateUserRoles(userId: string, request: UpdateUserRolesRequest): Promise<UpdateUserRolesResponseData> {
    return httpClient.patch<UpdateUserRolesResponseData>(`/users/${userId}/roles`, request);
  }
};
