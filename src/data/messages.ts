export interface Message {
  id: string
  sender: 'me' | 'them'
  text?: string
  voice?: boolean
  time: string
  read?: boolean
  reaction?: string
}

export const conversationSeeds: Record<string, Message[]> = {
  amara: [
    { id: 'm1', sender: 'them', text: 'I have to say, your compatibility report genuinely surprised me — 94%?', time: '10:12', read: true },
    { id: 'm2', sender: 'me', text: 'I know! The values alignment section was scarily accurate.', time: '10:14', read: true },
    { id: 'm3', sender: 'them', text: 'Right? Also I saw you like film photography — Leica or Nikon person?', time: '10:15', read: true },
    { id: 'm4', sender: 'me', text: 'Leica, unapologetically. It was my grandfather\'s.', time: '10:17', read: true, reaction: '❤️' },
    { id: 'm5', sender: 'them', voice: true, time: '10:19', read: false },
  ],
  julian: [
    { id: 'm1', sender: 'them', text: 'So — third novel. No spoilers, but is it as gothic as the last one?', time: '09:02', read: true },
    { id: 'm2', sender: 'me', text: 'Gothic-adjacent. More coastal melancholy than candlelit dread.', time: '09:05', read: true },
    { id: 'm3', sender: 'them', text: 'That\'s my favourite genre of melancholy, coincidentally.', time: '09:06', read: false },
  ],
  sienna: [
    { id: 'm1', sender: 'me', text: 'Trail running before a 12 hour shift is either dedication or madness.', time: '18:40', read: true },
    { id: 'm2', sender: 'them', text: 'It\'s the only thing keeping me sane, honestly.', time: '18:42', read: true },
  ],
}
