---
name: Drawing System Unification
description: Phases 1, 4, 5 of the large drawing-system prompt — what was done, why, and what remains.
---

## Phase 1 — Line Weight Canonical Source (COMPLETE)

**Rule:** `src/drawings/drawingStandards.ts` is the single source of truth for ALL line weights.
Never define new weights in drawingCoreEngine or other renderers — add them to LINE_WEIGHTS there.

**Why:** The system had two independent definitions: `drawingStandards.LINE_WEIGHTS` and `drawingCoreEngine.DEFAULT_LAYERS`.
They conflicted on BORDER (0.8 vs 1.0), GRID (0.15 vs 0.13), REBAR (0.6 vs 0.5 per ACI 315), DIMENSION (0.2 vs 0.25 per ISO 128).

**How to apply:** `drawingCoreEngine.ts` now uses a local `const LW = { ... }` that maps to the canonical values with inline references to drawingStandards. When you add a new layer type, add the weight to `drawingStandards.LINE_WEIGHTS` first, then reference it in `LW`.

## Phase 4 — DXF Quality Improvements (COMPLETE)

**Rule:** All DXF files must open correctly in metric mode in any AutoCAD/DraftSight/BricsCAD version.

**Changes made to `src/export/dxfExporter.ts`:**
- `dxfHeader()` now emits a full HEADER section: `$ACADVER AC1018` (R2004), `$INSUNITS 4` (mm), `$MEASUREMENT 1` (metric), `$LTSCALE 1.0`, `$DIMSCALE 1.0`.
- `dxfPolyline()` now generates modern `LWPOLYLINE` (lightweight polyline) instead of the legacy `POLYLINE/VERTEX/SEQEND` format from DXF R12. LWPOLYLINE is supported from AC1015 (R2000) onward.
- New exported function `dxfHatch(points, layer, pattern, scale, angle)` supports `ANSI31` (45° concrete hatching), `ANSI32` (earth/soil double hatching), and `SOLID` fills. Boundary is defined as closed LINE edges per the DXF specification.

**Why:** Without a HEADER, AutoCAD defaults to inch mode. Without LWPOLYLINE, some newer CAD tools emit warnings or reject the file. HATCH patterns are required for professional structural drawings.

## Phase 5 — Foundation Drawings Workspace (COMPLETE)

**Rule:** `FoundationDrawingsWorkspace` is the entry point for all foundation drawing/export UI. Do not use `FoundationDrawingsExportPanel` directly in new code — use the workspace.

**Changes:**
- Created `src/components/FoundationDrawingsWorkspace.tsx` — thin 2-tab wrapper:
  - Tab 1 **المخططات التفصيلية** → `FoundationDrawingsPanel` (visual footing details)
  - Tab 2 **التصدير والإدارة** → `FoundationDrawingsExportPanel` (which already includes `FoundationSheetManager` as its sub-tab 9)
- `FoundationDesignPanel.tsx` `drawings-export` tab updated to use the workspace.

**Why:** Three previously independent panels (FoundationDrawingsPanel, FoundationDrawingsExportPanel, FoundationSheetManager) were siloed. `FoundationDrawingsPanel` was not integrated anywhere — the workspace connects it.

**What remains:** `Index.tsx` line ~3449 still renders `FoundationDrawingsExportPanel` directly. Replace with `FoundationDrawingsWorkspace` there when ready.

## User-Specific Modification — Formwork/Axes Plan (COMPLETE)

**Rule:** When `projectionMode === 'general'` (drawing S-101, "مخطط القوالب والمحاور للدور"), the print output must contain ONLY the floor plan SVG — no schedule table, no construction notes.

**Changes made to `src/components/StructuralDrawingsModule.tsx` (`handlePrintActiveFloorPlan`):**
1. `tableHTML` stays empty (`''`) for `projectionMode === 'general'` — was incorrectly generating a column schedule table.
2. Construction notes `<div>` is wrapped in `${projectionMode !== 'general' ? \`...\` : ''}`.
3. `maxPixelX` (SVG crop right edge) expanded from 462 to `Math.min(710, offsetCadX + drawnW + 60)` for general mode, using the full sheet width freed up by removing the table.

**Why:** Engineer requirement — formwork/axes plan is a pure dimensional drawing for contractors. Tables and notes belong on separate sheets, not mixed with this plan.
