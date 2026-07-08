/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Lightbulb, Smile, Compass, Heart, Users, Star, Award, Gift, Sparkles, Flame } from 'lucide-react';

interface ReasonsSectionProps {
  reasons: string[];
}

export default function ReasonsSection({ reasons }: ReasonsSectionProps) {
  // Preset pleasant scrapbook sticky pastels
  const stickyColors = [
    'bg-rose-50 border-rose-200 text-rose-800',
    'bg-amber-50 border-amber-200 text-amber-900',
    'bg-emerald-50 border-emerald-200 text-emerald-900',
    'bg-blue-50 border-blue-200 text-blue-900',
    'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900',
  ];

  // Soft romantic icon library map for 10 reasons
  const reasonIcons = [
    <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />,
    <Smile className="w-5 h-5 text-amber-500 fill-amber-500/20" />,
    <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />,
    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />,
    <Lightbulb className="w-5 h-5 text-teal-500 fill-teal-500/20" />,
    <Compass className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />,
    <Users className="w-5 h-5 text-rose-500 fill-rose-500/20" />,
    <Award className="w-5 h-5 text-purple-500 fill-purple-500/20" />,
    <Gift className="w-5 h-5 text-orange-500 fill-orange-500/20" />,
    <Flame className="w-5 h-5 text-pink-500 fill-pink-500/20" />,
  ];

  return (
    <div id="reasons-section" className="relative w-full py-16 px-4 md:px-8 bg-amber-50/10 rounded-2xl border border-amber-100/30">
      {/* Decorative Stamp Tag */}
      <div className="absolute top-0 transform -translate-y-1/2 left-[40%] px-4 h-8 bg-amber-50 shadow-xs border border-amber-200 rotate-[-1deg] rounded-sm flex items-center justify-center font-cursive text-amber-800 text-xs select-none">
        {reasons.length} Reasons Why 💌
      </div>

      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight font-cursive">
          {reasons.length} Reasons You are So Special ❤️
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          Just general, everyday reasons why having you in my life makes every other detail completely beautiful.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        {reasons.map((reason, index) => {
          const colorClass = stickyColors[index % stickyColors.length];
          const angle = (index % 3) * 1.5 - 1.5; // slight tilt to mimic physical post-it board

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95, rotate: angle }}
              whileInView={{ opacity: 1, scale: 1, rotate: angle }}
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{ scale: 1.02, rotate: 0, zIndex: 10 }}
              transition={{ duration: 0.4 }}
              className={`p-6 border rounded-xl shadow-xs relative flex flex-col items-start gap-4 cursor-pointer overflow-hidden ${colorClass}`}
            >
              {/* Fake little washi tape strip at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-amber-200/50 -translate-y-1 border-b border-amber-300/20 shadow-2xs rotate-[2deg]" />

              <div className="flex gap-3 items-center">
                <span className="w-8 h-8 rounded-full bg-white/70 shadow-xs flex items-center justify-center shrink-0 font-mono text-xs font-black">
                  {index + 1}
                </span>
                <div className="shrink-0">
                  {reasonIcons[index % reasonIcons.length] || reasonIcons[0]}
                </div>
              </div>

              <p className="text-sm leading-relaxed font-sans font-medium text-slate-700/90 pl-1.5 flex-1 select-none">
                {reason}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
