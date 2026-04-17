import { apiRequest } from './client'

export type MenuNode = {
  id: string
  key: string
  icon: string | null
  route: string | null
  displayOrder: number
  isActive: boolean
  requiresAuth: boolean
  parentId: string | null
  label: string
  description: string | null
  children: MenuNode[]
}

export function getMenuTreeApi(lang = 'vi') {
  return apiRequest<MenuNode[]>(`/menus?lang=${encodeURIComponent(lang)}`, {
    auth: true,
  })
}
