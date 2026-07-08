/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, Heart, Smile } from 'lucide-react';

interface VirtualSurpriseProps {
  surpriseMessage: string;
}

export default function VirtualSurprise({ surpriseMessage }: VirtualSurpriseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleOpenGift = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setIsOpen(true);
    }, 1200);
  };

  return (
    <div id="surprise-section" className="relative w-full py-16 px-4 md:px-8 bg-white border border-rose-100 rounded-2xl shadow-xs overflow-hidden flex flex-col items-center justify-center min-h-[50vh]">
      {/* Tape Decoration */}
      <div className="absolute top-0 transform -translate-y-1/2 left-[25%] w-32 h-7 bg-amber-100/70 border border-amber-200 rotate-[3deg] flex items-center justify-center font-cursive text-amber-800 text-xs select-none">
        Hidden Surprise 🎁
      </div>

      <div className="max-w-xl mx-auto text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight font-cursive">
          A Special Keepsake Surprise ✨
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          I wrapped a little virtual gift box for you. Tap the box to unwrap it and discover what's inside!
        </p>
      </div>

      <div className="relative flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="closed"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: isShaking ? [0, -8, 8, -8, 8, -4, 4, 0] : [0, 1, -1, 1, -1, 0],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                rotate: isShaking
                  ? { duration: 1.2, ease: 'easeInOut' }
                  : { repeat: Infinity, duration: 3, ease: 'easeInOut' },
              }}
              onClick={handleOpenGift}
              className="flex flex-col items-center cursor-pointer select-none group"
            >
              {/* Virtual Ribbon Gift Box visual decoration */}
              <div className="relative w-40 h-40 md:w-48 md:h-48 bg-rose-500 rounded-xl shadow-2xl border-2 border-rose-600 flex items-center justify-center overflow-hidden">
                {/* Horizontal ribbon strip */}
                <div className="absolute h-6 inset-x-0 bg-yellow-400 border-y border-yellow-500/30 shadow-xs" />
                {/* Vertical ribbon strip */}
                <div className="absolute w-6 inset-y-0 bg-yellow-400 border-x border-yellow-500/30 shadow-xs" />

                <div className="absolute z-10 text-white flex flex-col items-center gap-1">
                  <Gift className="w-12 h-12 md:w-16 md:h-16 drop-shadow-md animate-bounce" />
                  <span className="text-[10px] md:text-xs font-mono font-black uppercase tracking-widest bg-rose-600/90 px-3 py-1 rounded-full shadow-xs">
                    Tap to open
                  </span>
                </div>

                {/* Sparkling dots */}
                <div className="absolute top-2 left-6 text-yellow-200"><Sparkles className="w-4 h-4 animate-pulse" /></div>
                <div className="absolute bottom-4 right-10 text-rose-200"><Heart className="w-4 h-4" /></div>
              </div>

              {isShaking && (
                <span className="mt-4 text-xs font-mono font-bold text-rose-500 uppercase tracking-widest animate-pulse">
                  Unwrapping your gift... ✨
                </span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="opened"
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20 }}
              className="max-w-md w-full bg-gradient-to-br from-rose-50 to-amber-50 border-2 border-dashed border-rose-300 rounded-2xl p-6 md:p-8 text-center shadow-xl relative cursor-default"
            >
              {/* Confetti decoration */}
              <div className="absolute top-2 left-2 text-rose-400"><Heart className="w-5 h-5 fill-rose-300/40" /></div>
              <div className="absolute top-6 right-8 text-yellow-500"><Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} /></div>
              <div className="absolute bottom-3 left-10 text-amber-500"><Smile className="w-5 h-5" /></div>

              <h4 className="text-2xl font-black text-rose-700 font-cursive mb-4">
                👑 Gift Unlocked! 👑
              </h4>

              <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-rose-100 shadow-inner max-h-60 overflow-y-auto">
                <p className="text-sm md:text-base text-slate-700 leading-relaxed font-sans whitespace-pre-wrap select-text">
                  {surpriseMessage}
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(false)}
                className="mt-6 text-xs font-mono font-bold uppercase tracking-widest hover:text-slate-900 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:bg-rose-150 shadow-md px-4 py-2 rounded-full transition-all"
              >
                Close Box
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
