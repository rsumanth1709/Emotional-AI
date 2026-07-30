"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface InteractiveLampProps {
  focusedField: string | null;
  isPasswordFocused?: boolean;
  hasError?: boolean;
  onToggleLight?: (isOn: boolean) => void;
}

export default function InteractiveLamp({
  focusedField,
  isPasswordFocused = false,
  hasError = false,
  onToggleLight,
}: InteractiveLampProps) {
  const [isOn, setIsOn] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position tracking relative to lamp base
  const mouseX = useSpring(0, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 150, damping: 20 });

  // 3D Lamp Head Rotation Springs
  const headAngle = useSpring(0, { stiffness: 200, damping: 18 });
  const headTilt = useSpring(0, { stiffness: 200, damping: 18 });
  const beamOpacity = useSpring(1, { stiffness: 180, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const lampX = rect.left + rect.width / 2;
      const lampY = rect.top + 80; // Lamp head position

      const dx = e.clientX - lampX;
      const dy = e.clientY - lampY;

      // Calculate relative angle (-35 to +35 deg)
      const angleDeg = Math.max(-40, Math.min(40, (dx / window.innerWidth) * 70));
      const tiltDeg = Math.max(-15, Math.min(25, (dy / window.innerHeight) * 40));

      if (!focusedField) {
        mouseX.set(dx);
        mouseY.set(dy);
        headAngle.set(angleDeg);
        headTilt.set(tiltDeg);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [focusedField, headAngle, headTilt, mouseX, mouseY]);

  // Adjust lamp head angle & beam focus depending on active focused input field
  useEffect(() => {
    if (!isOn) {
      beamOpacity.set(0);
      return;
    }
    beamOpacity.set(1);

    if (isPasswordFocused) {
      // Shy / Privacy tilt: Lamp turns upward and dims slightly
      headAngle.set(-25);
      headTilt.set(-30);
      beamOpacity.set(0.4);
    } else if (focusedField === "email") {
      headAngle.set(-15);
      headTilt.set(15);
    } else if (focusedField === "username" || focusedField === "fullName") {
      headAngle.set(0);
      headTilt.set(20);
    } else if (focusedField === "consent") {
      headAngle.set(20);
      headTilt.set(25);
    } else {
      headAngle.set(0);
      headTilt.set(0);
    }
  }, [focusedField, isPasswordFocused, isOn, headAngle, headTilt, beamOpacity]);

  // Handle pull cord click (Toggle Lamp Light)
  const handlePullCord = () => {
    setIsPulling(true);
    const newState = !isOn;
    setIsOn(newState);
    if (onToggleLight) onToggleLight(newState);
    setTimeout(() => setIsPulling(false), 300);
  };

  // Lamp Head Transform derived values
  const rotateHeadZ = useTransform(headAngle, (v) => `${v}deg`);
  const rotateHeadX = useTransform(headTilt, (v) => `${v}deg`);

  // Dynamic light beam color based on state
  const beamGradient = hasError
    ? "from-amber-500/40 via-red-500/20 to-transparent"
    : isPasswordFocused
    ? "from-purple-500/30 via-indigo-500/15 to-transparent"
    : "from-amber-300/40 via-violet-400/20 to-transparent";

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center select-none pointer-events-none z-20">
      
      {/* ── 3D LAMP STRUCTURE ─────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center" style={{ perspective: 1000 }}>

        {/* Lamp Base Ceiling Mount / Wall Joint */}
        <div className="w-24 h-4 rounded-full bg-gradient-to-r from-slate-700 via-slate-500 to-slate-800 shadow-xl border border-slate-600/50 flex items-center justify-center">
          <div className="w-16 h-1.5 rounded-full bg-slate-900/60" />
        </div>

        {/* Articulated Upper Arm Rod */}
        <div className="w-2.5 h-12 bg-gradient-to-b from-slate-600 via-slate-400 to-slate-700 shadow-md border-x border-slate-500/40 relative">
          {/* Metallic Spring Detail */}
          <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 w-4 flex flex-col justify-between opacity-70">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-0.5 w-full bg-slate-300 rounded-full shadow-sm" />
            ))}
          </div>
        </div>

        {/* Pivot Elbow Joint */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-500 to-slate-400 border border-amber-300/60 shadow-lg flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
        </div>

        {/* Lower Arm Rod */}
        <div className="w-2.5 h-10 bg-gradient-to-b from-slate-700 via-slate-500 to-slate-800 shadow-md border-x border-slate-500/40" />

        {/* ── LAMP HEAD (Dome + Bulb + Cord) ───────────────────────────── */}
        <motion.div
          style={{
            rotateZ: rotateHeadZ,
            rotateX: rotateHeadX,
            transformStyle: "preserve-3d",
          }}
          className="relative flex flex-col items-center origin-top transition-transform duration-75"
        >
          {/* Metallic Socket Ring */}
          <div className="w-10 h-3 rounded-t-md bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 border border-amber-300/40" />

          {/* Pixar-Style Dome Lamp Shade */}
          <div className="relative w-28 h-16 rounded-t-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-t-2 border-x border-amber-400/40 shadow-2xl overflow-hidden flex items-end justify-center">
            {/* Interior Copper Reflective Coating */}
            <div className="absolute inset-x-2 bottom-0 h-10 rounded-t-full bg-gradient-to-t from-amber-500/30 via-yellow-600/10 to-transparent" />

            {/* Illuminated LED Bulb */}
            <div
              className={`w-12 h-6 rounded-t-full transition-all duration-300 ${
                isOn
                  ? hasError
                    ? "bg-gradient-to-t from-red-400 via-amber-300 to-white shadow-[0_0_40px_rgba(239,68,68,0.9)]"
                    : isPasswordFocused
                    ? "bg-gradient-to-t from-purple-400 via-indigo-200 to-white shadow-[0_0_40px_rgba(168,85,247,0.9)]"
                    : "bg-gradient-to-t from-yellow-300 via-amber-100 to-white shadow-[0_0_50px_rgba(253,224,71,1)]"
                  : "bg-slate-700 shadow-none"
              }`}
            />
          </div>

          {/* ── PULL STRING SWITCH (Interactive Cord) ──────────────────── */}
          <div className="absolute top-10 right-2 pointer-events-auto flex flex-col items-center z-30">
            {/* String Chain */}
            <motion.div
              animate={{ height: isPulling ? 48 : 32 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-0.5 bg-gradient-to-b from-amber-400 via-slate-300 to-amber-200 shadow-sm flex flex-col items-center justify-between"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm -ml-0.5" />
              ))}
            </motion.div>

            {/* Metallic Ball Handle Knob */}
            <motion.button
              onClick={handlePullCord}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
              animate={{ y: isPulling ? 16 : 0 }}
              className="w-4 h-5 rounded-b-full bg-gradient-to-b from-amber-400 via-yellow-300 to-amber-600 border border-yellow-200 shadow-lg cursor-pointer flex items-center justify-center group"
              title="Click to toggle lamp light"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/80 group-hover:bg-white" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ── VOLUMETRIC SPOTLIGHT LIGHT BEAM CONE ──────────────────────────── */}
      <motion.div
        style={{ opacity: beamOpacity }}
        transition={{ duration: 0.2 }}
        className="relative w-full flex justify-center -mt-2 pointer-events-none"
      >
        <div
          className={`w-[480px] h-[340px] bg-gradient-to-b ${beamGradient} blur-xl opacity-90 transition-all duration-300`}
          style={{
            clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
            maskImage: "radial-gradient(ellipse at top, black 30%, transparent 80%)",
          }}
        />

        {/* Ambient Floor Glow Pool */}
        {isOn && (
          <motion.div
            animate={{
              scale: isPasswordFocused ? 0.8 : 1,
              opacity: isPasswordFocused ? 0.4 : 0.8,
            }}
            className={`absolute bottom-0 w-80 h-24 rounded-full blur-2xl transition-all duration-300 ${
              hasError
                ? "bg-red-500/30"
                : isPasswordFocused
                ? "bg-purple-500/20"
                : "bg-amber-300/30"
            }`}
          />
        )}
      </motion.div>
    </div>
  );
}
