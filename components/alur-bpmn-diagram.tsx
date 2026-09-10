"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  EyeIcon,
  EyeSlashIcon,
  InfoIcon,
  XIcon,
  CodeIcon,
  UserIcon,
  UsersIcon,
  CpuIcon,
  GearIcon,
  ArrowCounterClockwiseIcon,
  ArrowSquareOutIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import {
  NODES,
  EDGES,
  PHASES,
  BPMN_TYPE_DETAILS,
  getNodeById,
  getPhaseForCol,
  type BpmnNode,
  type LaneId,
} from "./alur-bpmn-data";

// Layout geometry constants (Draw.io style grid)
const LANE_HEADER_W = 150;
const COL_W = 205;
const TOTAL_COLS = 25;
const CANVAS_W = LANE_HEADER_W + TOTAL_COLS * COL_W;

const PHASE_HEADER_H = 44;
const LANE_PEGAWAI_H = 150;
const LANE_ATASAN_H = 150;
const LANE_SISTEM_H = 260;
const CANVAS_H = PHASE_HEADER_H + LANE_PEGAWAI_H + LANE_ATASAN_H + LANE_SISTEM_H;

// Exact Center Y coordinates for each swimlane baseline
const Y_PEGAWAI = PHASE_HEADER_H + LANE_PEGAWAI_H / 2; // 44 + 75 = 119
const Y_ATASAN = PHASE_HEADER_H + LANE_PEGAWAI_H + LANE_ATASAN_H / 2; // 194 + 75 = 269
const Y_SISTEM_MAIN = PHASE_HEADER_H + LANE_PEGAWAI_H + LANE_ATASAN_H + 70; // 344 + 70 = 414
const Y_SISTEM_SUB = PHASE_HEADER_H + LANE_PEGAWAI_H + LANE_ATASAN_H + 190; // 344 + 190 = 534

interface NodeDim {
  w: number;
  h: number;
}

// Draw.io standard element sizes
function getNodeDimensions(node: BpmnNode): NodeDim {
  switch (node.type) {
    case "start":
    case "end":
    case "intermediate":
    case "link-catch":
    case "link-throw":
      return { w: 42, h: 42 };
    case "gateway":
      return { w: 44, h: 44 };
    case "data":
      return { w: 44, h: 54 };
    case "user":
    case "service":
    default:
      return { w: 154, h: 70 };
  }
}

function getNodePos(node: BpmnNode) {
  const cx = LANE_HEADER_W + (node.col - 0.5) * COL_W;
  let cy = Y_PEGAWAI;
  if (node.lane === "atasan") {
    cy = Y_ATASAN;
  } else if (node.lane === "sistem") {
    cy = node.sub ? Y_SISTEM_SUB : Y_SISTEM_MAIN;
  }
  const dim = getNodeDimensions(node);
  return { cx, cy, ...dim };
}

/**
 * Generates Draw.io-style orthogonal SVG paths with clean rounded corners (radius r).
 */
function getDrawioOrthogonalPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options?: {
    isVerticalDirect?: boolean;
    midXRatio?: number;
    archY?: number;
    isReturnLoop?: boolean;
    radius?: number;
  }
) {
  const r = options?.radius ?? 8;

  // Straight horizontal
  if (Math.abs(y1 - y2) < 2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // Straight vertical
  if (Math.abs(x1 - x2) < 2 || options?.isVerticalDirect) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  // Return / backward rectangular arch (draw.io style loop)
  if (options?.isReturnLoop && options.archY !== undefined) {
    const archY = options.archY;
    const dirY1 = archY > y1 ? 1 : -1;
    const dirY2 = y2 > archY ? 1 : -1;
    const dirX = x2 > x1 ? 1 : -1;

    // Exit x1, turn to archY, travel horizontally, turn to x2, enter y2
    return `M ${x1} ${y1} L ${x1} ${archY - dirY1 * r} Q ${x1} ${archY} ${x1 + dirX * r} ${archY} L ${x2 - dirX * r} ${archY} Q ${x2} ${archY} ${x2} ${archY + dirY2 * r} L ${x2} ${y2}`;
  }

  // Forward S-step with rounded corners (draw.io standard)
  const ratio = options?.midXRatio ?? 0.5;
  const midX = x1 + (x2 - x1) * ratio;
  const dirY = y2 > y1 ? 1 : -1;
  const rad = Math.min(r, Math.abs(midX - x1) - 1, Math.abs(y2 - y1) / 2 - 1);

  if (rad <= 2) {
    return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
  }

  return `M ${x1} ${y1} L ${midX - rad} ${y1} Q ${midX} ${y1} ${midX} ${y1 + dirY * rad} L ${midX} ${y2 - dirY * rad} Q ${midX} ${y2} ${midX + rad} ${y2} L ${x2} ${y2}`;
}

export function AlurBpmnDiagram({
  isEmbedded = false,
  className = "",
}: {
  isEmbedded?: boolean;
  className?: string;
}) {
  const [showRevisi, setShowRevisi] = useState(true);
  const [selectedNode, setSelectedNode] = useState<BpmnNode | null>(null);
  const [activeLane, setActiveLane] = useState<LaneId | "all">("all");
  const [activePhase, setActivePhase] = useState<number | "all">("all");
  const [showLegend, setShowLegend] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Map of node positions
  const nodePosMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getNodePos>>();
    for (const node of NODES) {
      map.set(node.id, getNodePos(node));
    }
    return map;
  }, []);

  // Filter edges based on revisi toggle
  const visibleEdges = useMemo(() => {
    if (showRevisi) return EDGES;
    return EDGES.filter((e) => e.hideWith !== "revisi");
  }, [showRevisi]);

  // Filter nodes visibility based on revisi toggle
  const isNodeVisible = useCallback(
    (node: BpmnNode) => {
      if (!showRevisi && node.flag === "revisi") return false;
      return true;
    },
    [showRevisi]
  );

  // Jump to specific phase
  const scrollToPhase = (phaseIndex: number) => {
    setActivePhase(phaseIndex);
    if (!containerRef.current) return;
    const phase = PHASES[phaseIndex];
    if (!phase) return;
    const targetX = LANE_HEADER_W + (phase.from - 1) * COL_W * zoom;
    containerRef.current.scrollTo({ left: Math.max(0, targetX - 40), behavior: "smooth" });
  };

  // Drag to pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || (e.target as HTMLElement).closest(".interactive-bpmn-node")) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    containerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Zoom handlers
  const zoomIn = () => setZoom((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(0.55, Number((z - 0.15).toFixed(2))));
  const resetZoom = () => {
    setZoom(1);
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl border border-outline dark:border-white/10 bg-white dark:bg-[#15120D] shadow-sm overflow-hidden ${className}`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline dark:border-white/10 px-4 py-3 bg-surface-soft/60 dark:bg-white/3 backdrop-blur-sm">
        {/* Left: Phase Jump Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-ink-muted dark:text-[#A89F91] mr-1 hidden sm:inline">
            Fase:
          </span>
          <button
            type="button"
            onClick={() => {
              setActivePhase("all");
              if (containerRef.current) containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activePhase === "all"
                ? "bg-primary-strong text-white"
                : "bg-white dark:bg-white/5 border border-outline dark:border-white/10 text-ink dark:text-[#E6E0D6] hover:bg-surface-muted"
            }`}
          >
            Semua Fase
          </button>
          {PHASES.filter((p, i, arr) => arr.findIndex((q) => q.label === p.label) === i).map((p) => {
            const idx = PHASES.findIndex((q) => q.label === p.label);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => scrollToPhase(idx)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  activePhase === idx
                    ? "bg-primary-strong text-white"
                    : "bg-white dark:bg-white/5 border border-outline dark:border-white/10 text-ink dark:text-[#E6E0D6] hover:bg-surface-muted"
                }`}
              >
                {p.label.split("·")[0]?.trim()}
              </button>
            );
          })}
        </div>

        {/* Right: Controls & Toggles */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Revision toggle */}
          <button
            type="button"
            onClick={() => setShowRevisi((v) => !v)}
            title={showRevisi ? "Sembunyikan alur revisi / tolak" : "Tampilkan alur revisi / tolak"}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              showRevisi
                ? "bg-[#C8102E]/10 border-[#C8102E]/30 text-[#A80D26] dark:text-[#FF7A86]"
                : "bg-white dark:bg-white/5 border-outline dark:border-white/10 text-ink-muted hover:bg-surface-muted"
            }`}
          >
            {showRevisi ? <EyeIcon size={14} weight="bold" /> : <EyeSlashIcon size={14} weight="bold" />}
            <span>Alur Revisi {showRevisi ? "Aktif" : "Mati"}</span>
          </button>

          {/* Lane Filter dropdown */}
          <div className="hidden md:flex items-center gap-1 text-xs">
            <span className="text-ink-muted dark:text-[#A89F91]">Lane:</span>
            <select
              value={activeLane}
              onChange={(e) => setActiveLane(e.target.value as LaneId | "all")}
              className="px-2 py-1 rounded-lg border border-outline dark:border-white/10 bg-white dark:bg-[#1A1612] text-ink dark:text-white text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-strong"
            >
              <option value="all">Semua Lane</option>
              <option value="pegawai">Pegawai</option>
              <option value="atasan">Atasan</option>
              <option value="sistem">Sistem (Otomatis)</option>
            </select>
          </div>

          {/* Legend toggle */}
          <button
            type="button"
            onClick={() => setShowLegend((v) => !v)}
            className={`p-1.5 rounded-lg border border-outline dark:border-white/10 text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors cursor-pointer ${
              showLegend ? "bg-surface-muted text-primary-strong border-primary-strong/40" : "bg-white dark:bg-white/5"
            }`}
            title="Buka Legenda Simbol BPMN 2.0"
          >
            <InfoIcon size={16} weight="bold" />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-outline dark:border-white/10 bg-white dark:bg-white/5 p-0.5">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= 0.55}
              className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-muted disabled:opacity-30 cursor-pointer"
              title="Perkecil (Zoom Out)"
            >
              <MagnifyingGlassMinusIcon size={15} weight="bold" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="px-1.5 py-0.5 text-[11px] font-mono font-bold text-ink hover:bg-surface-muted rounded cursor-pointer"
              title="Reset Zoom (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= 1.5}
              className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-muted disabled:opacity-30 cursor-pointer"
              title="Perbesar (Zoom In)"
            >
              <MagnifyingGlassPlusIcon size={15} weight="bold" />
            </button>
          </div>

          {/* Full-page button if embedded */}
          {isEmbedded && (
            <Link
              href="/alur"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors cursor-pointer"
              title="Buka di Halaman Penuh"
            >
              <ArrowSquareOutIcon size={14} weight="bold" />
              <span className="hidden sm:inline">Layar Penuh</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Diagram Area with scroll / drag */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative flex-1 overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing select-none scrollbar-thin scrollbar-thumb-outline dark:scrollbar-thumb-white/20 bg-[#FAF8F5] dark:bg-[#120F0C]"
        style={{ minHeight: isEmbedded ? "520px" : "620px" }}
      >
        <div
          style={{
            width: CANVAS_W * zoom,
            height: CANVAS_H * zoom,
            transformOrigin: "top left",
            transform: `scale(${zoom})`,
          }}
          className="relative transition-transform duration-75"
        >
          {/* 1. Header Row: Phases (Fase 1, 2) */}
          <div
            className="absolute top-0 left-0 right-0 flex border-b border-outline dark:border-white/10 bg-white dark:bg-[#181410] z-10"
            style={{ height: PHASE_HEADER_H }}
          >
            <div
              className="border-r border-outline dark:border-white/10 flex items-center justify-center font-bold text-xs text-ink-muted dark:text-[#A89F91] tracking-wider uppercase shrink-0"
              style={{ width: LANE_HEADER_W }}
            >
              BPMN 2.0
            </div>
            <div className="flex-1 flex">
              {PHASES.map((phase, idx) => {
                const width = (phase.to - phase.from + 1) * COL_W;
                return (
                  <div
                    key={`phase-${idx}`}
                    className="border-r border-outline dark:border-white/10 px-4 flex items-center justify-between text-xs font-bold text-ink dark:text-[#E8E2D5] bg-surface-soft/40 dark:bg-white/2"
                    style={{ width }}
                  >
                    <span>{phase.label}</span>
                    <span className="text-[10px] font-mono text-outline-strong font-normal">
                      Kolom {phase.from} – {phase.to}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Swimlane Headers & Background Tracks (Draw.io Pool style) */}
          {/* Lane 1: Pegawai */}
          <div
            className={`absolute left-0 right-0 flex border-b border-outline dark:border-white/10 transition-opacity duration-200 ${
              activeLane !== "all" && activeLane !== "pegawai" ? "opacity-35" : "opacity-100"
            }`}
            style={{ top: PHASE_HEADER_H, height: LANE_PEGAWAI_H }}
          >
            <div
              className="border-r-2 border-primary-strong/80 bg-white dark:bg-[#1A1612] p-3 flex flex-col justify-between shrink-0 shadow-xs"
              style={{ width: LANE_HEADER_W }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
                  <UserIcon size={16} weight="bold" className="text-primary-strong" />
                  <span>Pegawai</span>
                </div>
                <p className="text-[11px] text-ink-muted dark:text-[#A89F91] leading-tight">
                  Pegawai yang dinilai
                </p>
              </div>
              <span className="text-[10px] font-mono text-outline-strong">Lane: Pegawai</span>
            </div>
            <div className="flex-1 bg-white/50 dark:bg-[#14110E]" />
          </div>

          {/* Lane 2: Atasan */}
          <div
            className={`absolute left-0 right-0 flex border-b border-outline dark:border-white/10 transition-opacity duration-200 ${
              activeLane !== "all" && activeLane !== "atasan" ? "opacity-35" : "opacity-100"
            }`}
            style={{ top: PHASE_HEADER_H + LANE_PEGAWAI_H, height: LANE_ATASAN_H }}
          >
            <div
              className="border-r-2 border-[#12A9B0] bg-white dark:bg-[#1A1612] p-3 flex flex-col justify-between shrink-0 shadow-xs"
              style={{ width: LANE_HEADER_W }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
                  <UsersIcon size={16} weight="bold" className="text-[#12A9B0]" />
                  <span>Atasan</span>
                </div>
                <p className="text-[11px] text-ink-muted dark:text-[#A89F91] leading-tight">
                  Pejabat penilai langsung
                </p>
              </div>
              <span className="text-[10px] font-mono text-outline-strong">Lane: Atasan</span>
            </div>
            <div className="flex-1 bg-surface-soft/30 dark:bg-[#120F0C]" />
          </div>

          {/* Lane 3: Sistem */}
          <div
            className={`absolute left-0 right-0 flex transition-opacity duration-200 ${
              activeLane !== "all" && activeLane !== "sistem" ? "opacity-35" : "opacity-100"
            }`}
            style={{ top: PHASE_HEADER_H + LANE_PEGAWAI_H + LANE_ATASAN_H, height: LANE_SISTEM_H }}
          >
            <div
              className="border-r-2 border-[#6B4FC7] bg-white dark:bg-[#1A1612] p-3 flex flex-col justify-between shrink-0 shadow-xs"
              style={{ width: LANE_HEADER_W }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
                  <CpuIcon size={16} weight="bold" className="text-[#6B4FC7]" />
                  <span>Sistem</span>
                </div>
                <p className="text-[11px] text-ink-muted dark:text-[#A89F91] leading-tight">
                  Engine aplikasi &amp; database
                </p>
              </div>
              <span className="text-[10px] font-mono text-outline-strong">Lane: Sistem</span>
            </div>
            <div className="flex-1 bg-white/30 dark:bg-[#100D0A] flex flex-col">
              <div className="h-1/2 border-b border-dashed border-outline/50 dark:border-white/5" />
              <div className="h-1/2" />
            </div>
          </div>

          {/* 3. Subtle Column Grid Lines (Draw.io canvas guide) */}
          <div
            className="absolute inset-0 pointer-events-none flex"
            style={{ left: LANE_HEADER_W, top: PHASE_HEADER_H }}
          >
            {Array.from({ length: TOTAL_COLS }).map((_, i) => (
              <div
                key={i}
                className="border-r border-outline/30 dark:border-white/5 h-full shrink-0"
                style={{ width: COL_W }}
              />
            ))}
          </div>

          {/* 4. Draw.io-style SVG Connector Lines (Orthogonal with 8px rounded corners) */}
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ overflow: "visible" }}
          >
            <defs>
              {/* Draw.io standard sequence flow closed filled arrowhead */}
              <marker
                id="drawio-seq-arrow"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#475569" className="dark:fill-[#94A3B8]" />
              </marker>

              {/* Draw.io standard return/revisi flow closed filled arrowhead */}
              <marker
                id="drawio-return-arrow"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#DC2626" />
              </marker>

              {/* Draw.io standard association open arrowhead */}
              <marker
                id="drawio-assoc-arrow"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5" fill="none" stroke="#64748B" strokeWidth="1.5" />
              </marker>
            </defs>

            {visibleEdges.map((edge) => {
              const fromNode = getNodeById(edge.from);
              const toNode = getNodeById(edge.to);
              if (!fromNode || !toNode) return null;
              if (!isNodeVisible(fromNode) || !isNodeVisible(toNode)) return null;

              const p1 = nodePosMap.get(fromNode.id);
              const p2 = nodePosMap.get(toNode.id);
              if (!p1 || !p2) return null;

              const isReturn = edge.kind === "return" || edge.hideWith === "revisi";
              const isAssoc = edge.kind === "assoc";
              const isHovered = hoveredNodeId === edge.from || hoveredNodeId === edge.to;

              // Calculate start and end connection ports
              let x1 = p1.cx + p1.w / 2;
              let y1 = p1.cy;
              let x2 = p2.cx - p2.w / 2;
              let y2 = p2.cy;
              let pathD = "";

              if (isReturn) {
                // Return / Revision loops with Draw.io rectangular arch routing
                if (edge.id === "e10") {
                  // t_tolak (col 7 atasan) -> s_draft (col 4 sistem)
                  x1 = p1.cx - p1.w / 2;
                  y1 = p1.cy;
                  x2 = p2.cx;
                  y2 = p2.cy - p2.h / 2;
                  const archY = 175; // corridor between pegawai & atasan
                  pathD = `M ${x1} ${y1} L ${x1 - 30} ${y1} Q ${x1 - 38} ${y1} ${x1 - 38} ${archY + 8} L ${x1 - 38} ${archY} L ${x2 + 8} ${archY} Q ${x2} ${archY} ${x2} ${archY + 8} L ${x2} ${y2}`;
                } else if (edge.id === "e17") {
                  // t_revisi (col 12 atasan) -> t_isi (col 8 pegawai)
                  x1 = p1.cx;
                  y1 = p1.cy - p1.h / 2;
                  x2 = p2.cx + p2.w / 2;
                  y2 = p2.cy;
                  const archY = 62; // corridor above pegawai tasks
                  pathD = `M ${x1} ${y1} L ${x1} ${archY + 8} Q ${x1} ${archY} ${x1 - 8} ${archY} L ${x2 + 25} ${archY} Q ${x2 + 15} ${archY} ${x2 + 15} ${archY + 8} L ${x2 + 15} ${y2} L ${x2} ${y2}`;
                } else if (edge.id === "e29") {
                  // t_revisi_reviu (col 22 atasan) -> t_centang (col 16 pegawai)
                  x1 = p1.cx;
                  y1 = p1.cy - p1.h / 2;
                  x2 = p2.cx + p2.w / 2;
                  y2 = p2.cy;
                  const archY = 62;
                  pathD = `M ${x1} ${y1} L ${x1} ${archY + 8} Q ${x1} ${archY} ${x1 - 8} ${archY} L ${x2 + 25} ${archY} Q ${x2 + 15} ${archY} ${x2 + 15} ${archY + 8} L ${x2 + 15} ${y2} L ${x2} ${y2}`;
                } else {
                  x1 = p1.cx - p1.w / 2;
                  x2 = p2.cx + p2.w / 2;
                  pathD = getDrawioOrthogonalPath(x1, y1, x2, y2, { isReturnLoop: true, archY: y1 - 40 });
                }
              } else if (edge.id === "e05") {
                // Vertical up: link_catch -> s_draft
                x1 = p1.cx;
                y1 = p1.cy - p1.h / 2;
                x2 = p2.cx;
                y2 = p2.cy + p2.h / 2;
                pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
              } else if (edge.id === "e20" || edge.id === "e33") {
                // Vertical down: s_selesai -> d_hasil OR g_lanjut -> t_salin
                x1 = p1.cx;
                y1 = p1.cy + p1.h / 2;
                x2 = p2.cx;
                y2 = p2.cy - p2.h / 2;
                pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
              } else if (fromNode.type === "gateway" && p1.cy !== p2.cy) {
                // Downward branch from gateway bottom port
                x1 = p1.cx;
                y1 = p1.cy + p1.h / 2;
                x2 = p2.cx - p2.w / 2;
                y2 = p2.cy;
                const r = 8;
                pathD = `M ${x1} ${y1} L ${x1} ${y2 - r} Q ${x1} ${y2} ${x1 + r} ${y2} L ${x2} ${y2}`;
              } else {
                // Standard orthogonal step with 8px rounded corners
                pathD = getDrawioOrthogonalPath(x1, y1, x2, y2);
              }

              // Calculate label coordinate
              const labelX = (x1 + x2) / 2 + (edge.labelDx ?? 0);
              const labelY = (y1 + y2) / 2 + (edge.labelDy ?? -9);

              return (
                <g key={edge.id} className="transition-all duration-150">
                  {/* Invisible thicker hit-box path for easier hover */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                    className="pointer-events-auto cursor-pointer"
                  />

                  {/* Draw.io visible path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isReturn
                        ? "#DC2626"
                        : isHovered
                        ? "#DC2626"
                        : isAssoc
                        ? "#94A3B8"
                        : "#475569"
                    }
                    strokeWidth={isHovered ? "2.5" : isReturn ? "2" : "1.5"}
                    strokeDasharray={isReturn ? "6 4" : isAssoc ? "3 3" : undefined}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    markerEnd={
                      isReturn
                        ? "url(#drawio-return-arrow)"
                        : isAssoc
                        ? "url(#drawio-assoc-arrow)"
                        : "url(#drawio-seq-arrow)"
                    }
                    className="transition-all duration-150 dark:stroke-white/40"
                    style={{
                      stroke: isReturn ? "#DC2626" : undefined,
                    }}
                  />

                  {/* Draw.io style edge label pill */}
                  {edge.label && (
                    <g
                      transform={`translate(${labelX}, ${labelY})`}
                      className="pointer-events-auto"
                    >
                      <rect
                        x="-4"
                        y="-9"
                        width={edge.label.length * 6.5 + 8}
                        height="17"
                        rx="4"
                        fill="white"
                        className="dark:fill-[#1E1914] stroke-slate-300 dark:stroke-white/20"
                        strokeWidth="1"
                      />
                      <text
                        x={edge.label.length * 3.25}
                        y="3"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="600"
                        fill={isReturn ? "#DC2626" : "#334155"}
                        className="dark:fill-[#E0D8C8] select-none"
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* 5. Nodes Layer (Draw.io Standard Elements) */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {NODES.map((node) => {
              if (!isNodeVisible(node)) return null;
              const pos = nodePosMap.get(node.id);
              if (!pos) return null;

              const isLaneDimmed = activeLane !== "all" && activeLane !== node.lane;
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;

              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: pos.cx - pos.w / 2,
                    top: pos.cy - pos.h / 2,
                    width: pos.w,
                    height: pos.h,
                  }}
                  className={`pointer-events-auto interactive-bpmn-node transition-all duration-150 cursor-pointer ${
                    isLaneDimmed ? "opacity-35" : "opacity-100"
                  }`}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => setSelectedNode(node)}
                >
                  <DrawioBpmnNodeRenderer
                    node={node}
                    isSelected={isSelected}
                    isHovered={isHovered}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Node Inspector Drawer / Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-outline dark:border-white/10 bg-white dark:bg-[#1A1612] p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${BPMN_TYPE_DETAILS[selectedNode.type].color}15`,
                      color: BPMN_TYPE_DETAILS[selectedNode.type].color,
                    }}
                  >
                    {BPMN_TYPE_DETAILS[selectedNode.type].name}
                  </span>
                  <span className="text-xs font-mono text-outline-strong">
                    Lane: {selectedNode.lane.toUpperCase()} · Kolom {selectedNode.col}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink dark:text-white">
                  {selectedNode.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <XIcon size={18} weight="bold" />
              </button>
            </div>

            <div className="text-sm text-ink-muted dark:text-[#C9C2B6] leading-relaxed">
              {selectedNode.desc}
            </div>

            {/* BPMN Standard Context */}
            <div className="p-3 rounded-xl border border-outline dark:border-white/10 bg-surface-soft/60 dark:bg-white/3 space-y-1.5 text-xs">
              <div className="font-semibold text-ink dark:text-white flex items-center gap-1.5">
                <InfoIcon size={14} weight="bold" className="text-primary-strong" />
                <span>Standar BPMN 2.0 (Draw.io / ISO):</span>
              </div>
              <p className="text-ink-muted dark:text-[#A89F91]">
                {BPMN_TYPE_DETAILS[selectedNode.type].standard} —{" "}
                {BPMN_TYPE_DETAILS[selectedNode.type].description}
              </p>
            </div>

            {/* Code & Database details if present */}
            <div className="space-y-2 text-xs">
              {selectedNode.codeRef && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted dark:bg-white/5 border border-outline/60 dark:border-white/5 font-mono text-[11px] text-ink dark:text-[#E8E2D5] overflow-x-auto">
                  <CodeIcon size={16} className="shrink-0 text-primary-strong" />
                  <span className="truncate">{selectedNode.codeRef}</span>
                </div>
              )}

              {selectedNode.statusChip && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-outline dark:border-white/10 bg-white dark:bg-white/2">
                  <span className="text-ink-muted">Status Entitas Database:</span>
                  <span className="font-mono font-bold text-primary-strong px-2 py-0.5 rounded bg-primary-soft dark:bg-primary-strong/10">
                    {selectedNode.statusChip}
                  </span>
                </div>
              )}
            </div>

            {/* Phase info */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-outline dark:border-white/10 text-outline-strong">
              <span>{getPhaseForCol(selectedNode.col).label}</span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="px-4 py-1.5 rounded-full bg-primary-strong text-white font-semibold hover:bg-[#A80D26] transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BPMN 2.0 Legend Drawer (Draw.io Notation Guide) */}
      {showLegend && (
        <div className="border-t border-outline dark:border-white/10 bg-surface-soft/90 dark:bg-[#181410]/95 p-4 backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-150 text-xs">
          <div className="max-w-6xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-ink dark:text-white">
                <ShieldCheckIcon size={16} weight="bold" className="text-primary-strong" />
                <span>Panduan Simbol Notasi BPMN 2.0 (Standar Draw.io / ISO 19510)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLegend(false)}
                className="text-ink-muted hover:text-ink cursor-pointer text-xs"
              >
                Tutup Legenda
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Object.entries(BPMN_TYPE_DETAILS).map(([key, item]) => (
                <div
                  key={key}
                  className="p-2.5 rounded-xl border border-outline dark:border-white/10 bg-white dark:bg-[#1E1914] space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-ink dark:text-white text-[11px]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <p className="text-[10px] text-ink-muted dark:text-[#A89F91] line-clamp-2 leading-tight">
                    {item.description}
                  </p>
                </div>
              ))}

              <div className="p-2.5 rounded-xl border border-outline dark:border-white/10 bg-white dark:bg-[#1E1914] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-ink dark:text-white text-[11px]">
                  <span className="w-4 h-0.5 bg-slate-600 dark:bg-white/60 shrink-0" />
                  <span>Sequence Flow</span>
                </div>
                <p className="text-[10px] text-ink-muted dark:text-[#A89F91] leading-tight">
                  Alur urutan eksekusi (panah solid terisi)
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-outline dark:border-white/10 bg-white dark:bg-[#1E1914] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#DC2626] text-[11px]">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-[#DC2626] shrink-0" />
                  <span>Return / Revisi</span>
                </div>
                <p className="text-[10px] text-ink-muted dark:text-[#A89F91] leading-tight">
                  Alur pengembalian evaluasi / penolakan
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Draw.io-Grade BPMN 2.0 Standard Node Renderers ─────────────────

function DrawioBpmnNodeRenderer({
  node,
  isSelected,
  isHovered,
}: {
  node: BpmnNode;
  isSelected: boolean;
  isHovered: boolean;
}) {
  // 1. Draw.io Start Event: Thin single green circle (42px) with text label underneath
  if (node.type === "start") {
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center transition-transform ${
          isHovered || isSelected ? "scale-110" : ""
        }`}
        title={`${node.title}: ${node.desc}`}
      >
        <svg width="42" height="42" viewBox="0 0 42 42" className="overflow-visible drop-shadow-2xs">
          <circle
            cx="21"
            cy="21"
            r="18"
            fill="#F0FDF4"
            className="dark:fill-[#0F291E]"
            stroke="#16A34A"
            strokeWidth={isSelected ? "3" : "2"}
          />
        </svg>
        <span className="absolute -bottom-5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap select-none">
          {node.title}
        </span>
      </div>
    );
  }

  // 2. Draw.io End Event: Thick solid red border circle (42px) with text label underneath
  if (node.type === "end") {
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center transition-transform ${
          isHovered || isSelected ? "scale-110" : ""
        }`}
        title={`${node.title}: ${node.desc}`}
      >
        <svg width="42" height="42" viewBox="0 0 42 42" className="overflow-visible drop-shadow-2xs">
          <circle
            cx="21"
            cy="21"
            r="17"
            fill="#FEF2F2"
            className="dark:fill-[#2B1114]"
            stroke="#DC2626"
            strokeWidth={isSelected ? "5" : "4"}
          />
        </svg>
        <span className="absolute -bottom-5 text-[10px] font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap select-none">
          {node.title}
        </span>
      </div>
    );
  }

  // 3. Draw.io Intermediate Event: Double concentric circle (42px) with status chip underneath
  if (node.type === "intermediate") {
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center transition-transform ${
          isHovered || isSelected ? "scale-110" : ""
        }`}
        title={`Status: ${node.statusChip} — ${node.desc}`}
      >
        <svg width="42" height="42" viewBox="0 0 42 42" className="overflow-visible drop-shadow-2xs">
          <circle
            cx="21"
            cy="21"
            r="19"
            fill="#EFF6FF"
            className="dark:fill-[#131F37]"
            stroke="#2563EB"
            strokeWidth="1.5"
          />
          <circle
            cx="21"
            cy="21"
            r="15"
            fill="#FFFFFF"
            className="dark:fill-[#18233C]"
            stroke="#2563EB"
            strokeWidth="1.5"
          />
        </svg>
        {node.statusChip && (
          <span className="absolute -bottom-5 text-[8.5px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/60 whitespace-nowrap select-none shadow-2xs">
            {node.statusChip}
          </span>
        )}
      </div>
    );
  }

  // 4. Draw.io Link Catch / Throw Event: Double concentric circle with directional arrow
  if (node.type === "link-catch" || node.type === "link-throw") {
    const isCatch = node.type === "link-catch";
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center transition-transform ${
          isHovered || isSelected ? "scale-110" : ""
        }`}
        title={`${node.title}: ${node.desc}`}
      >
        <svg width="42" height="42" viewBox="0 0 42 42" className="overflow-visible drop-shadow-2xs">
          <circle
            cx="21"
            cy="21"
            r="19"
            fill="#F0FDFA"
            className="dark:fill-[#0C2524]"
            stroke="#0D9488"
            strokeWidth="1.5"
          />
          <circle
            cx="21"
            cy="21"
            r="15"
            fill="#FFFFFF"
            className="dark:fill-[#122E2D]"
            stroke="#0D9488"
            strokeWidth="1.5"
          />
          {isCatch ? (
            // Link Catch: Unfilled arrow pointing right
            <polygon
              points="18,14 27,21 18,28 18,24 14,24 14,18 18,18"
              fill="none"
              stroke="#0D9488"
              strokeWidth="1.5"
            />
          ) : (
            // Link Throw: Solid filled arrow pointing right
            <polygon
              points="18,14 27,21 18,28 18,24 14,24 14,18 18,18"
              fill="#0D9488"
            />
          )}
        </svg>
        <span className="absolute -bottom-5 text-[8.5px] font-bold text-teal-700 dark:text-teal-300 whitespace-nowrap select-none">
          {isCatch ? "Link Catch" : "Link Throw"}
        </span>
      </div>
    );
  }

  // 5. Draw.io Exclusive Gateway (XOR): Diamond shape with "X", label positioned outside
  if (node.type === "gateway") {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center transition-transform ${
          isHovered || isSelected ? "scale-110" : ""
        }`}
        title={`${node.title}: ${node.desc}`}
      >
        {/* Draw.io Diamond SVG */}
        <svg width="44" height="44" viewBox="0 0 44 44" className="overflow-visible drop-shadow-2xs">
          <polygon
            points="22,2 42,22 22,42 2,22"
            fill="#FEFCE8"
            className="dark:fill-[#2B230D]"
            stroke="#CA8A04"
            strokeWidth={isSelected ? "2.5" : "2"}
          />
          {/* Draw.io diagonal X lines */}
          <line
            x1="15"
            y1="15"
            x2="29"
            y2="29"
            stroke="#854D0E"
            className="dark:stroke-[#FACC15]"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="29"
            y1="15"
            x2="15"
            y2="29"
            stroke="#854D0E"
            className="dark:stroke-[#FACC15]"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Question Title placed outside diamond (Draw.io standard) */}
        <span className="absolute -bottom-6 text-[9.5px] font-semibold text-ink-muted dark:text-[#D4CEBF] text-center whitespace-nowrap select-none bg-white/90 dark:bg-[#1E1914]/90 px-1.5 py-0.5 rounded border border-outline/50 dark:border-white/10 shadow-2xs">
          {node.title}
        </span>
      </div>
    );
  }

  // 6. Draw.io Data Object: Document with folded dog-ear corner
  if (node.type === "data") {
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center transition-transform ${
          isHovered || isSelected ? "scale-105" : ""
        }`}
        title={`${node.title}: ${node.desc}`}
      >
        <svg width="44" height="54" viewBox="0 0 44 54" className="overflow-visible drop-shadow-2xs">
          <path
            d="M 4,2 L 30,2 L 42,14 L 42,52 L 4,52 Z"
            fill="#F8FAFC"
            className="dark:fill-[#1A1E24]"
            stroke="#64748B"
            strokeWidth={isSelected ? "2.5" : "1.5"}
          />
          <path
            d="M 30,2 L 30,14 L 42,14"
            fill="#E2E8F0"
            className="dark:fill-[#2D343F]"
            stroke="#64748B"
            strokeWidth="1.5"
          />
          {/* Document text lines */}
          <line x1="10" y1="22" x2="34" y2="22" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10" y1="29" x2="34" y2="29" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10" y1="36" x2="26" y2="36" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="absolute -bottom-5 text-[8.5px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap select-none">
          {node.title}
        </span>
      </div>
    );
  }

  // 7. Draw.io Task (User Task & Service Task): Standard rounded box with activity marker in top-left
  const isService = node.type === "service";
  const isRevisi = node.flag === "revisi";

  return (
    <div
      className={`relative w-[154px] h-[70px] rounded-lg bg-white dark:bg-[#1C1814] border shadow-xs p-2 flex flex-col justify-between transition-all select-none ${
        isSelected
          ? "border-primary-strong ring-3 ring-primary-strong/20 shadow-md"
          : isHovered
          ? "border-ink-muted/80 shadow-md translate-y-[-1px]"
          : isRevisi
          ? "border-rose-400 dark:border-rose-500/60 hover:border-rose-500"
          : isService
          ? "border-purple-300 dark:border-purple-500/40 hover:border-purple-400"
          : "border-slate-300 dark:border-white/15 hover:border-primary-strong/60"
      }`}
      title={`${node.title}: ${node.desc}`}
    >
      {/* Draw.io standard top-left BPMN activity marker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {isService ? (
            <GearIcon size={14} weight="bold" className="text-purple-600 dark:text-purple-400" />
          ) : isRevisi ? (
            <ArrowCounterClockwiseIcon size={14} weight="bold" className="text-rose-600 dark:text-rose-400" />
          ) : (
            <UserIcon size={14} weight="bold" className="text-slate-600 dark:text-slate-300" />
          )}
          <span
            className={`text-[8.5px] font-bold uppercase tracking-wider ${
              isRevisi
                ? "text-rose-600 dark:text-rose-400"
                : isService
                ? "text-purple-600 dark:text-purple-400"
                : "text-slate-500 dark:text-[#A89F91]"
            }`}
          >
            {isService ? "Service Task" : isRevisi ? "Revisi" : "User Task"}
          </span>
        </div>

        {node.flag === "simplified" && (
          <span className="text-[7.5px] font-mono px-1 rounded bg-muted dark:bg-white/10 text-outline-strong">
            Simp
          </span>
        )}
      </div>

      {/* Task title (centered in Draw.io style) */}
      <div className="text-[11px] font-bold text-ink dark:text-white leading-tight line-clamp-2 text-center my-auto">
        {node.title}
      </div>

      {/* Footer codeRef indicator */}
      <div className="flex items-center justify-between text-[8px] font-mono text-outline-strong pt-0.5 border-t border-slate-100 dark:border-white/5">
        <span className="truncate max-w-[90px]">
          {node.codeRef ? node.codeRef.split("·")[0]?.trim() : node.lane}
        </span>
        <span className="text-primary-strong font-semibold">Detail →</span>
      </div>
    </div>
  );
}
