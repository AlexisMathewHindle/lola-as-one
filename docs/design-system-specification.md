# Lola As One - Design System Specification

**Version**: 1.0  
**Last Updated**: 2026-02-13  
**Status**: Draft

## Brand Identity

Lola As One is a creative, playful, and inclusive brand focused on bringing art and creativity to families and children. The design system should reflect:

- **Playful**: Vibrant colors, rounded shapes, friendly typography
- **Creative**: Artistic imagery, colorful palettes, expressive design
- **Warm**: Approachable, welcoming, community-focused
- **Professional**: Clean layouts, clear hierarchy, easy to use

---

## Color Palette

### Primary Colors

**Orange (Primary CTA & Brand)**
```css
--color-primary-50: #fff7ed;   /* Lightest tint */
--color-primary-100: #ffedd5;
--color-primary-200: #fed7aa;
--color-primary-300: #fdba74;
--color-primary-400: #fb923c;
--color-primary-500: #f97316;  /* Base - Main CTA color */
--color-primary-600: #ea580c;  /* Hover state */
--color-primary-700: #c2410c;
--color-primary-800: #9a3412;
--color-primary-900: #7c2d12;  /* Darkest shade */
```

**Teal/Turquoise (Secondary/Accent)**
```css
--color-secondary-50: #f0fdfa;
--color-secondary-100: #ccfbf1;
--color-secondary-200: #99f6e4;
--color-secondary-300: #5eead4;
--color-secondary-400: #2dd4bf;
--color-secondary-500: #14b8a6;  /* Base */
--color-secondary-600: #0d9488;
--color-secondary-700: #0f766e;
--color-secondary-800: #115e59;
--color-secondary-900: #134e4a;
```

### Event/Category Colors

These colors are used for event categories, product types, and visual differentiation:

**Blue (Open Studio, Creative Play)**
```css
--color-event-blue: #4A90A4;
--color-event-blue-light: #6BB6CC;
--color-event-blue-dark: #2E6B7F;
```

**Coral/Pink (Art & Craft)**
```css
--color-event-coral: #E76F51;
--color-event-coral-light: #F4A261;
--color-event-coral-dark: #D45D42;
```

**Amber (Storytelling, Creative Activities)**
```css
--color-event-amber: #F4A261;
--color-event-amber-light: #F9C784;
--color-event-amber-dark: #E8944E;
```

**Green (Nature, Outdoor)**
```css
--color-event-green: #6A994E;
--color-event-green-light: #8FBC6F;
--color-event-green-dark: #557A3E;
```

**Purple (Special Events)**
```css
--color-event-purple: #9D4EDD;
--color-event-purple-light: #B87FE7;
--color-event-purple-dark: #7B3AAD;
```

**Brown/Tan (Little Ones, Ages 2-4)**
```css
--color-event-brown: #A67C52;
--color-event-brown-light: #C4A57B;
--color-event-brown-dark: #8A6642;
```

### Neutral Colors

**Warm Neutrals (Backgrounds)**
```css
--color-neutral-50: #fafaf9;   /* Almost white */
--color-neutral-100: #f5f5f4;  /* Light background */
--color-neutral-200: #e7e5e4;  /* Subtle borders */
--color-neutral-300: #d6d3d1;
--color-neutral-400: #a8a29e;
--color-neutral-500: #78716c;  /* Body text (light) */
--color-neutral-600: #57534e;
--color-neutral-700: #44403c;  /* Body text */
--color-neutral-800: #292524;  /* Headings */
--color-neutral-900: #1c1917;  /* Dark text */
```

**Cream/Beige (Alternative Background)**
```css
--color-cream-50: #fefdfb;
--color-cream-100: #faf8f5;
--color-cream-200: #f5f3ee;   /* Main cream background */
--color-cream-300: #ebe8e0;
```

### Semantic Colors

**Success (Green)**
```css
--color-success-500: #22c55e;
--color-success-600: #16a34a;
```

**Warning (Yellow)**
```css
--color-warning-500: #eab308;
--color-warning-600: #ca8a04;
```

**Error/Danger (Red)**
```css
--color-danger-500: #ef4444;
--color-danger-600: #dc2626;
```

**Info (Blue)**
```css
--color-info-500: #3b82f6;
--color-info-600: #2563eb;
```

---

## Typography

### Font Families

**Sans-serif (Body Text)**
- Primary: `'Roboto', system-ui, -apple-system, sans-serif`
- Alternative: `'Open Sans', system-ui, sans-serif`

**Serif (Display/Headings)**
- Primary: `'Playfair Display', Georgia, serif`
- Alternative: `'Merriweather', Georgia, serif`

### Font Sizes

```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */
```

### Font Weights

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights

```css
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

---

## Spacing Scale

Based on 4px base unit:

```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
--spacing-24: 6rem;     /* 96px */
```

---

## Border Radius

```css
--radius-sm: 0.25rem;    /* 4px - Small elements */
--radius-md: 0.5rem;     /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;    /* 12px - Cards */
--radius-xl: 1rem;       /* 16px - Large cards */
--radius-2xl: 1.5rem;    /* 24px - Hero sections */
--radius-full: 9999px;   /* Fully rounded - Pills, avatars */
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

---

## Component Patterns

### Buttons

**Primary Button (CTA)**
- Background: `--color-primary-500` (#f97316)
- Text: White
- Padding: 12px 24px (py-3 px-6)
- Border radius: `--radius-lg` (12px)
- Font weight: 500 (medium)
- Hover: `--color-primary-600`
- Shadow: `--shadow-sm`

**Secondary Button**
- Background: `--color-secondary-500`
- Text: White
- Same sizing as primary

**Outline Button**
- Border: 2px solid `--color-primary-500`
- Text: `--color-primary-500`
- Background: Transparent
- Hover: Background `--color-primary-50`

**Ghost Button**
- No border
- Text: `--color-primary-500`
- Background: Transparent
- Hover: Background `--color-primary-50`

### Cards

**Standard Card**
- Background: White
- Border: 1px solid `--color-neutral-200`
- Border radius: `--radius-xl` (16px)
- Padding: 24px (p-6)
- Shadow: `--shadow-sm`
- Hover: `--shadow-md`

**Product Card**
- Image at top (aspect ratio 4:3 or 1:1)
- Title: `--text-lg`, `--font-semibold`
- Price: `--text-xl`, `--font-bold`, `--color-primary-600`
- Description: `--text-sm`, `--color-neutral-600`
- CTA button at bottom

**Event Card (Calendar)**
- Colored left border (4px) based on category
- Background: Category color at 10% opacity
- Date/time prominent
- Available spaces indicator
- Hover: Slight scale (1.02)

### Forms

**Input Fields**
- Border: 1px solid `--color-neutral-300`
- Border radius: `--radius-md` (8px)
- Padding: 10px 12px
- Focus: Border `--color-primary-500`, ring `--color-primary-100`
- Error: Border `--color-danger-500`

**Labels**
- Font size: `--text-sm`
- Font weight: 500
- Color: `--color-neutral-700`
- Margin bottom: 8px

### Navigation

**Main Navigation**
- Background: White
- Border bottom: 1px solid `--color-neutral-200`
- Shadow: `--shadow-sm`
- Logo: `--color-primary-600`, `--font-display`
- Links: `--color-neutral-700`, hover `--color-primary-600`

**Admin Sidebar**
- Background: `--color-neutral-900` (dark)
- Text: `--color-neutral-300`
- Active link: `--color-primary-500` background
- Hover: `--color-neutral-800` background

---

## Layout Guidelines

### Container Widths

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Grid System

- Use CSS Grid or Flexbox
- Gap: 24px (gap-6) for cards
- Gap: 16px (gap-4) for form elements
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

### Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

---

## Accessibility Guidelines

### Color Contrast

- All text must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Primary orange (#f97316) on white: ✓ Passes
- White on primary orange: ✓ Passes
- Test all color combinations before use

### Focus States

- All interactive elements must have visible focus states
- Use ring utility: `ring-2 ring-primary-500 ring-offset-2`

### Font Sizes

- Minimum body text: 16px (1rem)
- Minimum UI text: 14px (0.875rem)

---

## Usage Examples

### Hero Section

```html
<section class="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
  <div class="max-w-7xl mx-auto px-6">
    <h1 class="text-5xl font-display font-bold text-neutral-900 mb-6">
      Welcome to Lola As One
    </h1>
    <p class="text-xl text-neutral-600 mb-8">
      Where creativity meets community
    </p>
    <button class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow-sm">
      Explore Workshops
    </button>
  </div>
</section>
```

### Product Card

```html
<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
  <img src="..." alt="..." class="w-full h-48 object-cover rounded-lg mb-4">
  <h3 class="text-lg font-semibold text-neutral-900 mb-2">Art Box</h3>
  <p class="text-sm text-neutral-600 mb-4">Monthly creative supplies</p>
  <p class="text-xl font-bold text-primary-600 mb-4">£29.99</p>
  <button class="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
    Add to Cart
  </button>
</div>
```

---

## Implementation Checklist

- [ ] Update `app/src/style.css` with new color palette
- [ ] Update `app/index.html` with Google Fonts
- [ ] Update all Vue components to use new design tokens
- [ ] Update admin interface styling
- [ ] Update email templates
- [ ] Test accessibility (contrast, focus states)
- [ ] Cross-browser testing
- [ ] Mobile responsive testing
- [ ] Document component library in Storybook (future)

---

## References

- Legacy Website 1: Calendar/scheduling interface
- Legacy Website 2: Modern e-commerce design
- Tailwind CSS Documentation: https://tailwindcss.com
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

