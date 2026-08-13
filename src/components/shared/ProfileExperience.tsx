import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, BookOpen, BriefcaseBusiness, Crown, GraduationCap,
  Heart, Languages, LockKeyhole, Sparkles, Star, UserRound,
} from 'lucide-react'
import { ZodiacWheel } from '@/components/shared/ZodiacWheel'

const ZODIAC_GLYPHS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

const CHINESE_GLYPHS: Record<string, string> = {
  Rat: '🐀', Ox: '🐂', Tiger: '🐅', Rabbit: '🐇', Dragon: '🐉', Snake: '🐍',
  Horse: '🐎', Goat: '🐐', Sheep: '🐑', Monkey: '🐒', Rooster: '🐓', Dog: '🐕', Pig: '🐖',
}

const ELEMENT_GLYPHS: Record<string, string> = { Wood: '🌿', Fire: '🔥', Earth: '◈', Metal: '◇', Water: '💧' }

interface AstrologyData {
  sunSign?: string
  moonSign?: string
  risingSign?: string
  chineseAnimal?: string
  chineseElement?: string
  yinYang?: string
}

interface ProfileExperienceProps {
  astrology: AstrologyData
  isPremium: boolean
  isOwnProfile: boolean
  about?: string
  profession?: string
  education?: string
  languages?: string[]
  interests?: string[]
  onEdit?: () => void
  relationshipGoal?: string
  actions?: ReactNode
  cosmicProfilePath?: string | null
}

function AstroFact({ symbol, value, label }: { symbol: string; value?: string; label: string }) {
  if (!value) return null
  return (
    <div className="profile-astro-fact">
      <span className="profile-astro-symbol" aria-hidden="true">{symbol}</span>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export function ProfileExperience({
  astrology, isPremium, isOwnProfile, about, profession, education, languages = [], interests = [], onEdit,
  relationshipGoal, actions, cosmicProfilePath = '/cosmic-profile',
}: ProfileExperienceProps) {
  const navigate = useNavigate()
  const [openPanel, setOpenPanel] = useState<'about' | 'interests' | null>(null)

  return (
    <>
      {relationshipGoal && (
        <div className="profile-intention-row">
          {actions}
          <span className="profile-intention-pill"><Heart className="h-4 w-4" />{relationshipGoal}</span>
        </div>
      )}

      <section className="profile-luxury-card profile-astrology" aria-labelledby="astrology-heading">
        <div className="profile-card-heading">
          <h2 id="astrology-heading">My Astrology</h2>
          {!isPremium && isOwnProfile && (
            <button onClick={() => navigate('/founding-500')} className="profile-premium-link"><Crown className="h-4 w-4" /> Premium view <ArrowRight className="h-4 w-4" /></button>
          )}
          {isPremium && <span className="profile-premium-label"><Crown className="h-4 w-4" /> Premium</span>}
        </div>
        <div className={`profile-astro-grid ${isPremium ? 'is-premium' : 'is-standard'}`}>
          <AstroFact symbol={ZODIAC_GLYPHS[astrology.sunSign ?? ''] ?? '✦'} value={astrology.sunSign} label="Sun Sign" />
          <AstroFact symbol={CHINESE_GLYPHS[astrology.chineseAnimal ?? ''] ?? '✦'} value={astrology.chineseAnimal} label="Chinese Animal" />
          {isPremium && <AstroFact symbol={ZODIAC_GLYPHS[astrology.moonSign ?? ''] ?? '☾'} value={astrology.moonSign} label="Moon Sign" />}
          {isPremium && <AstroFact symbol={ZODIAC_GLYPHS[astrology.risingSign ?? ''] ?? '✧'} value={astrology.risingSign} label="Rising Sign" />}
          {isPremium && <AstroFact symbol={ELEMENT_GLYPHS[astrology.chineseElement ?? ''] ?? '◈'} value={astrology.chineseElement} label="Element" />}
          {isPremium && <AstroFact symbol={astrology.yinYang === 'Yin' ? '☽' : '☯'} value={astrology.yinYang} label="Yin / Yang" />}
        </div>
      </section>

      {isOwnProfile && isPremium && (
        <section className="profile-luxury-card profile-feature-strip" aria-label="Premium features">
          <button onClick={() => navigate('/settings')}><LockKeyhole /> Private Mode</button>
        </section>
      )}

      <div className="profile-shortcuts">
        <button onClick={() => setOpenPanel(openPanel === 'about' ? null : 'about')} aria-expanded={openPanel === 'about'}><UserRound /> <span>About Me</span><ArrowRight /></button>
        <button onClick={() => setOpenPanel(openPanel === 'interests' ? null : 'interests')} aria-expanded={openPanel === 'interests'}><Star /> <span>Interests</span><ArrowRight /></button>
      </div>

      {openPanel && (
        <section className="profile-luxury-card profile-expanded-panel" aria-live="polite">
          <div className="profile-card-heading">
            <h2>{openPanel === 'about' ? 'About Me' : 'Interests'}</h2>
            {isOwnProfile && onEdit && <button className="profile-premium-link" onClick={onEdit}>Edit</button>}
          </div>
          {openPanel === 'about' ? (
            <div className="profile-facts">
              {profession && <div><BriefcaseBusiness /><span>Profession</span><strong>{profession}</strong></div>}
              {education && <div><GraduationCap /><span>Education</span><strong>{education}</strong></div>}
              {!!languages.length && <div><Languages /><span>Languages</span><strong>{languages.join(', ')}</strong></div>}
              {!profession && !education && !languages.length && isOwnProfile && <p>Add your profession, education and languages from Edit Profile.</p>}
            </div>
          ) : (
            <div className="profile-interest-list">
              {interests.map((interest) => <span key={interest}>{interest}</span>)}
              {!interests.length && isOwnProfile && <p>Add interests from Edit Profile.</p>}
            </div>
          )}
        </section>
      )}

      <div className="profile-story-grid">
        {about && (
          <section className="profile-luxury-card profile-bio">
            <h2><BookOpen /> Bio</h2>
            <p>{about}</p>
          </section>
        )}
        <section className="profile-luxury-card profile-cosmic-preview">
          <div>
            <h2><Sparkles /> Cosmic Profile</h2>
            <p>Discover the deeper Western and Chinese astrology behind this celestial profile.</p>
            {cosmicProfilePath && <button onClick={() => navigate(cosmicProfilePath)}>View Cosmic Profile <ArrowRight /></button>}
          </div>
          <ZodiacWheel size={150} />
        </section>
      </div>
    </>
  )
}
