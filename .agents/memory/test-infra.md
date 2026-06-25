---
name: Test Infrastructure
description: Vitest setup details and critical FEM function signatures for the Structural Master test suite.
---

## Test Runner
- Command: `node_modules/.bin/vitest run --config vitest.config.ts`
- No global npm/pnpm — always use `node_modules/.bin/` prefix
- Config: `vitest.config.ts` with `@` → `src/` alias

## Test File Locations
- `src/__tests__/structuralEngine.test.ts` — 25 tests (ACI 318-19 beam/column/slab/footing)
- `src/__tests__/slabFEMEngine.test.ts` — 17 tests (FEM mesh, assembly, reactions)
- `src/__tests__/bbsGenerator.test.ts` — 15 tests (bar bending schedule generation)

## Critical: Exact FEM Function Signatures
These are NOT object-style; positional args only:

```ts
// src/slabFEMEngine/assembler.ts
reconstructDisplacements(d_free, freeDOFs, nDOF)
extractReactions(K_full, d_full, F_full, fixedDOFs, nDOF)

// src/slabFEMEngine/mesh.ts — correct name is meshSlab (NOT createMesh)
meshSlab(slab, beams, columns, meshDensity, registry?)
```

**Why:** Early tests failed using object-style calls and wrong function name; these corrections were necessary.
