import { motion } from 'framer-motion'
import { Music, Plane, MapPinned, Dumbbell, BookOpen, Clapperboard, Languages } from 'lucide-react'

interface DetailSectionsProps {
  music: string[]
  languages: string[]
  favoritePlaces: string[]
  dreamDestinations: string[]
  fitness: string
  books: string
  movies: string
}

export function ProfileDetailSections({
  music, languages, favoritePlaces, dreamDestinations, fitness, books, movies,
}: DetailSectionsProps) {
  const cards = [
    { icon: Music, label: 'Music', content: music.join(' · ') },
    { icon: Dumbbell, label: 'Fitness', content: fitness },
    { icon: BookOpen, label: 'Books', content: books },
    { icon: Clapperboard, label: 'Movies', content: movies },
    { icon: Languages, label: 'Languages', content: languages.join(' · ') },
    { icon: MapPinned, label: 'Favourite Places', content: favoritePlaces.join(' · ') },
    { icon: Plane, label: 'Dream Destinations', content: dreamDestinations.join(' · ') },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.06 }}
          className="glass rounded-2xl p-5 transition-colors hover:border-gold/25"
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
              <card.icon className="h-3.5 w-3.5 text-gold" />
            </div>
            <p className="text-[11px] uppercase tracking-widest text-white/45">{card.label}</p>
          </div>
          <p className="font-serif-display text-lg leading-snug text-champagne">{card.content}</p>
        </motion.div>
      ))}
    </div>
  )
}

