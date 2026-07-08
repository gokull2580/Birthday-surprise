/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Music, Volume2, Disc, SkipForward } from 'lucide-react';
import { MusicTrack } from '../types';

interface MusicSectionProps {
  herName: string;
  playlist?: MusicTrack[];
}

export default function MusicSection({ herName, playlist: propPlaylist }: MusicSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playlist = propPlaylist && propPlaylist.length > 0 ? propPlaylist : [
    {
      id: "1",
      title: "Cozy Acoustic Musicbox 🧸",
      artist: "Web Audio Melodizer",
      url: "",
      isSynth: true,
    },
    {
      id: "2",
      title: "Romantic Guitar Serenade 🎸",
      artist: "Royalty Free Acoustic",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Solid streaming example fallback
      isSynth: false,
    },
    {
      id: "3",
      title: "Sweet Ambient Dream Lullaby 🌌",
      artist: "Royalty Free Ambient",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      isSynth: false,
    }
  ];

  // Safeguard index transitions if playlist is customized/cleared
  useEffect(() => {
    if (currentTrackIdx >= playlist.length) {
      setCurrentTrackIdx(0);
      setIsPlaying(false);
      setProgress(0);
    }
  }, [playlist.length, currentTrackIdx]);

  const currentTrack = playlist[currentTrackIdx] || playlist[0];

  // Synth melody definition: "Happy Birthday" or "You are my sunshine" frequencies
  // Array of [frequency (Hz), duration (ms), rest (ms)]
  const birthdayMelody = [
    [261.63, 300, 50], // C4
    [261.63, 100, 50], // C4
    [293.66, 400, 50], // D4
    [261.63, 400, 50], // C4
    [349.23, 400, 50], // F4
    [329.63, 800, 100], // E4
    
    [261.63, 300, 50], // C4
    [261.63, 100, 50], // C4
    [293.66, 400, 50], // D4
    [261.63, 400, 50], // C4
    [392.00, 400, 50], // G4
    [349.23, 800, 100], // F4
    
    [261.63, 300, 50], // C4
    [261.63, 100, 50], // C4
    [523.25, 400, 50], // C5
    [440.00, 400, 50], // A4
    [349.23, 400, 50], // F4
    [329.63, 400, 50], // E4
    [293.66, 600, 100], // D4

    [466.16, 300, 50], // Bb4
    [466.16, 100, 50], // Bb4
    [440.00, 400, 50], // A4
    [349.23, 400, 50], // F4
    [392.00, 400, 50], // G4
    [349.23, 800, 200]  // F4
  ];

  let currentNoteIdx = 0;

  const playSynthNote = () => {
    if (!isPlaying || !currentTrack.isSynth) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const note = birthdayMelody[currentNoteIdx];
    const freq = note[0];
    const duration = note[1] / 1000;

    // Create simple beautiful sine oscillator
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Soft envelope to simulate cozy wood musicbox
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.2, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration - 0.02);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);

    // Track progresses matching noteIndex
    setProgress(((currentNoteIdx + 1) / birthdayMelody.length) * 100);

    // Set next timeout
    currentNoteIdx = (currentNoteIdx + 1) % birthdayMelody.length;
    const nextDelay = note[1] + note[2];
    synthIntervalRef.current = window.setTimeout(playSynthNote, nextDelay);
  };

  useEffect(() => {
    if (isPlaying) {
      if (currentTrack.isSynth) {
        // Stop audio tag if it is playing
        if (audioRef.current) {
          audioRef.current.pause();
        }
        currentNoteIdx = 0;
        playSynthNote();
      } else {
        // Clear synth timer
        if (synthIntervalRef.current) {
          clearTimeout(synthIntervalRef.current);
        }
        if (audioRef.current) {
          audioRef.current.volume = volume;
          audioRef.current.play().catch(() => {
            // catch promise interruption
          });
        }
      }
    } else {
      if (synthIntervalRef.current) {
        clearTimeout(synthIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (synthIntervalRef.current) {
        clearTimeout(synthIntervalRef.current);
      }
    };
  }, [isPlaying, currentTrackIdx, currentTrack.url, currentTrack.isSynth]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    setIsPlaying(false);
    setProgress(0);
    setTimeout(() => {
      setCurrentTrackIdx((prev) => (prev + 1) % playlist.length);
      setIsPlaying(true);
    }, 100);
  };

  // Listen to standard HTML Audio element updates
  const handleTimeUpdate = () => {
    if (audioRef.current && !currentTrack.isSynth) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const handleAudioEnded = () => {
    handleNextTrack();
  };

  return (
    <div id="music-section" className="relative w-full py-16 px-4 md:px-8 bg-amber-50/20 rounded-2xl border border-rose-100/30 overflow-hidden flex flex-col items-center">
      {/* Tape Tag */}
      <div className="absolute top-0 transform -translate-y-1/2 left-[50%] -translate-x-1/2 w-32 h-7 bg-indigo-100/60 border border-indigo-200/50 shadow-2xs rotate-[-2deg] flex items-center justify-center font-cursive text-indigo-900 text-xs select-none z-10">
        Favorite Song 🎶
      </div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
        {/* Soft background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-505/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-505/20 blur-3xl rounded-full" />

        {/* Vinyl Disk Spin Graphic */}
        <motion.div
          animate={isPlaying ? { rotate: 360 } : {}}
          transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
          className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-slate-800 border-4 border-slate-700/85 flex items-center justify-center shadow-lg cursor-pointer"
          onClick={handleTogglePlay}
        >
          {/* Audio grooves */}
          <div className="absolute inset-2 border border-slate-600/30 rounded-full" />
          <div className="absolute inset-4 border border-slate-600/30 rounded-full" />
          <div className="absolute inset-6 border border-slate-600/30 rounded-full" />
          <div className="absolute inset-8 border border-slate-600/30 rounded-full" />
          
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-white relative">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-900 font-mono select-none">
              LOVE
            </span>
            <div className="absolute w-3 h-3 rounded-full bg-slate-900 border border-slate-800" />
          </div>
        </motion.div>

        {/* Track descriptions */}
        <div className="mt-6 text-center select-none w-full">
          <h3 className="text-lg font-black text-rose-300 font-cursive tracking-wide truncate">
            {currentTrack.title}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {currentTrack.artist}
          </p>
        </div>

        {/* Music progression bar */}
        <div className="w-full mt-6">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full relative">
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-rose-500"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>

        {/* Control Box */}
        <div className="flex items-center justify-between w-full mt-6">
          <div className="flex items-center gap-1.5 w-1/3">
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleTogglePlay}
              className="w-11 h-11 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleNextTrack}
              className="w-8 h-8 bg-slate-850 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-full flex items-center justify-center transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="w-1/3 flex justify-end">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((bar) => (
                <motion.div
                  key={bar}
                  animate={isPlaying ? { height: [4, 16, 4] } : { height: 4 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5 + bar * 0.1,
                    ease: 'easeInOut',
                  }}
                  className="w-1 bg-rose-500 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        key={`${currentTrack.id}-${currentTrack.url}`}
        ref={audioRef}
        src={currentTrack.isSynth ? undefined : (currentTrack.url || undefined)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        preload="auto"
      />
    </div>
  );
}
