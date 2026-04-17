import { apiRequest } from './client'

export type LoginRequest = {
  username: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiry: string
  user: {
    id: string
    username: string
    fullName: string
    email: string
    preferredLanguage: string
    roles: string[]
  }
}

export function loginApi(input: LoginRequest) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: {
      username: input.username.trim(),
      password: input.password,
    },
  })
}

export function logoutApi() {
  return apiRequest<void>('/auth/logout', { method: 'POST', auth: true })
}
