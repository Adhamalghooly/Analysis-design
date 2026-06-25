---
name: Zustand Store Architecture
description: Decision record for how state is organized in Zustand stores for the God Component decomposition.
---

## Decision
State is split into 3 domain stores in `src/stores/`:

| Store | File | Responsibility |
|---|---|---|
| `useModelStore` | `modelStore.ts` | Geometry (slabs/beams/columns), materials, stories, overrides |
| `useAnalysisStore` | `analysisStore.ts` | Analysis results, engine type, ETABS import, BOB connections |
| `useUIStore` | `uiStore.ts` | Tabs, active tool, dialogs, title block, ephemeral UI state |

Import via barrel: `import { useModelStore, useAnalysisStore, useUIStore } from '@/stores'`

## Why Zustand (not React Context)
- Prompt explicitly suggested Zustand; subscribeWithSelector middleware enables efficient derived-state subscriptions
- No prop-drilling needed; store can be accessed from any component
- Performance: components only re-render when their slice changes

## Key Implementation Notes
- `modelVersion: number` in ModelStore increments on any structural geometry change — use as invalidation signal for analysis results
- EngineType values: `'legacy_2d' | 'legacy_3d' | 'global_frame' | 'unified_core' | 'fem_coupled'` (NOT `'legacy3d'`)
- ToolType imported from `@/components/ToolPalette`
- WorkerDiagnostics imported from `@/core/workers/workerTypes`

## Status
Foundation only — `src/pages/Index.tsx` (7742 lines) is NOT yet wired to these stores.
Next step: gradually replace `useReducer` calls in Index.tsx with store hooks, panel by panel.

**How to apply:** When extracting a panel from Index.tsx, pass store values as props or use store hooks directly in the extracted component. Never import AppState from indexReducer — use stores instead.
