/**
 * Floating chat assistant widget.
 *
 * Session ID is stored in component state (useState), not sessionStorage.
 * crypto.randomUUID() is called once on mount via the useState initialiser.
 * This approach keeps the session ID ephemeral: it resets when the widget
 * unmounts, preventing stale Dialogflow sessions from a previous page visit.
 *
 * Accessibility:
 * - Panel: role="dialog", aria-label="Chat assistant", aria-modal="true"
 * - Message list: role="log", aria-live="polite"
 * - Toggle button: aria-expanded, aria-label
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '../../services/api'
import { useCountry } from '../../contexts/CountryContext'
import Button from '../ui/Button'

export default function ChatWidget() {
  // Ephemeral session ID - see module JSDoc for rationale
  const [sessionId] = useState(() => crypto.randomUUID())

  const { country } = useCountry()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm Electra. Ask me anything about voting or elections." },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatButtonRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const logRef = useRef(null)

  const initialMount = useRef(true)

  // Move focus into panel on open; restore to button on close
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      return
    }

    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      chatButtonRef.current?.focus()
    }
  }, [isOpen])

  // Scroll to bottom of message log on new message
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const data = await chatApi.sendMessage(text, sessionId, country, 'en')
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: data.reply, suggestedTopics: data.suggested_topics || [] },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: 'Sorry, the chat service is temporarily unavailable. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        ref={chatButtonRef}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 focus:outline-2 focus:outline-offset-2 focus:outline-primary-600 flex items-center justify-center transition-colors"
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Chat assistant"
          aria-modal="true"
          className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-neutral-200 flex flex-col animate-slide-up"
          style={{ maxHeight: '70vh' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900 text-sm">Electra Assistant</h2>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-neutral-400 hover:text-neutral-700 focus:outline-2 focus:outline-primary-600 rounded p-0.5"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Message log */}
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={[
                    'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-neutral-100 text-neutral-800 rounded-bl-sm',
                  ].join(' ')}
                >
                  <span className="sr-only">
                    {msg.role === 'user' ? 'You said: ' : 'Assistant said: '}
                  </span>
                  {msg.text}
                  {/* Suggested topic pills */}
                  {msg.suggestedTopics?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.suggestedTopics.map((slug) => (
                        <button
                          key={slug}
                          onClick={() => navigate(`/topics/${slug}`)}
                          className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full hover:bg-primary-200 focus:outline-2 focus:outline-primary-600"
                        >
                          {slug.replace(/-/g, ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 text-neutral-500 rounded-xl rounded-bl-sm px-3 py-2 text-sm animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-neutral-200 flex gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about elections..."
              maxLength={500}
              disabled={loading}
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-2 focus:outline-primary-600 disabled:opacity-50"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              loading={loading}
              ariaLabel="Send message"
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
