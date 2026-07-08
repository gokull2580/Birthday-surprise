/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Hourglass } from 'lucide-react';

interface CountdownSectionProps {
  birthdate: string; // "YYYY-MM-DD" style
  herName: string;
}

export default function CountdownSection({ birthdate, herName }: CountdownSectionProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isBirthday: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isBirthday: false });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const currentYear = now.getFullYear();

      // Extract month and day from input birthdate
      const targetBase = new Date(birthdate);
      let targetMonth = targetBase.getMonth();
      let targetDay = targetBase.getDate();

      // Formulate target for THIS year
      let targetDate = new Date(currentYear, targetMonth, targetDay);

      // If her birthday already passed this year, set target to NEXT year!
      if (
        now.getMonth() > targetMonth ||
        (now.getMonth() === targetMonth && now.getDate() > targetDay)
      ) {
        targetDate.setFullYear(currentYear + 1);
      }

      // Check if TODAY is actually her birthday!
      const isTodayBirthday =
        now.getMonth() === targetMonth && now.getDate() === targetDay;

      const difference = targetDate.getTime() - now.getTime();

      if (isTodayBirthday) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isBirthday: true });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / (1000 * 60)) % 60);
      const s = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days: d,
        hours: h,
        minutes: m,
        seconds: s,
        isBirthday: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [birthdate]);

  return (
    <div id="countdown-section" className="relative w-full py-16 px-4 md:px-8 bg-white border border-rose-100 rounded-2xl shadow-xs overflow-hidden">
      {/* Decorative Ribbon */}
      <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
        <div className="bg-rose-500 text-white text-[10px] uppercase font-bold tracking-widest text-center py-1.5 width-[130px] absolute top-[25px] right-[-25px] rotate-45 shadow-sm">
          Big Day! 🎉
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-rose-50 border border-rose-200/50 rounded-full flex items-center justify-center text-rose-500 mb-4 shadow-sm">
          <Hourglass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 font-cursive leading-tight">
          Countdown to Your Special Day ✨
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          Seconds ticking by, each one bringing us closer to celebrating the absolute best day of the year!
        </p>

        <AnimatePresence mode="wait">
          {timeLeft.isBirthday ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="mt-8 bg-rose-50 border-2 border-rose-200 shadow-lg px-8 py-6 rounded-2xl text-center max-w-lg cursor-pointer"
            >
              <h3 className="text-2xl md:text-3xl font-black text-rose-600 font-cursive mb-2">
                🎉 HAPPY BIRTHDAY, {herName.toUpperCase()}! 🎉
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The wait is officially over! Today is all about you! Let's make every second of this day absolutely unforgettable, full of smiles and sweet treats. ❤️
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              className="mt-8 grid grid-cols-4 gap-4 md:gap-6 w-full max-w-xl"
            >
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Min', value: timeLeft.minutes },
                { label: 'Sec', value: timeLeft.seconds },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 md:p-5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-slate-200" />
                  <span className="text-2xl md:text-4xl font-black font-mono text-slate-800 tracking-tight select-none">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] md:text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 font-mono px-4 py-1.5 bg-slate-50 border border-slate-200/40 rounded-full">
          <Calendar className="w-3.5 h-3.5" />
          Target Day: {new Date(birthdate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
