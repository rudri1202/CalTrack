/** Bulk import food entries from a PDF nutrition diary. */
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileText, CheckCircle, AlertCircle, X, ArrowRight } from 'lucide-react'
import { importPdf } from '../api/import'
import type { ImportResult } from '../types'

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [topError, setTopError] = useState<string | null>(null)

  const [isDragOver, setIsDragOver] = useState(false)

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setTopError('Only PDF files are accepted.')
      return
    }
    setTopError(null)
    setFile(f)
    setResult(null)
    setStatus('idle')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setStatus('loading')
    setResult(null)
    setTopError(null)
    try {
      const res = await importPdf(file)
      setResult(res)
      setStatus('done')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Upload failed. Please try again.'
      setTopError(msg)
      setStatus('error')
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setStatus('idle')
    setTopError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Upload className="text-primary-600 dark:text-primary-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import from PDF</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Bulk-import food entries from an exported nutrition diary</p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        The PDF must contain a table with columns like <strong>food name</strong>, <strong>calories</strong>, and optionally date, meal type, protein, carbs, fat.
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText size={36} className="text-primary-500" />
            <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={36} className="text-gray-400" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">Drop a PDF here or click to browse</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Max 10 MB</p>
          </div>
        )}
      </div>

      {topError && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {topError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || status === 'loading'}
          className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {status === 'loading' ? 'Importing...' : 'Import Entries'}
        </button>
        {file && (
          <button
            onClick={reset}
            className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Import Results</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{result.imported}</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">Entries imported</p>
            </div>
            <div className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-3xl font-bold text-gray-500 dark:text-gray-400">{result.failed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rows skipped</p>
            </div>
          </div>

          {result.imported > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                <CheckCircle size={16} />
                Successfully added {result.imported} {result.imported === 1 ? 'entry' : 'entries'} to your meal history.
              </div>
              <Link
                to="/meals"
                className="flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                View in Meal Log <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issues ({result.errors.length})
              </p>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
