# Bartolomeu Home Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Lojinha do Bartolomeu home as a responsive feline-themed e-commerce storefront while preserving its current catalog, cart, freight quote and checkout behavior.

**Architecture:** Keep the existing Express application and public static-page architecture. `index.html` supplies semantic page regions and the existing cart drawer, `app.js` supplies temporary marketing data and renders catalog cards from `/api/catalog`, and `style.css` owns the visual system and responsive layouts.

**Tech Stack:** Node.js 20+, Express 5, vanilla HTML, CSS and ES modules.

**Spec:** `docs/superpowers/specs/2026-09-29-bartolomeu-home-redesign-design.md`

## Global Constraints

- Preserve Express, `GET /api/catalog`, the `barto-cart` localStorage key, freight quote and checkout APIs; do not add dependencies.
- Do not introduce personalization, uploads, quizzes or customer-created artwork.
- Use `#CFEAF6`, `#FFA97D`, `#FFF7EA`, `#3B180F` and white as the principal palette; use Coiny for display headings and Nunito Sans elsewhere.
- Use only local Bartolomeu images as temporary hero/banner imagery; product art remains a clearly replaceable local/CSS placeholder.
- Keep all controls keyboard-accessible, avoid broken links and horizontal overflow, and lazy-load below-the-fold images.
- The repository has no lint, test or build scripts; verification must use the available Node start command and browser/manual checks without adding tooling.

## Review Focus

- Empty catalog API response must leave the featured-products section usable and must not throw when the user opens the cart.
- A product's add button must use the API product `id`, increase the persisted `barto-cart` quantity and update the visible count.
- Existing localStorage cart IDs that are absent from the current catalog must render safely in the drawer.
- The 375 px layout must not introduce page-level horizontal scrolling, including the header and product grid.
- In-page header/footer links must target actual section IDs; icon-only buttons must expose accessible names.

---

### Task 1: Establish the reusable home data and catalog-card rendering

**Files:**
- Modify: `public/app.js`

**Interfaces:**
- Consumes: `GET /api/catalog` returning `Array<{id: string, name: string, description: string, priceCents: number, image: string}>`.
- Produces: `HOME_CONTENT` for benefits, steps, testimonials and footer benefits; `renderCatalog(products: CatalogProduct[]): void` that creates cards using a product `id` and preserves the current cart flow.

- [ ] **Step 1: Write the failing browser smoke scenario**

Document a manual scenario in the task implementation notes: stub `/api/catalog` with one product, click its “Adicionar” button, and assert `localStorage['barto-cart']` contains its ID with quantity `1`, the count becomes `1`, and the drawer opens.

- [ ] **Step 2: Run the smoke scenario against the current UI**

Run: `npm start`, open `http://localhost:3000`, and run the scenario in browser devtools.

Expected: FAIL because the current card uses only a plus icon and does not match the new card contract.

- [ ] **Step 3: Add `HOME_CONTENT` and implement `renderCatalog(products)` in `public/app.js`**

Define temporary benefits, four real-order-flow steps and testimonial objects in one data constant. Render cards with an accessible labeled add button (`data-id`), price and a replaceable mug placeholder; bind the same add-to-cart operation currently used by `.add`. Render a friendly empty state for `products.length === 0`. Do not modify checkout, shipping or API request payload shapes.

- [ ] **Step 4: Run the smoke scenario and cart compatibility checks**

Run: `npm start`, then repeat the one-product scenario and open a persisted cart with an unknown product ID.

Expected: PASS; the visible count, subtotal, drawer and unknown-product fallback all render without uncaught errors.

- [ ] **Step 5: Commit the isolated change when repository permissions permit**

Run: `git add public/app.js && git commit -m "feat: render redesigned catalog cards"`

Expected: only `public/app.js` is staged. If `.git/index.lock` permission is denied, leave the file uncommitted and record the blocked commit.

### Task 2: Rebuild the semantic home structure around preserved cart markup

**Files:**
- Modify: `public/index.html`

**Interfaces:**
- Consumes: `HOME_CONTENT` containers and `#products` populated by `renderCatalog`.
- Produces: stable IDs `inicio`, `canecas`, `como-funciona`, `depoimentos`, `presentes`, `sobre` and all existing cart DOM IDs consumed by `app.js`.

- [ ] **Step 1: Write the failing structural browser check**

In browser devtools, assert that the page contains one `header`, one `main`, a hero, benefits, how-it-works, featured-products, banner, testimonials, final-benefits and footer regions; assert every header link resolves to an existing fragment ID.

- [ ] **Step 2: Run the structural check against the existing markup**

Run: `npm start`, load the home, and inspect anchors/landmarks.

Expected: FAIL because the requested sections and target IDs do not yet all exist.

- [ ] **Step 3: Replace the home markup in `public/index.html`**

Import Google Fonts with `preconnect` hints, update title/description, build the approved section order with semantic landmarks, use `barto-flores.png` (hero) and another existing Bartolomeu image (banner), and include container elements for data-driven content. Preserve the drawer, veil, form controls and every ID referenced by `app.js`. Add a menu toggle button and accessible labels for icon controls.

- [ ] **Step 4: Run the structural and keyboard checks**

Run: `npm start`, inspect the DOM, tab through header/cart/drawer controls, and activate every in-page navigation link.

Expected: PASS; all regions and targets exist, focus is reachable, and the cart opens/closes as before.

- [ ] **Step 5: Commit the isolated change when repository permissions permit**

Run: `git add public/index.html && git commit -m "feat: structure Bartolomeu storefront home"`

Expected: only `public/index.html` is staged, subject to the same index-lock caveat.

### Task 3: Implement the visual system and responsive behavior

**Files:**
- Modify: `public/style.css`

**Interfaces:**
- Consumes: class names and IDs produced by Tasks 1–2.
- Produces: desktop, tablet and mobile layouts with no page-level horizontal overflow and visible focus styles.

- [ ] **Step 1: Write the failing visual viewport checks**

At 375 px, 430 px, 768 px, 1024 px and 1440 px, verify `document.documentElement.scrollWidth === window.innerWidth`; at desktop verify two-column hero and four inline process steps; at mobile verify stacked hero/process steps and a two-column product grid.

- [ ] **Step 2: Run viewport checks against the existing stylesheet**

Run: `npm start`, use browser responsive mode at the five specified widths, and record deviations from the requested visual system.

Expected: FAIL because current colors, typography, layout and section styles do not match the approved design.

- [ ] **Step 3: Rewrite `public/style.css` using design tokens and responsive breakpoints**

Define the four required color tokens, font families, radii and transition duration. Style the approved sections, local image treatments, placeholder mugs, cards, benefit icons, process steps, testimonials, drawer and mobile menu. Use Coiny only for display headings and Nunito Sans elsewhere; include `:focus-visible`, `prefers-reduced-motion` and `overflow-x: clip` safeguards.

- [ ] **Step 4: Run viewport, interaction and performance checks**

Run: `npm start`, inspect all five widths, hover a card/button, use the cart flow, and confirm below-the-fold images carry `loading="lazy"`.

Expected: PASS; no horizontal overflow, expected column changes, subtle interactions, readable contrast and functioning cart.

- [ ] **Step 5: Commit the isolated change when repository permissions permit**

Run: `git add public/style.css && git commit -m "feat: style Bartolomeu storefront home"`

Expected: only `public/style.css` is staged, subject to the same index-lock caveat.

### Task 4: Execute final regression and handoff verification

**Files:**
- Verify: `public/index.html`, `public/style.css`, `public/app.js`, `server/catalog.js`, `server/index.js`

**Interfaces:**
- Consumes: completed Tasks 1–3 and the existing `/api/catalog`, `/api/shipping` and `/api/checkout` contracts.
- Produces: evidence that the redesign did not modify or break the commerce flow.

- [ ] **Step 1: Check static syntax and changed-file scope**

Run: `git diff --check` and `git diff -- public/index.html public/style.css public/app.js server/index.js server/catalog.js`.

Expected: no whitespace errors; server catalog and checkout source are unchanged.

- [ ] **Step 2: Verify API and user journey manually**

Run: `npm start`; visit `/health`, `/api/catalog` and the home; add a product, adjust quantity, open the cart, enter a CEP, and confirm that the existing shipping request is issued without changing its payload shape. Do not submit a real checkout.

Expected: health and catalog return successfully; local cart calculations work; shipping behavior remains delegated to the original backend.

- [ ] **Step 3: Report verification limitations accurately**

Record that `package.json` has no `lint`, `test` or `build` scripts and therefore those commands cannot be run without unauthorized tooling changes. Report the server/API/browser checks actually run and any integration behavior blocked by missing environment credentials.

- [ ] **Step 4: Commit documentation or final metadata only when repository permissions permit**

Run: `git status --short` and stage only files created by this work. Do not stage pre-existing `package.json` or `package-lock.json` changes. If Git continues to deny `.git/index.lock`, leave all new work uncommitted and report the reason.

## Plan Self-Review

- **Spec coverage:** Tasks 1–3 cover data behavior, every requested visual section, local imagery/placeholders, typography/palette, accessibility and responsive requirements. Task 4 protects existing commerce behavior and documents unavailable automation.
- **Step clarity:** Every implementation step names an exact file, interface or manual assertion; no server contract is left to interpretation.
- **Type consistency:** `renderCatalog(products)` consumes the existing catalog response and continues passing product IDs to the current object-based cart. Existing endpoint and DOM IDs remain stable.
- **Review focus coverage:** Empty catalogs and unknown stored IDs are checked in Task 1; cart binding is Task 1; mobile overflow is Task 3; fragment links and accessible controls are Task 2.
- **Proportion:** The plan changes only the three public assets and validates the unaffected server contract, matching the approved scope.
