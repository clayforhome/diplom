import { ref } from 'vue'
import { jwtDecode } from 'jwt-decode'

const tokenKey = 'token'

interface JwtPayload {
  sub?: string
  exp: number
  [key: string]: unknown
}

class JwtService {
  private token = ref<string | null>(null)

  public saveToken = (token: string) => {
    localStorage.setItem(tokenKey, token)
    this.token.value = token
  }

  public getToken = (): string | null => {
    if (this.token.value != null) {
      if (!this.isTokenValid(this.token.value)) {
        this.removeToken()
        return null
      }
      return this.token.value
    }

    this.token.value = localStorage.getItem(tokenKey) as string | null
    return this.token.value
  }

  public clear = () => {
    this.token.value = null
    localStorage.removeItem(tokenKey)
  }

  public decodeToken = (token: string): JwtPayload | null => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }
      const payload = parts[1]!
      const decodedPayload = atob(payload)
      return JSON.parse(decodedPayload) as JwtPayload
    } catch {
      return null
    }
  }

  public removeToken = () => {
    if (this.token != null) {
      localStorage.removeItem(tokenKey)
      this.token.value = null
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const decoded: JwtPayload = jwtDecode(token)

      const currentTime = Math.floor(Date.now() / 1000)

      return decoded.exp > currentTime
    } catch (error) {
      console.error(error)
      return false
    }
  }
}

export default new JwtService()
