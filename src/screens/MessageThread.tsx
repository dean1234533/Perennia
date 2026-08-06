import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mic, Send, Check, CheckCheck, Play, Smile } from 'lucide-react'
import { conversationSeeds, type Message } from '@/data/messages'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { seedConversationIfNeeded, subscribeMessages, sendMessageRemote } from '@/lib/firestore'

const reactionOptions = ['❤️', '😂', '😍', '👏', '🔥']

export function MessageThread() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profiles } = useApp()
  const { user } = useAuth()
  const profile = id ? profiles.find((p) => p.id === id) : undefined
  const [messages, setMessages] = useState<Message[]>(id && !firebaseConfigured ? conversationSeeds[id] ?? [] : [])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [reactingTo, setReactingTo] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (!firebaseConfigured || !user || !id) return
    let unsub: (() => void) | undefined
    seedConversationIfNeeded(user.uid, id).then(() => {
      unsub = subscribeMessages(user.uid, id, setMessages)
    })
    return () => unsub?.()
  }, [user, id])

  if (!profile || !id) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif-display text-2xl text-champagne">Conversation not found</p>
        <Button onClick={() => navigate('/messages')}>Back to Messages</Button>
      </div>
    )
  }

  const sendMessage = () => {
    if (!input.trim()) return
    const text = input.trim()
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setInput('')

    if (firebaseConfigured && user) {
      sendMessageRemote(user.uid, id, { sender: 'me', text, time, read: false }, messages.length)
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        sendMessageRemote(
          user.uid,
          id,
          { sender: 'them', text: replyFor(text), time, read: true },
          messages.length + 1
        )
      }, 1800)
      return
    }

    const newMsg: Message = { id: `me-${Date.now()}`, sender: 'me', text, time, read: false }
    setMessages((prev) => [...prev, newMsg])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: `them-${Date.now()}`, sender: 'them', text: replyFor(text), time, read: true },
      ])
    }, 1800)
  }

  const addReaction = (msgId: string, emoji: string) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, reaction: emoji } : m)))
    setReactingTo(null)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="glass-strong sticky top-0 z-20 flex items-center gap-3 px-4 py-3 md:px-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <button onClick={() => navigate(`/profile/${profile.id}`)} className="flex items-center gap-3 cursor-pointer">
          <img src={profile.images[0]} alt={profile.name} className="h-10 w-10 rounded-full object-cover" />
          <div className="text-left">
            <p className="text-sm font-medium text-white">{profile.name}</p>
            <p className="text-[11px] text-emerald-400">Active now</p>
          </div>
        </button>
        <div className="ml-auto rounded-full bg-gold/10 px-3 py-1 text-[11px] text-gold border border-gold/20">
          {profile.compatibility}% Match
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: i === messages.length - 1 ? 0.05 : 0 }}
              className={`group relative flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              onDoubleClick={() => setReactingTo(m.id)}
            >
              <div className={`flex max-w-[75%] flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                    m.sender === 'me'
                      ? 'bg-gradient-to-br from-gold to-champagne text-midnight rounded-br-md'
                      : 'glass text-white/90 rounded-bl-md'
                  }`}
                >
                  {m.voice ? (
                    <div className="flex items-center gap-2 py-1">
                      <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 cursor-pointer">
                        <Play className="h-3 w-3 fill-current" />
                      </button>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 18 }).map((_, idx) => (
                          <span
                            key={idx}
                            className="w-0.5 rounded-full bg-current opacity-60"
                            style={{ height: `${6 + Math.sin(idx) * 6 + (idx % 3) * 4}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs opacity-70">0:14</span>
                    </div>
                  ) : (
                    m.text
                  )}
                </div>
                {m.reaction && (
                  <span className="-mt-2 mr-2 rounded-full glass-strong px-1.5 py-0.5 text-xs">{m.reaction}</span>
                )}
                <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-white/35">
                  {m.time}
                  {m.sender === 'me' && (m.read ? <CheckCheck className="h-3 w-3 text-gold" /> : <Check className="h-3 w-3" />)}
                </div>
              </div>

              <AnimatePresence>
                {reactingTo === m.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`glass-strong absolute -top-11 flex gap-1 rounded-full px-2 py-1.5 ${m.sender === 'me' ? 'right-0' : 'left-0'}`}
                  >
                    {reactionOptions.map((e) => (
                      <button
                        key={e}
                        onClick={() => addReaction(m.id, e)}
                        className="rounded-full p-1 text-base transition-transform hover:scale-125 cursor-pointer"
                      >
                        {e}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {typing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="glass flex items-center gap-1 rounded-3xl rounded-bl-md px-4 py-3.5">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-white/60"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="glass-strong sticky bottom-0 z-20 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/50 hover:text-gold cursor-pointer">
            <Smile className="h-5 w-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Write something thoughtful…"
            className="h-11 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/40"
          />
          {input.trim() ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-champagne text-midnight cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          ) : (
            <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/50 hover:text-gold cursor-pointer">
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function replyFor(_input: string): string {
  const replies = [
    'That\'s such a lovely way to put it.',
    'I was just thinking the same thing, actually.',
    'Tell me more — I want to hear all of it.',
    'Ha, I like the way you think.',
    'Okay, now I\'m even more curious about you.',
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}
