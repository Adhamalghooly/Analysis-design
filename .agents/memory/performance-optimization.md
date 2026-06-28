---
name: Performance Optimization — Index.tsx
description: Key performance anti-patterns found and fixed in Index.tsx; rules for keeping the app responsive.
---

## The Problem
App froze for ~1 minute when editing beam/column/slab dimensions in input panels. Every keystroke triggered an expensive computation chain.

## Root Causes Found & Fixed

### 1. `slabDesigns` useMemo — NO `analyzed` guard (CRITICAL)
`designSlab()` is a full FEM computation. It was running for **every slab on every keystroke** with no guard.
**Fix:** `if (!analyzed) return slabs.map(s => ({ ...s, design: null }));`

### 2. Inline `designSlab` calls inside JSX (CRITICAL × 5)
Five prop assignments called `slabs.map(s => ({ ...s, design: designSlab(...) }))` **directly in JSX**. This bypassed memoization entirely — FEM ran on every render.
Locations were: `ExportPanel`, `BOQPanel`, `StructuralDrawingsModule`, `QuantityTakeoffPanel`, `PDF button onClick`.
**Fix:** All now use the memoized `slabDesigns` variable.

### 3. `colDesigns` useMemo — NO `analyzed` guard
`designColumnBiaxial()` ran for every column on every render even with Pu=0.
**Fix:** `if (!analyzed && !(etabs mode)) return empty array;`

### 4. Model rebuild `useEffect` — fires on every keystroke
The effect at `mode==='auto'` rebuilt the entire structural model (nodes, beams, columns) on every change to beam/column dimensions. These changes happen on every keystroke.
**Fix:** Debounced with 250ms `setTimeout` + `useRef` timer.

### 5. Foundation and Export panels — always mounted
These heavy panels (with 17 internal `useMemo`/`useEffect` hooks) computed on every render.
**Fix:** Lazy mounting via `visitedTabs` Set state — panels only mount on first tab visit.

## Rules to Maintain

**Why:** Heavy design functions (FEM, biaxial interaction) are O(n×m) computations that block the JS thread.

- **Never call `designSlab()`, `designColumnBiaxial()`, or any `designXxx()` function directly in JSX props.** Always use a memoized variable.
- **Always add `if (!analyzed) return earlyResult;`** to any useMemo that calls structural analysis/design functions.
- **Any effect that rebuilds the structural model (calls `modelManager.clear()`) must be debounced** if it depends on user-typed values.
- **Heavy tab panels must be lazy-mounted** using the `visitedTabs` pattern to avoid computing on app startup.

## How to Apply
- Before adding a new `useMemo` with heavy computation, check if it needs an `analyzed` guard.
- When passing design data as props to panels, always pass the memoized variable, not an inline `.map()`.
- When adding a new `useEffect` with heavy work that depends on rapidly-changing state (input values), add a debounce timer.
