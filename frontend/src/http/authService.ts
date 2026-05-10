import { httpClient } from './httpClient';
import type {
  ChangePasswordRequest,
  CurrentUser,
  LoginRequest,
  LoginResponseData,
  PasswordResponseData,
  RegisterRequest,
  RegisterResponseData,
  ResetPasswordRequest
} from '../types';

export const authService = {
  login(payload: LoginRequest): Promise<LoginResponseData> {
    return httpClient.post<LoginResponseData>('/auth/login', payload);
  },
  register(payload: RegisterRequest): Promise<RegisterResponseData> {
    return httpClient.post<RegisterResponseData>('/auth/sign-up', payload);
  },
  getCurrentUser(): Promise<CurrentUser> {
    return httpClient.get<CurrentUser>('/user');
  },
  changePassword(payload: ChangePasswordRequest): Promise<string> {
    return httpClient.post<string>('/auth/change-password', payload);
  },
  resetPassword(payload: ResetPasswordRequest): Promise<PasswordResponseData> {
    return httpClient.post<PasswordResponseData>('/auth/reset-password', payload);
  },
  logout(): Promise<unknown> {
    return httpClient.post('/auth/logout');
  }
};
