/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoGalleryItem } from '../types';
import { X, Heart, ZoomIn } from 'lucide-react';

interface PhotoGalleryProps {
  gallery: PhotoGalleryItem[];
}

export default function PhotoGallery({ gallery }: PhotoGalleryProps) {
  const [activePhoto, setActivePhoto] = useState<PhotoGalleryItem | null>(null);

  // Slight rotate presets to simulate hand-placed Polaroid deck
  const getRotationClass = (idx: number) => {
    const rotates = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-3', '-rotate-3', 'rotate-1'];
    return rotates[idx % rotates.length];
  };

  return (
    <div id="gallery-section" className="relative w-full py-16 px-4 md:px-8 bg-white border border-rose-100 rounded-2xl shadow-xs">
      {/* Decorative Washi Tape */}
      <div className="absolute top-0 transform -translate-y-1/2 left-[60%] w-32 h-7 bg-rose-200/40 rotate-[-1deg] border border-rose-300/20 flex items-center justify-center font-cursive text-rose-900 shadow-2xs text-xs select-none">
        Moments Capture 📸
      </div>

      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight font-cursive">
          Our Polaroid Memory Wall ✨
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          Little moments captured in pixels, representing the massive spaces you occupy in my daydreams.
        </p>
      </div>

      {/* Grid of polaroids */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 p-4">
        {gallery.map((photo, index) => {
          const slant = getRotationClass(index);
          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03, rotate: 0, zIndex: 10 }}
              onClick={() => setActivePhoto(photo)}
              className={`bg-amber-50/40 p-4 pb-8 border border-neutral-200/40 rounded-sm shadow-md flex flex-col cursor-pointer transition-shadow duration-300 hover:shadow-xl ${slant}`}
            >
              <div className="relative group w-full aspect-square bg-neutral-100 rounded-sm overflow-hidden border border-amber-200/20">
                <img
                  src={photo.url || undefined}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay hover prompt */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white bg-slate-900/60 p-2 rounded-full text-xs flex items-center gap-1">
                    <ZoomIn className="w-4 h-4" /> View Large
                  </span>
                </div>
              </div>

              {/* Heart pin icon on polaroid card */}
              <div className="mt-4 flex items-start gap-1 pb-1">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-xs font-medium font-cursive tracking-wide select-none leading-relaxed">
                  {photo.caption}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox pop-up popup */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-110 flex items-center justify-center p-4"
            onClick={() => setActivePhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full border border-rose-200 p-4 relative shadow-2xl flex flex-col md:flex-row gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 rounded-full p-1.5 transition-colors z-20"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Large Image Frame */}
              <div className="w-full md:w-[60%] aspect-square md:aspect-auto md:max-h-[70vh] rounded-xl overflow-hidden shadow-inner border border-neutral-100">
                <img
                  src={activePhoto.url || undefined}
                  alt={activePhoto.caption}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Side Caption Detail */}
              <div className="w-full md:w-[40%] flex flex-col justify-center">
                <div className="flex gap-1.5 items-center text-xs text-rose-600 font-bold tracking-widest uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Polaroid Memory
                </div>
                <h4 className="text-xl md:text-2xl font-bold font-cursive text-slate-800 leading-snug">
                  {activePhoto.caption}
                </h4>
                <div className="mt-4 border-t border-rose-50 pt-3">
                  <p className="text-xs text-slate-400 italic font-cursive">
                    "Every picture tells a tiny story about why I am so lucky to have you."
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
