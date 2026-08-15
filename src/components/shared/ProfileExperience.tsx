import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, BookOpen, BriefcaseBusiness, Crown, GraduationCap,
  Heart, Languages, LockKeyhole, Sparkles, Star, UserRound,
} from 'lucide-react'
import { ZodiacWheel } from '@/components/shared/ZodiacWheel'
import { LEGACY_INTEREST_MAP } from '@/data/interests'

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
  messageAction?: ReactNode
  likeAction?: ReactNode
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
  relationshipGoal, messageAction, likeAction, cosmicProfilePath = '/cosmic-profile',
}: ProfileExperienceProps) {
  const navigate = useNavigate()
  const [openPanel, setOpenPanel] = useState<'about' | 'interests' | 'bio' | null>(null)

  const canonicalInterests = [...new Set(interests.map((interest) => LEGACY_INTEREST_MAP[interest] ?? interest))]

  return (
    <div className="profile-experience-contents">
      {relationshipGoal && (
        <div className="profile-intention-row">
          {messageAction}
          <span className="profile-intention-pill"><Heart className="h-4 w-4" />{relationshipGoal}</span>
          {likeAction}
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

      <div className="profile-story-grid">
        {about && (
          <section className="profile-luxury-card profile-bio">
            <h2><BookOpen /> Bio</h2>
            <p>{about}</p>
            {about.length > 180 && (
              <button
                type="button"
                className="profile-bio-read-more"
                onClick={() => setOpenPanel(openPanel === 'bio' ? null : 'bio')}
                aria-expanded={openPanel === 'bio'}
              >
                {openPanel === 'bio' ? 'Hide full bio' : 'Read full bio'} <ArrowRight />
              </button>
            )}
          </section>
        )}
        <section className="profile-luxury-card profile-cosmic-preview">
          <div>
            <h2><Sparkles /> {isOwnProfile ? 'My Cosmic Profile' : 'Cosmic Profile'}</h2>
            {cosmicProfilePath && (
              <button onClick={() => navigate(cosmicProfilePath)}>
                <span>{isOwnProfile ? 'View My Cosmic Profile' : 'View Cosmic Profile'}</span>
                <ArrowRight />
              </button>
            )}
          </div>
          <div className="profile-cosmic-art" aria-hidden="true">
            <ZodiacWheel size={72} />
          </div>
        </section>
      </div>

      {openPanel && (
        <section className="profile-luxury-card profile-expanded-panel" aria-live="polite">
          <div className="profile-card-heading">
            <h2>{openPanel === 'about' ? 'About Me' : openPanel === 'interests' ? 'Interests' : 'Full Bio'}</h2>
            {isOwnProfile && onEdit && openPanel !== 'bio' && <button className="profile-premium-link" onClick={onEdit}>Edit</button>}
          </div>
          {openPanel === 'about' ? (
            <div className="profile-facts">
              {profession && <div><BriefcaseBusiness /><span>Profession</span><strong>{profession}</strong></div>}
              {education && <div><GraduationCap /><span>Education</span><strong>{education}</strong></div>}
              {!!languages.length && <div><Languages /><span>Languages</span><strong>{languages.join(', ')}</strong></div>}
              {!profession && !education && !languages.length && isOwnProfile && <p>Add your profession, education and languages from Edit Profile.</p>}
            </div>
          ) : openPanel === 'interests' ? (
            <div className="profile-interest-list">
              {canonicalInterests.map((interest) => <span key={interest}>{interest}</span>)}
              {!canonicalInterests.length && isOwnProfile && <p>Add interests from Edit Profile.</p>}
            </div>
          ) : (
            <p className="profile-full-bio">{about}</p>
          )}
        </section>
      )}
    </div>
  )
}
