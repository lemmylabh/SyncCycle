"use client";

import { useState } from "react";
import {
  User, Droplets, Smile, HeartPulse, UtensilsCrossed, Dumbbell, Moon,
  TrendingUp, Sparkles, Wand2, GripVertical, X, Lock, Plus, Check,
  type LucideIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTrackerSettings } from "@/hooks/useTrackerSettings";
import {
  useDashboardCardOrder, computeAutoArrange,
  type InsightsCardSize, type ProfileCardSize,
  profileCells, insightsCells, maxCardSlots, adjustCardOrder,
} from "@/hooks/useDashboardCardOrder";

// ─── Card metadata ────────────────────────────────────────────────────────────

interface CardMeta {
  key: string;
  label: string;
  Icon: LucideIcon;
  core?: boolean;
  widget?: boolean;
}

const ALL_CARDS: CardMeta[] = [
  { key: "profile",   label: "Profile",     Icon: User,            core: true },
  { key: "period",    label: "Cycle Phase", Icon: Droplets,        core: true },
  { key: "mood",      label: "Vibe Check",  Icon: Smile },
  { key: "symptoms",  label: "Symptoms",    Icon: HeartPulse },
  { key: "nutrition", label: "Nutrition",   Icon: UtensilsCrossed },
  { key: "fitness",   label: "Fitness",     Icon: Dumbbell },
  { key: "sleep",     label: "Sleep",       Icon: Moon },
  { key: "insights",  label: "Insights",    Icon: TrendingUp,      widget: true },
  { key: "fiona",     label: "Ask Fiona",   Icon: Sparkles,        widget: true },
];

const TRACKER_META = ALL_CARDS.filter(c => !c.widget);
const WIDGET_META  = ALL_CARDS.filter(c => c.widget);

const ORDERED_TRACKERS: CardMeta[] = [
  { key: "period",    label: "Cycle Phase", Icon: Droplets },
  { key: "mood",      label: "Vibe Check",  Icon: Smile },
  { key: "symptoms",  label: "Symptoms",    Icon: HeartPulse },
  { key: "nutrition", label: "Nutrition",   Icon: UtensilsCrossed },
  { key: "fitness",   label: "Fitness",     Icon: Dumbbell },
  { key: "sleep",     label: "Sleep",       Icon: Moon },
];

// ─── Slot types ───────────────────────────────────────────────────────────────

type Slot =
  | { type: "tracker";  id: string; label: string; Icon: LucideIcon }
  | { type: "insights"; id: string }
  | { type: "fiona";    id: string }
  | { type: "empty";    id: string };

function computeSlots(layout: string[]): Slot[] {
  return layout.map((key, i) => {
    if (!key)              return { type: "empty",    id: `empty_${i}` };
    if (key === "insights") return { type: "insights", id: "insights"   };
    if (key === "fiona")    return { type: "fiona",    id: "fiona"      };
    const t = ORDERED_TRACKERS.find(t => t.key === key);
    return t
      ? { type: "tracker", id: key, label: t.label, Icon: t.Icon }
      : { type: "empty", id: `empty_${i}` };
  });
}

// ─── Sortable cell ────────────────────────────────────────────────────────────

interface SortableCellProps {
  slot: Slot;
  editMode: boolean;
  onRemove: (id: string) => void;
  extraStyle?: React.CSSProperties;
  insightsCardSize?: InsightsCardSize;
  onSelectInsightsSize?: (size: InsightsCardSize) => void;
  insightsSizeAvailability?: Record<InsightsCardSize, "ok" | "disabled">;
}

function SortableCell({ slot, editMode, onRemove, extraStyle, insightsCardSize, onSelectInsightsSize, insightsSizeAvailability }: SortableCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.id,
    disabled: !editMode || slot.type === "empty",
  });

  const isInsights = slot.type === "insights";

  const style: React.CSSProperties = {
    ...extraStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const baseClass = isInsights
    ? "bg-violet-500/[0.06] border border-violet-500/25 rounded-lg flex flex-col items-center justify-center gap-1.5 relative"
    : slot.type === "fiona"
      ? "bg-violet-500/[0.06] border border-violet-500/25 rounded-lg flex flex-col items-center justify-center gap-1.5 relative"
      : slot.type === "empty"
        ? "border border-dashed border-white/[0.08] rounded-lg relative"
        : `bg-white/[0.05] border rounded-lg flex flex-col items-center justify-center gap-1.5 relative ${
            editMode ? "border-white/25 ring-1 ring-white/10" : "border-white/[0.08]"
          }`;

  return (
    <div ref={setNodeRef} style={style} className={baseClass}>

      {/* Card content */}
      {slot.type === "tracker" && (
        <>
          <slot.Icon size={16} className="text-white/50" />
          <span className="text-[10px] text-white/30">{slot.label}</span>
        </>
      )}
      {slot.type === "insights" && (
        <>
          <TrendingUp size={16} className="text-violet-400/60" />
          <span className="text-[10px] text-violet-400/50">Insights</span>
          {/* Always-visible size badge (hidden in edit mode since picker replaces it) */}
          {!editMode && insightsCardSize && (
            <span className="text-[8px] text-violet-400/30 leading-none">{insightsCardSize}</span>
          )}
        </>
      )}
      {slot.type === "fiona" && (
        <>
          <Sparkles size={16} className="text-violet-400/60" />
          <span className="text-[10px] text-violet-400/50">Fiona</span>
        </>
      )}

      {/* Edit mode controls */}
      {editMode && slot.type !== "empty" && (
        <>
          {/* Drag handle — top left */}
          <button
            {...attributes}
            {...listeners}
            className="absolute top-1 left-1 p-0.5 bg-black/30 rounded text-white/55 hover:text-white/90 cursor-grab active:cursor-grabbing touch-none transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={13} />
          </button>

          {/* Remove — top right (all non-empty slots) */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(slot.id); }}
            className="absolute top-1 right-1 p-0.5 bg-black/30 rounded text-white/55 hover:text-red-400/90 transition-colors"
          >
            <X size={13} />
          </button>

          {/* Size picker — bottom centre (Insights only) — 2×2 grid to fit even 1×1 cells */}
          {slot.type === "insights" && onSelectInsightsSize && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 grid grid-cols-2 gap-0.5 z-10">
              {(["1x1", "1x2", "2x1", "2x2"] as InsightsCardSize[]).map(sz => {
                const avail = insightsSizeAvailability?.[sz] ?? "ok";
                const isActive = sz === insightsCardSize;
                return (
                  <button
                    key={sz}
                    disabled={avail === "disabled"}
                    onClick={e => { e.stopPropagation(); onSelectInsightsSize(sz); }}
                    title={avail === "disabled" ? "Not enough space" : sz}
                    className={`px-1 py-0.5 rounded text-[8px] leading-none transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-violet-500/70 text-white"
                        : avail === "disabled"
                          ? "bg-black/20 text-white/15 cursor-not-allowed"
                          : "bg-black/40 text-white/45 hover:text-violet-400/80 hover:bg-violet-500/10"
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardSettingsPage() {
  const { enabledTrackers } = useTrackerSettings();
  const { cardOrder, setCardOrder, profileCardSize, insightsCardSize, batchUpdate } = useDashboardCardOrder();
  const [editMode, setEditMode] = useState(false);
  const [arranged, setArranged] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const slots = computeSlots(cardOrder);
  const hasEmpty = cardOrder.includes("");

  const profileCellClass = ({
    "1x2": "row-span-2 col-start-1 row-start-1",
    "1x1": "col-start-1 row-start-1",
    "2x1": "col-span-2 col-start-1 row-start-1",
  } as Record<string, string>)[profileCardSize] ?? "row-span-2 col-start-1 row-start-1";

  const insightsStyle: React.CSSProperties = {
    gridColumn: (insightsCardSize === "2x1" || insightsCardSize === "2x2") ? "span 2" : undefined,
    gridRow:    (insightsCardSize === "1x2" || insightsCardSize === "2x2") ? "span 2" : undefined,
  };

  // ── Grid-aware resize ─────────────────────────────────────────────────────
  // Helpers (profileCells, insightsCells, maxCardSlots, adjustCardOrder) imported from hook.

  // Count filled non-insights slots to determine which insight sizes are safe vs. forced
  const filledNonInsights = cardOrder.filter(k => k !== "" && k !== "insights").length;

  // "ok" = fits without removing any filled cards; "disabled" = would force-remove filled cards
  const insightsSizeAvailability = (["1x1", "1x2", "2x1", "2x2"] as InsightsCardSize[]).reduce(
    (acc, sz) => {
      const max = maxCardSlots(profileCardSize, sz, true);
      acc[sz] = (max - 1) >= filledNonInsights ? "ok" : "disabled";
      return acc;
    },
    {} as Record<InsightsCardSize, "ok" | "disabled">
  );

  function selectInsightsSize(newSize: InsightsCardSize) {
    if (insightsSizeAvailability[newSize] === "disabled") return; // guard
    const newMax = maxCardSlots(profileCardSize, newSize, true);
    const withoutInsights = cardOrder.filter(k => k !== "insights");
    const adjustedRest = adjustCardOrder(withoutInsights, newMax - 1);

    let newOrder: string[];
    if (newSize === "1x1") {
      const origIdx = Math.min(cardOrder.indexOf("insights"), adjustedRest.length);
      newOrder = [...adjustedRest.slice(0, origIdx), "insights", ...adjustedRest.slice(origIdx)];
    } else {
      // Promote insights to index 0 — CSS auto-placement then finds a valid multi-cell block
      newOrder = ["insights", ...adjustedRest];
    }

    batchUpdate({ insightsCardSize: newSize, cardOrder: newOrder });
  }

  function cycleProfileSize() {
    const next: Record<string, ProfileCardSize> = { "1x2": "1x1", "1x1": "2x1", "2x1": "1x2" };
    const newSize = next[profileCardSize];
    const insightsInGrid = cardOrder.includes("insights");
    const newMax = maxCardSlots(newSize, insightsCardSize, insightsInGrid);
    const newOrder = adjustCardOrder(cardOrder, newMax);
    batchUpdate({ profileCardSize: newSize, cardOrder: newOrder });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = slots.map(s => s.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const newIds = arrayMove(ids, oldIndex, newIndex);
    const newOrder = newIds.map(id => id.startsWith("empty_") ? "" : id);
    setCardOrder(newOrder);
  }

  function handleRemove(key: string) {
    setCardOrder(cardOrder.map(k => k === key ? "" : k));
  }

  function handleAddCard(key: string) {
    const idx = cardOrder.findIndex(k => k === "");
    if (idx === -1) return;
    const next = [...cardOrder];
    next[idx] = key;
    if (key === "insights") {
      batchUpdate({ cardOrder: next, insightsCardSize: "1x1" });
    } else {
      setCardOrder(next);
    }
  }

  function handleAutoArrange() {
    batchUpdate(computeAutoArrange(enabledTrackers));
    setArranged(true);
    setTimeout(() => setArranged(false), 1500);
  }

  // Whether a card key is currently placed in the grid
  const inGrid = (key: string) => cardOrder.includes(key);

  // Whether a tracker card is enabled in App Settings
  const isEnabled = (key: string) =>
    key === "profile" || key === "period" || enabledTrackers.includes(key);

  return (
    <div className="h-full flex gap-6 p-6 overflow-hidden">

      {/* ── LEFT — Layout Preview ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3 flex-shrink-0">
          Layout Preview
        </p>

        <div className="flex-1 min-h-0 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-4">

          {/* Grid — square cells via aspect ratio */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slots.map(s => s.id)} strategy={rectSortingStrategy}>
              <div
                className="w-full grid grid-cols-4 gap-2"
                style={{ aspectRatio: "2 / 1", gridAutoFlow: "row dense" }}
              >
                {/* Profile — fixed position, resizable */}
                <div
                  className={`${profileCellClass} rounded-lg flex flex-col items-center justify-center gap-1.5 relative ${
                    editMode
                      ? "bg-white/[0.05] border border-white/25 ring-1 ring-white/10"
                      : "bg-white/[0.05] border border-white/[0.08]"
                  }`}
                >
                  <User size={16} className="text-white/50" />
                  <span className="text-[10px] text-white/30">Profile</span>
                  {/* Lock — top left (not draggable) */}
                  {editMode && (
                    <div className="absolute top-1 left-1 p-0.5 rounded text-white/20">
                      <Lock size={11} />
                    </div>
                  )}
                  {/* Resize cycle — bottom right */}
                  {editMode && (
                    <button
                      onClick={cycleProfileSize}
                      title="Cycle size"
                      className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/40 rounded text-[9px] text-white/50 hover:text-white/90 hover:bg-black/60 transition-colors leading-none"
                    >
                      {profileCardSize}
                    </button>
                  )}
                </div>

                {/* Sortable slots */}
                {slots.map(slot => (
                  <SortableCell
                    key={slot.id}
                    slot={slot}
                    editMode={editMode}
                    onRemove={handleRemove}
                    extraStyle={slot.type === "insights" ? insightsStyle : undefined}
                    insightsCardSize={slot.type === "insights" ? insightsCardSize : undefined}
                    onSelectInsightsSize={slot.type === "insights" ? selectInsightsSize : undefined}
                    insightsSizeAvailability={slot.type === "insights" ? insightsSizeAvailability : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.05] pt-3 flex items-center justify-between flex-shrink-0">
            <button
              onClick={handleAutoArrange}
              className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-white/50 hover:text-white/70 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <Wand2 size={12} />
              {arranged ? "Arranged!" : "Auto-Arrange"}
            </button>
            <button
              onClick={() => { if (!editMode || !hasEmpty) setEditMode(e => !e); }}
              disabled={editMode && hasEmpty}
              title={editMode && hasEmpty ? "Fill all empty slots to save" : undefined}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                editMode && hasEmpty
                  ? "bg-white/[0.03] border-white/[0.05] text-white/20 cursor-not-allowed"
                  : editMode
                    ? "bg-violet-500 border-violet-500 text-white hover:bg-violet-600"
                    : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.07] hover:text-white/70"
              }`}
            >
              {editMode ? "Done" : "Edit"}
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Card Dock ─────────────────────────────────────────────── */}
      <div className="w-56 flex-shrink-0 flex flex-col min-h-0">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3 flex-shrink-0">Cards</p>

        <div className="flex-1 min-h-0 bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col">

          {TRACKER_META.filter(c => c.key !== "profile").map((card, i, arr) => {
            const enabled = isEnabled(card.key);
            const active = inGrid(card.key);
            return (
              <div
                key={card.key}
                className={`flex items-center gap-2.5 px-3 py-2.5 ${i < arr.length - 1 ? "border-b border-white/[0.05]" : ""}`}
              >
                <card.Icon size={14} className={enabled ? "text-violet-400/70" : "text-white/15"} />
                <span className={`flex-1 text-xs ${enabled ? "text-white/55" : "text-white/20"}`}>
                  {card.label}
                </span>
                {card.core ? (
                  <span className="text-[10px] text-white/25 italic">Core</span>
                ) : active ? (
                  <Check size={11} className="text-violet-400/60 flex-shrink-0" />
                ) : (
                  <button
                    onClick={() => handleAddCard(card.key)}
                    disabled={!hasEmpty}
                    className="p-0.5 rounded text-white/30 hover:text-violet-400/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={hasEmpty ? `Add ${card.label}` : "No empty slots"}
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            );
          })}

          <div className="px-3 py-2 text-[10px] text-white/20 uppercase tracking-widest border-t border-white/[0.05]">
            Widgets
          </div>

          {WIDGET_META.map((card, i) => {
            const active = inGrid(card.key);
            return (
              <div
                key={card.key}
                className={`flex items-center gap-2.5 px-3 py-2.5 ${i < WIDGET_META.length - 1 ? "border-b border-white/[0.05]" : ""}`}
              >
                <card.Icon size={14} className="text-violet-400/50" />
                <span className="flex-1 text-xs text-white/55">{card.label}</span>
                {active ? (
                  <Check size={11} className="text-violet-400/60 flex-shrink-0" />
                ) : (
                  <button
                    onClick={() => handleAddCard(card.key)}
                    disabled={!hasEmpty}
                    className="p-0.5 rounded text-white/30 hover:text-violet-400/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={hasEmpty ? `Add ${card.label}` : "No empty slots"}
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            );
          })}

          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}
