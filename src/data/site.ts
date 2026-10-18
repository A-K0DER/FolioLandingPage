// Single source of truth for everything you will want to edit before launch.
// TODO(you): replace every value marked TODO with the real thing.
export const site = {
  name: 'Folio',
  domain: 'mac-folio.com',
  url: 'https://mac-folio.com',
  tagline: 'The file manager Finder should have been.',
  description:
    'Folio is a file manager for macOS with plain-English search, safe file operations, tabs, Quick Open and archive support. 7-day free trial, sold directly.',
  version: '1.0.0', // TODO
  minMacOS: 'macOS 14', 
  releaseDate: '2026-10-01', // TODO
  price: { amount: 19, currency: 'USD', label: '$19' }, // TODO
  trialDays: 7,
  // TODO: point these at your DMG and your checkout (Dodo Payments / Paddle / Lemon Squeezy)
  downloadUrl: '#download-todo',
  checkoutUrl: '#checkout-todo',
  supportEmail: 'support@mac-folio.com', // TODO
  twitter: '', // TODO
} as const;

export const nav = [
  { href: '/features/', label: 'Features' },
  { href: '/pricing/', label: 'Pricing' },
  { href: '/compare/commander-one-alternative/', label: 'Compare' },
  { href: '/changelog/', label: 'Changelog' },
  { href: '/faq/', label: 'FAQ' },
] as const;

export const footer = [
  { title: 'Product', links: [
    { href: '/features/', label: 'Features' },
    { href: '/pricing/', label: 'Pricing' },
    { href: '/download/', label: 'Download' },
    { href: '/changelog/', label: 'Changelog' },
  ]},
  { title: 'Compare', links: [
    { href: '/compare/commander-one-alternative/', label: 'Folio vs Commander One' },
    { href: '/features/finder-alternative/', label: 'Finder alternative' },
  ]},
  { title: 'Resources', links: [
    { href: '/faq/', label: 'FAQ' },
    { href: '/support/', label: 'Support' },
  ]},
  { title: 'Legal', links: [
    { href: '/privacy/', label: 'Privacy' },
    { href: '/terms/', label: 'Terms' },
  ]},
] as const;

export const featurePages = [
  { slug: 'finder-alternative', title: 'Finder Alternative', blurb: 'An Explorer-style layout with tabs, address bar, sidebar and details pane.' },
  { slug: 'search', title: 'Plain-English Search', blurb: 'Type "pdfs bigger than 10 MB modified last week" and get results.' },
  { slug: 'safe-file-operations', title: 'Safe File Operations', blurb: 'Trash on delete, verified moves, and undo for every operation.' },
  { slug: 'archives', title: 'Archives', blurb: 'Look inside ZIP, TAR and 7Z, then extract.' },
] as const;
