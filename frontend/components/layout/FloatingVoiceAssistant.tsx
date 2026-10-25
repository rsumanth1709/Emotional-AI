"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Mic } from "lucide-react";

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = "mindcare_voice_assistant_pos";
const BUTTON_SIZE = 58;
const PADDING = 16;

export default function FloatingVoiceAssistant() {
  const pathname = usePathname();
  const router = useRouter();

  // position is null when using CSS default (bottom-6 right-6), or { x, y } when customized/dragged
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false,
  });

  const buttonRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Position = JSON.parse(saved);
        const clampedX = Math.min(window.innerWidth - BUTTON_SIZE - PADDING, Math.max(PADDING, parsed.x));
        const clampedY = Math.min(window.innerHeight - BUTTON_SIZE - PADDING, Math.max(PADDING, parsed.y));
        setPosition({ x: clampedX, y: clampedY });
      } catch {
        // Use default
      }
    }
  }, []);

  // Handle window resizing to keep inside viewport
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        return {
          x: Math.min(window.innerWidth - BUTTON_SIZE - PADDING, Math.max(PADDING, prev.x)),
          y: Math.min(window.innerHeight - BUTTON_SIZE - PADDING, Math.max(PADDING, prev.y)),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // If position is null (default bottom-right), get current coordinates from bounding rect
    let curX = position?.x;
    let curY = position?.y;

    if (curX === undefined || curY === undefined) {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        curX = rect.left;
        curY = rect.top;
      } else {
        curX = window.innerWidth - BUTTON_SIZE - 24;
        curY = window.innerHeight - BUTTON_SIZE - 24;
      }
      setPosition({ x: curX, y: curY });
    }

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: curX,
      initialY: curY,
      moved: false,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragRef.current.startX;
      const deltaY = clientY - dragRef.current.startY;

      if (Math.hypot(deltaX, deltaY) > 5) {
        dragRef.current.moved = true;
      }

      const nextX = Math.min(
        window.innerWidth - BUTTON_SIZE - PADDING,
        Math.max(PADDING, dragRef.current.initialX + deltaX)
      );
      const nextY = Math.min(
        window.innerHeight - BUTTON_SIZE - PADDING,
        Math.max(PADDING, dragRef.current.initialY + deltaY)
      );

      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      if (dragRef.current.moved) {
        setPosition((currentPos) => {
          if (currentPos) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPos));
          }
          return currentPos;
        });
      }
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isDragging]);

  const handleClick = (e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      return;
    }
    router.push("/voice");
  };

  // Only hide when the user is already on the dedicated voice assistant page
  if (pathname === "/voice") {
    return null;
  }

  // Position: either custom (left/top) or default (right-6 bottom-6)
  const containerStyle: React.CSSProperties = position
    ? {
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
        zIndex: 9999,
      }
    : {
        position: "fixed",
        right: "24px",
        bottom: "24px",
        touchAction: "none",
        zIndex: 9999,
      };

  const isNearRight = position
    ? position.x > (typeof window !== "undefined" ? window.innerWidth / 2 : 500)
    : true;

  return (
    <div
      ref={buttonRef}
      style={containerStyle}
      className={`select-none flex items-center gap-2.5 group ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      {/* Tooltip on hover */}
      {isNearRight ? (
        <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none px-3 py-1.5 rounded-xl bg-slate-900/95 border border-purple-500/30 text-xs font-bold text-purple-200 shadow-xl shadow-black/80 -translate-x-1 group-hover:translate-x-0 order-first whitespace-nowrap">
          Voice Assistant
        </span>
      ) : null}

      <button
        onClick={handleClick}
        title="MindCare Voice Assistant"
        aria-label="Open MindCare Voice Assistant"
        type="button"
        className={`relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-2xl border border-purple-400/40 transition-transform ${
          isDragging
            ? "scale-110 shadow-purple-500/80 ring-4 ring-purple-400/50"
            : "shadow-purple-600/50 hover:scale-110 active:scale-95"
        }`}
      >
        <span className="absolute -inset-1 rounded-full bg-purple-500/25 group-hover:bg-purple-500/50 animate-pulse transition-all pointer-events-none" />
        <Mic className="w-6 h-6 relative z-10 pointer-events-none" />
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-md shadow-emerald-500/80 z-20 pointer-events-none" />
      </button>

      {!isNearRight ? (
        <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none px-3 py-1.5 rounded-xl bg-slate-900/95 border border-purple-500/30 text-xs font-bold text-purple-200 shadow-xl shadow-black/80 translate-x-1 group-hover:translate-x-0 whitespace-nowrap">
          Voice Assistant
        </span>
      ) : null}
    </div>
  );
}
