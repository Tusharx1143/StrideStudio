---
name: frontend-design-complete
description: Create distinctive, production-grade frontend interfaces with high design quality. Covers aesthetics, mobile-first patterns, modern CSS, performance (Core Web Vitals), dark mode/theming, AI-era patterns, interaction design, data visualization, fluid typography, responsive images, component architecture, forms, internationalization, cognitive accessibility, design tokens, and cascade layers. Use this as your single frontend design skill.
---

# Complete Frontend Design Guidelines

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics while ensuring proper mobile responsiveness and cross-element consistency.

---

## Part 1: Design Thinking & Aesthetics

### Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

### Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns.

### AI Slop Patterns to Avoid

**Colors:**
- Cream/off-white backgrounds (`#f8f6f3`, `#fdfcfb`, `#faf8f5` type colors)
- Terracotta/coral/rust accents (`#c45c48`, `#e07860`, `#d4715f`, `#bf4a37`)
- Orange and teal combinations
- Purple/blue gradients on white backgrounds

**Layout & Components:**
- Generous rounded corners (12-16px+ border-radius)
- Left-border accent lines on cards (the colored vertical stripe)
- Pill-shaped tabs and buttons
- Cards with subtle warm shadows and hover lift effects

**Overall Aesthetic:**
- The "cozy webapp" look - warm, soft, inviting
- Designs that feel like Notion/Linear clones
- Safe, inoffensive, "premium but accessible" feeling

Instead, make distinctive choices: cooler color temperatures, sharper geometry, unexpected color combinations, higher contrast, or commit fully to a specific design tradition (Swiss, Japanese, Brutalist, Editorial, etc.) rather than the generic "modern SaaS" look.

---

## Part 2: Mobile-First Responsive Patterns

### Hero Sections

**Problem**: 2-column grid layouts leave empty space when one column is hidden on mobile.

```css
/* Desktop: 2-column grid */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}

/* Mobile: Switch to centered flex */
@media (max-width: 768px) {
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px 20px;
    gap: 24px;
  }
  .hero-visual { display: none; }
}
```

**Key Rule**: When hiding grid columns on mobile, switch from `display: grid` to `display: flex` to eliminate reserved empty space.

### Large Selection Lists (Accordion Pattern)

**Problem**: Horizontal scroll for many items (20+) is unusable on mobile.

**Solution**: Use collapsible accordion with category headers.

```jsx
function StyleSelector({ items, categories }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  return (
    <div className="selector">
      {categories.map(category => (
        <div key={category.name} className={`category ${expandedCategory === category.name ? 'expanded' : ''}`}>
          <button className="category-header" onClick={() => setExpandedCategory(
            expandedCategory === category.name ? null : category.name
          )}>
            <span>{category.name}</span>
            <ChevronIcon />
          </button>
          <div className="category-items">
            {category.items.map(item => (
              <button key={item.id} className="item">{item.name}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Breakpoint Reference

```css
/* Tablet - Stack sidebars, maintain content width */
@media (max-width: 1200px) { }
/* Mobile - Full single-column, centered hero */
@media (max-width: 768px) { }
/* Small Mobile - Compact spacing, reduced font sizes */
@media (max-width: 480px) { }
```

---

## Part 3: Form Element Consistency

### Always Style as a Group

**Problem**: Styling only `.input` leaves `.select` and `.textarea` unstyled.

```css
/* CORRECT - Targets all form fields */
.style-brutalist .input,
.style-brutalist .select,
.style-brutalist .textarea {
  border: 2px solid var(--border);
  border-radius: 0;
}
```

### Textarea Border Radius Exceptions

Pill-shaped inputs (border-radius: 100px) look wrong on textareas:
```css
.style-kawaii .input, .style-kawaii .select { border-radius: 100px; }
.style-kawaii .textarea { border-radius: 20px; }
```

### Transparent Border Styles

**Problem**: Styles with `border: transparent` make form controls invisible.

```css
.style-neomorphism .radio-mark,
.style-claymorphism .radio-mark {
  border: 2px solid #B8BEC7;
  background: var(--bg-primary);
}
```

---

## Part 4: Color Contrast Rules

### Badge/Pill Elements
Always verify badge text contrasts with its background — use semantic variables, not hardcoded colors.

### Color Swatches Display
Swatches need visible borders regardless of swatch color:
```css
.color-swatch {
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
}
```

### Pre-Implementation Checklist

**Aesthetics**
- [ ] Committed to a bold, distinctive aesthetic direction
- [ ] Avoided AI slop patterns (cream backgrounds, terracotta accents, purple gradients)
- [ ] Used distinctive typography (not Inter, Roboto, Arial)
- [ ] Created cohesive color palette with CSS variables

**Mobile Responsiveness**
- [ ] Hero section centers on mobile (not left-aligned with empty space)
- [ ] Grid layouts collapse to single column on mobile
- [ ] Large selection lists use accordion on mobile (not horizontal scroll)
- [ ] Font sizes scale appropriately for mobile

**Form Elements**
- [ ] All form fields (input, select, textarea) styled consistently
- [ ] Radio buttons and checkboxes visible (especially for transparent-border styles)
- [ ] Textarea has appropriate border-radius (not pill-shaped)

**Color Contrast**
- [ ] Labels use semantic color variables (not hardcoded)
- [ ] Badge/pill text contrasts with background
- [ ] Color swatches have visible borders

---

## Part 5: Design Research & Inspiration Resources

### Curation & Reference Platforms
- **Are.na** - https://www.are.na - Visual research for mood boards
- **Mobbin** - https://mobbin.com - 1,150+ apps, 586,700+ screens, 312,000+ user flows
- **Logggos** - https://www.logggos.club - Curated logo gallery by sector

### Icons & Visual Assets
- **The Noun Project** - https://thenounproject.com - 10M+ curated icons
- **Artvee** - https://artvee.com - High-res public domain art
- **Mockupworld** - https://www.mockupworld.co - Free photo-realistic mockups

### Web Design Inspiration
- **Godly.website** - https://godly.website - "Astronomically good web design"
- **Minimal Gallery** - https://minimal.gallery - Minimalist design since 2013
- **Brutalist Websites** - https://brutalistwebsites.com - Brutalist design
- **Landingfolio** - https://landingfolio.com - Landing page inspiration

### Design Systems to Study
- **IBM Carbon** - https://carbondesignsystem.com - Enterprise design system
- **GitHub Primer** - https://primer.style - Open-source design system
- **Material Design 3** - https://m3.material.io - Google's design system

---

## Part 6: Design System Principles

### Token-Based Design

```css
:root {
  /* Primitive tokens */
  --color-blue-500: #3b82f6;
  --color-gray-900: #111827;
  --spacing-4: 1rem;
  /* Semantic tokens */
  --color-primary: var(--color-blue-500);
  --color-text-primary: var(--color-gray-900);
}
.button {
  background: var(--color-primary);
  padding: var(--spacing-component-padding);
}
```

### Typography Scale (Material 3 inspired)
```css
:root {
  --type-display-large: 57px/64px;
  --type-display-medium: 45px/52px;
  --type-headline-large: 32px/40px;
  --type-title-large: 22px/28px;
  --type-body-large: 16px/24px;
  --type-body-medium: 14px/20px;
  --type-label-large: 14px/20px;
}
```

### Elevation & Depth
```css
:root {
  --elevation-1: 0 1px 2px rgba(0, 0, 0, 0.05);
  --elevation-2: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --elevation-3: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --elevation-4: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Accessibility Patterns
```css
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
.interactive:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; } }
```

---

## Part 7: Brutalist Design Principles

### Core Philosophy
1. **Technical Honesty** - Expose the scaffolding of web design
2. **Anti-Commercial Stance** - Reject polish and visual manipulation
3. **Content-First** - Information hierarchy stripped to essentials
4. **Deliberate Austerity** - Uncompromising, deliberately austere

### Implementation
```css
body { font-family: monospace; font-size: 16px; }
.container { max-width: none; padding: 20px; }
body { background: #fff; color: #000; }
nav a { text-decoration: underline; color: inherit; }
button { border: 2px solid currentColor; background: transparent; padding: 8px 16px; }
```

---

## Part 8: Motion Design Principles

### High-Impact Moments
```css
.hero-content > * {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease-out forwards;
}
.hero-content > *:nth-child(1) { animation-delay: 0ms; }
.hero-content > *:nth-child(2) { animation-delay: 100ms; }
@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
```

### Performance Considerations
Only animate `transform` and `opacity` for smooth 60fps. Never animate `width`, `height`, `margin`, `padding`, `top`, `left`.

---

## Part 9: Foundational UX Principles

### Nielsen's 10 Usability Heuristics
1. **Visibility of System Status** - Keep users informed through feedback
2. **Match Between System and Real World** - Use familiar language
3. **User Control and Freedom** - Provide "emergency exits" (undo, cancel)
4. **Consistency and Standards** - Follow platform conventions
5. **Error Prevention** - Design to prevent errors before they occur
6. **Recognition Rather Than Recall** - Minimize memory load
7. **Flexibility and Efficiency of Use** - Shortcuts for experts, simplicity for novices
8. **Aesthetic and Minimalist Design** - Every extra unit competes with relevant info
9. **Help Users Recognize, Diagnose, and Recover from Errors** - Plain language errors
10. **Help and Documentation** - Searchable, task-focused documentation

### Key Laws of UX
- **Hick's Law**: Fewer choices = faster decisions
- **Miller's Law**: Chunk info into 5-9 items
- **Fitts's Law**: Make clickable areas large enough
- **Jakob's Law**: Users prefer familiar patterns
- **Peak-End Rule**: Design memorable highs and strong endings
- **Aesthetic-Usability Effect**: Beautiful design is perceived as more usable

---

## Part 10: Humane Design Principles

1. **Empowering** - Give users control over algorithms and data
2. **Finite** - Respect time and attention ("all caught up" indicators)
3. **Inclusive** - Design for disabilities first
4. **Intentional** - Use friction to prevent misuse
5. **Respectful** - Align notifications with actual urgency
6. **Transparent** - No dark patterns, clear about intentions
7. **Resilient** - Systems that degrade gracefully

### Anti-Patterns to Avoid
- Infinite scroll without endpoints
- Autoplay that consumes attention
- Dark patterns that trick users
- Notification spam
- Confirmation shaming ("No, I don't want to save money")

---

## Part 11: Comprehensive Accessibility Checklist

### HTML & Structure
- [ ] Valid HTML, `lang` attribute, unique `<title>`, semantic landmarks
- [ ] Linear content flow, no `autofocus` that disrupts navigation

### Headings
- [ ] One `<h1>` per page, logical sequence (no skipping levels)

### Keyboard Navigation
- [ ] Visible focus styles on all interactive elements
- [ ] Skip link to main content, no keyboard traps

### Images
- [ ] `alt` attributes on all images, empty `alt=""` for decorative

### Forms
- [ ] All inputs have associated `<label>`, grouped with `<fieldset>`
- [ ] Errors in list above form after submission

### Color & Contrast
- [ ] Normal text: 4.5:1 contrast ratio minimum
- [ ] Large text: 3:1 minimum
- [ ] Information not conveyed by color alone

### Mobile & Touch
- [ ] Viewport zoom not disabled, works in any orientation
- [ ] Touch targets minimum 44x44px

---

## Part 12: Dieter Rams' 10 Principles for Good Design

1. **Innovative** - Push boundaries
2. **Useful** - Every element serves user goals
3. **Aesthetic** - Visual quality is integral
4. **Understandable** - Interface explains itself
5. **Unobtrusive** - Serve purpose without demanding attention
6. **Honest** - No dark patterns
7. **Long-lasting** - Avoid trendy elements
8. **Thorough** - Every pixel matters
9. **Environmentally-friendly** - Optimize performance
10. **As little design as possible** - "Less, but better"

---

## Part 13: The 8-Point Grid System

```css
:root {
  --space-1: 4px;   --space-2: 8px;   --space-3: 16px;
  --space-4: 24px;  --space-5: 32px;  --space-6: 48px;
  --space-7: 64px;  --space-8: 96px;
}
```

Why 8pt works: Consistency, reduced decisions, multi-platform scaling.

---

## Part 14: Typography Scale Ratios

| Ratio | Name | Use Case |
|-------|------|----------|
| 1.067 | Minor Second | Subtle hierarchy |
| 1.125 | Major Second | Conservative |
| 1.200 | Minor Third | Balanced |
| 1.250 | Major Third | Clear distinction |
| 1.333 | Perfect Fourth | Strong hierarchy |
| 1.618 | Golden Ratio | Classic proportion |

```css
/* Using 1.250 (Major Third) with 16px base */
:root {
  --text-xs: 10px; --text-sm: 13px; --text-base: 16px;
  --text-lg: 20px; --text-xl: 25px; --text-2xl: 31px;
  --text-3xl: 39px; --text-4xl: 49px;
}
```

---

## Part 15: Spatial System Approaches

- **Element-First**: Fixed dimensions (buttons = 40px height)
- **Content-First**: Fixed padding, content determines size (cards)

---

## Part 16: Settings Philosophy

From Linear: "Settings are not a design failure." Add settings when user habits vary, platform conventions differ, or accessibility needs vary. Don't add settings to avoid making a design decision.

---

## Part 17: Learning Resources

- **Degreeless.design** - https://degreeless.design - Design curriculum
- **Laws of UX** - https://lawsofux.com - 30 psychological principles
- **Nielsen Norman Group** - https://www.nngroup.com - Usability research
- **Google Fonts Knowledge** - https://fonts.google.com/knowledge
- **Typescale** - https://typescale.com - Type scale generator
- **The A11Y Project** - https://www.a11yproject.com - Accessibility
- **WebAIM** - https://webaim.org - Testing
- **Material Design** - https://material.io/design/
- **Human Interface Guidelines** - https://developer.apple.com/design/human-interface-guidelines
- **Godly.website** - https://godly.website - Web design inspiration

---

## Part 18: Modern CSS Techniques

### Container Queries
```css
.card-container { container-type: inline-size; container-name: card; }
@container card (min-width: 400px) {
  .card { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
}
@container card (max-width: 399px) {
  .card { display: flex; flex-direction: column; }
}
```

### The :has() Selector
```css
.form-group:has(:invalid) { border-color: var(--color-error); }
.checkbox:has(:checked) + .label { text-decoration: line-through; opacity: 0.6; }
```

### CSS Subgrid
```css
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.card { display: grid; grid-template-rows: subgrid; grid-row: span 3; }
```

### View Transitions API
```css
.product-image { view-transition-name: product-hero; }
::view-transition-old(product-hero) { animation: fadeOut 0.3s ease-out; }
```

### Scroll-Driven Animations
```css
.section { animation: fadeInUp linear both; animation-timeline: view(); animation-range: entry 0% entry 100%; }
```

### Anchor Positioning
```css
.trigger { anchor-name: --tooltip-anchor; }
.tooltip { position: fixed; position-anchor: --tooltip-anchor; top: anchor(bottom); }
```

### Popover API
```html
<button popovertarget="menu">Open</button>
<div id="menu" popover><nav>...</nav></div>
```

### Quick Reference
| Feature | Replaces | Use Case |
|---------|----------|----------|
| Container queries | Media queries for components | Reusable responsive components |
| `:has()` | JS class toggling | Parent-aware styling |
| Subgrid | Manual alignment hacks | Consistent grid children |
| View Transitions | JS libraries | Page transitions |
| Scroll-driven animations | Intersection Observer | Scroll-triggered effects |
| CSS nesting | Sass/Less | Scoped styles |
| Anchor positioning | Popper/Floating UI | Tooltips |
| Popover API | Custom modal JS | Light-dismiss overlays |
| `@layer` | Specificity hacks | CSS ordering |

---

## Part 19: Performance-First Design (Core Web Vitals)

| Metric | Good | Poor |
|--------|------|------|
| LCP | ≤ 2.5s | > 4.0s |
| INP | ≤ 200ms | > 500ms |
| CLS | ≤ 0.1 | > 0.25 |

### CLS Prevention
```css
img { width: 100%; height: auto; aspect-ratio: 16 / 9; }
.embed-container { min-height: 300px; contain: layout; }
@font-face { font-family: 'Display'; font-display: swap; size-adjust: 105%; }
```

### LCP Optimization
```html
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high">
```

### Skeleton Loaders
```css
.skeleton {
  background: linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-shine) 50%, var(--skeleton-base) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
```

### Animation Performance Budget
- **SAFE**: `transform`, `opacity` (GPU-accelerated)
- **NEVER**: `width`, `height`, `margin`, `padding`, `top`, `left`

---

## Part 20: Dark Mode & Theming

### System Preference Detection
```css
:root { color-scheme: light dark; }
@media (prefers-color-scheme: dark) {
  :root { --color-surface-0: #121212; --color-text-primary: #e5e5e5; }
}
```

### Key Principles
- Desaturate colors ~20% for dark mode
- Never use pure white on pure black (use off-white on dark gray)
- Use surface elevation instead of shadows (lighter surfaces = higher elevation)
- Handle scrollbar, form defaults with `color-scheme: dark`
- Prevent flash of wrong theme by running restore script in `<head>`

---

## Part 21: AI-Era Design Patterns

### Streaming UI
```css
.message.streaming::after { content: '|'; animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
```

### AI Loading States
- AI loading is unpredictable (1s to 2min). Use phase-based indicators with cancel button
- Show elapsed time after 3+ seconds
- Skeleton loaders are wrong for AI content (structure unknown)

### Confidence Indicators
Show confidence badges (high/medium/low) when AI certainty varies. Users trust AI more when it admits uncertainty.

### Human-in-the-Loop Controls
Every AI response needs: Copy, Edit, Regenerate, Report buttons. Never read-only AI output.

### Error Handling for AI
- Explain in plain language (not error codes)
- Preserve user input
- Offer retry + manual fallback
- Show partial results

---

## Part 22: Advanced Interaction Design

### Micro-Interaction States
Every interactive element needs: **default, hover, active/pressed, disabled**. Important actions also need loading and success/error states.

### Gesture Design
Every gesture must have a visible, tappable alternative. Include onboarding hints for discoverable gestures.

### State-Based Design
| State | Design Treatment |
|-------|-----------------|
| Empty | Illustration + CTA + explanation |
| Loading | Skeleton matching dimensions |
| Error | Explain + retry + manual fallback |
| Offline | Cached content + offline indicator |

### Progressive Disclosure
Show only essential options first. Reveal complexity on demand.

---

## Part 23: Data Visualization Design

### Chart Type Selection
| Goal | Chart Type |
|------|-----------|
| Compare parts of a whole | Pie/donut (≤5 segments) |
| Show trends over time | Line chart |
| Compare categories | Bar chart (horizontal for many items) |
| Show distribution | Histogram |
| Show relationships | Scatter plot |
| Show part-to-whole over time | Stacked area chart |

### Color for Data Viz
- Use sequential palettes for ordered data (light→dark)
- Use diverging palettes for deviation from a midpoint
- Never use rainbow/spectrum color schemes
- Ensure 3:1 contrast between data elements
- Always include direct labels (avoid relying only on legends)

### Accessibility for Charts
- Support patterns/textures as well as colors
- Provide data tables as alternatives
- Include screen-reader descriptions
- Support keyboard navigation for interactive charts

---

## Part 24: Fluid Typography & Responsive Images

### Fluid Typography with clamp()
```css
h1 { font-size: clamp(2rem, 5vw + 1rem, 4rem); }
p { font-size: clamp(1rem, 0.5vw + 0.8rem, 1.25rem); }
```

Use Utopia (https://utopia.fyi) to generate fluid type scales.

### Variable Fonts
Variable fonts offer weight, width, and optical size axes in one file. Use for smooth responsive typography.

### Responsive Images
```html
<img src="photo.avif" srcset="photo-400.avif 400w, photo-800.avif 800w, photo-1200.avif 1200w"
     sizes="(max-width: 768px) 100vw, 50vw" alt="Description">
<picture>
  <source srcset="hero.avif" type="image/avif">
  <img src="hero.jpg" alt="Hero">
</picture>
```

---

## Part 25: Component Architecture

### Component Design Principles
- **Single Responsibility**: One component, one concern
- **Composition over Configuration**: Compose small components rather than configuring large ones
- **Controlled Props**: Accept state from parent (controlled) or manage internally (uncontrolled)

### Component API Design
```tsx
// Good: Intuitive API
<Button variant="primary" size="md" onPress={handleClick}>
  Submit
</Button>

// Avoid: Too many props
<Button primary medium fullWidth rounded elevated withShadow onClick={handleClick}>
  Submit
</Button>
```

### Component Categories
| Category | Examples | Characteristics |
|----------|----------|----------------|
| Primitive | Button, Input, Text | Minimal styling, highly reusable |
| Composite | Card, FormField, Dialog | Combine primitives |
| Feature | ActivityChart, TemplateGallery | Business logic, data-fetching |
| Layout | Stack, Grid, Container | Only spacing/positioning |
| Page | HomeScreen, ProfileScreen | Route-level, orchestrates features |

---

## Part 26: Forms & Input Design

### Form Layout Principles
- Single column layouts are faster to complete than multi-column
- Labels above inputs (not placeholder-only) for accessibility
- Group related fields with fieldset/legend
- Show password requirements before submission (not after error)

### Validation Patterns
- Inline validation on blur (not on every keystroke)
- Submit validation checks everything
- Show all errors at top of form + inline on fields
- Error message formula: "What's wrong" + "How to fix it"

### Mobile Form UX
- Use appropriate input types (`type="tel"`, `inputMode="numeric"`)
- Auto-advance to next field when appropriate
- Provide save/draft functionality for long forms
- Show progress for multi-step forms

---

## Part 27: Internationalization (i18n) & RTL

### CSS for i18n
```css
/* Use logical properties instead of physical */
.card {
  margin-inline-start: 16px; /* margin-left in LTR, margin-right in RTL */
  padding-block: 12px;       /* padding-top + padding-bottom */
  border-inline-end: 1px solid; /* border-right in LTR */
}

/* RTL adjustments */
[dir="rtl"] .icon-arrow { transform: scaleX(-1); }
```

### Text Considerations
- Allow 30-50% extra space for text expansion
- German text is ~30% longer than English
- Avoid text-in-image for content that needs translation
- Use `Intl` APIs for dates, numbers, and currencies

---

## Part 28: Design Token Architecture (Three-Tier)

### Tier 1: Constants (Primitives)
```css
:root {
  --blue-500: #3b82f6;
  --gray-100: #f5f5f5;
  --gray-900: #111827;
  --size-4: 16px;
}
```

### Tier 2: Semantic Tokens
```css
:root {
  --color-primary: var(--blue-500);
  --color-surface: var(--gray-100);
  --color-text: var(--gray-900);
  --space-inset: var(--size-4);
}
```

### Tier 3: Contextual Tokens (Component-level)
```css
.button {
  --bg: var(--color-primary);
  --text: white;
  --padding: var(--space-inset);
}
.card {
  --bg: var(--color-surface);
  --text: var(--color-text);
}
```

---

## Part 29: Cognitive Accessibility

### Design Patterns
- Consistent navigation, predictable interactions
- Content chunked into manageable sections
- Clear headings and visual hierarchy
- Enough time to complete tasks (no auto-logout during form filling)
- Help with inputs (good defaults, autocomplete, format hints)

### ADHD
- Minimize distractions, reduce visual noise
- Focus mode that hides non-essential UI
- Progress indicators for multi-step tasks
- "You're here" breadcrumbs and wayfinding

### Autism Spectrum
- Predictable, consistent patterns
- Clear, literal language (no idioms or metaphors)
- Avoid unexpected sounds or animations
- Offer structured choices with clear outcomes

### Dyslexia
- Use sans-serif fonts, 1.5x line-height minimum
- Left-aligned text (not justified or centered for body)
- Dark text on light background, avoid pure white
- Support screen readers with detailed alt text

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; }
}
```
- Eliminate ALL animation when reduced motion is preferred
- Parallax, confetti, and celebratory effects must be disabled

---

## Part 30: Performance Budgets

### Loading Budget
- **Initial load**: < 200KB critical path, < 2s to interactive on 3G
- **JavaScript**: < 100KB per route (code-split)
- **Images**: < 100KB hero, < 30KB thumbnails (use AVIF/WebP)

### Runtime Budget
- **INP**: < 200ms for all interactions
- **First Input Delay**: < 100ms
- **Memory**: < 50MB for typical usage
- **Long Tasks**: None > 50ms

### Bundle Budgets
- Framework: < 50KB gzipped
- Route/page chunk: < 30KB gzipped
- Third-party total: < 50KB gzipped

---

## Part 31: Cascade Layers

Organize CSS priority without fighting specificity:

```css
/* Declare layer order */
@layer reset, base, tokens, components, utilities, overrides;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; margin: 0; }
}
@layer base {
  body { font-family: system-ui; line-height: 1.5; }
}
@layer tokens {
  :root { --color-primary: #3b82f6; }
}
@layer components {
  .button { background: var(--color-primary); }
}
@layer utilities {
  .bg-red { background: red; } /* Wins over .button despite specificity */
}
@layer overrides {
  /* Forced overrides, third-party fixes */
}
```

**Benefits**: Predictable cascade without `!important` or specificity battles. Load order doesn't matter — layer declaration order determines priority.
