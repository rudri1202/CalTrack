/** Image upload modal: analyze food photo, prefill meal form, save entry. */
import { useState, useRef } from 'react'
import { Upload, X, Loader2, Camera } from 'lucide-react'
import { analyzeImage } from '../api/ai'
import { createEntry } from '../api/entries'
import type { AIAnalysisResult, FoodEntryCreate, MealType } from '../types'
import MealEntryForm from '../components/MealEntryForm'
import { format } from 'date-fns'

interface Props {
  onClose: () => void
  onEntryCreated: () => void
}

export default function ImageUpload({ onClose, onEntryCreated }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AIAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setIsAnalyzing(true)
    setError(null)
    try {
      const data = await analyzeImage(file)
      setResult(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to analyze image'
      setError(msg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSaveEntry = async (data: FoodEntryCreate) => {
    setIsSaving(true)
    try {
      await createEntry(data)
      onEntryCreated()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="text-primary-600" size={20} />
          <h2 className="font-semibold text-gray-900">AI Food Scanner</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Upload a photo of your meal or a nutrition label and AI will extract the nutritional info.
      </p>

      {!file ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600 font-medium">Click to upload photo</p>
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP up to 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img src={preview!} alt="Preview" className="w-full max-h-64 object-contain rounded-xl border border-gray-200" />
            <button
              onClick={() => { setFile(null); setPreview(null); setResult(null) }}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-gray-50"
            >
              <X size={16} />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                'Analyze Photo'
              )}
            </button>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-primary-700 mb-2">AI Analysis Result</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Food: </span>
                    <span className="font-medium">{result.food_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Calories: </span>
                    <span className="font-medium">{result.calories} kcal</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Protein: </span>
                    <span className="font-medium">{result.protein_g}g</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Carbs: </span>
                    <span className="font-medium">{result.carbs_g}g</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fat: </span>
                    <span className="font-medium">{result.fat_g}g</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity: </span>
                    <span className="font-medium">{result.quantity} {result.quantity_unit}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Review & Save Entry</p>
                <MealEntryForm
                  onSubmit={handleSaveEntry}
                  onCancel={onClose}
                  prefill={result}
                  defaultDate={format(new Date(), 'yyyy-MM-dd')}
                  isLoading={isSaving}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
