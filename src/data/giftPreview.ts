export type GiftCategoryId = 'flowers' | 'dining' | 'cinema' | 'experiences' | 'wellness' | 'getaways'

export type GiftFulfilment = 'physical' | 'digital' | 'experience'

export type GiftVisual = 'flowers' | 'dining' | 'cinema' | 'experience' | 'wellness' | 'getaway'

export interface GiftPreviewOffering {
  id: string
  name: string
  description: string
  pricePence: number
  serviceFeePence: number
  fulfilment: GiftFulfilment
  options: string[]
}

export interface GiftPreviewPartner {
  id: string
  name: string
  description: string
  availability: string
  startingPricePence: number
  offerings: GiftPreviewOffering[]
}

export interface GiftPreviewCategory {
  id: GiftCategoryId
  label: string
  visual: GiftVisual
  description: string
  partners: GiftPreviewPartner[]
}

const offering = (
  id: string,
  name: string,
  description: string,
  pricePence: number,
  serviceFeePence: number,
  fulfilment: GiftFulfilment,
  options: string[],
): GiftPreviewOffering => ({ id, name, description, pricePence, serviceFeePence, fulfilment, options })

export const GIFT_PREVIEW_MARKETPLACE: GiftPreviewCategory[] = [
  {
    id: 'flowers',
    label: 'Flowers',
    visual: 'flowers',
    description: 'National flower delivery and approved local florists.',
    partners: [
      {
        id: 'petal-pine',
        name: 'Petal & Pine Preview',
        description: 'Seasonal bouquets arranged by an independent network of sample florists.',
        availability: 'National preview coverage',
        startingPricePence: 3200,
        offerings: [
          offering('seasonal-bouquet', 'Seasonal British Bouquet', 'A hand-tied arrangement of seasonal flowers.', 4800, 595, 'physical', ['Classic', 'Fuller bouquet', 'Premium']),
          offering('letterbox-blooms', 'Letterbox Blooms', 'A fresh bouquet designed for convenient letterbox delivery.', 3200, 450, 'physical', ['Pastel', 'Bright', 'Florist’s choice']),
        ],
      },
      {
        id: 'sample-city-blooms',
        name: 'Sample City Blooms',
        description: 'A fictional local florist specialising in modern, low-waste arrangements.',
        availability: 'Local preview partner · Sample City',
        startingPricePence: 3800,
        offerings: [
          offering('garden-gathering', 'Garden Gathering Bouquet', 'Locally arranged stems with a soft, natural palette.', 3800, 595, 'physical', ['Standard', 'Deluxe']),
          offering('orchid-keepsake', 'Orchid Keepsake', 'A potted orchid presented in a reusable ceramic planter.', 5600, 595, 'physical', ['White', 'Purple']),
        ],
      },
    ],
  },
  {
    id: 'dining',
    label: 'Dining',
    visual: 'dining',
    description: 'Restaurant experiences and flexible dining vouchers.',
    partners: [
      {
        id: 'table-thyme',
        name: 'Table & Thyme Preview',
        description: 'Flexible dining vouchers across a fictional collection of UK restaurants.',
        availability: 'National preview coverage',
        startingPricePence: 5000,
        offerings: [
          offering('dinner-voucher-50', 'Dining Voucher', 'A flexible contribution towards a meal at a participating venue.', 5000, 350, 'digital', ['£50 value', '£75 value', '£100 value']),
          offering('dinner-for-two', 'Dinner for Two', 'A set-menu dining experience for two.', 8500, 350, 'experience', ['Classic menu', 'Vegetarian menu']),
        ],
      },
      {
        id: 'sample-quarter-kitchen',
        name: 'Sample Quarter Kitchen',
        description: 'A fictional independent restaurant with seasonal menus and relaxed dining.',
        availability: 'Local preview partner · Sample City',
        startingPricePence: 6500,
        offerings: [
          offering('tasting-menu', 'Seasonal Tasting Menu', 'A five-course sample menu for two guests.', 11000, 450, 'experience', ['Standard', 'Vegetarian']),
          offering('sunday-lunch', 'Sunday Lunch for Two', 'A relaxed three-course Sunday lunch experience.', 6500, 350, 'experience', ['12:30 sitting', '14:30 sitting']),
        ],
      },
    ],
  },
  {
    id: 'cinema',
    label: 'Cinema',
    visual: 'cinema',
    description: 'Cinema operators and flexible film-night passes.',
    partners: [
      {
        id: 'silver-screen-pass',
        name: 'Silver Screen Pass Preview',
        description: 'Flexible digital cinema passes for fictional participating UK venues.',
        availability: 'National preview coverage',
        startingPricePence: 2400,
        offerings: [
          offering('cinema-night', 'Cinema Night Gift Pass', 'Two cinema tickets with a refreshment voucher.', 3200, 250, 'digital', ['Standard screens', 'Premium screens']),
          offering('film-fan-pass', 'Film Fan Pass', 'Four flexible admissions for films of the recipient’s choice.', 4800, 250, 'digital', ['2 visits for two', '4 individual visits']),
        ],
      },
      {
        id: 'lantern-picturehouse',
        name: 'Lantern Picturehouse Preview',
        description: 'A fictional independent cinema with curated films and special screenings.',
        availability: 'Regional preview partner · Sample Region',
        startingPricePence: 2800,
        offerings: [
          offering('independent-film-night', 'Independent Film Night', 'Two admissions with drinks at the sample bar.', 3600, 250, 'experience', ['Any standard screening', 'Curated season pass']),
          offering('classic-screening', 'Classic Screening for Two', 'A special-event screening with reserved seats.', 2800, 250, 'experience', ['Matinée', 'Evening']),
        ],
      },
    ],
  },
  {
    id: 'experiences',
    label: 'Experiences',
    visual: 'experience',
    description: 'Theatre, tastings, classes and memorable days out.',
    partners: [
      {
        id: 'wonder-days',
        name: 'Wonder Days Preview',
        description: 'A fictional marketplace for theatre, tasting and creative experiences.',
        availability: 'National preview coverage',
        startingPricePence: 5900,
        offerings: [
          offering('afternoon-tea', 'Afternoon Tea Experience', 'A choice of elegant afternoon-tea experiences for two.', 7200, 450, 'experience', ['Traditional', 'Sparkling']),
          offering('theatre-voucher', 'Theatre Experience Voucher', 'A flexible contribution towards selected UK productions.', 10000, 450, 'digital', ['£100 value', '£150 value']),
        ],
      },
      {
        id: 'make-taste-studio',
        name: 'Make & Taste Studio Preview',
        description: 'Small-group cooking classes and guided sample tastings.',
        availability: 'Regional preview partner · Sample Region',
        startingPricePence: 6800,
        offerings: [
          offering('cooking-class', 'Cooking Class for Two', 'A hands-on seasonal cooking class with a shared meal.', 9800, 450, 'experience', ['Pasta', 'Baking', 'Plant-based']),
          offering('guided-tasting', 'Guided Tasting Experience', 'A hosted tasting session for two guests.', 6800, 450, 'experience', ['Chocolate', 'Tea', 'Alcohol-free']),
        ],
      },
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    visual: 'wellness',
    description: 'Spa days, massages, beauty and restorative treatments.',
    partners: [
      {
        id: 'stillwater-wellness',
        name: 'Stillwater Wellness Preview',
        description: 'A fictional network of restorative spa and massage experiences.',
        availability: 'National preview coverage',
        startingPricePence: 6500,
        offerings: [
          offering('wellness-voucher', 'Spa & Wellness Voucher', 'A flexible voucher towards an approved treatment.', 9500, 450, 'experience', ['£95 value', '£125 value', '£175 value']),
          offering('restorative-massage', 'Restorative Massage', 'A 60-minute massage at a participating sample spa.', 7500, 450, 'experience', ['Relaxation', 'Deep tissue']),
        ],
      },
      {
        id: 'sample-garden-spa',
        name: 'Sample Garden Spa',
        description: 'A fictional local day spa with quiet treatment spaces and afternoon access.',
        availability: 'Local preview partner · Sample City',
        startingPricePence: 6500,
        offerings: [
          offering('spa-afternoon', 'Spa Afternoon', 'Afternoon facility access with one 30-minute treatment.', 8900, 450, 'experience', ['Weekday', 'Weekend']),
          offering('beauty-treatment', 'Beauty Treatment Voucher', 'A choice of facial, manicure or restorative treatment.', 6500, 350, 'experience', ['Facial', 'Manicure', 'Treatment credit']),
        ],
      },
    ],
  },
  {
    id: 'getaways',
    label: 'Getaways',
    visual: 'getaway',
    description: 'Hotels, countryside stays and flexible city-break vouchers.',
    partners: [
      {
        id: 'near-far-stays',
        name: 'Near & Far Stays Preview',
        description: 'Flexible getaway vouchers for a fictional collection of UK stays.',
        availability: 'National preview coverage',
        startingPricePence: 15000,
        offerings: [
          offering('weekend-escape', 'UK Weekend Escape Voucher', 'A flexible contribution towards a one-night UK stay.', 18000, 650, 'experience', ['£180 value', '£250 value']),
          offering('city-break-credit', 'City Break Credit', 'A voucher towards a participating sample city hotel.', 15000, 650, 'experience', ['London sample', 'Regional city sample']),
        ],
      },
      {
        id: 'meadow-house-retreats',
        name: 'Meadow House Retreats Preview',
        description: 'Fictional countryside properties offering quiet overnight stays.',
        availability: 'Regional preview partner · Sample Region',
        startingPricePence: 19500,
        offerings: [
          offering('country-night', 'Countryside Night Away', 'A one-night stay with breakfast at a sample retreat.', 19500, 650, 'experience', ['Midweek', 'Weekend supplement']),
          offering('two-night-retreat', 'Two-Night Retreat Voucher', 'A flexible two-night countryside stay voucher.', 32000, 750, 'experience', ['Room only', 'Breakfast included']),
        ],
      },
    ],
  },
]

export const RECEIVE_GIFT_PREVIEW = {
  category: GIFT_PREVIEW_MARKETPLACE[0],
  partner: GIFT_PREVIEW_MARKETPLACE[0].partners[0],
  offering: GIFT_PREVIEW_MARKETPLACE[0].partners[0].offerings[0],
}

export const giftPreviewMoney = (pence: number) => new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
}).format(pence / 100)
