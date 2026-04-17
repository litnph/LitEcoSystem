import { apiRequest } from './client'

export type UserApiDto = {
  id: string
  username: string
  email: string
  fullName: string
  preferredLanguage: string
  isActive: boolean
  createdAt: string
  roles: string[]
}

export function getUsersApi() {
  return apiRequest<UserApiDto[]>('/users', { auth: true })
}
