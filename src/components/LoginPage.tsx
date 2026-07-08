/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Key, Calendar, User, Sparkles, BookOpen, UserPlus, LogIn, ChevronRight, HelpCircle, Trash2 } from 'lucide-react';
import { ScrapbookData, sanitizeScrapbookData } from '../types';
import { defaultScrapbookData } from '../defaultData';

export interface UserAccount {
  name: string; // Dynamic casing
  dob: string;  // Format YYYY-MM-DD
  data: ScrapbookData;
}

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form input states
  const [nameInput, setNameInput] = useState('');
  const [dobInput, setDobInput] = useState('');
  const [partnerNameInput, setPartnerNameInput] = useState('Gokul'); // Default partner
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Normalize utility for robust index matching
  const normalizeStr = (str: string) => str.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a name!');
      return;
    }
    if (!dobInput) {
      setErrorMsg('Please select your Date of Birth!');
      return;
    }

    const currentNormName = normalizeStr(trimmedName);
    const currentNormDob = dobInput.trim(); // "YYYY-MM-DD"

    setLoading(true);

    try {
      const { getUserAccount, saveUserAccount } = await import('../lib/firebase');

      // 1. Always look up if an account already exists in the cloud
      let found = await getUserAccount(trimmedName, currentNormDob);

      // Auto-seed/auto-login for Kavi demonstration account if not already in Firestore
      if (!found && currentNormName === 'kavi' && currentNormDob === '2026-07-17') {
        const demoData: ScrapbookData = {
          ...defaultScrapbookData,
          herName: "Kavi",
          partnerName: "Gokul",
          birthdate: "2026-07-17T00:00:00",
        };
        const demoAccount: UserAccount = {
          name: "Kavi",
          dob: "2026-07-17",
          data: demoData
        };
        await saveUserAccount(demoAccount);
        found = demoAccount;
      }

      if (found) {
        // Existing user: ALWAYS log in directly with their saved data (even if isSignUp was active)
        setSuccessMsg(`Welcome back, ${found.name}! Loading your synchronized memories...`);
        setTimeout(() => {
          onLoginSuccess(found!);
        }, 1000);
        return;
      }

      if (isSignUp) {
        // Initialize customized scrapbook starting point for new users
        const chosenPartner = partnerNameInput.trim() || 'Gokul';
        const initializedData: ScrapbookData = {
          ...defaultScrapbookData,
          herName: trimmedName,
          partnerName: chosenPartner,
          birthdate: `${currentNormDob}T00:00:00`,
          welcomeMessage: `Happy Birthday to the most beautiful person in my life ❤️ You make my days brighter, my smile bigger, and my heart happier. This is your very own digital scrapbook memory box! Welcome to your canvas. Customize every word, story, and photo inside! ✨`,
          timeline: [
            {
              id: '1',
              title: 'Our Journey Begins 💬',
              date: 'Day one',
              icon: 'MessageSquare',
              description: `A brand new blank page for ${trimmedName} and ${chosenPartner}! Hit the "Edit Scrapbook Data" drawer below to document your first conversations, meetings, and special memories.`,
            }
          ],
          gallery: [
            {
              id: '1',
              url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800',
              caption: 'Click below to switch this onto your real couple photos! 📸'
            }
          ],
          reasons: [
            'Because of your pure infectious laugh.',
            'The way you check up on me when I am busy.',
            'Your stunning, radiant kindness.'
          ],
          letter: {
            salutation: `My Dearest ${trimmedName},`,
            paragraphs: [
              'This is a private, customizable letter space where I wanted to say how truly grateful I am to have you in my universe. Thank you for being my safety and my absolute favorite chapter.',
              'Click the configure button to write your heart out here.'
            ],
            closing: 'Love you always!'
          },
          futureWishes: [
            {
              id: '1',
              title: 'Travel the world ✈️',
              description: 'Pack a single backpack, fly somewhere unexpected, and get fully lost together.',
              icon: 'Compass'
            }
          ],
          enabledFeatures: {
            countdown: true,
            timeline: true,
            gallery: true,
            reasons: true,
            music: true,
            quiz: true,
            letter: true,
            futureWishes: true,
            surprise: true,
            finalSignoff: true
          },
          playlist: defaultScrapbookData.playlist
        };

        const newAccount: UserAccount = {
          name: trimmedName,
          dob: currentNormDob,
          data: initializedData
        };

        // Save account to Firestore
        await saveUserAccount(newAccount);

        setSuccessMsg('Account created beautifully in the cloud! Logging you in...');
        setTimeout(() => {
          onLoginSuccess(newAccount);
        }, 1200);

      } else {
        if (currentNormName === 'kavi' && currentNormDob !== '2026-07-17') {
          setErrorMsg("Hint: Kavi's default romantic demo has Date of Birth set to 2026-07-17! Please double check.");
        } else {
          setErrorMsg('No account found in cloud matching this Name and DOB. Click "Create Dashboard" to build your free space!');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('A network error occurred while reaching the central database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-radial-at-t from-rose-50 via-amber-25/50 to-rose-100/40 relative overflow-hidden font-sans">
      
      {/* Absolute Decorative Floating Hearts */}
      <div className="absolute top-12 left-12 w-20 h-20 bg-rose-200/30 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-amber-200/25 rounded-full blur-2xl animate-pulse" />
      
      <div className="bg-white/95 border-2 border-rose-100 rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-2xl relative z-10 backdrop-blur-md overflow-hidden">
        
        {/* Binder Ring Hole Accents on the Left Border */}
        <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-around py-8 pointer-events-none opacity-40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-1.5 translate-x-3.5">
              <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300" />
              <div className="w-5 h-2 bg-gradient-to-r from-slate-300 to-transparent rounded-full" />
            </div>
          ))}
        </div>

        <div className="pl-6 flex flex-col items-center">
          
          {/* Logo & Intro */}
          <div className="flex flex-col items-center text-center mb-8 relative">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm"
            >
              <BookOpen className="w-7 h-7" />
            </motion.div>
            
            <Heart className="absolute top-10 right-0 w-5 h-5 text-rose-300 fill-rose-100 animate-bounce" />
            
            <h1 className="text-2xl font-black text-slate-800 tracking-wide mt-4 uppercase">
              Our Love Scrapbook
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
              Unlock a personal, dedicated digital scrap-canvas isolated specifically to you and your favorite human.
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex w-full bg-slate-50 p-1 rounded-xl mb-6 border border-slate-100 text-xs font-mono font-bold select-none">
            <button
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !isSignUp ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isSignUp ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            
            {/* Name Input */}
            <div>
              <label className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-widest block mb-1.5">
                Who are you? (Your Name)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Kavi, Kiara, Aiden..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 focus:bg-white text-slate-800 font-sans transition-all"
                />
              </div>
            </div>

            {/* Date of Birth Input */}
            <div>
              <label className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-widest block mb-1.5">
                Your Date of Birth (Security pin)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={dobInput}
                  onChange={(e) => setDobInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 focus:bg-white text-slate-800 font-sans transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Special Partner Name setup input when registering */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-1 block"
                >
                  <label className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-widest block mb-1.5 mt-1">
                    Your Partner's Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Heart className="w-4 h-4 text-rose-300" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Gokul, Liam, Mason..."
                      value={partnerNameInput}
                      onChange={(e) => setPartnerNameInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 focus:bg-white text-slate-800 font-sans transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alerts */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs text-center leading-relaxed font-sans"
              >
                ⚠️ {errorMsg}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs text-center font-sans"
              >
                ✨ {successMsg}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-102 cursor-pointer mt-6"
            >
              <span>{isSignUp ? 'Create Personal Binder' : 'Unlock Scrapbook'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Seed demo quick-login cheat sheet to make it fully playful */}
          <div className="mt-8 pt-4 border-t border-slate-100 w-full text-center">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-relaxed block">
              💡 Demonstration Key Accounts
            </span>
            <div className="mt-2 text-[10px] text-slate-500 bg-amber-50/50 rounded-lg p-2.5 border border-amber-100/50">
              To test the romantic demo of <strong>Kavi</strong>, log in with:<br/>
              Name: <span className="underline select-all text-rose-600 font-semibold font-mono">Kavi</span> &bull; DOB: <span className="underline select-all text-rose-600 font-semibold font-mono">2026-07-17</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
