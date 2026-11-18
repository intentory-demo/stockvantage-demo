# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Overview

This is a design system for creating CarGurus dealer-facing B2B interfaces. Projects live in the `Projects/` folder and use a shared design reference for styles and patterns.

## Repository Structure

```
design-reference/
├── styles/global/          # CSS components — use these for all styling
├── component/              # Web components (custom elements) — create new ones here
└── img/                    # Images and icons

Projects/
```

## Styling Rules

1. **Always check `design-reference/styles/global/` first.** Before adding any UI element (button, dropdown, input, panel, etc.), look for an existing CSS class in that folder and use it.
2. **No custom CSS unless necessary.** Only add custom CSS if no suitable class exists in `design-reference/styles/global/`, or if the user explicitly asks for it.
3. **No repeated inline styles.** When two or more elements share the same styling, create a CSS class instead of using inline `style=""` on each element. Inline styles are acceptable only for one-off, unique styling on a single element.

## CSS Styling
When rendering lists or groups of repeated elements, always use CSS class names instead of inline styles. Inline styles are fine for one-off single elements.

## Layout

- **Prefer flexbox for all layout.** Use `display: flex` (with `flex-direction`, `align-items`, `justify-content`, `gap`) for arranging elements — rows, columns, spacing between items, alignment.
- Only use other layout methods (grid, floats, absolute positioning) when flexbox genuinely can't achieve the result.

## Communication

- Before making any edits, always state the name of the file being modified. Example: "Working on price-overview.html".

## Default Edit Context

- Edits apply to files inside the `Projects/` folder.
- Unless told otherwise, changes go inside `div.content` in the target file.

## Icons

- Always use Font Awesome for icons. Reference: https://fontawesome.com/

## Charts

- Always use Chart.js for any charts or data visualizations. Load it via CDN: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`

## Terminology

- When the user says "side panel" or "side-panel", they mean the `#side-panel` element (the vehicle detail panel), not the `.side-panel` CSS class or the filter panel.
- "global style" or "global css" → `design-reference/styles/global/`
- "img folder" → `design-reference/img/`
- "create a component" → create a web component (custom element) in `design-reference/component/`

## Typography

- Never hardcode font sizes. Always use the size variables from `design-reference/styles/global/typography.css`:
  - `--text-xs: 10px`
  - `--text-sm: 12px`
  - `--text-md: 14px`
  - `--text-lg: 16px`
- When the user says a font size like "12px" or "14px text", map it to the correct variable (e.g. 12px → `var(--text-sm)`, 14px → `var(--text-md)`).

## Buttons

- "primary button" → use `.btn-primary` from `design-reference/styles/global/button.css`
- "secondary button" → use `.btn-secondary` from `design-reference/styles/global/button.css`
- Always pair with `.btn` for base sizing and shape.

## Color Shorthands

- "gray text" → `color: var(--text-secondary)` (`#5E6976`)
- "black text" → `color: var(--text-primary)` (`#0C0C11`)

## Industry Terminology
If you encounter an industry term or abbreviation you don't recognize or are unsure about, look it up in `dictionary.md` before responding. Only consult this file when you actually need it — do not read it proactively or on every conversation start.