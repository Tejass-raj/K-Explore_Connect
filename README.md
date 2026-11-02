# K-Explore Connect

**A multi-page event discovery and registration website for KIIT University, built with plain HTML, CSS and JavaScript.**

Browse upcoming campus events, search and filter them, read the details, watch a live countdown, and reserve a seat, all without a backend, a framework or a build step.

> **Repository:** https://tejass-raj.github.io/K-Explore_Connect/

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [How It Works](#how-it-works)
7. [Managing Events](#managing-events)
8. [Form Validation Rules](#form-validation-rules)
9. [Design and Accessibility](#design-and-accessibility)
10. [Browser Support](#browser-support)
11. [Limitations and Future Improvements](#limitations-and-future-improvements)
12. [Author](#author)

---

## Overview

K-Explore Connect helps students find the events worth attending on campus and take their place at them. The site follows a simple three-step flow:

1. **Browse**: search by name, venue or category, and filter by category.
2. **Choose**: read the description, date, time, venue, seats and entry fee.
3. **Register**: reserve a place in under a minute and receive a reference number.

The catalogue currently features eight KIIT and FED KIIT events, including KIIT MUN, Omega 6.0, the FED Hackathon, KIIT Fest, KIIT Tech Fest, Shark Tank and a GSoC session.

## Features

**Event discovery**
- Home page with featured events and a "Next Up" section showing a live countdown (days, hours, minutes, seconds) to the nearest upcoming event.
- Events page with real-time text search and category filter buttons that are generated automatically from the data.
- Result counter that updates as you search or filter, with a friendly empty state when nothing matches.
- Dedicated event detail page (`event.html?id=...`) showing date, time (IST), venue, seats, entry fee and its own countdown.
- Past events are hidden automatically, and their detail pages show "Registration closed".

**Registration**
- Form with full name, email, phone number and event selection.
- Event can be pre-selected by arriving from an event's "Register" button (`register.html?event=...`).
- Inline, field-level validation on blur and on input, with clear error messages and focus moved to the first invalid field.
- Duplicate protection: the same email cannot register twice for the same event.
- Unique reference code on success (format `KE-XXXXXX`).
- "Your registrations" list with the ability to cancel a registration.
- Registrations persist across page reloads using the browser's `localStorage`.

**Site-wide**
- Fully responsive layout with a mobile slide-out menu (closes on link click, `Esc`, or resize to desktop).
- Scroll-reveal and fade-in animations that respect the `prefers-reduced-motion` setting.
- Custom 404 page.
- Per-page titles, meta descriptions and Open Graph tags; the event detail page updates its title and description dynamically.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Markup | HTML5 (semantic elements, ARIA attributes) |
| Styling | CSS3 (custom properties, Grid, Flexbox, `clamp()` fluid sizing, media queries) |
| Behaviour | Vanilla JavaScript (ES5-style IIFE, no dependencies) |
| Storage | Browser `localStorage` |
| Fonts | Google Fonts: Cormorant Garamond and Jost |
| Images | WebP |

There is no framework, no package manager and no build tooling. Open the files and it works.

## Project Structure

```
K-Explore-Connect/
├── README.md
└── k-explore-connect/
    ├── index.html          # Home: hero, featured events, next-event countdown, how it works
    ├── events.html         # All upcoming events with search and category filters
    ├── event.html          # Single event detail page (driven by ?id= query parameter)
    ├── register.html       # Registration form and "your registrations" list
    ├── contact.html        # Contact details
    ├── 404.html            # Custom "page not found" page
    ├── css/
    │   └── style.css       # All styles: design tokens, layout, components, responsive rules
    ├── js/
    │   ├── events-data.js  # Event catalogue (edit this to add or change events)
    │   └── main.js         # Shared behaviour for every page
    └── images/
        ├── event-1.webp … event-8.webp
        └── favicon.svg
```

## Getting Started

### Option 1: Open directly
1. Clone the repository:
   ```bash
   git clone https://github.com/Tejass-raj/K-Explore_Connect.git
   cd K-Explore-Connect/k-explore_connect
   ```
2. Double-click `index.html` to open it in your browser.

### Option 2: Run a local server (recommended)
Some browsers restrict `localStorage` for `file://` pages, so a local server gives the most reliable result.

```bash
# Python 3
python -m http.server 8000

# or Node.js
npx serve .
```

Then visit **http://localhost:8000**.

### Deploying
Because the site is fully static, it can be hosted on GitHub Pages, Netlify or Vercel with no configuration. Point the host at the `k-explore-connect/` folder that contains `index.html`.

## How It Works

**Data-driven pages.** Every event lives in one array, `window.KE_EVENTS`, in `js/events-data.js`. `main.js` reads it, sorts events by date, filters out past events and renders cards, filters, detail pages and the registration dropdown from that single source.

**One script, many pages.** `main.js` runs on every page and checks `<body data-page="...">` (`home`, `events`, `event`, `register`, `contact`, `notfound`) to decide which behaviour to activate.

**Routing by query string.** Event cards link to `event.html?id=<encoded event id>`. The detail page reads the `id`, looks up the event, and shows a "not found" message if it does not exist.

**Registration storage.** Each registration is saved under the `keRegistrations` key in `localStorage` as JSON:

```json
{
  "ref": "KE-4F9A2B",
  "eventId": "FED hackathon",
  "eventName": "FED Hackathon",
  "name": "Student Name",
  "email": "student@example.com",
  "phone": "9876543210",
  "date": "2026-11-02T12:00:00.000Z"
}
```

**Safe rendering.** All dynamic text passes through an `esc()` helper before being inserted into the page, which guards against HTML injection.

## Managing Events

To add, edit or remove an event, change `js/events-data.js`. No other file needs to be touched.

```js
{
  id: "Unique Event ID",            // used in URLs, must be unique
  name: "Display Name",
  category: "Tech",                 // filter buttons are built from these automatically
  date: "2027-01-09T10:00:00+05:30",// ISO 8601 with IST offset
  venue: "C25, KIIT, Bhubaneswar",
  image: "images/event-4.webp",
  featured: true,                   // up to 3 featured events appear on the home page
  seats: 400,
  price: "₹500",                    // free-text, e.g. "Free"
  short: "Code. Create. Innovate.", // one-line summary shown on cards
  description: "Longer description shown on the detail page."
}
```

## Form Validation Rules

| Field | Rule |
|-------|------|
| Full name | Required, at least 2 characters, letters (including accented), spaces, dots, hyphens and apostrophes only |
| Email | Required, must match a standard `name@domain.tld` pattern |
| Phone | Required, 10 to 13 digits with optional leading `+`; spaces, hyphens and brackets are ignored |
| Event | Required, chosen from upcoming events only |
| Duplicates | The same email cannot register for the same event twice |

## Design and Accessibility

- **Visual style:** a dark, editorial "luxury typographic" look. Black background (`#0E0D0B`), ivory text (`#F3EDE2`) and gold accents (`#C6A15B`), set in a serif and sans-serif pairing. Colours, fonts and spacing are CSS custom properties in `:root`, so the theme can be changed in one place.
- **Responsive:** breakpoints at 960px, 860px, 768px, 600px and 480px. The event grid goes from 3 columns to 2 to 1.
- **Accessibility:**
  - Semantic landmarks (`header`, `nav`, `main`, `footer`) and labelled navigation.
  - `aria-current`, `aria-expanded`, `aria-pressed`, `aria-live` and `aria-invalid` used where state changes.
  - Visible `:focus-visible` outlines and keyboard-closable mobile menu.
  - `<noscript>` fallback on the event detail page.
  - Animations disabled for users who prefer reduced motion.
- **Performance:** WebP images with lazy loading, no JavaScript libraries, and a single stylesheet and script.

## Browser Support

Tested for modern evergreen browsers (Chrome, Edge, Firefox, Safari). Scroll-reveal falls back gracefully where `IntersectionObserver` is unavailable.

## Limitations and Future Improvements

This is a front-end project, so some things are intentionally simplified:

- **No backend.** Registrations are stored only in the visitor's own browser, so organisers cannot see them and they do not sync across devices.
- **Seat counts are informational.** Registering does not reduce the number of available seats.
- **No payment or email confirmation.** The reference number is shown on screen only.

Ideas for future work:

- [ ] Node.js / Firebase / Supabase backend for real registrations and an admin dashboard
- [ ] Email or SMS confirmation and a downloadable ticket (QR code)
- [ ] Live seat tracking and a "sold out" state
- [ ] User accounts and "my tickets"
- [ ] Calendar export (`.ics`) and share buttons
- [ ] Light theme toggle

## Author

**Tejas Raj** · [@Tejass-raj](https://github.com/Tejass-raj)
KIIT University, Bhubaneswar, Odisha
Contact: 2405315@kiit.ac.in

---

_Built as a course assignment. Event names and details are used for demonstration purposes._
