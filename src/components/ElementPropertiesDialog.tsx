import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { FrameElement, AreaElement, StructuralNode } from '@/structural/model/types';

interface EndRelease {
  ux: boolean; uy: boolean; uz: boolean;
  rx: boolean; ry: boolean; rz: boolean;
}

interface SlabPropsData {
  thickness: number;
  finishLoad: number;
  liveLoad: number;
  cover: number;
}

interface ElementPropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  frame?: FrameElement | null;
  area?: AreaElement | null;
  node?: StructuralNode | null;
  nodeI?: StructuralNode | null;
  nodeJ?: StructuralNode | null;
  slabProps?: SlabPropsData | null;
  hasMultipleStories?: boolean;
  columnOrientAngle?: number;
  onSave: (data: {
    frameId?: number;
    areaId?: number;
    nodeId?: number;
    b?: number;
    h?: number;
    orientAngle?: number;
    thickness?: number;
    finishLoad?: number;
    liveLoad?: number;
    cover?: number;
    nodeIRestraints?: EndRelease;
    nodeJRestraints?: EndRelease;
    restraints?: EndRelease;
    applyToUpperFloors?: boolean;
    moveX?: number;
    moveY?: number;
    syncColocated?: boolean;
    newX1?: number;
    newY1?: number;
    newX2?: number;
    newY2?: number;
  }) => void;
  onDelete?: (data: { frameId?: number; areaId?: number; nodeId?: number }) => void;
}

export default function ElementPropertiesDialog({
  open, onClose, frame, area, node, nodeI, nodeJ, slabProps, onSave, onDelete, hasMultipleStories, columnOrientAngle
}: ElementPropertiesDialogProps) {
  const [b, setB] = useState(0);
  const [h, setH] = useState(0);
  const [orientAngle, setOrientAngle] = useState(0);
  const [thickness, setThickness] = useState(0);
  const [finishLoad, setFinishLoad] = useState(0);
  const [liveLoad, setLiveLoad] = useState(0);
  const [cover, setCover] = useState(0);
  const [releaseI, setReleaseI] = useState<EndRelease>({ ux: false, uy: false, uz: false, rx: false, ry: false, rz: false });
  const [releaseJ, setReleaseJ] = useState<EndRelease>({ ux: false, uy: false, uz: false, rx: false, ry: false, rz: false });
  const [nodeRestraints, setNodeRestraints] = useState<EndRelease>({ ux: false, uy: false, uz: false, rx: false, ry: false, rz: false });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [applyToUpperFloors, setApplyToUpperFloors] = useState(false);
  // Move state
  const [moveX, setMoveX] = useState('0');
  const [moveY, setMoveY] = useState('0');
  const [syncColocated, setSyncColocated] = useState(false);
  // Beam coordinate edit state
  const [editX1, setEditX1] = useState('0');
  const [editY1, setEditY1] = useState('0');
  const [editX2, setEditX2] = useState('0');
  const [editY2, setEditY2] = useState('0');

  useEffect(() => {
    setConfirmDelete(false);
    setApplyToUpperFloors(false);
    setMoveX('0');
    setMoveY('0');
    setSyncColocated(false);
    if (frame) {
      setB(frame.b || 200);
      setH(frame.h || 400);
      setOrientAngle(columnOrientAngle ?? 0);
    }
    if (frame?.type === 'beam' && nodeI && nodeJ) {
      setEditX1(nodeI.x.toFixed(3));
      setEditY1(nodeI.y.toFixed(3));
      setEditX2(nodeJ.x.toFixed(3));
      setEditY2(nodeJ.y.toFixed(3));
    }
    if (area) {
      setThickness(area.thickness);
    }
    if (slabProps && area) {
      setFinishLoad(slabProps.finishLoad);
      setLiveLoad(slabProps.liveLoad);
      setCover(slabProps.cover);
      setThickness(slabProps.thickness);
    }
    if (node) {
      setNodeRestraints({ ...node.restraints });
    }
    if (nodeI) setReleaseI({ ...nodeI.restraints });
    if (nodeJ) setReleaseJ({ ...nodeJ.restraints });
  }, [frame, area, node, nodeI, nodeJ, slabProps, columnOrientAngle]);

  const handleSave = () => {
    const dx = parseFloat(moveX) || 0;
    const dy = parseFloat(moveY) || 0;
    if (node) {
      onSave({
        nodeId: node.id,
        restraints: nodeRestraints,
      });
    } else if (frame) {
      const saveData: Parameters<typeof onSave>[0] = {
        frameId: frame.id,
        b, h,
        orientAngle: isColumn ? orientAngle : undefined,
        nodeIRestraints: releaseI,
        nodeJRestraints: releaseJ,
        applyToUpperFloors: isColumn ? applyToUpperFloors : undefined,
        moveX: dx !== 0 ? dx : undefined,
        moveY: dy !== 0 ? dy : undefined,
        syncColocated: isBeam ? syncColocated : undefined,
      };
      if (isBeam) {
        const x1 = parseFloat(editX1);
        const y1 = parseFloat(editY1);
        const x2 = parseFloat(editX2);
        const y2 = parseFloat(editY2);
        const coordsChanged = nodeI && nodeJ && (
          Math.abs(x1 - nodeI.x) > 0.0001 || Math.abs(y1 - nodeI.y) > 0.0001 ||
          Math.abs(x2 - nodeJ.x) > 0.0001 || Math.abs(y2 - nodeJ.y) > 0.0001
        );
        if (coordsChanged) {
          saveData.newX1 = x1; saveData.newY1 = y1;
          saveData.newX2 = x2; saveData.newY2 = y2;
        }
      }
      onSave(saveData);
    } else if (area) {
      onSave({
        areaId: area.id, thickness, finishLoad, liveLoad, cover,
        moveX: dx !== 0 ? dx : undefined,
        moveY: dy !== 0 ? dy : undefined,
      });
    }
    onClose();
  };

  const handleRotate90 = () => {
    const normalized = ((orientAngle % 360) + 360) % 360;
    const newAngle = (normalized >= 45 && normalized < 135) ? 0 : 90;
    setOrientAngle(newAngle);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (onDelete) {
      if (node) onDelete({ nodeId: node.id });
      else if (frame) onDelete({ frameId: frame.id });
      else if (area) onDelete({ areaId: area.id });
    }
    onClose();
  };

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  const isBeam = frame?.type === 'beam';
  const isColumn = frame?.type === 'column';
  const isArea = !!area;
  const isNode = !!node;

  const title = isNode ? `خصائص وتحرير ركيزة العقدة N${node?.id}` :
    isBeam ? `خصائص الجسر B${frame?.id}` :
    isColumn ? `خصائص العمود C${frame?.id}` :
    isArea ? `خصائص البلاطة A${area?.id}` : 'خصائص العنصر';

  const elementTypeLabel = isNode ? 'العقدة' : isBeam ? 'الجسر' : isColumn ? 'العمود' : 'البلاطة';

  const ReleaseToggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-mono">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md flex flex-col gap-0 p-0 overflow-hidden" style={{ maxHeight: '92dvh' }}>
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            تعديل خصائص وأبعاد العنصر وحرية الأطراف
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 pb-3 space-y-4">
          {/* Node Properties */}
          {isNode && node && (
            <div className="space-y-4">
              {/* Coordinates Info */}
              <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-1 text-xs">
                <div className="font-semibold text-foreground text-sm mb-1.5 border-b pb-1">موقع وإحداثيات العقدة</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الإحداثي X:</span>
                  <span className="font-mono font-medium">{node.x.toFixed(3)} م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الإحداثي Y:</span>
                  <span className="font-mono font-medium">{node.y.toFixed(3)} م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الإحداثي Z (الارتفاع):</span>
                  <span className="font-mono font-medium">{node.z.toFixed(3)} م</span>
                </div>
              </div>

              {/* Support Presets */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">تعيين سريع للركائز (Presets)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs h-10 flex items-center gap-1.5"
                    onClick={() => setNodeRestraints({ ux: true, uy: true, uz: true, rx: true, ry: true, rz: true })}
                  >
                    <span>🔒 وثاقة (Fixed)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs h-10 flex items-center gap-1.5"
                    onClick={() => setNodeRestraints({ ux: true, uy: true, uz: true, rx: false, ry: false, rz: false })}
                  >
                    <span>📍 مفصلية (Pinned)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs h-10 flex items-center gap-1.5"
                    onClick={() => setNodeRestraints({ ux: false, uy: false, uz: true, rx: false, ry: false, rz: false })}
                  >
                    <span>🛞 منزلقة (Roller)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs h-10 flex items-center gap-1.5"
                    onClick={() => setNodeRestraints({ ux: false, uy: false, uz: false, rx: false, ry: false, rz: false })}
                  >
                    <span>🌐 حرة (Free)</span>
                  </Button>
                </div>
              </div>

              {/* Force/Restraint definition */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">تحرير الركيزة بالتفصيل (درجات الحرية)</h4>
                <p className="text-[10px] text-muted-foreground">U = منع الحركة (إزاحة)، R = منع الدوران (عزم)</p>
                <div className="grid grid-cols-3 gap-2 bg-muted/50 rounded-lg p-3">
                  {([
                    { key: 'ux', label: 'UX', desc: 'إزاحة X' },
                    { key: 'uy', label: 'UY', desc: 'إزاحة Y' },
                    { key: 'uz', label: 'UZ', desc: 'إزاحة Z' },
                    { key: 'rx', label: 'RX', desc: 'دوران X' },
                    { key: 'ry', label: 'RY', desc: 'دوران Y' },
                    { key: 'rz', label: 'RZ', desc: 'دوران Z' },
                  ] as const).map(({ key, label, desc }) => (
                    <div key={`node-${key}`} className="flex flex-col items-center gap-0.5">
                      <ReleaseToggle label={label}
                        value={nodeRestraints[key]}
                        onChange={v => setNodeRestraints(prev => ({ ...prev, [key]: v }))} />
                      <span className="text-[8px] text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dimensions */}
          {(isBeam || isColumn) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">الأبعاد (مم)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">العرض b</label>
                  <Input type="number" value={b} onChange={e => setB(Number(e.target.value))} className="h-10 font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">الارتفاع h</label>
                  <Input type="number" value={h} onChange={e => setH(Number(e.target.value))} className="h-10 font-mono text-sm" />
                </div>
              </div>
              {nodeI && (
                <div className="text-xs text-muted-foreground">
                  <span>الطول: </span>
                  <span className="font-mono">
                    {nodeI && nodeJ ? Math.sqrt((nodeJ.x - nodeI.x) ** 2 + (nodeJ.y - nodeI.y) ** 2 + (nodeJ.z - nodeI.z) ** 2).toFixed(3) : '—'} م
                  </span>
                </div>
              )}
              {isColumn && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRotate90}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      (((orientAngle % 360) + 360) % 360) >= 45 && (((orientAngle % 360) + 360) % 360) < 135
                        ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                        : 'border-border hover:bg-accent/30'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    {(((orientAngle % 360) + 360) % 360) >= 45 && (((orientAngle % 360) + 360) % 360) < 135
                      ? 'مدوَّر 90° — اضغط للإلغاء'
                      : 'تدوير العمود 90°'}
                  </button>
                  {(((orientAngle % 360) + 360) % 360) >= 45 && (((orientAngle % 360) + 360) % 360) < 135 && (
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono">
                      b_فعلي={b > h ? b : h} × h_فعلي={b > h ? h : b} مم
                    </span>
                  )}
                </div>
              )}
              {isColumn && hasMultipleStories && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <Checkbox
                    id="apply-upper-floors"
                    checked={applyToUpperFloors}
                    onCheckedChange={v => setApplyToUpperFloors(!!v)}
                  />
                  <label htmlFor="apply-upper-floors" className="text-xs cursor-pointer leading-tight">
                    تطبيق الأبعاد على الأعمدة في نفس الموقع (الأدوار العلوية)
                  </label>
                </div>
              )}
            </div>
          )}

          {isArea && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">خصائص البلاطة</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">السماكة (مم)</label>
                  <Input type="number" value={thickness} onChange={e => setThickness(Number(e.target.value))} className="h-10 font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">الغطاء (مم)</label>
                  <Input type="number" value={cover} onChange={e => setCover(Number(e.target.value))} className="h-10 font-mono text-sm" />
                </div>
              </div>
              
              <h4 className="text-sm font-semibold text-foreground mt-3">الأحمال المسلطة</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">أحمال التشطيب (kN/m²)</label>
                  <Input type="number" value={finishLoad} onChange={e => setFinishLoad(Number(e.target.value))} className="h-10 font-mono text-sm" step="0.1" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">الحمل الحي (kN/m²)</label>
                  <Input type="number" value={liveLoad} onChange={e => setLiveLoad(Number(e.target.value))} className="h-10 font-mono text-sm" step="0.1" />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">الوزن الذاتي</span>
                  <span className="font-mono">{(thickness / 1000 * 25).toFixed(2)} kN/m²</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">إجمالي الحمل الميت</span>
                  <span className="font-mono">{(thickness / 1000 * 25 + finishLoad).toFixed(2)} kN/m²</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">الحمل النهائي (1.2D + 1.6L)</span>
                  <span className="font-mono">{(1.2 * (thickness / 1000 * 25 + finishLoad) + 1.6 * liveLoad).toFixed(2)} kN/m²</span>
                </div>
              </div>
            </div>
          )}

          {/* Move Element Section */}
          {(isBeam || isColumn || isArea) && (
            <div className="space-y-3 border border-orange-200 dark:border-orange-800 rounded-lg p-3 bg-orange-50/40 dark:bg-orange-950/20">
              <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
                تحريك العنصر (إزاحة نسبية)
              </h4>
              <p className="text-[10px] text-muted-foreground">أدخل قيمة الإزاحة بالمتر — موجب لليمين/للأعلى، سالب لليسار/للأسفل</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="font-mono font-bold text-blue-600">ΔX</span>
                    <span className="text-[9px]">(+ يمين / - يسار)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={moveX}
                    onChange={e => setMoveX(e.target.value)}
                    className="h-10 font-mono text-sm"
                    placeholder="0.00 م"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="font-mono font-bold text-green-600">ΔY</span>
                    <span className="text-[9px]">(+ فوق / - تحت)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={moveY}
                    onChange={e => setMoveY(e.target.value)}
                    className="h-10 font-mono text-sm"
                    placeholder="0.00 م"
                  />
                </div>
              </div>
              {isBeam && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
                  <Checkbox
                    id="sync-colocated"
                    checked={syncColocated}
                    onCheckedChange={v => setSyncColocated(!!v)}
                  />
                  <label htmlFor="sync-colocated" className="text-xs cursor-pointer leading-tight">
                    تحريك جميع الجسور المطابقة في الإحداثيات (جميع الأدوار)
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Beam Coordinate Edit Section */}
          {isBeam && nodeI && nodeJ && (
            <div className="space-y-3 border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50/30 dark:bg-blue-950/20">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/></svg>
                تعديل إحداثيات الجسر مباشرة (م)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">X₁ (بداية)</label>
                  <Input type="number" step="0.01" value={editX1} onChange={e => setEditX1(e.target.value)} className="h-9 font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">Y₁ (بداية)</label>
                  <Input type="number" step="0.01" value={editY1} onChange={e => setEditY1(e.target.value)} className="h-9 font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">X₂ (نهاية)</label>
                  <Input type="number" step="0.01" value={editX2} onChange={e => setEditX2(e.target.value)} className="h-9 font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono">Y₂ (نهاية)</label>
                  <Input type="number" step="0.01" value={editY2} onChange={e => setEditY2(e.target.value)} className="h-9 font-mono text-xs" />
                </div>
              </div>
              <div className="text-[9px] text-muted-foreground bg-muted/40 rounded p-2">
                الطول المحسوب: {(Math.sqrt((parseFloat(editX2) - parseFloat(editX1)) ** 2 + (parseFloat(editY2) - parseFloat(editY1)) ** 2) || 0).toFixed(3)} م
              </div>
            </div>
          )}

          {/* End releases for frames - ETABS style */}
          {frame && nodeI && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                تحرير الطرف I (بداية العنصر)
                <Badge variant="outline" className="text-[10px]">N{frame.nodeI}</Badge>
              </h4>
              <p className="text-[10px] text-muted-foreground">U = إزاحة (قوة)، R = دوران (عزم) — مثل ETABS</p>
              <div className="grid grid-cols-3 gap-2 bg-muted/50 rounded-lg p-3">
                {([
                  { key: 'ux', label: 'U1', desc: 'محوري' },
                  { key: 'uy', label: 'U2', desc: 'قص رئيسي' },
                  { key: 'uz', label: 'U3', desc: 'قص ثانوي' },
                  { key: 'rx', label: 'R1', desc: 'لَي' },
                  { key: 'ry', label: 'R2', desc: 'عزم M22' },
                  { key: 'rz', label: 'R3', desc: 'عزم M33' },
                ] as const).map(({ key, label, desc }) => (
                  <div key={`i-${key}`} className="flex flex-col items-center gap-0.5">
                    <ReleaseToggle label={`${label}`}
                      value={releaseI[key]}
                      onChange={v => setReleaseI(prev => ({ ...prev, [key]: v }))} />
                    <span className="text-[8px] text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {frame && nodeJ && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                تحرير الطرف J (نهاية العنصر)
                <Badge variant="outline" className="text-[10px]">N{frame.nodeJ}</Badge>
              </h4>
              <div className="grid grid-cols-3 gap-2 bg-muted/50 rounded-lg p-3">
                {([
                  { key: 'ux', label: 'U1', desc: 'محوري' },
                  { key: 'uy', label: 'U2', desc: 'قص رئيسي' },
                  { key: 'uz', label: 'U3', desc: 'قص ثانوي' },
                  { key: 'rx', label: 'R1', desc: 'لَي' },
                  { key: 'ry', label: 'R2', desc: 'عزم M22' },
                  { key: 'rz', label: 'R3', desc: 'عزم M33' },
                ] as const).map(({ key, label, desc }) => (
                  <div key={`j-${key}`} className="flex flex-col items-center gap-0.5">
                    <ReleaseToggle label={`${label}`}
                      value={releaseJ[key]}
                      onChange={v => setReleaseJ(prev => ({ ...prev, [key]: v }))} />
                    <span className="text-[8px] text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ETABS instability warnings */}
          {frame && (() => {
            const warnings: string[] = [];
            if (releaseI.ux && releaseJ.ux) warnings.push('⚠️ لا يمكن تحرير U1 (محوري) من كلا الطرفين — عدم استقرار');
            if (releaseI.uy && releaseJ.uy) warnings.push('⚠️ لا يمكن تحرير U2 (قص) من كلا الطرفين — عدم استقرار');
            if (releaseI.uz && releaseJ.uz) warnings.push('⚠️ لا يمكن تحرير U3 (قص) من كلا الطرفين — عدم استقرار');
            if (releaseI.rx && releaseJ.rx) warnings.push('⚠️ لا يمكن تحرير R1 (لَي) من كلا الطرفين — عدم استقرار');
            if (releaseI.ry && releaseJ.ry && (releaseI.uz || releaseJ.uz))
              warnings.push('⚠️ R2 من كلا الطرفين مع U3 — عدم استقرار');
            if (releaseI.rz && releaseJ.rz && (releaseI.uy || releaseJ.uy))
              warnings.push('⚠️ R3 من كلا الطرفين مع U2 — عدم استقرار');
            if (warnings.length === 0) return null;
            return (
              <div className="space-y-1 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-destructive font-medium">{w}</p>
                ))}
              </div>
            );
          })()}

          {/* Delete confirmation message */}
          {confirmDelete && (
            <div className="bg-destructive/10 border border-destructive/40 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium text-center">
                ⚠️ هل أنت متأكد من حذف {elementTypeLabel}؟
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                اضغط "حذف العنصر" مرة أخرى للتأكيد
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0 px-5 py-4 border-t shrink-0 bg-background">
          {/* Delete button - shown when onDelete is provided */}
          {onDelete && (
            <Button
              variant={confirmDelete ? "destructive" : "outline"}
              onClick={handleDelete}
              className={`min-h-[44px] sm:mr-auto border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground ${confirmDelete ? '' : 'hover:border-destructive'}`}
            >
              {confirmDelete ? '⚠️ تأكيد الحذف' : '🗑️ حذف العنصر'}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="min-h-[44px]">إلغاء</Button>
            <Button onClick={handleSave} className="min-h-[44px]">حفظ التغييرات</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
