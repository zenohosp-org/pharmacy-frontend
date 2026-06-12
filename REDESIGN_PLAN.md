# Pharmacy Frontend — Visual Redesign Plan

**Goal:** make the pharmacy app feel modern, alive, and "clinical-premium" — depth, color, motion, and personality — without rebuilding logic. This is a **styling + presentational** redesign: we touch CSS, design tokens, and a handful of presentational components. No API, hook, or routing changes.

---

## 1. Why it feels boring today (diagnosis)

The token system in `styles/design-system.css` is solid (Lexend, full color scale, spacing/radius/shadow vars). The flatness comes from how it's *used*:

| Symptom | Where | Fix theme |
|---|---|---|
| Monochrome sidebar — active state is flat gray `#e4e4e4`, icons always `#020617` | `styles/layouts.css` `.sidebar-*` | Colored active pill, gradient brand, accent icons |
| Cards are white with a 1px border and **no shadow** | `styles/components.css` `.card` | Soft elevation, rounded-xl, hover lift |
| Stat cards: plain white + emoji icon, no color/trend | `components/ui/StatCard.*`, `DashboardStats` | Gradient/tinted cards, icon chips, trend deltas |
| Two clashing page backgrounds (`--color-bg-page #F1F5F9` vs `.main-content #f9f9f9`) | `design-system.css`, `layouts.css` | One soft tinted canvas |
| Brand color barely appears; everything is gray/black | global | Purposeful primary + a fresh medical accent |
| Tables, modals, forms are functional but flat | `components.css` | Subtle depth, zebra/hover polish, focus glow |
| No motion — only a `translateY(-1px)` on buttons | global | Mount transitions, skeleton shimmer, count-up, toasts |
| Emoji icons (📦 etc.) read as unpolished | `DashboardStats`, `QuickActions` | Consistent `lucide-react` icons in tinted chips |

---

## 2. Design direction

**"Calm clinical."** Keep the blue primary, add a fresh **teal/emerald accent** for a health feel, lean on **soft depth + whitespace + one accent gradient**. Premium but legible; not flashy.

- **Primary** `#2563EB` (keep) · **Accent** teal `#0EA5E9`/emerald `#10B981` for positive/health cues.
- **Surfaces:** white cards on a faint cool-gray canvas with a barely-there top gradient.
- **Depth:** every card gets `--shadow-sm`, interactive cards lift to `--shadow-md` on hover.
- **Radius:** standardize cards on `--radius-xl` (0.875rem) for a softer, modern feel.
- **Motion:** 150–250ms ease; content fades/slides in on mount; numbers count up; hovers lift.
- **Dark mode:** out of scope for v1 (note as a future token swap).

---

## 3. Token & global changes (`styles/design-system.css`)

1. **Unify the canvas.** Set `--color-bg-page` and `.main-content` background to one value — a faint vertical gradient: `linear-gradient(180deg,#F8FAFC 0%, #F1F5F9 100%)` (or solid `#F6F8FB`). Remove the stray `#f9f9f9` in `layouts.css`.
2. **Add elevation + accent tokens:** brand-tinted shadows (`--shadow-primary: 0 8px 24px rgba(37,99,235,.18)`), a hero gradient `--gradient-brand: linear-gradient(135deg,#2563EB,#0EA5E9)`, and tint backgrounds already exist (`*-subtle`).
3. **Motion tokens** already exist (`--transition-*`); add `--ease-spring: cubic-bezier(.34,1.56,.64,1)` for playful pops (modals/cards).
4. **Global niceties:** styled thin scrollbars, `::selection` in brand tint, smoother default `:focus-visible` ring using the primary glow.

---

## 4. Component-level redesign

### 4.1 Sidebar (`styles/layouts.css`, `components/Layout.jsx`)
- **Brand:** gradient text or a gradient pill logo; subtle bottom divider.
- **Active link:** primary-tinted pill `background: var(--color-primary-subtle)`, primary text + **primary icon**, a 3px left accent bar or full rounded pill. Replace flat `#e4e4e4`.
- **Hover:** light primary tint, not gray.
- **Section titles:** smaller, more letter-spacing, muted.
- **Collapse chevrons:** rotate-animate on open.
- **"Other Apps" footer:** each app gets its brand-colored icon chip.

### 4.2 Buttons (`components/ui/Button.jsx`, `components.css`)
- Primary: keep fill, add the brand gradient option for hero CTAs (`+ New Sale`, `Complete Sale`); crisper shadow; press scale `0.98`.
- Add a **ghost-accent** and **soft** (tinted) variant for secondary actions.
- Add loading spinner state (used on checkout/save).

### 4.3 Cards (`components.css` `.card`, `components/ui/Card.jsx`)
- Default `--shadow-sm`, `--radius-xl`, 1px hairline border.
- New modifier `.card--interactive` → hover lift to `--shadow-md` + `translateY(-2px)`.
- Card header: optional gradient/tinted strip + leading icon chip.

### 4.4 Stat cards (`components/ui/StatCard.*`, `dashboard/DashboardStats.jsx`)
- Replace emoji with **lucide icons in a tinted rounded chip** (color per tone).
- Tone-colored value + a subtle tone-tinted background wash or left accent border.
- Optional **trend delta** (▲ 12% today) and a tiny sparkline placeholder.
- **Count-up animation** on mount (small `useCountUp` helper).

### 4.5 Tables (`components/ui/Table.*`, `components.css`)
- Sticky header with a soft shadow on scroll; zebra or hover-tint rows; rounded outer corners; expand chevrons animate.
- Numeric/units columns in `--font-mono` for alignment.
- Empty states get an icon + friendly copy (not just gray text).

### 4.6 Modals (`components.css`)
- Already animate; upgrade to spring easing, slightly larger radius, header icon chip, sticky footer with gradient primary confirm.

### 4.7 Forms (`Input/Select`, `components.css`)
- Focus: primary border + soft primary glow (today it turns the border **black** — change to primary).
- Inputs on white (not gray-50) for crispness; clearer labels; inline validation color.

### 4.8 Badges / status (`StatusBadge`, `.badge`)
- Add a leading dot, softer tints; pill consistency across schedule badges (H/H1/X), stock status, rack types.

### 4.9 Feedback / motion (new, small)
- **Toasts** for success/error (replace inline `Alert` for transient events like "Bill created") — a tiny `Toast`/`useToast` in `components/ui/`.
- **Skeleton shimmer** loader to replace the spinner `ContentLoader` on data pages.
- **Page mount transition:** wrap routed content in a fade/slide (a `.page-enter` class or a tiny wrapper) — applied in `Layout`'s `<Outlet>` area.

---

## 5. Page-by-page polish

- **Dashboard** (`pages/Dashboard.*`, `components/dashboard/*`): hero greeting with date + gradient accent; redesigned `DashboardStats` (gradient/tinted icon-chip cards + count-up); `AlertCards` as colored alert tiles (red expiry / amber low-stock) with icons; `QuickActions` as colorful icon tiles with hover lift; `TodaysTransactionsCard` table polish.
- **Counter Sale** (`pages/CounterSale.*`): make it feel like a fast POS — sticky `BillSummary` with a gradient total, animated cart add/remove, clearer batch dropdowns (already added), prominent "Complete Sale" gradient CTA with loading state.
- **Rack Master** (`pages/RackMaster.*`): tiles already grid-based — add depth, type color accents (cold = blue gradient), hover lift, count badges as pills; detail modal header chip.
- **Stock Dashboard** (`pages/StockDashboard.*`): expiry/reorder status as colored pills + a small stock progress bar; expandable batch rows with the strip/loose breakdown styled as chips.
- **Drug Master** (`pages/DrugMaster.*`): schedule badges colored (OTC/H/H1/X), zebra table, search bar with icon.
- **IPD Dispensing / Queue / Logs** (`pages/Dispensing*.*`): patient panel as a profile card; prescription queue items as cards with status pills.
- **Reports** (`pages/reports/*`): consistent stat tiles + chart container styling.
- **Login** (`pages/Login.*`): branded gradient split screen / centered card with the brand gradient — strong first impression.

---

## 6. Phased rollout (low-risk order)

1. **Foundation (biggest visual win, lowest risk):** tokens + global canvas, sidebar, buttons, cards, tables, forms, modals (`design-system.css`, `components.css`, `layouts.css`, `ui/*`). This alone re-skins every page because they all consume these classes.
2. **Dashboard** — the hero surface; stat cards + count-up + alert/quick-action tiles.
3. **Motion & feedback** — page mount transition, toasts, skeleton loaders.
4. **Per-page passes** — Counter Sale, Stock Dashboard, Rack Master, Drug Master, IPD, Reports, Login.

Each phase is independently shippable; after Phase 1 the whole app already looks new.

---

## 7. Guardrails

- **CSS-only where possible.** Keep the rule: separate `.css` files, **no inline styles, no MUI** (matches project convention). New tokens/classes live in the existing `styles/*` files; page tweaks in their existing `.css`.
- **No logic churn.** Presentational components (`StatCard`, `Button`, `Card`, `Table`, `Alert→Toast`) may gain props/variants but keep current call sites working.
- **Reuse tokens** — no hardcoded hex in pages; everything references `--color-*`, `--shadow-*`, `--radius-*`.
- **Accessibility:** maintain contrast on tinted surfaces; keep `:focus-visible`; honor `prefers-reduced-motion` (already handled globally — extend to new animations).
- **Icons:** standardize on `lucide-react` (already a dep); remove emoji.

---

## 8. Verification

- `npm run build` + `npm run lint` clean after each phase.
- Click through every route at desktop + mobile widths (sidebar drawer, grids reflow).
- Visual QA: sidebar active states, card elevation/hover, stat-card count-up, modal spring, toast on a real counter sale, skeletons on load, focus rings.
- Confirm reduced-motion disables animations.

---

### Quick-win shortlist (if you want one commit that changes the "feel" the most)
1. Unify background + add soft card shadows + `--radius-xl`.
2. Color the sidebar active/hover states with the primary tint + accent icons.
3. Re-skin stat cards with tinted icon chips + tone colors + count-up.
4. Primary-glow focus rings (replace the black focus border) + button press scale.

Those four touch only `design-system.css`, `components.css`, `layouts.css`, `StatCard.*`, `DashboardStats.jsx` and visibly modernize the entire app.
