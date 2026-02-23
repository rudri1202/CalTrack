/** AI nutrition chat: send messages, view history, optional meal logging via assistant. */
import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2, MessageSquare, AlertCircle } from 'lucide-react'
import { sendChatMessage, getChatHistory } from '../api/ai'
import type { ChatMessage } from '../types'
import { format } from 'date-fns'
import clsx from 'clsx'

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={clsx('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary-600' : 'bg-gray-200'
        )}
      >
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-gray-600" />}
      </div>
      <div
        className={clsx(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-primary-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        <p className={clsx('text-xs mt-1.5', isUser ? 'text-primary-200' : 'text-gray-400')}>
          {format(new Date(msg.created_at), 'h:mm a')}
        </p>
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'What did I eat today?',
  'Log 100g of chicken breast for lunch',
  'How close am I to my protein goal?',
  'Give me a summary of this week',
]

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const isSendingRef = useRef(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [actionsInfo, setActionsInfo] = useState<string[]>([])
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getChatHistory()
      .then((data) => {
        // Deduplicate consecutive messages with the same role+content (DB artifact from double-sends)
        const deduped = data.items.filter((msg, i, arr) => {
          if (i === 0) return true
          const prev = arr[i - 1]
          return !(prev.role === msg.role && prev.content === msg.content)
        })
        setMessages(deduped)
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || isSendingRef.current) return
    isSendingRef.current = true
    setSendError(null)
    setInput('')

    // Optimistic user message
    const tempId = crypto.randomUUID()
    const userMsg: ChatMessage = {
      id: tempId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsSending(true)
    setActionsInfo([])

    try {
      const response = await sendChatMessage(content)
      // Replace the optimistic message with the confirmed one + assistant reply
      setMessages((prev) => [...prev.filter((m) => m.id !== tempId), userMsg, response.message])
      if (response.actions_taken.length > 0) {
        setActionsInfo(response.actions_taken)
        setTimeout(() => setActionsInfo([]), 5000)
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? 'Failed to reach AI. Check your GROQ_API_KEY in .env and restart the server.'
      setSendError(detail)
      // Remove the optimistic message so the user can retry without duplicates
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      isSendingRef.current = false
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="p-2 bg-primary-100 rounded-lg">
          <MessageSquare className="text-primary-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Nutrition Assistant</h1>
          <p className="text-xs text-gray-500">Powered by Groq — log meals, check goals, get advice</p>
        </div>
      </div>

      {/* Actions toast */}
      {actionsInfo.length > 0 && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
          Logged: {actionsInfo.join(', ')}
        </div>
      )}

      {/* Error banner */}
      {sendError && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{sendError}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {isLoadingHistory ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Start chatting with your AI nutrition assistant</p>
            <p className="text-gray-400 text-sm mt-1">Ask me anything about your nutrition, log meals, or check your progress</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isSending && (
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-gray-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Suggestions (when there are messages) */}
      {messages.length > 0 && !isSending && (
        <div className="flex gap-2 overflow-x-auto pb-2 px-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-xs bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors flex-shrink-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about nutrition, log a meal..."
            rows={1}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-32"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors self-end"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}
