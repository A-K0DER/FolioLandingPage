// Single source of truth for everything you will want to edit before launch.
// TODO(you): replace every value marked TODO with the real thing.
export const site = {
  name: 'Folio',
  domain: 'mac-folio.com',
  url: 'https://mac-folio.com',
  tagline: 'The file manager Finder should have been.',
  description:
    'Folio is a Mac Finder alternative: a file manager for macOS with plain-English search, safe file operations, tabs, Quick Open and archive support.',
  version: '1.0.0', // TODO
  minMacOS: 'macOS 14', 
  releaseDate: '2026-10-01', // TODO
  price: { amount: 19.99, currency: 'USD', label: '$19.99' },
  // TODO: point these at your DMG and your checkout (Dodo Payments / Paddle / Lemon Squeezy)
  downloadUrl: '/downloads/Folio-1.0.0.dmg',
  checkoutUrl: 'https://checkout.dodopayments.com/buy/pdt_0Nq1fGt8Ixf2XOrna9nfR?quantity=1',
  supportEmail: 'ayushk199923@gmail.com', // TODO: switch to support@mac-folio.com once email routing is set up
  twitter: '', // TODO
} as const;

export const nav = [
  { href: '/features/', label: 'Features' },
  { href: '/pricing/', label: 'Pricing' },
  { href: '/compare/commander-one-alternative/', label: 'Compare' },
  { href: '/changelog/', label: 'Changelog' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
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
    { href: '/about/', label: 'About Us' },
    { href: '/contact/', label: 'Contact Us' },
  ]},
  { title: 'Legal', links: [
    { href: '/privacy/', label: 'Privacy Policy' },
    { href: '/terms/', label: 'Terms & Conditions' },
  ]},
] as const;

export const featurePages = [
  { slug: 'finder-alternative', title: 'Finder Alternative', blurb: 'An Explorer-style layout with tabs, address bar, sidebar and details pane.' },
  { slug: 'search', title: 'Plain-English Search', blurb: 'Type "pdfs bigger than 10 MB modified last week" and get results.' },
  { slug: 'safe-file-operations', title: 'Safe File Operations', blurb: 'Trash on delete, verified moves, and undo for every operation.' },
  { slug: 'archives', title: 'Archives', blurb: 'Look inside ZIP, TAR and 7Z, then extract.' },
  { slug: 'group-by-category', title: 'Group by Category', blurb: 'Sort a folder into Videos, Images, PDFs and more, with fold-away headers and a size for each group.' },
  { slug: 'storage-breakdown', title: 'Storage Breakdown', blurb: 'See what is taking up space in a folder, split by category, without leaving the details pane.' },
] as const;

// Competitor details are deliberately limited to what is widely known. Verify on each product's own site before adding specifics.
export const rivals = [
  {
    slug: 'forklift-alternative', name: 'ForkLift', kw: 'ForkLift Alternative for Mac',
    desc: 'Looking for a ForkLift alternative for Mac? See how Folio, a Finder alternative with plain-English search and undoable file operations, differs.',
    h1: 'A ForkLift alternative for people who want a safer, simpler file manager.',
    intro: 'ForkLift is a well-known Mac file manager. If you are weighing it against other Mac file manager apps, here is where Folio fits.',
    who: 'ForkLift is often chosen by people who want a dual-pane file manager. Folio takes a different route: one familiar Explorer-style window with tabs, a details pane and a clickable address bar.',
    asOf: 'ForkLift 4.7.6 on binarynights.com',
    rows: [
      ['Layout', 'Dual-pane with tabs, workspaces and sync browsing'],
      ['Remote connections', 'SFTP, FTP, WebDAV, Amazon S3, Backblaze B2, Google Drive, OneDrive, Dropbox, SMB, AFP, NFS'],
      ['Search', 'Search, quick select and tags, including on remote servers'],
      ['Archives', 'Browse local and remote archives as folders'],
      ['Extras', 'Folder sync, Git support, file comparison, app deleter, themes'],
      ['Price', 'One-year updates from $19.95 (single user); two-year from $34.95; described as a lifetime license'],
      ['Minimum macOS', 'macOS 14.6'],
    ],
    pick: 'Choose ForkLift if you regularly work with remote servers and cloud storage, or want dual panes and folder sync. Choose Folio if most of your work is on local files and you value plain-English search, undo for every operation and a single-window layout.',
  },
  {
    slug: 'path-finder-alternative', name: 'Path Finder', kw: 'Path Finder Alternative for Mac',
    desc: 'Looking for a Path Finder alternative on Mac? See how Folio, a Finder alternative built around plain-English search and safe file operations, differs.',
    h1: 'A Path Finder alternative built around safe file operations.',
    intro: 'Path Finder is one of the longest-running Finder replacements for Mac. Here is how Folio differs for people comparing the two.',
    who: 'Path Finder is known for being a feature-rich Finder replacement. Folio aims to be simpler: the essentials done carefully, with search you can type in plain English.',
    asOf: 'press coverage and download pages; check cocoatech.io for current details',
    rows: [
      ['Layout', 'Dual pane, tabbed browsing, bookmarks bar and breadcrumbs'],
      ['Folder tools', 'Compare, merge and synchronize folders; batch rename and batch select'],
      ['Drag and drop', 'Drop Stack for pausing a drag-and-drop operation'],
      ['Other', 'Shows hidden files, full keyboard navigation, saved searches'],
      ['Price', 'Past versions offered a 30-day demo; confirm current pricing on its website'],
    ],
    pick: 'Choose Path Finder if you want a long-established, feature-rich Finder replacement with dual panes and folder-compare tools. Choose Folio if you want a smaller, calmer app built around search, safe operations and a clear price.',
  },
  {
    slug: 'marta-alternative', name: 'Marta', kw: 'Marta Alternative: Finder Alternative for Mac',
    desc: 'Looking for a Marta alternative? Folio is a Mac Finder alternative with plain-English search, tabs, Quick Open and undo for every file operation.',
    h1: 'A Marta alternative with plain-English search and undo.',
    intro: 'Marta is a file manager that Mac users look at when leaving Finder. Here is how Folio compares as a Marta Finder alternative.',
    who: 'If you are comparing Marta with other Finder alternatives, Folio is the option to try when you want undoable operations, archive browsing and search that understands everyday phrasing.',
    asOf: 'marta.sh',
    rows: [
      ['Layout', 'Multiple windows and tabs'],
      ['Extensibility', 'Plugins written with a Lua API; five built-in themes you can customize'],
      ['Search', 'Quick Search by substring or regular expression, plus system-wide Look Up'],
      ['Archives', 'Opens and writes ZIP; opens RAR, 7Z, TAR, ISO and others'],
      ['Extras', 'Built-in terminal, disk usage analysis, task queue with pause and resume'],
      ['Price and status', 'Download is free; the site asks for Patreon support and says Marta is in beta (version 0.8.2)'],
      ['Minimum macOS', 'macOS 11.0'],
    ],
    pick: 'Choose Marta if you want a free, scriptable file manager and are fine with beta software. Choose Folio if you want a released (non-beta) app with plain-English search, undo for every operation and a detail pane.',
  },
] as const;
