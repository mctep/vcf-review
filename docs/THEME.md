# Theme and design system

The app uses **Chakra UI v3** with a custom system created in `src/theme/index.ts`:

```ts
export const system = createSystem(defaultConfig, config)
```

`defaultConfig` provides Chakra's components and scales; `config` adds our tokens, semantic tokens, text styles,
layer styles, recipes and slot recipes and overrides a few defaults (surfaces, radii, button, badge). The system
is passed to `ChakraProvider` in `src/components/ui/provider.tsx`. Light/dark mode is handled by `next-themes`
(class strategy) through the Chakra `color-mode` snippet.

A live reference of everything below is available at **`#/ui`** (`src/dev/UiShowcasePage.tsx`).

---

## 1. Principles

- **Two surfaces, two moods.**
  - *Work surfaces* (case details, variants, report) are calm: a white `panel` on a pastel gradient, thin borders,
    almost no shadow, dense typography, monospace for genomic notation.
  - *Glass* surfaces (stats, upload, processing banner, assistant, empty states) are translucent with a soft glow
    and a thin gradient bar on top. Use them sparingly to highlight, never for dense data.
- **Meaning first.** Clinical states map to named palettes (`tier1`, `vus`, `agreementLow`…), not to colors.
  Components never hard-code colors.
- **Semantic tokens only.** In JSX use `fg.muted`, `bg.panel`, `brand.solid`… — never hex values or raw palette
  steps like `brand.600`. Semantic tokens switch automatically in dark mode.
- **One highlight per screen.** The gradient text (`<Highlight>`) and gradient bars are accents, not decoration.

---

## 2. Tokens (`src/theme/tokens`)

### Colors (`colors.ts`)

Four custom palettes with steps `50`–`950`, plus dark-mode surfaces:

| Palette | Key step | Role |
|---|---|---|
| `brand` | `600` = `#541FC7` | Primary violet: actions, links, section titles, selection |
| `accent` | `600` = `#D709B8` | Magenta: secondary CTA, "edited / updated" markers, gradient end |
| `aqua` | `500` = `#07B2BB` | Teal: processing state, file icons, gradient start |
| `ink` | `900` = `#0F1729`, `700` = `#435670`, `500` = `#65758B`, `200` = `#E1E7EF` | Cool slate neutrals for text and borders |
| `night` | `600`–`50` | Dark-mode surfaces (violet-tinted navy) |

### Typography (`typography.ts`)

| Token | Value |
|---|---|
| `fonts.heading`, `fonts.body` | Montserrat |
| `fonts.mono` | JetBrains Mono |
| `fontSizes.2xs` | 11px |
| `fontSizes.display` | 49px |
| `letterSpacings.display / title / heading` | −0.04em / −0.035em / −0.02em (tight headings, weight 800) |
| `letterSpacings.eyebrow / caps` | 0.12em / 0.06em (uppercase labels) |

### Radii (`radii.ts`)

Chakra components use the layered radii `l1`–`l3`; they are bumped up:

| Token | Value | Used by |
|---|---|---|
| `l1` | 4px | checkboxes, small chips |
| `l2` | 8px | buttons, inputs, menus, nav items |
| `l3` | 12px | cards, dialogs |
| `panel` | 12px | main work panel |
| `glass` | 18px | glass cards |

### Gradients (`gradients.ts`)

| Token | Use |
|---|---|
| `brandStripe` | 90° aqua → magenta. Top of the window, top of glass cards and the report |
| `logoTile` | 135° aqua → violet → magenta. Product mark |
| `highlightText` | Gradient text for one highlight per screen |

---

## 3. Semantic tokens (`src/theme/semanticTokens.ts`)

### Palette contract

Every custom palette exposes Chakra's standard keys, so it works with `colorPalette="…"` on all built-in
components (Button, Badge, Checkbox, Progress…):

| Key | Light | Dark |
|---|---|---|
| `<p>.solid` | `600` | `400` |
| `<p>.contrast` | white | `950` |
| `<p>.fg` | `600` | `300` |
| `<p>.muted` | `100` | `900` |
| `<p>.subtle` | `50` | `950` |
| `<p>.emphasized` | `200` | `800` |
| `<p>.focusRing` | `500` | `400` |

### Clinical palettes

Aliases of Chakra's built-in palettes. Use them through `colorPalette`; helpers in `src/domain/labels.ts`
(`TIER_PALETTE`, `ONCOGENICITY_PALETTE`, `AGREEMENT_PALETTE`) map domain values to names.

| Palette | Alias of | Meaning |
|---|---|---|
| `tier1` / `tier2` / `tier3` / `tier4` | red / orange / yellow / gray | AMP/ASCO/CAP tiers |
| `oncogenic` | red | Oncogenic, likely oncogenic |
| `vus` | yellow | Variant of uncertain significance |
| `benign` | green | Benign, likely benign |
| `unknown` | brand | Unknown biological function (outline badge) |
| `agreementHigh` / `agreementMedium` / `agreementLow` | green / yellow / red | Agreement between evidence sources |

### Surfaces, text, borders

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | white | `night.500` | Page default |
| `bg.panel` | white | `night.400` | Panels, cards, report paper |
| `bg.subtle` | `ink.50` | `night.300` | Table headers, list toolbars |
| `bg.muted` | `ink.100` | `night.200` | Hover, progress track |
| `bg.emphasized` | `ink.200` | `night.100` | Pressed |
| `bg.glass` | white 72% | navy 62% | Glass cards (with backdrop blur) |
| `bg.selected` | `brand.50` | violet 18% | Active list row, selected file |
| `fg` / `fg.muted` / `fg.subtle` | `ink.900` / `ink.700` / `ink.500` | `#EEF1F7` / `#A9B4C7` / `#7C879B` | Text hierarchy |
| `border` / `border.muted` / `border.emphasized` | `ink.200` / `ink.100` / `ink.300` | white 10% / 6% / 18% | Hairlines |
| `border.glass` | white 60% | white 8% | Glass card edge |
| `app.stop1`–`stop6` | lavender → mint → pink | navy → teal | App background gradient (see `globalCss.ts`) |
| `tile.from` / `tile.to` | aqua.50 → periwinkle | translucent aqua → violet | Icon tile gradient |

### Shadows

| Token | Use |
|---|---|
| `panel` | 1px hairline elevation for the main panel |
| `glass` | Soft white glow + faint drop + inner highlight (dark: deeper drop) |

---

## 4. Global styles (`src/theme/globalCss.ts`)

- `html { colorPalette: brand }` — brand is the default palette for every component.
- `body` gets the fixed 135° pastel gradient built from `app.stop1`–`stop6`, and a 3px `brandStripe` fixed to the
  top of the window (`body::before`).
- `::selection` uses `brand.muted` / `brand.fg`.

---

## 5. Text styles (`src/theme/textStyles.ts`)

| Style | Spec | Example |
|---|---|---|
| `display` | 49px / 800 / −0.04em | Hero numbers, empty states |
| `h1` | 24–30px / 800 / −0.035em | "Case 4f2a…", page titles (`<PageTitle>`) |
| `h2` | 20px / 800 / −0.02em | Card titles, drawer titles, gene name |
| `h3` | 16px / 700 | Small headings |
| `eyebrow` | 12px / 700 / UPPERCASE / 0.12em | Nav group labels, card eyebrows (`<Eyebrow>`) |
| `sectionTitle` | 14px / 700 / UPPERCASE / 0.06em | "CLASSIFICATIONS", "GENE DESCRIPTION" (`<SectionTitle>`) |
| `label` | 14px / 500 / UPPERCASE | Row labels: "ONCOGENICITY" |
| `body` / `bodyLg` | 14px / 1.65 · 16px / 1.75 | Descriptions, report text |
| `mono` / `monoSm` | JetBrains Mono 14px / 12px | Coordinates, transcripts, codes |
| `caption` | 12px / 1.4 | Hints |

```tsx
<Text textStyle="sectionTitle" color="brand.fg">Classifications</Text>
```

---

## 6. Layer styles (`src/theme/layerStyles.ts`)

Layer styles may only contain visual properties (background, border, shadow, color). Layout lives in components.

| Style | Spec | Use |
|---|---|---|
| `panel` | `bg.panel`, 1px `border`, radius `panel`, shadow `panel` | The main work surface (AppShell) |
| `card` | `bg.panel`, 1px `border`, radius `l3` | Variant list, variant card, form sections, tables |
| `glass` | `bg.glass` + `blur(14px)`, `border.glass`, radius `glass`, shadow `glass` | Stats, upload, processing banner, assistant |
| `iconTile` | 10px radius, `tile.from → tile.to` gradient, `brand.fg` icon | Used by `<IconTile>` |

```tsx
<Box layerStyle="card" p="6">…</Box>
```

---

## 7. Recipes (`src/theme/recipes`)

### `button` (extends Chakra's button)

Base: weight 600, radius `l2`. Added variants:

| Variant | Look | When |
|---|---|---|
| `solid` (built-in) + `colorPalette="brand"` | Violet filled | Primary action ("Create case", "View analysis details") |
| `outline` (built-in) | Bordered | Secondary action ("Copy output", "Fetch from LIMS") |
| `accent` | Magenta filled | Rare marketing-style CTA |
| `ghostLink` | Brand text + icon, no box | Inline actions ("Leave feedback", "Edit") |

```tsx
<Button variant="ghostLink"><MessageSquarePlus /> Leave feedback</Button>
```

### `badge` (extends Chakra's badge)

All badges are pills (`radius: full`, weight 500). Combine with a clinical palette:

```tsx
<Badge colorPalette="vus">VUS</Badge>
<Badge variant="outline" colorPalette="agreementLow">Med-low source agreement</Badge>
```

### `statusPill`

Case lifecycle pill. Variant `status`: `processing` (aqua, with spinner), `ready` (brand outline), `review`
(yellow), `signed` (green), `failed` (red). Component: `<StatusPill status="ready" />`.

### `monoNotation`

Inline genomic notation in JetBrains Mono. Variants `tone`: `brand` (default) · `muted` · `default`;
`size`: `xs` · `sm` · `md` · `lg`. Component: `<Mono size="lg">p.V600E</Mono>`.

### `citation`

Inline evidence link inside AI-drafted text: brand color, external-link icon, hover background, focus ring.
Component: `<CitationLink citation={…} />`.

---

## 8. Slot recipes (`src/theme/slotRecipes`)

Consumed with `createSlotRecipeContext({ key })` → `withProvider` / `withContext`.

| Recipe | Slots | Notes |
|---|---|---|
| `sidebarNav` | root, group, groupLabel, badge, item, subItem, footer | Sits directly on the gradient. Active item via `aria-current="page"` (NavLink) gets a glass background and brand text |
| `variantListItem` | root, control, body, title, meta, dot | Variant `selected: true` → lavender background + 3px brand left border. `dot` uses `colorPalette.solid` |
| `classificationRow` | root, header, label, value, info, trigger, content | Used with Chakra `Collapsible`; the chevron rotates on `data-state=open` |
| `glassCard` | root, accentBar, eyebrow, title, body | Variant `size`: `sm` · `md` · `lg`. Component: `GlassCard.*` in `src/ui` |
| `fileBrowser` | root, connections, connection, main, toolbar, list, row, selectedBar | Rows use `aria-selected` / `aria-disabled`; connections use `aria-pressed` |

```tsx
<GlassCard.Root size="sm">
  <GlassCard.AccentBar />
  <GlassCard.Eyebrow>Processing</GlassCard.Eyebrow>
  <GlassCard.Title>3</GlassCard.Title>
</GlassCard.Root>
```

---

## 9. UI components (`src/ui`)

| Component | Built on |
|---|---|
| `GlassCard.*` | `glassCard` slot recipe |
| `StatusPill` | `statusPill` recipe |
| `Mono` | `monoNotation` recipe |
| `CitationLink` | `citation` recipe |
| `IconTile` | `iconTile` layer style + layout |
| `InfoTip` | Tooltip snippet + ⓘ icon |
| `Eyebrow`, `SectionTitle`, `PageTitle`, `Highlight` | text styles / `highlightText` gradient |

---

## 10. Dark mode

- Toggle in the sidebar footer (and on `#/ui`). `next-themes` puts `class="dark"` on `<html>`; Chakra's `_dark`
  condition picks the dark value of every semantic token.
- Because components only use semantic tokens, no component has dark-mode-specific code.
- When adding a token, always give both values: `{ value: { base: '…', _dark: '…' } }`.

---

## 11. How to change the theme

1. Add or change tokens / semantic tokens / recipes in `src/theme`.
2. Run `npm run theme:types` (Chakra typegen) so TypeScript knows the new names and variants.
3. Use the token or recipe in components (semantic names only).
4. Show it on `#/ui` and document it here.
5. Check both light and dark mode.
