# LoanOS Design Guide: The Swiss Style

> **Core Philosophy**:  Precision, data density, high contrast, and zero decoration. This design system is inspired by Swiss Style typography and technical schematics. It communicates trust through structure rather than embellishment.

---

## 1. Typography

**Font Family**:
- **Primary**: `font-mono` (Monospace). Used for almost everything, especially distinct labels, numbers, and lists.
- **Headings**: `font-sans` with `tracking-tight` or `tracking-tighter`. Bold and Uppercase.

**Usage Rules**:
- **Labels**: Always uppercase, small size (`text-xs`), widely tracked (`tracking-widest`).
- **Headings**: Uppercase, bold, often paired with numbering (e.g., "01 / FEATURE").
- **Body**: Standard weight, high readability.

## 2. Layout & Grid

**Structure**:
- **Visible Grids**: Layouts should feel like a spreadsheet or a technical drawing. Use visible borders (`border-black` or `border-zinc-300`).
- **Dividers**: Use distinct horizontal and vertical lines to separate content.
- **Alignment**: Strict alignment is critical. Everything must align to a grid.

**Spacing**:
- **Compact**: "Swiss" means efficiency. Avoid excessive whitespace padding unless it serves a functional purpose (content vs. negative space balance).
- **Square**: Prefer square aspect ratios for icons and modules.

## 3. Colors

**Palette**:
- **Background**: `bg-white` (Primary), `bg-zinc-50` (Secondary/Hover).
- **Foreground**: `text-black` (Headings/Primary), `text-zinc-500` (Secondary/Labels).
- **Borders**: `border-black` (Strong), `border-zinc-300` (Subtle).
- **Accents**: Sparse usage.
    - **Blue (`text-blue-600`)**: Interactive elements (links, buttons).
    - **Red/Green**: Only for semantic status (Errors/Success).

## 4. Components

### Cards & Modules
- **Border**: 1px solid black or grey.
- **Hover**: Subtle background shift (`hover:bg-zinc-50`) or border darkening (`hover:border-black`).
- ** Numbering**: Index items clearly (e.g., "01", "02").

### Buttons
- **Primary**: Black background, White text. Rectangular, sharp corners (or slightly rounded `rounded-md`, but prefer sharp for strict Swiss).
- **Secondary**: White background, Black border.
- **Text Link**: Uppercase, bold, with an underline or arrow icon.

### Lists
- **Markers**: Use geometric shapes (squares, circles) or simply lines.
- **Separators**: Use dotted or solid lines between list items.

## 5. Implementation Example

```tsx
<div className="border border-black p-6 hover:bg-zinc-50 transition-colors">
  <div className="flex justify-between mb-4">
    <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
      01 / SYSTEM
    </span>
    <Icon className="w-5 h-5" />
  </div>
  <h3 className="text-xl font-bold uppercase mb-2">
    Core Module
  </h3>
  <p className="font-mono text-sm text-zinc-600">
    System description goes here using monospaced font for technical feel.
  </p>
</div>
```

**Instruction for Agents**: When implementing new features, always copy the className patterns from `VariantB.tsx` components. Do not introduce rounded corners (beyond user preference for small radius) or drop shadows unless absolutely necessary for overlay depth.
