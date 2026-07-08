/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { TimelineEvent } from '../types';
import DynamicIcon from './DynamicIcon';

interface TimelineSectionProps {
  timeline: TimelineEvent[];
}

export default function TimelineSection({ timeline }: TimelineSectionProps) {
  return (
    <div id="timeline-section" className="relative w-full py-16 px-4 md:px-8 bg-amber-50/20 rounded-2xl border border-rose-100/30">
      {/* Decorative Washi Tape Header */}
      <div className="absolute top-0 transform -translate-y-1/2 left-[20%] w-36 h-7 bg-amber-200/50 rotate-[1deg] border border-amber-300/30 flex items-center justify-center font-cursive text-amber-900 shadow-2xs text-xs select-none">
        Our Story Timeline 🌸
      </div>

      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight font-cursive">
          How We Grew Together ✨
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          A little digital stroll down memory lane, celebrating all the milestones of our beautiful path.
        </p>
      </div>

      <div className="max-w-3xl mx-auto relative pl-4 md:pl-0">
        {/* Continuous Solid Line in Center (MD screens) or Left (SM screens) */}
        <div className="absolute top-0 bottom-0 left-6 md:left-1/2 w-[2px] bg-rose-200/60 transform md:-translate-x-1/2" />

        <div className="space-y-12">
          {timeline.map((event, index) => {
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col md:flex-row relative items-start md:items-center ${
                  isEven ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline Dynamic Icon Indicator (Center or Left track) */}
                <div className="absolute left-6 md:left-1/2 w-10 h-10 rounded-full bg-rose-100 border-2 border-rose-300 shadow-md flex items-center justify-center text-rose-600 transform -translate-x-5 z-20">
                  <DynamicIcon name={event.icon} className="w-5 h-5" />
                </div>

                {/* Timeline Card */}
                <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isEven ? 'md:pr-10' : 'md:pl-10'}`}>
                  <motion.div
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="bg-white border border-rose-50 rounded-xl shadow-md p-6 relative cursor-pointer overflow-hidden transform hover:shadow-lg transition-all"
                  >
                    {/* Tiny decorative paper slip */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-pink-300" />
                      <span className="w-2 h-2 rounded-full bg-amber-300" />
                    </div>

                    <span className="text-xs font-mono px-3 py-1 bg-rose-50 text-rose-700/80 rounded-full tracking-wider border border-rose-100/40 inline-block mb-3">
                      {event.date}
                    </span>

                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-1.5 font-cursive">
                      {event.title}
                    </h3>

                    <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                      {event.description}
                    </p>

                    {/* Timeline Event Optional Polaroid Photo */}
                    {event.image && event.image.trim() !== '' && (
                      <div className="mt-4 overflow-hidden rounded-lg bg-amber-50 p-2 border border-amber-100 shadow-xs">
                        <img
                          src={event.image || undefined}
                          alt={event.title}
                          className="w-full h-40 object-cover rounded-md"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Space holder for md screens layout symmetry */}
                <div className="hidden md:block w-[45%]" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
