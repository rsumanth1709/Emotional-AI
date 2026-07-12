"use client";

import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <div className="flex flex-col gap-1 items-start w-full">
      <span className="text-[10px] text-slate-500 font-medium">MindCare AI • Typing</span>
      <div className="bubble-bot flex items-center gap-1.5 py-3 px-4">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 bg-violet-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
