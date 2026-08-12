---
name: Dialog Kinerja
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#0d0097'
  on-tertiary: '#ffffff'
  tertiary-container: '#2724b8'
  on-tertiary-container: '#a1a4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  role-tag:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is rooted in the principles of **Corporate Modernism**, prioritizing clarity, hierarchy, and perceived authority. It is designed for high-stakes performance management, where the UI must act as a reliable, transparent medium for critical professional feedback and administrative tracking.

The aesthetic is characterized by high whitespace, a strictly organized grid, and a focus on "Data-First" presentation. It avoids unnecessary ornamentation, instead using subtle tonal shifts and precise typography to guide the user's attention. The emotional response should be one of competence, fairness, and systematic order.

## Colors
The palette is dominated by **Navy Blue (#1E3A8A)** to establish a foundation of institutional trust. 

- **Primary:** Used for primary actions, navigation headers, and the Manager (Atasan) role indicator.
- **Secondary:** Reserved for "Success" states and completion milestones.
- **Surface:** A range of cool grays (from #F8FAFC to #E2E8F0) is used to separate content zones without the harshness of pure black lines.
- **Status Tokens:** These are functional semantic colors used for performance cycles. Each has a specific background-fill at 10% opacity and a high-contrast text label for accessibility.

## Typography
This design system utilizes **Inter** exclusively to leverage its exceptional legibility at small sizes—critical for data-heavy tables and dense forms. 

Hierarchy is established through weight rather than dramatic size shifts. **Labels** use a semi-bold weight and slight letter spacing to ensure they are distinguishable from input data. Mobile typography scales down the `display-lg` and `headline-lg` by 15% to maintain readable line-lengths on smaller viewports.

## Layout & Spacing
The layout follows a **Fixed-Fluid hybrid grid**. Sidebars and navigation rails are fixed width (240px and 72px respectively), while the content area is fluid with a maximum container width of 1440px to prevent excessive line lengths.

A **4px baseline grid** governs all vertical rhythm. Component spacing is strictly tiered:
- Use **stack-sm** for internal element spacing (label to input).
- Use **stack-md** for spacing between related fields.
- Use **stack-lg** for separating sections or card modules.
On mobile, `container-padding` reduces to 16px to maximize horizontal space for data tables.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Low-Contrast Outlines**. 

Shadows are used sparingly, reserved only for floating elements like dropdown menus or modals. These shadows are "Ambient": highly diffused (20-30px blur), low opacity (8%), and tinted with the Primary Navy color to prevent a "dirty" gray appearance. 

Primary surfaces use a subtle 1px border (#E2E8F0) instead of shadows to maintain a flat, professional, and digital-first feel. Backgrounds for the application are slightly off-white (#F1F5F9) to make white content cards "pop" without needing heavy elevation.

## Shapes
The design system uses **Soft (0.25rem)** roundedness for standard components like input fields and buttons. This provides a modern touch without sacrificing the professional "seriousness" of the interface. Larger containers like cards or dashboard panels use `rounded-lg` (0.5rem) to soften the overall layout. Role indicators and status badges are slightly more rounded (rounded-md) to distinguish them from functional UI buttons.

## Components

### Buttons & Inputs
- **Primary Button:** Solid #1E3A8A with white text. Hover state uses a 10% darken overlay.
- **Input Fields:** 1px border (#CBD5E1). On focus, the border transitions to Primary Blue with a 3px soft outer glow.
- **Role Tags:** "MANAGER" tags use a primary-filled background; "PEGAWAI" tags use a neutral-outlined style to denote the hierarchical relationship clearly.

### Status Badges
Badges are designed for quick scanning in list views:
- **Structure:** 10% color background, 100% color text, bold font-weight.
- **Draft:** Slate Gray.
- **Waiting:** Amber for Pegawai, Blue for Atasan, Indigo for Validation.
- **Completed:** Success Green with a checkmark icon prefix.

### Data Displays
- **Performance Cards:** White backgrounds, subtle border, with a clear header area for the period (e.g., "Triwulan I").
- **Lists:** Rows utilize a hover-state background change (#F8FAFC) to help users track their horizontal eye-path across data points.