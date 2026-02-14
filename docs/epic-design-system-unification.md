# Epic: Design System Unification

**Status**: Not Started  
**Priority**: High  
**Epic Owner**: Design & Development Team  
**Created**: 2026-02-13

## Overview

This epic focuses on unifying the design system across both frontend (customer-facing) and backend (admin) interfaces to match the visual identity of the two legacy websites being merged into Lola As One.

## Problem Statement

Currently, the application uses a generic design system with:
- Primary color: Orange (#f97316)
- Fonts: Roboto and Playfair Display
- Standard Tailwind color palette

However, the legacy websites have distinct visual identities that need to be preserved and unified:
- **Legacy Site 1**: Calendar/scheduling interface with vibrant, colorful event blocks
- **Legacy Site 2**: Modern, clean design with rainbow/pastel colors, playful imagery, and warm aesthetics

## Goals

1. **Unified Visual Identity**: Create a cohesive design system that works across both customer-facing and admin interfaces
2. **Brand Consistency**: Preserve the playful, creative, and colorful brand identity from the legacy sites
3. **Accessibility**: Ensure all color combinations meet WCAG AA standards for contrast
4. **Maintainability**: Document the design system thoroughly for future development

## Design Audit Findings

### Colors Observed in Legacy Sites

**Primary Colors**:
- Rainbow/vibrant colors for events and products
- Warm orange/amber tones (appears to be primary CTA color)
- Teal/turquoise accents

**Background Colors**:
- Cream/beige backgrounds (#f5f5f0 or similar)
- White cards and sections
- Soft pastel backgrounds

**Event/Category Colors** (from calendar view):
- Blue/Teal: #4A90A4 (Open Studio)
- Orange: #F4A261 (Storytelling/Creative)
- Brown/Tan: #A67C52 (Little Ones classes)
- Green: #6A994E (Nature/Outdoor)
- Pink: #E76F51 (Art/Craft)
- Purple: #9D4EDD (Special events)

### Typography

**Observed Fonts**:
- Sans-serif body text (appears to be similar to Roboto or Open Sans)
- Display font for headings (Playfair Display or similar serif)
- Clean, readable font sizes with good hierarchy

### Component Patterns

- Rounded corners on cards and buttons (8-12px border radius)
- Soft shadows for depth
- Colorful icon backgrounds
- Product cards with image, title, price, and CTA
- Calendar grid with color-coded events
- Subscription tier cards with clear pricing

## Technical Implementation

### Phase 1: Foundation (Tasks 1-3)

**Task 1: Audit Legacy Website Design Elements**
- Extract exact color values from screenshots
- Document font families and sizes
- Identify spacing patterns (padding, margins, gaps)
- Document component patterns (buttons, cards, forms)

**Task 2: Define Unified Color Palette**
- Create comprehensive Tailwind color system in `app/src/style.css`
- Define semantic color tokens (primary, secondary, accent, etc.)
- Create category/event color palette
- Define neutral/gray scale
- Document color usage guidelines

**Task 3: Define Typography System**
- Configure Google Fonts imports in `app/index.html`
- Update Tailwind font families in `app/src/style.css`
- Define font size scale
- Define font weight scale
- Document typography usage guidelines

### Phase 2: Documentation & Components (Tasks 4, 7)

**Task 4: Update Design System Documentation**
- Update `app/src/views/DesignSystem.vue` with new colors
- Add typography examples
- Add component examples (buttons, cards, forms)
- Add usage guidelines

**Task 7: Update Component Library**
- Update shared components in `app/src/components/shared/`
- Update button styles
- Update card styles
- Update form input styles
- Update navigation components

### Phase 3: Frontend Application (Task 5)

**Task 5: Update Frontend Styling**
- Update Home page (`app/src/views/Home.vue`)
- Update Workshops page (`app/src/views/Workshops.vue`)
- Update Boxes page (`app/src/views/Boxes.vue`)
- Update Shop page (`app/src/views/Shop.vue`)
- Update Blog pages
- Update product detail pages
- Update navigation (`app/src/components/Navigation.vue`)

### Phase 4: Admin/Backend (Task 6)

**Task 6: Update Admin/Backend Styling**
- Update AdminLayout (`app/src/layouts/AdminLayout.vue`)
- Update Dashboard (`app/src/views/admin/Dashboard.vue`)
- Update all admin views (Offerings, Blog, Orders, etc.)
- Ensure admin interface is professional but aligned with brand

### Phase 5: Email & Testing (Tasks 8-10)

**Task 8: Update Email Templates**
- Update base email layout (`supabase/functions/send-email/templates/base-layout.ts`)
- Update all email templates to match design system
- Test email rendering across email clients

**Task 9: Cross-browser Testing**
- Test on Chrome, Firefox, Safari, Edge
- Test on mobile devices (iOS, Android)
- Test responsive breakpoints
- Fix any rendering issues

**Task 10: Create Design System Documentation**
- Create `docs/design-system.md` with comprehensive guidelines
- Document color palette with hex codes and usage
- Document typography scale and usage
- Document component patterns
- Include code examples
- Add accessibility guidelines

## Success Criteria

- [ ] All customer-facing pages use the unified design system
- [ ] Admin interface uses the unified design system
- [ ] Design system is fully documented
- [ ] All color combinations meet WCAG AA contrast standards
- [ ] Design system is approved by stakeholders
- [ ] Cross-browser testing passes
- [ ] Email templates match the design system

## Dependencies

- Access to legacy website assets/screenshots
- Stakeholder approval on color palette and typography
- Design review and approval

## Timeline Estimate

- Phase 1 (Foundation): 2-3 days
- Phase 2 (Documentation & Components): 2-3 days
- Phase 3 (Frontend): 3-4 days
- Phase 4 (Admin): 2-3 days
- Phase 5 (Email & Testing): 2-3 days

**Total Estimate**: 11-16 days

## Notes

- Preserve existing functionality while updating styling
- Ensure backward compatibility with existing data
- Consider creating a feature flag for gradual rollout
- Plan for stakeholder review checkpoints

