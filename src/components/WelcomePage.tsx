/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

interface WelcomePageProps {
  herName: string;
  partnerName: string;
  welcomeMessage: string;
  welcomeImage: string;
}

export default function WelcomePage({
  herName,
  partnerName,
  welcomeMessage,
  welcomeImage,
}: WelcomePageProps) {
  return (
    <div id="welcome-section" className="relative flex flex-col items-center justify-center min-h-[85vh] w-full px-4 md:px-8 py-12">
      {/* Tape Decoration */}
      <div className="absolute top-0 transform -translate-y-1/2 left-1/2 -translate-x-1/2 w-32 h-8 bg-amber-100/60 backdrop-blur-xs border border-amber-200/50 shadow-xs rotate-[-2deg] z-10 flex items-center justify-center font-mono text-[10px] text-amber-800 tracking-widest uppercase">
        Special Delivery
      </div>

      <div className="max-w-2xl w-full bg-white border border-rose-100 shadow-xl rounded-2xl p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
        {/* Decorative corner stars */}
        <div className="absolute top-4 left-4 text-amber-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="absolute bottom-4 right-4 text-rose-300">
          <Heart className="w-5 h-5 fill-rose-300 animate-bounce" />
        </div>

        {/* Polaroid Style Image Cover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          whileHover={{ rotate: 1, scale: 1.02 }}
          className="w-full md:w-1/2 bg-amber-50 p-3 pt-3 pb-8 shadow-md border border-amber-100/40 rounded-sm relative cursor-pointer"
        >
          {/* Tape on Polaroid corner */}
          <div className="absolute top-[-15px] left-[20%] w-16 h-6 bg-rose-200/50 -rotate-12 border border-rose-300/20 shadow-2xs"></div>
          
          <img
            src={(welcomeImage && welcomeImage.trim() !== '') ? welcomeImage : 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800'}
            alt={herName}
            className="w-full aspect-square object-cover rounded-xs border border-amber-200/30"
            referrerPolicy="no-referrer"
          />
          <div className="mt-4 text-center font-sans">
            <span className="text-xl font-bold font-cursive text-rose-700 tracking-wide select-none">
              My Favorite Photo ✨
            </span>
          </div>
        </motion.div>

        {/* Romantic birthday welcome details */}
        <div className="w-full md:w-1/2 flex flex-col text-center md:text-left justify-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span className="text-xs bg-rose-50 text-rose-600 border border-rose-200/60 font-semibold uppercase px-3 py-1 rounded-full tracking-wider inline-block mb-3">
              To my gorgeous girl
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight"
          >
            Happy Birthday, <br />
            <motion.span
              animate={{ color: ['#9f1239', '#e11d48', '#be123c', '#9f1239'] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="inline-block relative py-1 drop-shadow-xs font-cursive text-5xl md:text-6xl"
            >
              {herName} <span className="inline-block animate-pulse">❤️</span>
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-6 text-sm md:text-base text-slate-600 leading-relaxed font-sans"
          >
            {welcomeMessage}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-4 text-xs font-cursive text-slate-400 self-end md:self-start italic border-t border-rose-100/50 pt-2 w-full md:w-fit"
          >
            Created with pure love by {partnerName}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
