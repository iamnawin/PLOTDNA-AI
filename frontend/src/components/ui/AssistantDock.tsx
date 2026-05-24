import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import {
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { askPlotDNA, type AssistantContext, type AssistantMessage } from '@/lib/assistant'

interface Props {
  context: AssistantContext
}

export default function AssistantDock({ context }: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    {
      role: 'assistant',
      content: context.areaName
        ? `Ask me about ${context.areaName}. I can compare investment risk, growth, and nearby areas.`
        : `Ask me about this map view, a coordinate, or a city zone. I can translate the score into a plain answer.`,
    },
  ])

  const listRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open, loading])

  const quickPrompts = useMemo(() => {
    if (context.areaName) {
      return [
        `Is ${context.areaName} better for investment or end-use?`,
        'What are the main risks here?',
        'Compare this with nearby areas',
      ]
    }
    return [
      'Which area looks strongest right now?',
      'What are the biggest risk signals?',
      'Explain the score in simple terms',
    ]
  }, [context.areaName])

  async function sendQuestion(question: string) {
    const trimmed = question.trim()
    if (!trimmed || loading) return

    const nextHistory: AssistantMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextHistory)
    setInput('')
    setLoading(true)
    setError(null)

    const response = await askPlotDNA({
      question: trimmed,
      context,
      history: nextHistory.slice(-6),
    })

    if (!response) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not reach the assistant right now. Try again in a moment.',
        },
      ])
      setError('Assistant request failed')
      setLoading(false)
      return
    }

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: response.answer,
      },
    ])
    setLoading(false)
  }

  const locationLabel = [context.areaName, context.cityName].filter(Boolean).join(', ')

  const [dragConstraints, setDragConstraints] = useState({ left: -400, right: 10, top: -600, bottom: 10 })

  const keepDockInViewport = useCallback(() => {
    const el = dockRef.current
    if (!el || typeof window === 'undefined') return

    const rect = el.getBoundingClientRect()
    const safe = 10
    const minTop = safe
    const maxRight = window.innerWidth - safe
    const maxBottom = window.innerHeight - safe
    let nextX = x.get()
    let nextY = y.get()

    if (rect.left < safe) nextX += safe - rect.left
    if (rect.right > maxRight) nextX -= rect.right - maxRight
    if (rect.top < minTop) nextY += minTop - rect.top
    if (rect.bottom > maxBottom) nextY -= rect.bottom - maxBottom

    x.set(nextX)
    y.set(nextY)
  }, [x, y])

  useEffect(() => {
    const handleResize = () => {
      setDragConstraints({
        left: -window.innerWidth + 180,
        right: 10,
        top: -window.innerHeight + (context.page === 'map' ? 120 : 100),
        bottom: context.page === 'map' ? 60 : 10,
      })
      window.requestAnimationFrame(keepDockInViewport)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [context.page, keepDockInViewport])

  return (
    <motion.div
      ref={dockRef}
      drag={!open}
      dragConstraints={dragConstraints}
      dragElastic={0.1}
      dragMomentum={false}
      onDragEnd={() => window.requestAnimationFrame(keepDockInViewport)}
      className={`fixed z-[1200] ${open ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing touch-none'}`}
      style={{
        x,
        y,
        right: 'calc(1rem + env(safe-area-inset-right))',
        bottom: context.page === 'map'
          ? 'calc(7.25rem + env(safe-area-inset-bottom))'
          : 'calc(1rem + env(safe-area-inset-bottom))',
      }}
    >
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              x.set(0)
              y.set(0)
              setOpen(true)
            }}
            className="pointer-events-auto flex items-center gap-2 px-3 sm:px-4 py-3 rounded-full shadow-lg"
            style={{
              background: 'rgba(7, 10, 16, 0.96)',
              border: '1px solid rgba(0, 230, 118, 0.22)',
              boxShadow: '0 14px 32px rgba(0,0,0,0.42)',
            }}
          >
            <MessageCircle size={15} className="text-[#00e676]" />
            <span className="text-xs font-mono font-semibold text-[#e8e8f0] sm:hidden">Ask</span>
            <span className="hidden sm:inline text-xs font-mono font-semibold text-[#e8e8f0]">Ask PlotDNA</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto w-[calc(100vw-1.5rem)] sm:w-[380px] max-h-[72dvh] overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(5, 6, 12, 0.98)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 24px 56px rgba(0,0,0,0.54)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-[#00e676]" />
                  <p className="text-sm font-mono font-semibold text-[#e8e8f0]">Ask PlotDNA</p>
                </div>
                <p className="text-[10px] font-mono text-[#555566] truncate mt-0.5">
                  {locationLabel || 'Map assistant'}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#555566] hover:text-[#e8e8f0]"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#444455] mb-2">
                <MapPin size={10} className="text-[#00e676]" />
                <span className="truncate">{context.page === 'area' ? 'Area detail view' : 'Map view'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void sendQuestion(prompt)}
                    className="px-2.5 py-1.5 rounded-full text-[10px] font-mono text-[#cfd0db] transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={listRef}
              className="px-4 overflow-y-auto space-y-3"
              style={{ maxHeight: 'calc(72dvh - 214px)' }}
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[88%] rounded-2xl px-3 py-2.5"
                    style={{
                      background: message.role === 'user' ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255,255,255,0.03)',
                      border: message.role === 'user'
                        ? '1px solid rgba(0, 230, 118, 0.22)'
                        : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <p className="text-[11px] font-mono text-[#e8e8f0] whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Loader2 size={13} className="text-[#00e676] animate-spin" />
                    <p className="text-[11px] font-mono text-[#888899]">Thinking...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-white/5">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendQuestion(input)
                    }
                  }}
                  placeholder="Ask about the area..."
                  className="flex-1 min-w-0 rounded-xl px-3 py-2.5 text-[12px] font-mono outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#e8e8f0',
                  }}
                />
                <button
                  onClick={() => void sendQuestion(input)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,230,118,0.2), rgba(0,179,107,0.15))',
                    border: '1px solid rgba(0,230,118,0.22)',
                    color: '#00e676',
                  }}
                >
                  <Send size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-[9px] font-mono text-[#333344] truncate">
                  {error ? 'Assistant temporarily unavailable' : 'Grounded in the current map context'}
                </p>
                <button
                  onClick={() => {
                    setMessages([
                      {
                        role: 'assistant',
                        content: context.areaName
                          ? `Ask me about ${context.areaName}. I can compare investment risk, growth, and nearby areas.`
                          : `Ask me about this map view, a coordinate, or a city zone. I can translate the score into a plain answer.`,
                      },
                    ])
                    setInput('')
                    setError(null)
                  }}
                  className="text-[9px] font-mono text-[#555566] hover:text-[#e8e8f0] transition-colors"
                >
                  Reset chat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
