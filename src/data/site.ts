// Single source of truth for everything you will want to edit before launch.
// TODO(you): replace every value marked TODO with the real thing.
export const site = {
  name: 'Folio',
  domain: 'mac-folio.com',
  url: 'https://mac-folio.com',
  tagline: 'The file manager Finder should have been.',
  description:
    'Folio is a Mac Finder alternative: a file manager for macOS with plain-English search, safe file operations, tabs, Quick Open and archive support. 7-day free trial.',
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
    { href: '/compare/forklift-alternative/', label: 'Folio vs ForkLift' },
    { href: '/compare/path-finder-alternative/', label: 'Folio vs Path Finder' },
    { href: '/compare/marta-alternative/', label: 'Folio vs Marta' },
    { href: '/best-mac-file-manager/', label: 'Best Mac file manager' },
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

// Competitor details are deliberately limited to what is widely known. Verify on each product's own site before adding specifics.
export const rivals = [
  {
    slug: 'forklift-alternative', name: 'ForkLift', kw: 'ForkLift Alternative for Mac',
    desc: 'Looking for a ForkLift alternative for Mac? See how Folio, a Finder alternative with plain-English search and undoable file operations, differs.',
    h1: 'A ForkLift alternative for people who want a safer, simpler file manager.',
    intro: 'ForkLift is a well-known Mac file manager. If you are weighing it against other Mac file manager apps, here is where Folio fits.',
    who: 'ForkLift is often chosen by people who want a dual-pane file manager. Folio takes a different route: one familiar Explorer-style window with tabs, a details pane and a clickable address bar.',
  },
  {
    slug: 'path-finder-alternative', name: 'Path Finder', kw: 'Path Finder Alternative for Mac',
    desc: 'Looking for a Path Finder alternative on Mac? See how Folio, a Finder alternative built around plain-English search and safe file operations, differs.',
    h1: 'A Path Finder alternative built around safe file operations.',
    intro: 'Path Finder is one of the longest-running Finder replacements for Mac. Here is how Folio differs for people comparing the two.',
    who: 'Path Finder is known for being a feature-rich Finder replacement. Folio aims to be simpler: the essentials done carefully, with search you can type in plain English.',
  },
  {
    slug: 'marta-alternative', name: 'Marta', kw: 'Marta Alternative: Finder Alternative for Mac',
    desc: 'Looking for a Marta alternative? Folio is a Mac Finder alternative with plain-English search, tabs, Quick Open and undo for every file operation.',
    h1: 'A Marta alternative with plain-English search and undo.',
    intro: 'Marta is a file manager that Mac users look at when leaving Finder. Here is how Folio compares as a Marta Finder alternative.',
    who: 'If you are comparing Marta with other Finder alternatives, Folio is the option to try when you want undoable operations, archive browsing and search that understands everyday phrasing.',
  },
] as const;
