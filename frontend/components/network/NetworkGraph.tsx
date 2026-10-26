"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Filter,
  Bot,
  User,
  Phone,
  Radio,
  Share2,
  Sparkles,
  ExternalLink,
  Heart,
  MessageSquare,
} from "lucide-react";
import { NetworkNode, NetworkEdge, NetworkGraphData } from "@/types";

interface SimNode extends NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isFixed?: boolean;
}

interface NetworkGraphProps {
  data: NetworkGraphData;
  selectedNodeId?: string | null;
  onSelectNode?: (node: NetworkNode) => void;
  className?: string;
}

export function NetworkGraph({
  data,
  selectedNodeId,
  onSelectNode,
  className = "",
}: NetworkGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeFilter, setActiveFilter] = useState<"all" | "threat" | "organic" | "lures">("all");
  const [isSimulating, setIsSimulating] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const draggedNodeIdRef = useRef<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const WIDTH = 840;
  const HEIGHT = 580;
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = HEIGHT / 2 + 15;

  // 1. Filter Nodes & Edges
  const filteredNodes = useMemo(() => {
    if (activeFilter === "threat") {
      return data.nodes.filter(
        (n) => n.type === "target" || n.type === "buzzer" || n.type === "bot" || (n.riskScore || 0) >= 40
      );
    }
    if (activeFilter === "organic") {
      return data.nodes.filter((n) => n.type === "target" || n.type === "organic");
    }
    if (activeFilter === "lures") {
      return data.nodes.filter(
        (n) => n.type === "target" || n.type === "threat_lure" || n.sublabel?.includes("WA") || n.sublabel?.includes("Lure")
      );
    }
    return data.nodes;
  }, [data.nodes, activeFilter]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return data.edges.filter(
      (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
  }, [data.edges, filteredNodeIds]);

  // 2. Initialize simulation nodes with radial placement
  const initializeNodes = useCallback(() => {
    const targetNode = filteredNodes.find((n) => n.type === "target") || filteredNodes[0];
    const middleNodes = filteredNodes.filter((n) => n.id !== targetNode?.id && n.type !== "threat_lure");
    const outerNodes = filteredNodes.filter((n) => n.type === "threat_lure");

    const newSimNodes: SimNode[] = [];

    // Target in Center
    if (targetNode) {
      newSimNodes.push({
        ...targetNode,
        x: CENTER_X,
        y: CENTER_Y,
        vx: 0,
        vy: 0,
        radius: 28,
        isFixed: true,
      });
    }

    // Commenters in Orbit 1
    const middleRadius = 155;
    middleNodes.forEach((node, idx) => {
      const angle = (idx / Math.max(1, middleNodes.length)) * 2 * Math.PI - Math.PI / 2;
      const r = node.type === "buzzer" || node.type === "bot" ? 21 : 18;
      newSimNodes.push({
        ...node,
        x: CENTER_X + middleRadius * Math.cos(angle) + (Math.random() - 0.5) * 15,
        y: CENTER_Y + middleRadius * Math.sin(angle) + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: r,
      });
    });

    // Lures in Orbit 2
    const outerRadius = 220;
    outerNodes.forEach((node, idx) => {
      const angle = (idx / Math.max(1, outerNodes.length)) * 2 * Math.PI;
      newSimNodes.push({
        ...node,
        x: CENTER_X + outerRadius * Math.cos(angle) + (Math.random() - 0.5) * 15,
        y: CENTER_Y + outerRadius * Math.sin(angle) + (Math.random() - 0.5) * 15,
        vx: 0,
        vy: 0,
        radius: 17,
      });
    });

    nodesRef.current = newSimNodes;
  }, [filteredNodes, CENTER_X, CENTER_Y]);

  // Re-initialize when filtered nodes change
  useEffect(() => {
    initializeNodes();
  }, [initializeNodes]);

  // 3. Force-Directed Physics Simulation Loop (60 FPS with requestAnimationFrame)
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isSimulating) return;

    let isMounted = true;

    const runPhysicsTick = () => {
      if (!isMounted) return;
      timeRef.current += 0.02;
      const t = timeRef.current;
      const nodes = nodesRef.current;
      const nLen = nodes.length;

      // Force 1: Node-Node Repulsion (Coulomb)
      for (let i = 0; i < nLen; i++) {
        for (let j = i + 1; j < nLen; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          const minDist = n1.radius + n2.radius + 32;

          if (dist < minDist) {
            const force = ((minDist - dist) / dist) * 0.18;
            const fx = dx * force;
            const fy = dy * force;
            if (!n1.isFixed && draggedNodeIdRef.current !== n1.id) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (!n2.isFixed && draggedNodeIdRef.current !== n2.id) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }
      }

      // Force 2: Edge Spring Attraction (Hooke)
      filteredEdges.forEach((edge) => {
        const n1 = nodes.find((n) => n.id === edge.source);
        const n2 = nodes.find((n) => n.id === edge.target);
        if (!n1 || !n2) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetLen = edge.type === "lure" ? 95 : 180;
        const displacement = dist - targetLen;
        const springForce = displacement * 0.0018;

        const fx = (dx / dist) * springForce;
        const fy = (dy / dist) * springForce;

        if (!n1.isFixed && draggedNodeIdRef.current !== n1.id) {
          n1.vx += fx;
          n1.vy += fy;
        }
        if (!n2.isFixed && draggedNodeIdRef.current !== n2.id) {
          n2.vx -= fx;
          n2.vy -= fy;
        }
      });

      // Force 3: Center Gravity & Subtle Organic Harmonic Breathing
      nodes.forEach((n, idx) => {
        if (n.isFixed || draggedNodeIdRef.current === n.id) return;

        // Pull to center gently
        const dx = CENTER_X - n.x;
        const dy = CENTER_Y - n.y;
        n.vx += dx * 0.0006;
        n.vy += dy * 0.0006;

        // Harmonic organic drift (gives living cosmic/microscopic fluidity)
        n.vx += Math.sin(t * 1.4 + idx * 0.85) * 0.045;
        n.vy += Math.cos(t * 1.4 + idx * 0.85) * 0.045;

        // Apply velocity with silk-like damping
        n.vx *= 0.93;
        n.vy *= 0.93;
        n.x += n.vx;
        n.y += n.vy;

        // Canvas Boundary Containment
        const pad = n.radius + 15;
        if (n.x < pad) { n.x = pad; n.vx *= -0.5; }
        if (n.x > WIDTH - pad) { n.x = WIDTH - pad; n.vx *= -0.5; }
        if (n.y < pad) { n.y = pad; n.vy *= -0.5; }
        if (n.y > HEIGHT - pad) { n.y = HEIGHT - pad; n.vy *= -0.5; }
      });

      setTick((prev) => prev + 1);
      animFrameRef.current = requestAnimationFrame(runPhysicsTick);
    };

    animFrameRef.current = requestAnimationFrame(runPhysicsTick);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating, filteredEdges, CENTER_X, CENTER_Y, WIDTH, HEIGHT]);

  // 4. Mouse & Drag Handlers with Exact Coordinate Inversion
  const getSvgCoordinates = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      const svgX = rawX * scaleX;
      const svgY = rawY * scaleY;
      const x = (svgX - pan.x - CENTER_X) / zoom + CENTER_X;
      const y = (svgY - pan.y - CENTER_Y) / zoom + CENTER_Y;
      return { x, y };
    },
    [pan, zoom, CENTER_X, CENTER_Y, WIDTH, HEIGHT]
  );

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // If clicking empty canvas area -> pan
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    draggedNodeIdRef.current = nodeId;
    const coords = getSvgCoordinates(e as any);
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      node.x = coords.x;
      node.y = coords.y;
      node.vx = 0;
      node.vy = 0;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNodeIdRef.current) {
      const coords = getSvgCoordinates(e);
      const node = nodesRef.current.find((n) => n.id === draggedNodeIdRef.current);
      if (node) {
        node.x = coords.x;
        node.y = coords.y;
        node.vx = 0;
        node.vy = 0;
      }
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    draggedNodeIdRef.current = null;
    setIsPanning(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    initializeNodes();
  };

  // Real-time live node lookup map (evaluated fresh on every frame to match live node positions)
  const positionMap = new Map<string, SimNode>();
  for (let i = 0; i < nodesRef.current.length; i++) {
    const n = nodesRef.current[i];
    positionMap.set(n.id, n);
  }

  const targetNode = nodesRef.current.find((n) => n.type === "target") || nodesRef.current[0];

  return (
    <div
      className={`relative bg-[var(--bg)] border border-[var(--line)] rounded-[10px] overflow-hidden select-none ${className}`}
    >
      {/* ── Dynamic Top Bar Controls ── */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Filter Buttons & Simulation State Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--s1)]/90 backdrop-blur-md border border-[var(--line)] rounded-[6px] pointer-events-auto shadow-sm">
          <span className="text-[10.5px] font-mono text-[var(--mute)] px-2 uppercase font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3 text-[var(--acc)]" />
            Filter:
          </span>
          {[
            { id: "all", label: "Semua Kluster" },
            { id: "threat", label: "Anomali & Botnet" },
            { id: "lures", label: "Umpan / WA" },
            { id: "organic", label: "Organik" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                activeFilter === f.id
                  ? "bg-[var(--s2)] text-[var(--ink)] font-semibold border border-[var(--acc)] shadow-[inset_2px_0_var(--acc)]"
                  : "text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)]"
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="w-[1px] h-4 bg-[var(--line)] mx-1" />

          {/* Physics Simulation Play/Pause Toggle */}
          <button
            onClick={() => setIsSimulating((s) => !s)}
            className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSimulating
                ? "bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/30 font-semibold"
                : "bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] hover:text-[var(--ink)]"
            }`}
            title={isSimulating ? "Jeda Simulasi Fisika" : "Aktifkan Gerak Fisika"}
          >
            {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isSimulating ? "Fisika Aktif" : "Dijeda"}</span>
          </button>
        </div>

        {/* Right: Zoom & Layout Reset Controls */}
        <div className="flex items-center gap-1 p-1 bg-[var(--s1)]/90 backdrop-blur-md border border-[var(--line)] rounded-[6px] pointer-events-auto shadow-sm">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            className="p-1.5 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)] rounded cursor-pointer transition-colors"
            title="Perbesar (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            className="p-1.5 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)] rounded cursor-pointer transition-colors"
            title="Perkecil (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)] rounded cursor-pointer transition-colors"
            title="Rapikan & Reset Posisi"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Interactive SVG Canvas with 60FPS Fluid Physics ── */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-[580px] cursor-grab active:cursor-grabbing bg-[radial-gradient(ellipse_at_center,_var(--s1)_0%,_var(--bg)_100%)]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Cyber Grid Pattern */}
          <pattern id="graph-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="0.75" fill="var(--line)" />
          </pattern>

          {/* Glow Filters */}
          <filter id="threat-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="acc-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* CSS Animation Keyframes for Smooth SVG Data Flow & Beacons */}
          <style>{`
            @keyframes flowDashThreat {
              from { stroke-dashoffset: 48; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes flowDashCyan {
              from { stroke-dashoffset: 36; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes pulsePing {
              0% { r: 18px; opacity: 0.85; stroke-width: 1.5px; }
              70% { r: 38px; opacity: 0; stroke-width: 0.5px; }
              100% { r: 38px; opacity: 0; stroke-width: 0px; }
            }
            @keyframes targetAbsorb {
              0% { r: 28px; opacity: 0.7; stroke-width: 1.6px; }
              60% { r: 44px; opacity: 0; stroke-width: 0.5px; }
              100% { r: 44px; opacity: 0; stroke-width: 0px; }
            }
            @keyframes radarSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes radarSpinRev {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            .edge-threat-flow {
              animation: flowDashThreat 1.2s linear infinite;
            }
            .edge-cyan-flow {
              animation: flowDashCyan 2s linear infinite;
            }
            .radar-beacon {
              animation: pulsePing 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            .target-absorb {
              animation: targetAbsorb 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
          `}</style>
        </defs>

        {/* Ambient Grid Layer */}
        <rect width="100%" height="100%" fill="url(#graph-grid)" />

        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
        >
          {/* Subtle Ambient Telemetry Guide Rings */}
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r="175"
            fill="none"
            stroke="var(--line)"
            strokeDasharray="4 6"
            strokeWidth="0.8"
            opacity="0.5"
          />
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r="230"
            fill="none"
            stroke="var(--line)"
            strokeDasharray="5 8"
            strokeWidth="0.6"
            opacity="0.35"
          />

          {/* ── Dynamic Edge Connections & Living Packet Stream ── */}
          {filteredEdges.map((edge, edgeIdx) => {
            const p1 = positionMap.get(edge.source);
            const p2 = positionMap.get(edge.target);
            if (!p1 || !p2) return null;

            const isThreatLink = edge.type === "lure" || edge.type === "coordination";
            const isSelectedLink =
              selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
            const isHoveredLink =
              hoveredNode && (edge.source === hoveredNode.id || edge.target === hoveredNode.id);

            // 1. Vector geometry between endpoints
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / dist;
            const ny = dx / dist;

            // 2. Dynamic Quadratic Bezier Sag/Tension Curve (organic curvature)
            const bendSign = edgeIdx % 2 === 0 ? 1 : -1;
            const bendMagnitude = (0.08 + (edgeIdx % 3) * 0.04) * Math.min(32, dist * 0.22);
            const bend = bendSign * bendMagnitude;
            const cx = (p1.x + p2.x) / 2 + nx * bend;
            const cy = (p1.y + p2.y) / 2 + ny * bend;
            const curvePath = `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;

            // Midpoint on Bezier for label (s = 0.5)
            const midX = 0.25 * p1.x + 0.5 * cx + 0.25 * p2.x;
            const midY = 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y;

            // 3. Physical Traveling Data Packet Dots (Seamless flow from source into target)
            const tVal = timeRef.current;
            const speed = isThreatLink ? 0.32 : 0.22;
            const offset = (edgeIdx * 0.19) % 1;
            const s1 = (tVal * speed + offset) % 1;
            const s2 = (tVal * speed + offset + 0.5) % 1;

            const inv1 = 1 - s1;
            const pt1X = inv1 * inv1 * p1.x + 2 * inv1 * s1 * cx + s1 * s1 * p2.x;
            const pt1Y = inv1 * inv1 * p1.y + 2 * inv1 * s1 * cy + s1 * s1 * p2.y;

            const inv2 = 1 - s2;
            const pt2X = inv2 * inv2 * p1.x + 2 * inv2 * s2 * cx + s2 * s2 * p2.x;
            const pt2Y = inv2 * inv2 * p1.y + 2 * inv2 * s2 * cy + s2 * s2 * p2.y;

            // Sine envelope: 0 at source dot, peaks at mid-transit, 0 at target dot (seamless emergence & absorption)
            const op1 = Math.sin(s1 * Math.PI);
            const op2 = Math.sin(s2 * Math.PI);

            const packetColor = isSelectedLink || isHoveredLink
              ? "#60a5fa"
              : isThreatLink
              ? "#ef4444"
              : "#38bdf8";

            const packetGlow = isThreatLink ? "url(#threat-glow)" : "url(#acc-glow)";

            return (
              <g key={edge.id} className="transition-opacity duration-300">
                {/* Layer 1: Base Nerve Curve */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke={
                    isSelectedLink || isHoveredLink
                      ? "var(--acc)"
                      : isThreatLink
                      ? "rgba(239, 68, 68, 0.22)"
                      : "rgba(100, 116, 139, 0.16)"
                  }
                  strokeWidth={isSelectedLink || isHoveredLink ? 2.2 : isThreatLink ? 1.4 : 1}
                />

                {/* Layer 2: Animated Flowing Stream Along the Curve */}
                <path
                  d={curvePath}
                  fill="none"
                  stroke={
                    isSelectedLink || isHoveredLink
                      ? "#60a5fa"
                      : isThreatLink
                      ? "rgba(239, 68, 68, 0.55)"
                      : "rgba(56, 189, 248, 0.35)"
                  }
                  strokeWidth={isSelectedLink || isHoveredLink ? 2 : isThreatLink ? 1.5 : 1.1}
                  strokeDasharray="4 8"
                  className={isThreatLink ? "edge-threat-flow" : "edge-cyan-flow"}
                  opacity={isSelectedLink || isHoveredLink ? 1 : isThreatLink ? 0.9 : 0.65}
                />

                {/* Layer 3: Physical Traveling Data Packet Dots */}
                {op1 > 0.05 && (
                  <g pointerEvents="none">
                    <circle
                      cx={pt1X}
                      cy={pt1Y}
                      r={isThreatLink ? 4.5 : 3.5}
                      fill={packetColor}
                      opacity={op1 * 0.35}
                      filter={packetGlow}
                    />
                    <circle
                      cx={pt1X}
                      cy={pt1Y}
                      r={isThreatLink ? 2.5 : 2}
                      fill="#ffffff"
                      opacity={op1 * 0.95}
                    />
                  </g>
                )}
                {op2 > 0.05 && (
                  <g pointerEvents="none">
                    <circle
                      cx={pt2X}
                      cy={pt2Y}
                      r={isThreatLink ? 4.5 : 3.5}
                      fill={packetColor}
                      opacity={op2 * 0.35}
                      filter={packetGlow}
                    />
                    <circle
                      cx={pt2X}
                      cy={pt2Y}
                      r={isThreatLink ? 2.5 : 2}
                      fill="#ffffff"
                      opacity={op2 * 0.95}
                    />
                  </g>
                )}

                {/* Edge Connection Anchor Dot at Source (Unifying Line with Dot) */}
                <circle
                  cx={p1.x}
                  cy={p1.y}
                  r={2.5}
                  fill={packetColor}
                  opacity={0.45}
                  pointerEvents="none"
                />

                {/* Edge Label on hover or selected */}
                {(isSelectedLink || isHoveredLink) && edge.label && (
                  <g transform={`translate(${midX}, ${midY - 4})`}>
                    <rect
                      x="-34"
                      y="-10"
                      width="68"
                      height="15"
                      rx="3"
                      fill="var(--s1)"
                      stroke="var(--line)"
                      strokeWidth="0.8"
                    />
                    <text
                      textAnchor="middle"
                      dy="1"
                      fill="var(--ink)"
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ── Central Target Radar Sweep Reticle ── */}
          {targetNode && (
            <g transform={`translate(${targetNode.x}, ${targetNode.y})`} pointerEvents="none">
              {/* Outer Counter-Rotating Segmented Telemetry Ring */}
              <circle
                r="46"
                fill="none"
                stroke="var(--acc)"
                strokeWidth="1.2"
                strokeDasharray="18 10 6 10"
                opacity="0.45"
                style={{
                  transformOrigin: "0 0",
                  animation: "radarSpin 16s linear infinite",
                }}
              />
              {/* Inner Fast Rotating Dashed Ring */}
              <circle
                r="38"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="6 6"
                opacity="0.5"
                style={{
                  transformOrigin: "0 0",
                  animation: "radarSpinRev 10s linear infinite",
                }}
              />
              {/* Target Data Packet Absorption Ping Wave */}
              <circle
                r="30"
                fill="none"
                stroke="var(--acc)"
                strokeWidth="1.2"
                className="target-absorb pointer-events-none"
              />
              {/* Target Crosshairs */}
              <line x1="-52" y1="0" x2="-38" y2="0" stroke="var(--acc)" strokeWidth="1.2" opacity="0.6" />
              <line x1="38" y1="0" x2="52" y2="0" stroke="var(--acc)" strokeWidth="1.2" opacity="0.6" />
              <line x1="0" y1="-52" x2="0" y2="-38" stroke="var(--acc)" strokeWidth="1.2" opacity="0.6" />
              <line x1="0" y1="38" x2="0" y2="52" stroke="var(--acc)" strokeWidth="1.2" opacity="0.6" />
            </g>
          )}

          {/* ── Interactive Fluid Nodes with Harmonic Breathing ── */}
          {nodesRef.current.map((node, nodeIdx) => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNode?.id === node.id;
            const isTarget = node.type === "target";
            const isThreat =
              node.type === "buzzer" || node.type === "bot" || (node.riskScore || 0) >= 40;
            const isLure = node.type === "threat_lure";
            const isOrganic = node.type === "organic";

            // Harmonic subtle breathing radius so nodes feel alive
            const dynamicRadius = node.radius + Math.sin(timeRef.current * 2.2 + nodeIdx * 0.85) * 0.75;

            let strokeColor = "var(--line)";
            let fillColor = "var(--s2)";
            let textColor = "var(--ink)";

            if (isTarget) {
              strokeColor = "var(--acc)";
              fillColor = "var(--s1)";
            } else if (isThreat) {
              strokeColor = "#ef4444";
              fillColor = "rgba(239, 68, 68, 0.16)";
              textColor = "#ef4444";
            } else if (isLure) {
              strokeColor = "#f59e0b";
              fillColor = "rgba(245, 158, 11, 0.16)";
              textColor = "#f59e0b";
            } else if (isOrganic) {
              strokeColor = "#22c55e";
              fillColor = "rgba(34, 197, 94, 0.1)";
            }

            if (isSelected || isHovered) {
              strokeColor = "var(--acc)";
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode?.(node);
                }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer group select-none"
              >
                {/* 1. Pulsing Radar Wave on High Anomaly / Threat Nodes */}
                {isThreat && (
                  <circle
                    r={dynamicRadius}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    className="radar-beacon pointer-events-none"
                  />
                )}

                {/* 2. Selection Orbit Ring */}
                {isSelected && (
                  <circle
                    r={dynamicRadius + 7}
                    fill="none"
                    stroke="var(--acc)"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                    className="pointer-events-none"
                    style={{
                      transformOrigin: "0 0",
                      animation: "radarSpin 6s linear infinite",
                    }}
                  />
                )}

                {/* 3. Outer Halo on Hover */}
                {isHovered && !isSelected && (
                  <circle
                    r={dynamicRadius + 5}
                    fill="none"
                    stroke="var(--acc)"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    className="pointer-events-none"
                  />
                )}

                {/* 4. Main Node Geometry */}
                <circle
                  r={dynamicRadius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isTarget ? 2.5 : isSelected || isHovered ? 2 : 1.5}
                  className="transition-transform duration-200 group-hover:scale-110"
                  filter={isThreat ? "url(#threat-glow)" : isSelected ? "url(#acc-glow)" : undefined}
                />

                {/* 5. Center Icon / Typography */}
                <text
                  textAnchor="middle"
                  dy="3.5"
                  fontSize={isTarget ? "14" : "10"}
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={isTarget ? "var(--acc)" : textColor}
                  pointerEvents="none"
                >
                  {isTarget ? "@" : isThreat ? "!" : isLure ? "#" : "✓"}
                </text>

                {/* 6. Node Label with Sharp SVG Outline */}
                <text
                  y={node.radius + 13}
                  textAnchor="middle"
                  fill={isSelected || isHovered ? "var(--acc)" : "var(--ink)"}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight={isSelected || isHovered ? "bold" : "normal"}
                  pointerEvents="none"
                  className="tracking-tight"
                  style={{
                    paintOrder: "stroke fill",
                    stroke: "var(--bg)",
                    strokeWidth: "2.5px",
                    strokeLinejoin: "round",
                  }}
                >
                  {node.label.length > 16 ? `${node.label.slice(0, 15)}…` : node.label}
                </text>

                {/* 7. Sublabel / Anomaly % */}
                {node.sublabel && (
                  <text
                    y={node.radius + 23}
                    textAnchor="middle"
                    fill={isThreat ? "#ef4444" : "var(--mute)"}
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight={isThreat ? "bold" : "normal"}
                    pointerEvents="none"
                    style={{
                      paintOrder: "stroke fill",
                      stroke: "var(--bg)",
                      strokeWidth: "2px",
                      strokeLinejoin: "round",
                    }}
                  >
                    {node.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── Interactive Floating Node Inspector Card (On Hover) ── */}
      {hoveredNode && (
        <div
          className="absolute top-16 left-4 z-20 p-3 bg-[var(--s1)]/95 backdrop-blur-md border border-[var(--acc)]/50 rounded-[8px] shadow-lg text-[12px] font-mono pointer-events-none min-w-[240px] space-y-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
            <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hoveredNode.type === 'buzzer' || hoveredNode.type === 'bot' ? 'bg-[#ef4444]' : hoveredNode.type === 'threat_lure' ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'}`} />
              {hoveredNode.label}
            </span>
            <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] font-bold">
              {hoveredNode.type}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-[var(--mute)]">
            <div className="flex justify-between">
              <span>Skor Anomali:</span>
              <strong className={hoveredNode.riskScore && hoveredNode.riskScore >= 40 ? "text-[#ef4444]" : "text-[var(--lo)]"}>
                {hoveredNode.riskScore ? `${hoveredNode.riskScore.toFixed(0)}%` : "0% (Organik)"}
              </strong>
            </div>

            {hoveredNode.details?.author_display_name && (
              <div className="flex justify-between">
                <span>Nama Tampilan:</span>
                <span className="text-[var(--ink)] truncate max-w-[130px]">
                  {hoveredNode.details.author_display_name}
                </span>
              </div>
            )}

            {hoveredNode.details?.likes_count != null && (
              <div className="flex justify-between">
                <span>Interaksi Publik:</span>
                <span className="text-[var(--ink)]">
                  {hoveredNode.details.likes_count} Suka &bull; {hoveredNode.details?.account_signals?.comments_count || 0} Komen
                </span>
              </div>
            )}

            {hoveredNode.details?.comment_text && (
              <div className="pt-1 text-[10.5px] text-[var(--ink)] line-clamp-2 italic border-t border-[var(--line)]/50">
                &ldquo;{hoveredNode.details.comment_text}&rdquo;
              </div>
            )}
          </div>

          <div className="pt-1 text-[9.5px] text-[var(--acc)] font-semibold text-right">
            [Klik node untuk mengunci ke dossier]
          </div>
        </div>
      )}

      {/* ── Legend Strip (Bottom Right) ── */}
      <div className="absolute bottom-3 right-3 p-1.5 px-2 bg-[var(--s1)]/90 backdrop-blur-md border border-[var(--line)] rounded-[6px] text-[10px] font-mono flex items-center gap-2.5 shadow-sm pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[var(--acc)] bg-[var(--acc)]/30 animate-pulse" />
          <span className="text-[var(--ink)] font-semibold">Sasaran</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#22c55e] bg-[#22c55e]/30" />
          <span className="text-[var(--mute)]">Organik</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#ef4444] bg-[#ef4444]/30" />
          <span className="text-[#ef4444] font-semibold">Buzzer/Bot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#f59e0b] bg-[#f59e0b]/30" />
          <span className="text-[#f59e0b]">Umpan WA</span>
        </div>
      </div>

      {/* ── Interactive Telemetry Pill (Bottom Left) ── */}
      <div className="absolute bottom-3 left-3 p-1.5 px-2 bg-[var(--s1)]/90 backdrop-blur-md border border-[var(--line)] rounded-[6px] text-[10px] font-mono text-[var(--mute)] flex items-center gap-1.5 shadow-sm pointer-events-none">
        <Share2 className="w-3 h-3 text-[var(--acc)] animate-spin" style={{ animationDuration: "12s" }} />
        <span>
          <strong className="text-[var(--ink)]">{filteredNodes.length}</strong> Entitas &bull;{" "}
          <strong className="text-[var(--ink)]">{filteredEdges.length}</strong> Jalur Relasi &bull; Tarik Node Bebas
        </span>
      </div>
    </div>
  );
}
