import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import jwtService from '@/services/jwtService.ts'

class HttpClient {
  private instance: AxiosInstance

  constructor(baseURL: string = '') {
    this.instance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    function setAuthorizationHeader(config: InternalAxiosRequestConfig<unknown>) {
      if (config.headers['Authorization'] != null) {
        return
      }

      const token = jwtService.getToken()

      if (token != null) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }

    this.instance.interceptors.request.use(
      (config) => {
        setAuthorizationHeader(config)
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )
  }

  public async get<T>(
    url: string,
    queryParams?: Record<string, unknown>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get<T>(url, {
      ...config,
      params: queryParams,
    })
    return response.data
  }

  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return await this.instance.post<T>(url, data, config)
  }

  public async postForm<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return await this.instance.postForm<T>(url, data, config)
  }

  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return await this.instance.put<T>(url, data, config)
  }

  public async putForm<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return await this.instance.putForm<T>(url, data, config)
  }
}

export default new HttpClient()
