# Prompt — Website Header & Content Upgrade

Copy everything below the line and paste into your AI coding tool (Claude Code, Cursor, Lovable, Bolt, etc.). If your tool accepts images, attach the reference screenshot of the pill navbar + mega dropdown.

---

## ROLE
You are a senior front-end engineer and UI/UX designer. Upgrade my existing website's navigation, information architecture, and key pages. Work step by step, keep my existing code and content working, and do not delete anything without moving it to its new place.

## CONTEXT
My site is a tech and learning hub. It currently has this header:

`AI & ML | IT & Cloud | Developers | Resource types | Discover`

Problem: every one of these menu items only opens **repository** content. The menu is repetitive, and visitors cannot tell resources, repositories, and applications apart.

## NEW HEADER (replace the old one completely)

```
About Us | Our Resources ▾ | Our Repository | Our Applications | Our Projects | Contact Us        [Get in Touch]
```

### 1. About Us
Who I am, mission, skills and tech stack, journey timeline, links to GitHub / LinkedIn / YouTube / portfolio.

### 2. Our Resources (mega dropdown, 3 columns)
Each item = page with: short intro, beginner → advanced roadmap, best free and paid courses, cheat sheets, related repositories, related applications.

- AI & ML
- IT Services
- Cloud Storage
- Coding Languages
- Data Science
- Data Analyst
- Full Stack Development
- DevOps
- Prompt Engineering
- Loop Engineering
- (build so I can add more later: Cyber Security, Databases, UI/UX, Automation, Generative AI, MLOps)

Every dropdown item shows: UPPERCASE TITLE + one-line description (max ~60 characters).

### 3. Our Repository
Take **all repositories that currently exist on the site** and re-arrange them **category-wise**. Do not lose any repository.
- Categories: AI & ML, Data Science & Analytics, Full Stack / Web, Automation & Scripts, Cloud & DevOps, Prompt & Loop Engineering, Mobile / Games, Others.
- UI: category tabs or left sidebar filter, search bar, sort (Latest / Popular / A–Z).
- Repo card: name, short description, tech tags, GitHub link, live demo link.
- Each repo has a single `category` field in the data file (single source of truth).
- If a repo does not fit, put it in "Others" and list it for me at the end of your answer.

### 4. Our Applications (external tech / IT / AI websites)
A card grid of useful Tech, IT, and AI websites. Each card **must** have:
- Logo or screenshot **image**
- Name
- Category
- One-line description
- **Official URL** (official site only, no mirrors or affiliate links)
- Pricing tag (Free / Freemium / Paid)

Categories: AI Chat & Assistants, AI Image / Video / Audio, Coding & Dev Tools, Design & UI, Cloud & Hosting, Data & Analytics, Productivity & Automation, Learning Platforms.

Rules:
- Store in one data file (`apps.json`). Page reads from it; adding a new app = adding one JSON entry.
- Open links in a new tab with `rel="noopener noreferrer"`.
- Lazy-load images, use WebP, add proper `alt` text.
- Add category filter + search.

### 5. Our Projects
Applications built by me (examples: Sticker Print Studio, KPI Dashboard, Tooling System, PC-Reminder, Running Game, Roni voice assistant). Card: screenshot, name, problem solved, tech stack, status (Live / In progress), live link, GitHub link.

### 6. Contact Us
Contact form (name, email, subject, message), email, LinkedIn, GitHub, YouTube links.

## UI / DESIGN REQUIREMENTS (match the reference screenshot style)

**Navbar**
- Floating **white pill-shaped navbar** with soft shadow, menu links inside, logo on the left outside the pill, solid teal **CTA button** ("Get in Touch") on the right.
- Chevron `▾` on dropdown items, rotates when open. Open/hover link turns teal.
- Sticky on scroll with a light shadow after ~10px scroll.

**Mega dropdown**
- Full-width white panel under the navbar, rounded corners (16px), soft shadow.
- 3-column grid, large padding. Item = **teal uppercase bold title** + grey description below.
- Fade + slide-down animation (~220ms). Opens on hover (desktop, short delay) and click (touch). One panel open at a time. Closes on outside click, `Esc`, and route change.

**Design tokens**
- Teal `#1F9A97` (hover `#167A78`), text `#1A1F26`, muted `#5B6670`, surface `#FFFFFF`, page tint `#EEF6F6`.
- Font: Poppins or Inter. Menu 18px, mega title 20px uppercase bold, description 16px.
- Dark mode support.

**Responsive**
- ≥1200px: full pill + 3-column mega.
- 768–1199px: 2-column mega.
- <768px: hamburger → slide-in drawer, Resources as accordion, CTA at the bottom.

**Accessibility & performance**
- Keyboard navigation, `aria-expanded`, `aria-haspopup`, visible focus ring, WCAG AA contrast, respect `prefers-reduced-motion`.
- Target Lighthouse 90+.

## LIBRARIES / STYLE RULES
- Use **React Bits** (reactbits.dev) components for animated UI parts: nav hover effects, card hover/glow, text effects on hero heading, subtle background.
- Use **MotionSites** (motionsites.ai) design prompts as the visual direction for hero section, spacing, typography, and scroll animations.
- Keep the header itself clean. Put heavy animation in hero and cards.
- Do not copy any other brand's logo, name, or text. Use my own branding.

## DATA STRUCTURE
Create these data files so content is easy to edit:

```
/data/nav.js          // menu + dropdown items (label, href, desc)
/data/repos.json      // all repositories with category
/data/apps.json       // external applications (name, category, description, image, url, pricing)
/data/projects.json   // my built projects
/data/resources.json  // resource topics, roadmap, courses, cheat sheets
```

`nav.js` shape:

```js
export const navItems = [
  { label: "About Us", href: "/about" },
  { label: "Our Resources", href: "/resources", children: [
      { label: "AI & ML", href: "/resources/ai-ml", desc: "Machine learning, deep learning, model projects" },
      // ... all 10 topics
  ]},
  { label: "Our Repository", href: "/repository" },
  { label: "Our Applications", href: "/applications" },
  { label: "Our Projects", href: "/projects" },
  { label: "Contact Us", href: "/contact" }
];
```

## WORKFLOW (follow in order)
1. Read my current codebase. List current header items, routes, and all repositories.
2. Show me a short plan and the category mapping for every repository. Then continue.
3. Build `nav.js` + new Header (desktop, mega dropdown, mobile drawer).
4. Build pages: About, Resources (one template + 10 topic pages), Repository, Applications, Projects, Contact.
5. Fill `apps.json` with at least 24 real tech / IT / AI sites (3 per category) with **official URLs only**. Mark any URL you could not verify with `"verified": false`.
6. Add 301 redirects from old URLs to new ones so no link breaks.
7. Add SEO: page titles, meta descriptions, Open Graph, sitemap.
8. Test: mobile, keyboard, broken links, Lighthouse. Fix issues.
9. Give me a final summary: what changed, files added, anything needing my input (logo, images, missing repo categories).

## RULES
- Do not delete existing repositories or content; move them.
- Ask me only when blocked; otherwise choose the sensible default and say what you chose.
- If you are unsure about a URL or logo, do not invent it. Mark it clearly.
- Keep code clean, commented, and component-based.
- Show diffs / file list after each major step.

## DEFINITION OF DONE
- [ ] New 6-item header works on desktop and mobile
- [ ] Resources dropdown has all 10 topics, each with a working page
- [ ] Every old repository appears under the right category
- [ ] Applications page: every card has image + working official URL
- [ ] Contact form works
- [ ] No broken links, Lighthouse ≥ 90, old URLs redirect
