# REFACTOR BASELINE — خط الأساس الهندسي
> أُنشئ بتاريخ: 2026-06-25  
> الهدف: توثيق كل دالة حسابية أساسية قبل أي إعادة هيكلة، مع مدخلاتها ومخرجاتها ومرجعها الكودي.  
> **القاعدة**: لا يُعدَّل أي منطق حسابي دون اختبار يثبت التطابق مع هذا الخط.

---

## 1. `src/lib/structuralEngine.ts`

### 1.1 `designFlexure(Mu, b, h, fc, fy, cover?, slabExists?, slabThickness?, slabWidth?, minBars?)`
- **المدخلات**: عزم التصميم Mu (kN.m)، عرض b وعمق h (mm)، مقاومة الخرسانة fc (MPa)، حديد التسليح fy (MPa)، غطاء cover (mm)، خصائص بلاطة T-Beam اختياريًا.
- **المخرجات**: `FlexureResult { Mu, Ru, rho, As, bars, dia, checkSpacing, requiredSteelArea, utilizationRatio }`
- **المرجع الكودي**:
  - ACI 318-19 §9.5.1.1: φMn ≥ Mu
  - ACI 318-19 §9.6.1.2: ρmin = max(0.25√f'c/fy, 1.4/fy)
  - ACI 318-19 §21.2.2: ρmax من ε_t ≥ 0.005 → c/dt ≤ 0.375 → ρmax = 0.85β₁f'c/fy · (0.003/0.008)
  - ACI 318-19 §25.2.1: min clear spacing = max(db, 25mm, 4/3·dg)
  - ACI 318-19 §6.3.2.1: عرض الشفة الفعال للـ T-beam

### 1.2 `designShear(Vu, b, h, fc, fyt, cover?, stirrupDia?, wu?, supportWidth?, As?)`
- **المدخلات**: قوة القص Vu (kN)، b و h (mm)، fc و fyt (MPa)، تحميل موزع wu (kN/m) لحساب القطاع الحرج.
- **المخرجات**: `ShearResult { Vc, Vs, sRequired, sMax, sUsed, stirrups, stirrupLegs, shearUtilization, Vc_simplified, Vc_detailed }`
- **المرجع الكودي**:
  - ACI 318-19 §22.5.5.1: Vc_simplified = (1/6)√f'c·bw·d (kN)
  - ACI 318-19 Table 22.5.5.1: Vc_detailed = 0.66·(ρw)^(1/3)·√f'c·bw·d
  - ACI 318-19 §22.5.1.2: Vs_max = (2/3)·√f'c·bw·d
  - ACI 318-19 §9.7.6.2.2: s_max = min(d/2, 600mm) if Vs ≤ (1/3)√f'c·bw·d
  - ACI 318-19 §9.6.3.3: Av_min = max(0.062√f'c·b/fyt, 0.35·b/fyt)
  - ACI 318-19 §9.4.3.2: قطاع القص الحرج على بعد d من وجه الركيزة

### 1.3 `designColumnETABS(Pu, Mu, b, h, fc, fy, Lu)`
- **المدخلات**: حمل محوري Pu (kN)، عزم Mu (kN.m)، أبعاد b×h (mm)، fc و fy (MPa)، طول غير مسنود Lu (mm).
- **المخرجات**: `ColumnResult { Pu, Mu, checkSlenderness, bars, dia, stirrups, phiPn, phiMn, adequate, rhoActual, kLu_r, deltaNs, MuMagnified, pmDiagram, utilizationRatio }`
- **المرجع الكودي**:
  - ACI 318-19 §6.2.5: حد النحافة = 34 − 12·(M1/M2), max 40 (r = 0.3·min(b,h))
  - ACI 318-19 §6.6.4: تكبير العزم للأعمدة النحيفة (non-sway)
  - ACI 318-19 §6.6.4.5.4: M2,min = Pu·(15 + 0.03·h)/1000
  - ACI 318-19 §10.7.6.1.2: مسافة الكانات = min(16·db_long, 48·db_tie, min(b,h))
  - ACI 318-19 §22.4: مخطط P-M للتحقق من السعة

### 1.4 `designSlab(slab, props, mat, allSlabs, columns?)`
- **المدخلات**: كائن البلاطة slab مع خصائص المواد props و mat وجميع البلاطات للتحقق من الاستمرارية.
- **المخرجات**: `SlabDesignResult { lx, ly, beta, isOneWay, hMin, hUsed, ownWeight, Wu, discontinuousEdges, shortDir, longDir, shortCoeff, longCoeff, punchingShear? }`
- **المرجع الكودي**:
  - ACI 318-19 Table 7.3.1.1 / 8.3.1.1: الحد الأدنى لسُمك البلاطة
  - ACI 318-19 §6.5.2: معاملات العزم التقريبية للبلاطات أحادية الاتجاه
  - ACI 318-19 §7.6.1.1 / §8.6.1.1: الحد الأدنى للتسليح ρ_min = 0.0018·b·h (fy≥420)
  - Wu = 1.2·(DL+SDL) + 1.6·LL

### 1.5 `diagnoseBeam(beamId, beam, flexLeft, flexMid, flexRight, shear, deflection, ...)`
- **المرجع الكودي**: ACI 318-19 Table 9.3.1.1 (min depth)، §9.5.1.1 (flexure)، §22.5 (shear)

### 1.6 `calculateDeflection(beam, flexMid, mat, slabProps, ...)`
- **المرجع الكودي**: ACI 318-19 §24.2.2 (immediate), §24.2.4 (long-term λΔ)

### 1.7 `analyzeFrame(frames, beams, ...)`
- **المرجع الكودي**: طريقة صلابة المصفوفة (Direct Stiffness Method) — Kassimali, Matrix Analysis of Structures

---

## 2. `src/slabFEMEngine/`

### 2.1 `elementStiffness(elem, nodes, slabProps, mat)` — `mindlinShell.ts`
- **المرجع الكودي**:
  - Bathe & Dvorkin (1985): MITC4 element, Mindlin-Reissner plate
  - ACI 318-19 §6.6.3.1: SLAB_STIFFNESS_REDUCTION = 0.25·Ig
  - Db = 0.25·(Ec·t³)/(12·(1−ν²)), Ec = 4700√f'c (ACI §19.2.2), ν = 0.2
  - التكامل العددي: 2×2 Gauss للانحناء، 1×1 reduced Gauss للقص (منع locking)
- **المخرجات**: مصفوفة الجساءة 12×12 (flat row-major) بوحدات N/mm, N·mm/mm, N·mm

### 2.2 `assembleSystem(mesh, slabProps, mat, q)` — `assembler.ts`
- **المرجع الكودي**: Direct Stiffness Assembly (Cook et al., Concepts and Applications of FEA)
- **المخرجات**: `AssembledSystem { K_ff, F_f, freeDOFs, fixedDOFs, nDOF, F_full, K_full }`

### 2.3 `elementLoadVector(elem, nodes, q)` — `mindlinShell.ts`
- **المرجع**: متجه الحمل المتسق (consistent load vector) بتكامل Gauss 2×2
- **المخرجات**: 12-element vector (Fz للعقد فقط، RX/RY = 0 للضغط المنتظم)

---

## 3. `src/rebar/bbsGenerator.ts`

### 3.1 `generateBBS(beams, columns, slabs, beamDesigns, colDesigns, slabDesigns, filterStoryId?)`
- **المخرجات**: `BBSEntry[]` لكل عنصر تسليح
- **المرجع**: BS 8666 (shape codes)، ACI 318 (حسابات الأطوال)
- **قواعد الطول**:
  - الحديد العلوي (أعصاب العقود): span × 0.3 + hookLength
  - الحديد السفلي (حديد الجاذبية): span + 2 × hookLength
  - Stirrups: 2×(b+h) − 8×cover + 2×hookLength
- **وزن القضيب**: dia²/162.2 × length (kg/m) — معامل الوزن الصلب القياسي
- **عوامل الهدر (wastage)**: beam=5%, column=3%, slab=8%

### 3.2 `hookLength(dia)`
- **القيمة**: max(12·dia/1000, 0.15) بالمتر

---

## 4. ملفات هندسية أخرى (للمرجعية)

| الملف | الدالة الرئيسية | المرجع |
|-------|-----------------|--------|
| `src/lib/foundationDesign.ts` | تصميم القواعد المنعزلة/الشريطية/المركبة | ACI 318-19 Ch.13 |
| `src/lib/solver3D.ts` | محلل الإطارات ثلاثي الأبعاد | MSM (Matrix Stiffness Method) |
| `src/lib/momentDistribution.ts` | توزيع العزوم | Hardy Cross Method |
| `src/lib/continuousSlabAnalysis.ts` | تحليل البلاطات المستمرة | ACI 8.10 |
| `src/lib/ribbedSlabDesignEngine.ts` | تصميم البلاطات المضلعة | ACI 318-19 §9.8 |
| `src/lib/isolatedFootingDesignEngine.ts` | تصميم القواعد المنعزلة | ACI 318-19 §13.3 |

---

## 5. القيود الصارمة (Hard Constraints)

1. لا تغيير لأي معامل هندسي (مثل `(1/6) * sqrt(fc) * b * d`) دون مرجع كودي واختبار مطابق.
2. أي تعديل لملفات هذا الـ baseline يستلزم تحديث الاختبارات في `src/__tests__/` أيضاً.
3. الصيغ الهندسية ثابتة — إعادة الهيكلة تمس التنظيم فقط لا المنطق.
