/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { defaultScrapbookData } from './defaultData';
import { ScrapbookData, sanitizeScrapbookData } from './types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, saveUserAccount, getUserDocId } from './lib/firebase';

// Scrapbook Sections
import WelcomePage from './components/WelcomePage';
import TimelineSection from './components/TimelineSection';
import PhotoGallery from './components/PhotoGallery';
import ReasonsSection from './components/ReasonsSection';
import CountdownSection from './components/CountdownSection';
import MusicSection from './components/MusicSection';
import VirtualSurprise from './components/VirtualSurprise';
import LetterPage from './components/LetterPage';
import FutureWishes from './components/FutureWishes';
import QuizSection from './components/QuizSection';

// Extra Visual elements
import FloatingHeartsAndStars from './components/FloatingHearts';
import EditPanel from './components/EditPanel';
import LoginPage, { UserAccount } from './components/LoginPage';

import { Heart, Sparkles, BookOpen, Music as MusicIcon, Compass, Award, Scroll, Send, ArrowUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ALL_SECTIONS = [
  { id: 'welcome-section', label: 'Welcome 🌸', key: 'welcome' },
  { id: 'countdown-section', label: 'Countdown ⏰', key: 'countdown' },
  { id: 'timeline-section', label: 'Our Story 💬', key: 'timeline' },
  { id: 'gallery-section', label: 'Polaroids 📸', key: 'gallery' },
  { id: 'reasons-section', label: '10 Reasons ❤️', key: 'reasons' },
  { id: 'music-section', label: 'Our Melodies 🎶', key: 'music' },
  { id: 'quiz-section', label: 'Trivia Quiz 🧠', key: 'quiz' },
  { id: 'letter-section', label: 'Letter ✉️', key: 'letter' },
  { id: 'wishes-section', label: 'Future Wishes ✈️', key: 'futureWishes' },
  { id: 'surprise-section', label: 'Surprise Box 🎁', key: 'surprise' },
  { id: 'final-section', label: 'Forever Yours ♾️', key: 'finalSignoff' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const active = localStorage.getItem('current_scrapbook_user_v3');
    if (active) {
      try {
        const parsed = JSON.parse(active);
        return {
          ...parsed,
          data: sanitizeScrapbookData(parsed.data)
        };
      } catch (e) {
        // Fallback
      }
    }
    return null;
  });

  const [data, setData] = useState<ScrapbookData>(() => {
    if (currentUser) {
      return sanitizeScrapbookData(currentUser.data);
    }
    return sanitizeScrapbookData(defaultScrapbookData);
  });

  const [showScrollTop, setShowScrollTop] = useState(false);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Real-time synchronization from central cloud database
  useEffect(() => {
    if (!currentUser) return;
    const docId = getUserDocId(currentUser.name, currentUser.dob);
    const unsub = onSnapshot(doc(db, 'users', docId), (docSnap) => {
      if (docSnap.metadata.hasPendingWrites) {
        return;
      }
      if (docSnap.exists()) {
        const remoteUser = docSnap.data() as UserAccount;
        if (remoteUser && remoteUser.data) {
          const sanitizedRemoteData = sanitizeScrapbookData(remoteUser.data);
          // Only update state if remote data is different from current local state
          if (JSON.stringify(sanitizedRemoteData) !== JSON.stringify(dataRef.current)) {
            setData(sanitizedRemoteData);
            setCurrentUser(prev => prev ? { ...prev, data: sanitizedRemoteData } : null);
          }
        }
      }
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
    });
    return () => unsub();
  }, [currentUser?.name, currentUser?.dob]);

  // Monitor scroll height to show sticky navigation helps
  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const handleLoginSuccess = (userAcc: UserAccount) => {
    const sanitizedUserAcc = {
      ...userAcc,
      data: sanitizeScrapbookData(userAcc.data)
    };
    setCurrentUser(sanitizedUserAcc);
    setData(sanitizedUserAcc.data);
    localStorage.setItem('current_scrapbook_user_v3', JSON.stringify(sanitizedUserAcc));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_scrapbook_user_v3');
  };

  const handleSaveData = async (newData: ScrapbookData) => {
    const sanitized = sanitizeScrapbookData(newData);
    setData(sanitized);
    if (currentUser) {
      const updatedUser = { ...currentUser, data: sanitized };
      setCurrentUser(updatedUser);
      localStorage.setItem('current_scrapbook_user_v3', JSON.stringify(updatedUser));

      try {
        await saveUserAccount(updatedUser);
      } catch (err) {
        console.error("Failed to sync updated scrapbook data to Firestore:", err);
        throw err;
      }
    }
  };
 
  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFeatureEnabled = (key: string) => {
    if (key === 'welcome') return true;
    if (!data.enabledFeatures) return true;
    return data.enabledFeatures[key as keyof typeof data.enabledFeatures] !== false;
  };

  const getNextActiveSection = (currentId: string) => {
    const activeSections = ALL_SECTIONS.filter(s => isFeatureEnabled(s.key));
    const currentIndex = activeSections.findIndex(s => s.id === currentId);
    if (currentIndex !== -1 && currentIndex < activeSections.length - 1) {
      return activeSections[currentIndex + 1];
    }
    return null;
  };

  const DynamicNextButton = ({ currentId }: { currentId: string }) => {
    const next = getNextActiveSection(currentId);
    if (!next) return null;
    return (
      <div className="flex justify-center mt-6 select-none">
        <motion.button
          whileHover={{ scale: 1.05, y: 2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleScrollTo(next.id)}
          className="px-6 py-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-cursive text-lg font-extrabold rounded-full shadow-md flex items-center gap-2 transition-all hover:shadow-lg cursor-pointer"
        >
          <span>Continue to: {next.label}</span>
          <motion.span
            animate={{ y: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="inline-block"
          >
            👇
          </motion.span>
        </motion.button>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="relative min-h-screen text-slate-800 flex flex-col items-center">
        <FloatingHeartsAndStars />
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-slate-800 flex flex-col items-center animate-fade-in">
      
      {/* 2 in 1 Twinkling Stars + Hover Floating Hearts canvas */}
      <FloatingHeartsAndStars />

      {/* Floating Vintage Header Ring Decor for true "Scrapbook Binder" aesthetic */}
      <div className="fixed top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-200 via-amber-200 to-indigo-200 z-50 shadow-xs" />

      {/* Floating chapter Navigation strip (sticky ribbon tab on far right side) */}
      <div className="hidden lg:flex flex-col gap-2.5 fixed right-6 top-1/2 -translate-y-1/2 z-40 select-none">
        {ALL_SECTIONS.filter(tab => isFeatureEnabled(tab.key)).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleScrollTo(tab.id)}
            className="text-[11px] font-mono font-bold tracking-wider uppercase text-left py-1.5 px-3 bg-white hover:bg-rose-50 border border-rose-100 text-slate-500 hover:text-rose-700 rounded-md shadow-xs transition-colors transition-transform duration-200 hover:translate-x-[-4px] cursor-pointer"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Binder Book Cover */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 relative z-10 flex flex-col gap-16 md:gap-24">
        
        {/* Top Control menu bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white/75 backdrop-blur-md rounded-2xl border border-rose-100/50 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <h2 className="text-xs font-mono font-black tracking-widest text-slate-700 uppercase">
              {data.herName}'s Book of Love
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 font-bold">
              👤 Owner: <span className="text-rose-600">{currentUser.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-800 rounded-lg px-2.5 py-1.5 flex items-center gap-1 hover:scale-103 transition-all cursor-pointer"
            >
              Log Out 🚪
            </button>
           

          </div>
        </div>

        {/* 1. Welcome section */}
        <section id="welcome-section" className="section-container">
          <WelcomePage
            herName={data.herName}
            partnerName={data.partnerName}
            welcomeMessage={data.welcomeMessage}
            welcomeImage={data.welcomeImage}
          />
          <DynamicNextButton currentId="welcome-section" />
        </section>

        {isFeatureEnabled('countdown') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-2">
              <span className="w-8 h-[1px] bg-rose-200" />
              <Heart className="w-4 h-4 fill-rose-100" />
              <span className="w-8 h-[1px] bg-rose-200" />
            </div>

            {/* 2. Birthday countdown component */}
            <section id="countdown-section" className="section-container">
              <CountdownSection birthdate={data.birthdate} herName={data.herName} />
              <DynamicNextButton currentId="countdown-section" />
            </section>
          </>
        )}

        {isFeatureEnabled('timeline') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-2">
              <span className="w-8 h-[1px] bg-rose-200" />
              <Heart className="w-4 h-4 fill-rose-100" />
              <span className="w-8 h-[1px] bg-rose-200" />
            </div>

            {/* 3. Story timeline component */}
            <section id="timeline-section" className="section-container">
              <TimelineSection timeline={data.timeline} />
              <DynamicNextButton currentId="timeline-section" />
            </section>
          </>
        )}

        {isFeatureEnabled('gallery') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-2">
              <span className="w-8 h-[1px] bg-rose-200" />
              <Heart className="w-4 h-4 fill-rose-100" />
              <span className="w-8 h-[1px] bg-rose-200" />
            </div>

            {/* 4. Memories Polaroid gallery */}
            <section id="gallery-section" className="section-container">
              <PhotoGallery gallery={data.gallery} />
              <DynamicNextButton currentId="gallery-section" />
            </section>
          </>
        )}

        {isFeatureEnabled('reasons') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-2">
              <span className="w-8 h-[1px] bg-rose-200" />
              <Heart className="w-4 h-4 fill-rose-100" />
              <span className="w-8 h-[1px] bg-rose-200" />
            </div>

            {/* 5. 10 Reasons Post-its board */}
            <section id="reasons-section" className="section-container">
              <ReasonsSection reasons={data.reasons} />
              <DynamicNextButton currentId="reasons-section" />
            </section>
          </>
        )}

        {isFeatureEnabled('music') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-2">
              <span className="w-8 h-[1px] bg-rose-200" />
              <Heart className="w-4 h-4 fill-rose-100" />
              <span className="w-8 h-[1px] bg-rose-200" />
            </div>

            {/* 6. Favorite customized music soundtrack player */}
            <section id="music-section" className="section-container">
              <MusicSection herName={data.herName} playlist={data.playlist} />
              <DynamicNextButton currentId="music-section" />
            </section>
          </>
        )}

        {isFeatureEnabled('quiz') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-2">
              <span className="w-8 h-[1px] bg-rose-200" />
              <Heart className="w-4 h-4 fill-rose-100" />
              <span className="w-8 h-[1px] bg-rose-200" />
            </div>

            {/* 7. Relationship multiple choice quiz board */}
            <section id="quiz-section" className="section-container">
              <QuizSection quiz={data.quiz} />
              <DynamicNextButton currentId="quiz-section" />
            </section>
          </>
        )}

        {isFeatureEnabled('letter') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-2">
              <span className="w-8 h-[1px] bg-rose-200" />
              <Heart className="w-4 h-4 fill-rose-100" />
              <span className="w-8 h-[1px] bg-rose-200" />
            </div>

            {/* 8. Letter folder page */}
            <section id="letter-section" className="section-container">
              <LetterPage letter={data.letter} partnerName={data.partnerName} />
              <DynamicNextButton currentId="letter-section" />
            </section>
          </>
        )}

        {isFeatureEnabled('futureWishes') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-2">
              <span className="w-8 h-[1px] bg-rose-200" />
              <Heart className="w-4 h-4 fill-rose-100" />
              <span className="w-8 h-[1px] bg-rose-200" />
            </div>

            {/* 9. Dreams Corkboard future wishes */}
            <section id="wishes-section" className="section-container">
              <FutureWishes futureWishes={data.futureWishes} />
              <DynamicNextButton currentId="wishes-section" />
            </section>
          </>
        )}

        {isFeatureEnabled('surprise') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-2">
              <span className="w-8 h-[1px] bg-rose-200" />
              <Heart className="w-4 h-4 fill-rose-100" />
              <span className="w-8 h-[1px] bg-rose-200" />
            </div>

            {/* 10. Floating shaking gift box surprise */}
            <section id="surprise-section" className="section-container">
              <VirtualSurprise surpriseMessage={data.surpriseDetails.message} />
              <DynamicNextButton currentId="surprise-section" />
            </section>
          </>
        )}

        {isFeatureEnabled('finalSignoff') && (
          <>
            {/* Divider separator */}
            <div className="flex justify-center items-center gap-2 text-rose-300 opacity-50 my-6">
              <span className="w-12 h-[1px] bg-rose-200" />
              <Heart className="w-5 h-5 fill-rose-400 animate-pulse text-rose-500" />
              <span className="w-12 h-[1px] bg-rose-200" />
            </div>

            {/* 11. Final Concluding Signoff Page */}
            <section id="final-section" className="relative w-full py-16 px-4 md:px-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center text-center">
              
              <div className="absolute top-[-50px] -left-12 w-48 h-48 bg-rose-500/10 blur-3xl rounded-full" />
              <div className="absolute bottom-[-50px] -right-12 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full" />

              {/* Golden animated crown or sparkle badge */}
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                className="w-14 h-14 rounded-full bg-amber-400/15 border border-amber-300/30 flex items-center justify-center text-amber-400 mb-6 shadow-md"
              >
                <Sparkles className="w-6 h-6 animate-pulse" />
              </motion.div>

              <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-300/80 mb-2">
                The Final Page
              </span>

              <h2 className="text-3xl md:text-5xl font-black text-rose-100 font-cursive tracking-wide max-w-lg leading-tight select-none">
                Thank you for being part of my life ❤️
              </h2>

              <p className="mt-4 text-xs md:text-sm text-slate-400 max-w-sm font-sans leading-relaxed">
                Every day is a gift, and every memory we write is my favorite story. I look forward to adding a million more pages to our scrapbook.
              </p>

              <div className="mt-8 pt-6 border-t border-slate-800/60 w-32 flex flex-col items-center">
                <span className="text-[10px] font-mono font-bold text-slate-505 uppercase tracking-widest block">
                  Forever Yours,
                </span>
                <span className="font-cursive text-3xl font-extrabold text-white mt-1 drop-shadow-md select-none tracking-wide">
                  {data.partnerName}
                </span>
              </div>

              {/* Decorative small heart emitter indicator */}
              <div className="mt-8 text-[10px] text-slate-500 font-mono italic">
                * Tap anywhere around the screen to spawn floating hearts *
              </div>
            </section>
          </>
        )}

      </main>

      {/* Retro Footer line */}
      <footer className="w-full text-center py-10 select-none border-t border-slate-100 relative z-10">
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          Made with Love &bull; Copyright &copy; 2026 &bull; Digital Scrapbook Builder
        </p>
      </footer>

      {/* Real-time configuration Editor panel drawer overlay */}
      <EditPanel data={data} onSave={handleSaveData} />

      {/* Floating Scroll back to top control ribbon */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 bg-white border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-full p-3.5 shadow-xl hover:scale-105 duration-200 z-40 cursor-pointer"
            title="Scroll to Top"
          >
            <ArrowUp className="w-4.5 h-4.5" />
          </motion.button>
        )}
      </AnimatePresence>


    </div>
  );
}
