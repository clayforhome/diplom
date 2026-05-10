import { httpClient } from './httpClient';
import type { CurrentUser, LoginRequest, LoginResponseData, RegisterRequest, RegisterResponseData } from '../types';

export const authService = {
  login(payload: LoginRequest): Promise<LoginResponseData> {
    return httpClient.post<LoginResponseData>('/auth/login', payload);
  },
  register(payload: RegisterRequest): Promise<RegisterResponseData> {
    return httpClient.post<RegisterResponseData>('/auth/sign-up', payload);
  },
  getCurrentUser(): Promise<CurrentUser> {
    return httpClient.get<CurrentUser>('/user');
  }
};
