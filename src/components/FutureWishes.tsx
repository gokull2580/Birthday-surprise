/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { FutureWish } from '../types';
import DynamicIcon from './DynamicIcon';

interface FutureWishesProps {
  futureWishes: FutureWish[];
}

export default function FutureWishes({ futureWishes }: FutureWishesProps) {
  return (
    <div id="wishes-section" className="relative w-full py-16 px-4 md:px-8 bg-white border border-rose-100 rounded-2xl shadow-xs overflow-hidden">
      {/* Tape Tape tag */}
      <div className="absolute top-0 transform -translate-y-1/2 left-[15%] w-34 h-7 bg-amber-500/10 border border-amber-300 shadow-2xs rotate-[-3deg] flex items-center justify-center font-cursive text-amber-900 text-xs select-none">
        Bucket List ✈️
      </div>

      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight font-cursive">
          Our Dreams & Future Wishes ✨
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          Little seeds we've planted in our dream journals, representing all the beautiful places to visit and milestones we will cross.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 p-4">
        {futureWishes.map((wish, index) => {
          return (
            <motion.div
              key={wish.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -3, scale: 1.01 }}
              className="bg-amber-50/20 border border-amber-200/40 shadow-xs rounded-2xl p-6 relative flex flex-col hover:shadow-md transition-all duration-300"
            >
              {/* Pushpin circle graphic to look like a pinned bulletin post */}
              <div className="absolute top-[-8px] left-[15%] w-4 h-4 bg-rose-500 rounded-full shadow-md z-10 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-rose-300 rounded-full" />
              </div>

              {/* Decorative pin shadow */}
              <div className="absolute top-[4px] left-[17%] w-2 h-2 bg-black/15 blur-2xs rounded-full z-0" />

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl border border-rose-100/60 shadow-inner flex items-center justify-center text-rose-500 shrink-0">
                  <DynamicIcon name={wish.icon} className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 font-sans tracking-wide">
                    {wish.title}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-slate-500 leading-relaxed font-sans">
                    {wish.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
