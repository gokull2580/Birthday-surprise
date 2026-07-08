/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Mail, MailOpen } from 'lucide-react';
import { useState } from 'react';

interface LetterPageProps {
  letter: {
    salutation: string;
    paragraphs: string[];
    closing: string;
  };
  partnerName: string;
}

export default function LetterPage({ letter, partnerName }: LetterPageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="letter-section" className="relative w-full py-16 px-4 md:px-8 bg-amber-50/20 rounded-2xl border border-rose-100/20 flex flex-col items-center">
      {/* Tape Tape Decoration */}
      <div className="absolute top-0 transform -translate-y-1/2 left-[75%] w-32 h-7 bg-emerald-100/50 rotate-[-1deg] border border-emerald-200/50 flex items-center justify-center font-cursive text-emerald-900 text-xs select-none">
        Handwritten Letter ✉️
      </div>

      <div className="max-w-2xl w-full text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight font-cursive">
          A Letter For You 💌
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          Take a deep breath, tap below to open the envelope, and read this heartfelt handwritten note I wrote from the soul.
        </p>
      </div>

      <div className="max-w-xl w-full relative flex flex-col items-center">
        {/* Envelope trigger tab */}
        {!isOpen ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(true)}
            className="w-full bg-white border border-rose-100 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[250px]"
          >
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 shadow-inner">
              <Mail className="w-8 h-8 animate-pulse" />
            </div>
            <h4 className="text-xl font-bold text-slate-800 font-cursive">
              You've got mail, my love
            </h4>
            <span className="text-xs text-rose-500 font-mono mt-2 uppercase tracking-widest font-black">
              Click to break the wax seal
            </span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full bg-[#FCF9F2] border border-[#ECD9BC] shadow-xl rounded-2xl p-6 md:p-10 relative overflow-hidden"
          >
            {/* Lined paper retro background using gradient decoration */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(#00f 0px, #00f 1px, transparent 1px, transparent 24px)',
                backgroundPosition: '0 30px',
                lineHeight: '24px',
              }}
            />

            {/* Close / seal button icon */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-xs font-mono font-bold bg-amber-100 hover:bg-rose-100 hover:text-rose-600 text-amber-800 px-3 py-1.5 rounded-full border border-amber-200 transition-colors z-20 flex items-center gap-1.5"
            >
              <MailOpen className="w-3.5 h-3.5" /> Re-seal Letter
            </button>

            {/* Letter Head */}
            <div className="mt-4 font-cursive text-2xl font-bold text-slate-800">
              {letter.salutation}
            </div>

            {/* Paragraphs body with handwritten cursive styles */}
            <div className="mt-6 space-y-6 text-slate-700/90 font-cursive text-lg leading-loose select-text relative z-10 pl-2">
              {letter.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Letter Signoff */}
            <div className="mt-10 text-right pr-4 relative z-10 flex flex-col items-end">
              <span className="font-cursive text-slate-400 italic text-sm">
                {letter.closing}
              </span>
              <span className="font-cursive text-2xl font-black text-rose-600 mt-1">
                {partnerName} ❤️
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
