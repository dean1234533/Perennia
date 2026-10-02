import { useMemo, useState, type ComponentType, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clapperboard,
  Compass,
  Flower2,
  Gift,
  HeartHandshake,
  HeartPulse,
  Luggage,
  Mail,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Ticket,
  UtensilsCrossed,
} from 'lucide-react'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { Button } from '@/components/ui/button'
import { DESIGN_PREVIEW_PROFILE_PHOTO_URL } from '@/data/designPreviewProfile'
import { DESIGN_PREVIEW_VISITOR_PROFILE } from '@/data/designPreviewVisitorProfile'
import {
  GIFT_PREVIEW_MARKETPLACE,
  RECEIVE_GIFT_PREVIEW,
  giftPreviewMoney,
  type GiftPreviewOffering,
  type GiftPreviewPartner,
  type GiftVisual,
} from '@/data/giftPreview'
import './GiftToMePreview.css'

type GiftPreviewMode = 'send' | 'receive'
type GiftIcon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

const giftIcons: Record<GiftVisual, GiftIcon> = {
  flowers: Flower2,
  dining: UtensilsCrossed,
  cinema: Clapperboard,
  experience: Ticket,
  wellness: HeartPulse,
  getaway: Luggage,
}

const recipient = {
  name: DESIGN_PREVIEW_VISITOR_PROFILE.name.split(' ')[0],
  photoUrl: DESIGN_PREVIEW_VISITOR_PROFILE.profilePhotoUrl,
}

const sender = {
  name: 'Alex',
  photoUrl: DESIGN_PREVIEW_PROFILE_PHOTO_URL,
}

export function GiftToMePreview({ mode }: { mode: GiftPreviewMode }) {
  return mode === 'send' ? <SendGiftPreview /> : <ReceiveGiftPreview />
}

function GiftPreviewHeader({ person, eyebrow, title, description }: {
  person: { name: string; photoUrl: string | null }
  eyebrow: string
  title: string
  description: string
}) {
  const navigate = useNavigate()

  return (
    <header className="gift-preview-header">
      <div className="gift-preview-header__inner">
        <button type="button" className="gift-preview-back" onClick={() => navigate('/dev/design-preview?screen=visitorProfile')}>
          <ArrowLeft aria-hidden="true" /> Back
        </button>
        <div className="gift-preview-brand" aria-label="Perennia">
          <CelestialHeart className="gift-preview-brand__mark" />
          <span>Perennia</span>
        </div>
        <div className="gift-preview-intro">
          <img src={person.photoUrl ?? ''} alt="" draggable={false} />
          <div>
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            <span>{description}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

function SendGiftPreview() {
  const [step, setStep] = useState<'categories' | 'partners' | 'offerings' | 'review' | 'sent'>('categories')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null)
  const [message, setMessage] = useState('Thinking of you — I hope this brightens your week.')
  const selectedCategory = useMemo(
    () => GIFT_PREVIEW_MARKETPLACE.find((category) => category.id === selectedCategoryId) ?? null,
    [selectedCategoryId],
  )
  const selectedPartner = useMemo(
    () => selectedCategory?.partners.find((partner) => partner.id === selectedPartnerId) ?? null,
    [selectedCategory, selectedPartnerId],
  )
  const selectedOffering = useMemo(
    () => selectedPartner?.offerings.find((offering) => offering.id === selectedOfferingId) ?? null,
    [selectedOfferingId, selectedPartner],
  )

  const chooseCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedPartnerId(null)
    setSelectedOfferingId(null)
    setStep('partners')
  }

  const choosePartner = (partner: GiftPreviewPartner) => {
    setSelectedPartnerId(partner.id)
    setSelectedOfferingId(null)
    setStep('offerings')
  }

  const chooseOffering = (offering: GiftPreviewOffering) => {
    setSelectedOfferingId(offering.id)
    setStep('review')
  }

  const goBackOneStep = () => {
    if (step === 'partners') setStep('categories')
    if (step === 'offerings') setStep('partners')
    if (step === 'review' || step === 'sent') setStep('offerings')
  }

  return (
    <div className="gift-preview-page gift-preview-page--send">
      <GiftPreviewHeader
        person={recipient}
        eyebrow="A thoughtful gesture, shared safely"
        title={`Send ${recipient.name} a Gift`}
        description="Choose a category, explore fictional preview partners and select something meaningful."
      />

      <main className="gift-preview-main">
        <section className="gift-preview-section-heading">
          <span><Gift aria-hidden="true" /></span>
          <div>
            <p>Preview partner marketplace</p>
            <h2>{step === 'categories' ? 'Choose a category' : step === 'partners' ? `Choose a ${selectedCategory?.label.toLowerCase()} partner` : step === 'offerings' ? `Gifts from ${selectedPartner?.name}` : step === 'sent' ? 'Request confirmation' : 'Review your gift'}</h2>
          </div>
        </section>

        {step !== 'categories' && step !== 'sent' && (
          <button type="button" className="gift-marketplace-back" onClick={goBackOneStep}><ArrowLeft aria-hidden="true" /> Change {step === 'partners' ? 'category' : step === 'offerings' ? 'partner' : 'gift'}</button>
        )}

        {step === 'categories' && (
          <section className="gift-category-grid" aria-label="Gift categories">
            {GIFT_PREVIEW_MARKETPLACE.map((category) => {
              const Icon = giftIcons[category.visual]
              return (
                <button key={category.id} type="button" className="gift-category-card" onClick={() => chooseCategory(category.id)}>
                  <span className={`gift-category-card__icon gift-catalogue-visual--${category.visual}`}><Icon aria-hidden={true} /></span>
                  <span><strong>{category.label}</strong><small>{category.description}</small></span>
                  <ArrowLeft className="gift-category-card__arrow" aria-hidden="true" />
                </button>
              )
            })}
          </section>
        )}

        {step === 'partners' && selectedCategory && (
          <>
            <div className="gift-area-notice"><MapPin aria-hidden="true" /><p>Showing partners that may serve Amara’s area. Final availability is confirmed after the gift is accepted.</p></div>
            <section className="gift-partner-grid" aria-label={`${selectedCategory.label} preview partners`}>
              {selectedCategory.partners.map((partner) => {
                const Icon = giftIcons[selectedCategory.visual]
                return (
                  <article key={partner.id} className="gift-partner-card">
                    <div className="gift-partner-card__logo"><Icon aria-hidden={true} /></div>
                    <div className="gift-partner-card__body">
                      <p>Fictional preview partner</p>
                      <h3>{partner.name}</h3>
                      <span>{partner.description}</span>
                      <div className="gift-partner-availability"><MapPin aria-hidden="true" /> {partner.availability}</div>
                      <div className="gift-partner-card__footer"><strong>From {giftPreviewMoney(partner.startingPricePence)}</strong><button type="button" onClick={() => choosePartner(partner)}>View Gifts</button></div>
                    </div>
                  </article>
                )
              })}
            </section>
            <p className="gift-marketplace-explainer">If a selected preview partner cannot fulfil the gift after acceptance details are confirmed, a production flow would offer an alternative partner or a refund. No fulfilment logic runs in this preview.</p>
          </>
        )}

        {step === 'offerings' && selectedCategory && selectedPartner && (
          <section className="gift-offering-grid" aria-label={`Gifts from ${selectedPartner.name}`}>
            {selectedPartner.offerings.map((offering) => {
              const Icon = giftIcons[selectedCategory.visual]
              return (
                <article key={offering.id} className="gift-offering-card">
                  <div className={`gift-offering-card__visual gift-catalogue-visual--${selectedCategory.visual}`}><Icon aria-hidden={true} /><span>{selectedCategory.label}</span></div>
                  <div className="gift-offering-card__body">
                    <p>{selectedPartner.name}</p>
                    <h3>{offering.name}</h3>
                    <span>{offering.description}</span>
                    <div className="gift-offering-options">{offering.options.map((option) => <em key={option}>{option}</em>)}</div>
                    <div><strong>{giftPreviewMoney(offering.pricePence)}</strong><button type="button" onClick={() => chooseOffering(offering)}>Select Gift</button></div>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {step === 'review' && selectedPartner && selectedOffering && (
          <section className="gift-review-panel gift-review-panel--marketplace" aria-label="Gift review">
            <p className="gift-review-panel__eyebrow">Review your gift</p>
            <h2>Ready when you are</h2>
            <div className="gift-review-recipient">
              <img src={recipient.photoUrl ?? ''} alt="" draggable={false} />
              <span><small>Recipient</small><strong>{recipient.name}</strong></span>
            </div>
            <dl className="gift-review-summary">
              <div><dt>Preview partner</dt><dd>{selectedPartner.name}</dd></div>
              <div><dt>Gift</dt><dd>{selectedOffering.name}</dd></div>
              <div><dt>Gift price</dt><dd>{giftPreviewMoney(selectedOffering.pricePence)}</dd></div>
              <div><dt>Service &amp; fulfilment fee</dt><dd>{giftPreviewMoney(selectedOffering.serviceFeePence)}</dd></div>
              <div className="gift-review-summary__total"><dt>Total</dt><dd>{giftPreviewMoney(selectedOffering.pricePence + selectedOffering.serviceFeePence)}</dd></div>
            </dl>
            <label className="gift-message-field">
              <span>Optional message</span>
              <textarea value={message} maxLength={240} onChange={(event) => setMessage(event.target.value)} />
              <small>{message.length}/240</small>
            </label>
            <Button className="gift-primary-action" onClick={() => setStep('sent')}>Continue to Secure Payment</Button>
            <p className="gift-preview-disclaimer">Preview only — no payment is taken and no request is sent.</p>
          </section>
        )}

        {step === 'sent' && (
          <section className="gift-review-panel gift-review-panel--marketplace">
            <GiftConfirmation
              title="Gift request sent"
              description={`${recipient.name} has been invited to accept your gift. The request is awaiting acceptance and fulfilment has not started.`}
              onReset={() => setStep('review')}
            />
          </section>
        )}
      </main>
    </div>
  )
}

type ReceiveStage = 'request' | 'details' | 'accepted' | 'declined'

function ReceiveGiftPreview() {
  const [stage, setStage] = useState<ReceiveStage>('request')
  const [consent, setConsent] = useState(false)
  const [supportStatus, setSupportStatus] = useState('')
  const { category: selectedCategory, partner: selectedPartner, offering: selectedGift } = RECEIVE_GIFT_PREVIEW
  const GiftIcon = giftIcons[selectedCategory.visual]

  const handleAccept = (event: FormEvent) => {
    event.preventDefault()
    if (!consent) return
    setStage('accepted')
  }

  return (
    <div className="gift-preview-page gift-preview-page--receive">
      <GiftPreviewHeader
        person={sender}
        eyebrow="A gift request for you"
        title={`${sender.name} would like to send you a gift`}
        description="You are always in control. Review the gift, then accept or decline without sharing private details with the sender."
      />

      <main className="gift-preview-main gift-preview-main--receive">
        <section className="gift-receive-card">
          {stage === 'accepted' ? (
            <GiftConfirmation
              title="Gift accepted"
              description={`${sender.name} can see that you accepted, but cannot see the delivery information you provided. Perennia’s approved fulfilment partner can now arrange the gift.`}
              onReset={() => { setStage('request'); setConsent(false) }}
            />
          ) : stage === 'declined' ? (
            <GiftConfirmation
              title="Gift declined"
              description={`${sender.name} will only see that the gift was declined. No reason or private information will be shared.`}
              onReset={() => setStage('request')}
            />
          ) : (
            <>
              <div className="gift-request-sender">
                <img src={sender.photoUrl} alt="" draggable={false} />
                <span><small>From</small><strong>{sender.name}</strong><em>Verified Perennia member</em></span>
              </div>

              <div className="gift-request-detail">
                <div className="gift-request-visual"><GiftIcon aria-hidden={true} /></div>
                <div>
                  <p>{selectedCategory.label} · {selectedPartner.name}</p>
                  <h2>{selectedGift.name}</h2>
                  <span>{selectedGift.description}</span>
                  <strong>Gift value {giftPreviewMoney(selectedGift.pricePence)}</strong>
                </div>
              </div>

              <blockquote>“Thinking of you — I hope this brightens your week.”</blockquote>
              <p className="gift-expiry"><Compass aria-hidden="true" /> This invitation expires in 7 days.</p>

              {stage === 'request' ? (
                <>
                  <div className="gift-receive-actions">
                    <Button onClick={() => setStage('details')}>Accept Gift</Button>
                    <Button variant="outline" onClick={() => setStage('declined')}>Decline</Button>
                  </div>
                  <button type="button" className="gift-safety-link" onClick={() => setSupportStatus('Safety support opened in this preview. No report was sent.')}>
                    <ShieldCheck aria-hidden="true" /> Safety or report concern
                  </button>
                  {supportStatus && <p className="gift-local-status" role="status">{supportStatus}</p>}
                </>
              ) : (
                <form className="gift-delivery-form" onSubmit={handleAccept}>
                  <div className="gift-delivery-form__heading">
                    <MapPin aria-hidden="true" />
                    <div><p>Private fulfilment details</p><h2>Where should your gift be arranged?</h2></div>
                  </div>
                  <div className="gift-privacy-note">
                    <ShieldCheck aria-hidden="true" />
                    <p>The information you enter is available only to Perennia and the approved partner responsible for fulfilling this gift. It is not shown to the sender or other members.</p>
                  </div>
                  <div className="gift-form-grid">
                    <label><span>Recipient name</span><input defaultValue="Amara B. (sample)" /></label>
                    <label><span>Delivery window</span><select defaultValue="weekday"><option value="weekday">Weekday, 9am–5pm</option><option value="weekend">Weekend, 10am–4pm</option></select></label>
                    <label className="gift-form-grid__wide"><span>Address line</span><input defaultValue="14 Sample Garden" /></label>
                    <label><span>Town or city</span><input defaultValue="Sampleborough" /></label>
                    <label><span>Postcode</span><input defaultValue="AB1 2CD" /></label>
                    <label className="gift-form-grid__wide"><span>Delivery notes (optional)</span><textarea defaultValue="Please leave with the sample concierge if unavailable." /></label>
                  </div>
                  <label className="gift-consent-row">
                    <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                    <span>I consent to Perennia sharing these details only with its approved fulfilment partner to arrange this gift.</span>
                  </label>
                  <div className="gift-receive-actions">
                    <Button type="submit" disabled={!consent}>Accept and Arrange Gift</Button>
                    <Button type="button" variant="outline" onClick={() => { setStage('request'); setConsent(false) }}>Cancel and return</Button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>

        <aside className="gift-trust-panel">
          <HeartHandshake aria-hidden="true" />
          <div><p>Your privacy comes first</p><h2>A warm gesture, arranged safely</h2></div>
          <ul>
            <li><ShieldCheck aria-hidden="true" /> Your address and private contact details stay hidden from the sender.</li>
            <li><MessageSquareText aria-hidden="true" /> The sender sees only the request status.</li>
            <li><Mail aria-hidden="true" /> Perennia shares only necessary details with an approved fulfilment partner.</li>
          </ul>
        </aside>
      </main>
    </div>
  )
}

function GiftConfirmation({ title, description, onReset }: { title: string; description: string; onReset: () => void }) {
  return (
    <div className="gift-confirmation" role="status">
      <span><Check aria-hidden="true" /></span>
      <p>Preview confirmation</p>
      <h2>{title}</h2>
      <div>{description}</div>
      <Button variant="outline" onClick={onReset}>Return to preview</Button>
    </div>
  )
}
