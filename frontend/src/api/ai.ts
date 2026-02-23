/** AI API: image analysis and chat assistant. */
import client from './client'
import type { AIAnalysisResult, ChatResponse, PaginatedResponse, ChatMessage } from '../types'

export const analyzeImage = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client
    .post<AIAnalysisResult>('/ai/analyze-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const sendChatMessage = (content: string) =>
  client.post<ChatResponse>('/ai/chat', { content }).then((r) => r.data)

export const getChatHistory = (page = 1, page_size = 50) =>
  client
    .get<PaginatedResponse<ChatMessage>>('/ai/chat/history', { params: { page, page_size } })
    .then((r) => r.data)
