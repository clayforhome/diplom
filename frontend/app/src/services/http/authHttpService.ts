import httpClient from '@/services/http/httpClient.ts'
import type {
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/services/http/httpResponses.ts'
import jwtService from '@/services/jwtService.ts'

class AuthHttpService {
  public login(login: string, password: string) {
    return httpClient.post<LoginResponse>('/api/v1/auth/login', {
      login: login,
      password: password,
    })
  }

  public register(data: RegisterRequest) {
    return httpClient.post<RegisterResponse>('/api/v1/auth/register', data)
  }

  public logout() {
    const token = localStorage.getItem('token')
    if (token) {
      jwtService.removeToken()
      localStorage.removeItem('token')
    }
  }
}

export default new AuthHttpService()
