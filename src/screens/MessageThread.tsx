import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mic, Send, Check, CheckCheck, Smile, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { getMatch, getUserDoc, subscribeMessages, sendMessageRemote, markConversationRead, type Message, type DiscoveryCandidate } from '@/lib/firestore'

interface ThreadLocationState {
  otherUid?: string
}

export function MessageThread() {
  const { id: matchId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const state = (location.state as ThreadLocationState | null) ?? null
  const [profile, setProfile] = useState<DiscoveryCandidate | null | undefined>(undefined)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchId || !user) return
    let cancelled = false
    async function resolve() {
      const otherUid = state?.otherUid ?? (await getMatch(matchId!))?.users.find((u) => u !== user!.uid)
      if (!otherUid) {
        if (!cancelled) setProfile(null)
        return
      }
      const doc = await getUserDoc(otherUid)
      if (!cancelled) setProfile(doc ? { uid: otherUid, ...doc } : null)
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [matchId, user, state?.otherUid])

  useEffect(() => {
    if (!matchId) return
    return subscribeMessages(matchId, setMessages)
  }, [matchId])

  // Real read receipts: mark the other person's messages read once this
  // thread has actually been viewed.
  useEffect(() => {
    if (!matchId || !user || messages.length === 0) return
    markConversationRead(matchId, user.uid, messages).catch((err) =>
      console.warn('[Perennia] Failed to mark conversation read:', err)
    )
  }, [matchId, user, messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!matchId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif-display text-2xl text-champagne">Conversation not found</p>
        <Button onClick={() => navigate('/messages')}>Back to Messages</Button>
      </div>
    )
  }

  if (profile === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif-display text-2xl text-champagne">Conversation not found</p>
        <Button onClick={() => navigate('/messages')}>Back to Messages</Button>
      </div>
    )
  }

  const sendMessage = () => {
    if (!input.trim() || !user) return
    const text = input.trim()
    setInput('')
    sendMessageRemote(matchId, user.uid, text).catch((err) => console.warn('[Perennia] Failed to send message:', err))
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="glass-strong sticky top-0 z-20 flex items-center gap-3 px-4 py-3 md:px-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <button onClick={() => navigate(`/profile/${profile.uid}`)} className="flex items-center gap-3 cursor-pointer">
          <img src={profile.profilePhotoUrl} alt={profile.name} className="h-10 w-10 rounded-full object-cover" />
          <div className="text-left">
            <p className="text-sm font-medium text-white">{profile.name}</p>
          </div>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.length === 0 && (
            <div className="glass flex flex-col items-center gap-2 rounded-3xl px-8 py-12 text-center">
              <p className="font-serif-display text-xl text-champagne">Say hello 👋</p>
              <p className="text-sm text-white/50">You matched — send the first message to start the conversation.</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isMe = m.senderId === user?.uid
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: i === messages.length - 1 ? 0.05 : 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[75%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-br from-gold to-champagne text-midnight rounded-br-md'
                        : 'glass text-white/90 rounded-bl-md'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-white/35">
                    {m.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? 'Sending…'}
                    {isMe && (m.read ? <CheckCheck className="h-3 w-3 text-gold" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </motion.div>
            )
          })}
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
