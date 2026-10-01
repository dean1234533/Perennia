import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, LockKeyhole, Sparkles, AlertTriangle, Loader2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { getUserDoc, type DiscoveryCandidate } from '@/lib/firestore'
import { getCompatibility, type CompatibilityResult, type PersonBirthProfile } from '@/lib/compatibilityApi'
import { CHINESE_ANIMALS, CHINESE_ELEMENTS, CHINESE_POLARITIES } from '@/data/chineseAstrologyPresentation'
import { ConnectionHeartsIcon } from '@/components/shared/ConnectionHeartsIcon'
import {
  COMPATIBILITY_REPORT_PRICE,
  compatibilityExperienceFromResult,
  type CompatibilityAccess,
  type CompatibilityDimension,
  type CompatibilityDimensionKey,
  type CompatibilityExperienceData,
  type CompatibilityPerson,
} from '@/data/compatibilityExperience'
import './CompatibilityReport.css'

const WESTERN_SIGNS = new Set([
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
])

function normalized(value: string) {
  return value.trim().toLowerCase()
}

function westernAsset(value: string) {
  const key = normalized(value)
  return WESTERN_SIGNS.has(key) ? `/approved-symbol-cards-v4/zodiac-white/${key}.png` : null
}

function chineseAnimalAsset(value: string) {
  const key = normalized(value) === 'sheep' ? 'goat' : normalized(value)
  return CHINESE_ANIMALS[key]?.asset ?? null
}

function elementAsset(value: string) {
  return CHINESE_ELEMENTS[normalized(value)]?.asset ?? null
}

function polarityAsset(value: string) {
  return CHINESE_POLARITIES[normalized(value)]?.asset ?? null
}

function dimensionValue(person: CompatibilityPerson, key: CompatibilityDimensionKey) {
  switch (key) {
    case 'animal': return person.chineseAnimal
    case 'element': return `${person.yinYang} ${person.chineseElement}`
    case 'yinYang': return person.yinYang
    case 'sun': return person.sunSign
    case 'moon': return person.moonSign
    case 'rising': return person.risingSign
  }
}

function dimensionAsset(person: CompatibilityPerson, key: CompatibilityDimensionKey) {
  switch (key) {
    case 'animal': return chineseAnimalAsset(person.chineseAnimal)
    case 'element': return elementAsset(person.chineseElement)
    case 'yinYang': return polarityAsset(person.yinYang)
    case 'sun': return westernAsset(person.sunSign)
    case 'moon': return westernAsset(person.moonSign)
    case 'rising': return westernAsset(person.risingSign)
  }
}

export interface CompatibilityReportPreviewData {
  access: CompatibilityAccess
  experience: CompatibilityExperienceData
}

export function CompatibilityReport({ previewData }: { previewData?: CompatibilityReportPreviewData } = {}) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { onboarding } = useApp()
  const [profile, setProfile] = useState<DiscoveryCandidate | null | undefined>(previewData ? null : undefined)
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [loading, setLoading] = useState(!previewData)
  const [error, setError] = useState('')

  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang,
  )
  const otherChartComplete = Boolean(
    profile?.sunSign && profile.moonSign && profile.risingSign &&
    profile.chineseAnimal && profile.chineseElement && profile.yinYang,
  )

  useEffect(() => {
    if (previewData || !id) return
    getUserDoc(id)
      .then((doc) => setProfile(doc ? { uid: id, ...doc } : null))
      .catch(() => setProfile(null))
  }, [id, previewData])

  useEffect(() => {
    if (previewData) return
    if (!profile || !selfChartComplete || !otherChartComplete) {
      setLoading(false)
      return
    }

    const personA: PersonBirthProfile = {
      sunSign: onboarding.sunSign,
      moonSign: onboarding.moonSign,
      risingSign: onboarding.risingSign,
      chineseAnimal: onboarding.chineseAnimal,
      chineseElement: onboarding.chineseElement,
      yinYang: onboarding.yinYang,
    }
    const personB: PersonBirthProfile = {
      sunSign: profile.sunSign,
      moonSign: profile.moonSign,
      risingSign: profile.risingSign,
      chineseAnimal: profile.chineseAnimal,
      chineseElement: profile.chineseElement,
      yinYang: profile.yinYang,
    }

    setLoading(true)
    setError('')
    getCompatibility({ personA, personB })
      .then(setResult)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load your compatibility report.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, previewData, selfChartComplete, otherChartComplete])

  const productionExperience = profile && result
    ? compatibilityExperienceFromResult({
        personA: {
          preferredName: onboarding.name.split(' ')[0] || 'You',
          profilePhotoUrl: onboarding.profilePhotoThumbUrl || onboarding.profilePhotoUrl,
          profilePath: '/my-profile',
          sunSign: onboarding.sunSign,
          moonSign: onboarding.moonSign,
          risingSign: onboarding.risingSign,
          chineseAnimal: onboarding.chineseAnimal,
          chineseElement: onboarding.chineseElement,
          yinYang: onboarding.yinYang,
        },
        personB: {
          preferredName: profile.name.split(' ')[0],
          profilePhotoUrl: profile.profilePhotoThumbUrl || profile.profilePhotoUrl,
          profilePath: `/profile/${profile.uid}`,
          sunSign: profile.sunSign,
          moonSign: profile.moonSign,
          risingSign: profile.risingSign,
          chineseAnimal: profile.chineseAnimal,
          chineseElement: profile.chineseElement,
          yinYang: profile.yinYang,
        },
        result,
      })
    : null
  const experience = previewData?.experience ?? productionExperience

  if (!previewData && profile === undefined) return <CompatibilityStatus loading />
  if (!previewData && !profile) return <CompatibilityStatus title="Report not found" />
  if (!previewData && !selfChartComplete) {
    return <CompatibilityStatus title="Complete Your Cosmic Profile" body="Add your birth details before opening a compatibility report." />
  }
  if (!previewData && !otherChartComplete) {
    return <CompatibilityStatus title="Not Ready Yet" body={`${profile?.name.split(' ')[0] ?? 'This member'} has not completed their cosmic profile.`} />
  }
  if (!previewData && loading) return <CompatibilityStatus loading />
  if (!previewData && error) return <CompatibilityStatus title="Couldn’t Load This Report" body={error} />
  if (!experience) return <CompatibilityStatus title="Compatibility unavailable" />

  const access = previewData?.access ?? 'full'

  return (
    <main className="compatibility-experience">
      <div className="compatibility-stars" aria-hidden="true" />
      <div className="compatibility-shell">
        <button type="button" className="compatibility-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft />
        </button>
        {access === 'full' ? <FullCompatibility experience={experience} /> : <CompatibilityTeaser experience={experience} />}
      </div>
    </main>
  )
}

function CompatibilityStatus({ loading, title, body }: { loading?: boolean; title?: string; body?: string }) {
  return (
    <main className="compatibility-experience compatibility-status-page">
      <div className="compatibility-status-card">
        {loading ? <Loader2 className="compatibility-spinner" /> : <AlertTriangle />}
        <h1>{loading ? 'Preparing your compatibility…' : title}</h1>
        {body && <p>{body}</p>}
      </div>
    </main>
  )
}

function FullCompatibility({ experience }: { experience: CompatibilityExperienceData }) {
  return (
    <>
      <header className="compatibility-header">
        {experience.isPreviewSample && <span className="compatibility-sample-label">In-memory preview percentages</span>}
        <p className="compatibility-eyebrow"><Sparkles /> Perennia Compatibility Overview <Sparkles /></p>
        <h1>A holistic view of your cosmic connection</h1>
      </header>

      <section className="compatibility-overview" aria-label="Overall compatibility">
        <CompatibilityIdentity person={experience.personA} side="A" />
        <div className="compatibility-score-orb">
          <small>Overall compatibility</small>
          <strong>{experience.overallScore}%</strong>
          <span>{experience.overallLabel}</span>
        </div>
        <CompatibilityIdentity person={experience.personB} side="B" />
      </section>

      <section className="compatibility-dimension-grid" aria-label="Six compatibility dimensions">
        {experience.dimensions.map((dimension, index) => (
          <CompatibilityDimensionCard key={dimension.key} dimension={dimension} index={index + 1} personA={experience.personA} personB={experience.personB} />
        ))}
      </section>

      <section className="compatibility-conclusion-grid">
        <div className="compatibility-breakdown">
          <h2>Compatibility breakdown</h2>
          <div>
            {experience.dimensions.map((dimension) => (
              <div className="compatibility-breakdown-row" key={dimension.key}>
                <span>{dimension.title}</span>
                <i><b style={{ width: `${dimension.score}%` }} /></i>
                <strong>{dimension.score}%</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="compatibility-meaning">
          <ConnectionHeartsIcon />
          <div><h2>What this means</h2><p>{experience.summary}</p></div>
        </div>
      </section>

      <p className="compatibility-guidance-note">
        Compatibility guidance offers insight, not a guarantee of relationship success. Every lasting connection is shaped by the people building it.
      </p>
    </>
  )
}

function CompatibilityIdentity({ person, side }: { person: CompatibilityPerson; side: 'A' | 'B' }) {
  return (
    <article className="compatibility-identity">
      <CompatibilityProfilePhoto person={person} />
      <div>
        <small>Person {side}</small>
        <h2>{person.preferredName}</h2>
        <strong>{person.chineseAnimal}</strong>
        <p>{person.yinYang} {person.chineseElement}</p>
        {person.naturalAnimalElement && <span>Natural element · {person.naturalAnimalElement}</span>}
      </div>
    </article>
  )
}

function CompatibilityProfilePhoto({ person }: { person: CompatibilityPerson }) {
  if (!person.profilePhotoUrl) return null
  const image = <img src={person.profilePhotoUrl} alt={`${person.preferredName}'s profile`} draggable={false} />
  return person.profilePath ? (
    <Link className="compatibility-profile-photo" to={person.profilePath} aria-label={`View ${person.preferredName}'s profile`}>
      {image}
    </Link>
  ) : <span className="compatibility-profile-photo">{image}</span>
}

function CompatibilityDimensionCard({ dimension, index, personA, personB }: { dimension: CompatibilityDimension; index: number; personA: CompatibilityPerson; personB: CompatibilityPerson }) {
  return (
    <article className={`compatibility-dimension compatibility-dimension--${dimension.key}`}>
      <h2><span>{index}.</span> {dimension.title}</h2>
      <div className="compatibility-pair">
        <CompatibilityValue person={personA} dimension={dimension.key} />
        <div className="compatibility-mini-score" style={{ '--score': `${dimension.score * 3.6}deg` } as CSSProperties}><span>{dimension.score}%</span></div>
        <CompatibilityValue person={personB} dimension={dimension.key} />
      </div>
      <strong className="compatibility-dimension-label">{dimension.label}</strong>
      <p>{dimension.explanation}</p>
    </article>
  )
}

function CompatibilityValue({ person, dimension }: { person: CompatibilityPerson; dimension: CompatibilityDimensionKey }) {
  const asset = dimensionAsset(person, dimension)
  return (
    <div className="compatibility-value">
      {asset && <img src={asset} alt="" draggable={false} />}
      <strong>{dimensionValue(person, dimension)}</strong>
      <small>{person.preferredName}</small>
    </div>
  )
}

function CompatibilityTeaser({ experience }: { experience: CompatibilityExperienceData }) {
  return (
    <section className="compatibility-teaser">
      <header className="compatibility-header">
        <span className="compatibility-sample-label">In-memory entitlement preview</span>
        <p className="compatibility-eyebrow"><Sparkles /> Your Compatibility Preview <Sparkles /></p>
        <h1>{experience.personA.preferredName} &amp; {experience.personB.preferredName}</h1>
      </header>

      <div className="compatibility-teaser-identities">
        <TeaserIdentity person={experience.personA} />
        <span><ConnectionHeartsIcon /></span>
        <TeaserIdentity person={experience.personB} />
      </div>

      <div className="compatibility-free-insight">
        <ConnectionHeartsIcon /><div><small>Your free insight</small><p>{experience.freeInsight}</p></div>
      </div>

      <div className="compatibility-locked-grid" aria-label="Locked compatibility categories">
        {experience.dimensions.map((dimension) => <div key={dimension.key}><LockKeyhole /><span>{dimension.title}</span></div>)}
      </div>

      <div className="compatibility-unlock-card">
        <LockKeyhole />
        <h2>See your complete cosmic connection</h2>
        <p>Unlock all six compatibility dimensions, detailed guidance and your complete overview.</p>
        <button type="button">Unlock Compatibility <ArrowRight /></button>
        <strong>Unlock this report for {COMPATIBILITY_REPORT_PRICE.display}</strong>
        <a href="/founding-500">Included with Perennia Match</a>
      </div>

      <p className="compatibility-guidance-note">Compatibility guidance offers insight, not a guarantee of relationship success.</p>
    </section>
  )
}

function TeaserIdentity({ person }: { person: CompatibilityPerson }) {
  return (
    <article>
      <div><CompatibilityProfilePhoto person={person} /></div>
      <h2>{person.preferredName}</h2>
      <p>{person.sunSign} · {person.chineseAnimal}</p>
    </article>
  )
}
