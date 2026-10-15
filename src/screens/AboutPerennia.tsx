import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HeartHandshake, Orbit, ShieldCheck, Sparkles } from 'lucide-react'
import { CelestialHeart } from '@/components/shared/CelestialHeart'

export function AboutPerennia() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto min-h-[calc(100svh-5rem)] max-w-5xl px-5 pb-28 pt-8 sm:px-8 xl:pb-12 xl:pt-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 text-sm text-white/70 transition-colors hover:bg-white/[.08] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
      </button>

      <header className="max-w-3xl">
        <div className="mb-5 flex items-center gap-3">
          <CelestialHeart className="h-14 w-14" />
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-blue-300">About Perennia</p>
        </div>
        <h1 className="font-serif-display text-4xl leading-tight text-white sm:text-6xl">For Love That Fits, Naturally.</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
          Perennia combines Western and Chinese astrology with thoughtful compatibility insights to help people build meaningful, lasting relationships.
        </p>
      </header>

      <section className="mt-10 grid gap-4 md:grid-cols-3" aria-label="What guides Perennia">
        <article className="rounded-3xl border border-blue-300/15 bg-white/[.045] p-6 backdrop-blur-md">
          <Orbit className="h-6 w-6 text-blue-300" aria-hidden="true" />
          <h2 className="mt-5 font-serif-display text-2xl text-white">Compatibility first</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Astrological patterns become clear, useful guidance for understanding connection and long-term alignment.</p>
        </article>
        <article className="rounded-3xl border border-violet-300/15 bg-white/[.045] p-6 backdrop-blur-md">
          <HeartHandshake className="h-6 w-6 text-violet-300" aria-hidden="true" />
          <h2 className="mt-5 font-serif-display text-2xl text-white">Meaningful intention</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Profiles focus on values, relationship intentions and the real-life details that shape a lasting partnership.</p>
        </article>
        <article className="rounded-3xl border border-cyan-300/15 bg-white/[.045] p-6 backdrop-blur-md">
          <ShieldCheck className="h-6 w-6 text-cyan-300" aria-hidden="true" />
          <h2 className="mt-5 font-serif-display text-2xl text-white">Trust and safety</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Identity verification and member safety controls support a more genuine, respectful dating community.</p>
        </article>
      </section>

      <div className="mt-6 flex items-start gap-3 rounded-3xl border border-white/10 bg-gradient-to-r from-blue-500/10 to-violet-500/10 p-6 text-white/65">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" aria-hidden="true" />
        <p className="text-sm leading-7">Compatibility guidance is designed to encourage reflection and better conversations. It supports your judgment rather than replacing it.</p>
      </div>
    </div>
  )
}
