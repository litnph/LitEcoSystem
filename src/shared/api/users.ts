import { apiRequest } from './client'

export type UserApiDto = {
  id: string
  username: string
  email: string
  fullName: string
  preferredLanguage: string
  isActive: boolean
  createdAt: string
}

export function getUsersApi() {
  return apiRequest<UserApiDto[]>('/users', { auth: true })
}

export type CreateUserPayload = {
  username: string
  password: string
  email: string
  fullName: string
}

export type UpdateUserPayload = {
  email: string
  fullName: string
}

export function createUserApi(payload: CreateUserPayload) {
  return apiRequest<UserApiDto>('/users', {
    method: 'POST',
    auth: true,
    body: payload,
  })
}

export function updateUserApi(id: string, payload: UpdateUserPayload) {
  return apiRequest<UserApiDto>(`/users/${id}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  })
}

export function deleteUserApi(id: string) {
  return apiRequest<void>(`/users/${id}`, { method: 'DELETE', auth: true })
}

export function setUserStatusApi(id: string, isActive: boolean) {
  return apiRequest<void>(`/users/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body: { isActive },
  })
}
