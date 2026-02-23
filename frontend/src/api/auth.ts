/** Auth API: register, login, current user. */
import client from './client'
import type { AuthTokens, User } from '../types'

export const register = (data: {
  email: string
  password: string
  name: string
  height_cm?: number | null
  weight_kg?: number | null
  age?: number | null
  gender?: 'male' | 'female' | null
  goal_type?: 'bulking' | 'cutting' | 'maintenance' | null
}) => client.post<AuthTokens>('/auth/register', data).then((r) => r.data)

export const login = (data: { email: string; password: string }) =>
  client.post<AuthTokens>('/auth/login', data).then((r) => r.data)

export const getMe = () =>
  client.get<User>('/auth/me').then((r) => r.data)
