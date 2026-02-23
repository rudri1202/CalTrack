/** PDF bulk-import API. */
import client from './client'
import type { ImportResult } from '../types'

export const importPdf = (file: File): Promise<ImportResult> => {
  const form = new FormData()
  form.append('file', file)
  return client
    .post<ImportResult>('/import/pdf', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data)
}
