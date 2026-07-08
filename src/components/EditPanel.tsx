/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { ScrapbookData } from '../types';
import { Settings, Save, X, Edit, Plus, Trash2, Calendar, FileText, Heart, Image as ImageIcon, Music, Gift, Sparkles, Move, ZoomIn, ZoomOut, RotateCw, Crop, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { defaultScrapbookData } from '../defaultData';

interface EditPanelProps {
  data: ScrapbookData;
  onSave: (newData: ScrapbookData) => Promise<void>;
}

// Utility to compress base64 images client-side before saving to Firestore (keeps files light and fast)
function compressImage(file: File, maxDimension: number = 800, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        resolve(e.target?.result as string); // fallback
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function EditPanel({ data, onSave }: EditPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<ScrapbookData>(() => JSON.parse(JSON.stringify(data)));
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'timeline' | 'gallery' | 'reasons' | 'letter' | 'quiz' | 'music' | 'wishes' | 'surprise'>('general');

  // Saving states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editorSaveStatus, setEditorSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Photo Editor state variables
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [editorScale, setEditorScale] = useState<number>(1);
  const [editorRotate, setEditorRotate] = useState<number>(0);
  const [editorPosition, setEditorPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editorIsDragging, setEditorIsDragging] = useState<boolean>(false);
  const [editorDragStart, setEditorDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgDimensions, setImgDimensions] = useState({ width: 300, height: 300 });
  const [editorPreviewUrl, setEditorPreviewUrl] = useState<string>('');

  const editorImgRef = useRef<HTMLImageElement | null>(null);

  // Helper to draw cropped image on high-res 500x500 canvas
  const generateCroppedImage = (): string => {
    if (editingPhotoIndex === null || !editorImgRef.current) return '';
    
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Paint background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 500, 500);

    const factor = 500 / 300; // Viewport is 300x300, Canvas is 500x500

    // Translate to center of 500x500 canvas
    ctx.translate(250, 250);
    
    // Apply fine offset translation
    ctx.translate(editorPosition.x * factor, editorPosition.y * factor);

    // Apply rotation
    ctx.rotate((editorRotate * Math.PI) / 180);

    // Apply scaling
    ctx.scale(editorScale, editorScale);

    // Draw centering image
    const img = editorImgRef.current;
    ctx.drawImage(
      img, 
      -imgDimensions.width / 2, 
      -imgDimensions.height / 2, 
      imgDimensions.width, 
      imgDimensions.height
    );

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  // Live updates for Preview
  useEffect(() => {
    if (editingPhotoIndex !== null && imgDimensions.width > 0) {
      const timer = setTimeout(() => {
        const cropped = generateCroppedImage();
        setEditorPreviewUrl(cropped);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [editorScale, editorRotate, editorPosition, editingPhotoIndex, imgDimensions]);

  // Open editor and calculate initial fit/cover scale
  const openPhotoEditor = (index: number) => {
    setEditingPhotoIndex(index);
    const photo = formData.gallery[index];
    if (photo && photo.url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        // Set initial scale to completely cover the square container
        const coverScale = Math.max(300 / img.naturalWidth, 300 / img.naturalHeight) || 1;
        setEditorScale(coverScale);
        setEditorPosition({ x: 0, y: 0 });
        setEditorRotate(0);
        setEditorPreviewUrl('');
      };
      img.src = photo.url;
    }
  };

  const handleSaveAdjustedPhoto = async () => {
    if (editingPhotoIndex === null) return;
    const cropped = generateCroppedImage();
    if (cropped) {
      setEditorSaveStatus('saving');
      const updatedGallery = [...formData.gallery];
      updatedGallery[editingPhotoIndex] = {
        ...updatedGallery[editingPhotoIndex],
        url: cropped
      };
      const updatedData = { ...formData, gallery: updatedGallery };
      setFormData(updatedData);
      try {
        await onSave(updatedData);
        setEditorSaveStatus('saved');
        setTimeout(() => {
          setEditorSaveStatus('idle');
          setEditingPhotoIndex(null);
        }, 1200);
      } catch (err) {
        console.error("Failed to automatically save adjusted photo to central database:", err);
        setEditorSaveStatus('error');
        setTimeout(() => setEditorSaveStatus('idle'), 3000);
      }
    } else {
      setEditingPhotoIndex(null);
    }
  };

  // Sync state with parent prop when open toggles or database is updated
  useEffect(() => {
    if (isOpen) {
      setFormData(JSON.parse(JSON.stringify(data)));
    }
  }, [isOpen, data]);

  const handleToggleFeature = (featureKey: string) => {
    setFormData((prev) => {
      const currentFeatures = prev.enabledFeatures || {
        countdown: true,
        timeline: true,
        gallery: true,
        reasons: true,
        music: true,
        quiz: true,
        letter: true,
        futureWishes: true,
        surprise: true,
        finalSignoff: true,
      };
      return {
        ...prev,
        enabledFeatures: {
          ...currentFeatures,
          [featureKey]: !currentFeatures[featureKey as keyof typeof currentFeatures],
        },
      };
    });
  };

  const handleTextChange = (field: keyof ScrapbookData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await onSave(formData);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsOpen(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to save scrapbook to central database:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Timeline Event Handlers
  const handleTimelineChange = (idx: number, field: string, value: string) => {
    const updated = [...formData.timeline];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData((prev) => ({ ...prev, timeline: updated }));
  };

  const addTimelineItem = () => {
    const id = Date.now().toString();
    const newItem = {
      id,
      title: 'Our Sweet New Milestone 🎉',
      date: 'Month Year',
      icon: 'Heart',
      description: 'Click to tell the story of this beautiful moment and share it here with her.',
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800'
    };
    setFormData((prev) => ({ ...prev, timeline: [...prev.timeline, newItem] }));
  };

  const removeTimelineItem = (idx: number) => {
    if (formData.timeline.length <= 1) {
      alert("Please keep at least one timeline milestone!");
      return;
    }
    const filtered = formData.timeline.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, timeline: filtered }));
  };

  // Gallery Handlers
  const handleGalleryChange = (idx: number, field: string, value: string) => {
    const updated = [...formData.gallery];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData((prev) => ({ ...prev, gallery: updated }));
  };

  const addGalleryItem = () => {
    const id = Date.now().toString();
    const newItem = {
      id,
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800',
      caption: 'Click to customize this caption! ❤️',
    };
    setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, newItem] }));
  };

  const removeGalleryItem = (idx: number) => {
    if (formData.gallery.length <= 1) {
      alert("Please keep at least one polaroid photo!");
      return;
    }
    const filtered = formData.gallery.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, gallery: filtered }));
  };

  // Reasons Handlers
  const handleReasonChange = (idx: number, value: string) => {
    const updated = [...formData.reasons];
    updated[idx] = value;
    setFormData((prev) => ({ ...prev, reasons: updated }));
  };

  const addReasonItem = () => {
    setFormData((prev) => ({
      ...prev,
      reasons: [...prev.reasons, 'A beautiful reason why you make my soul incredibly happy. 💕']
    }));
  };

  const removeReasonItem = (idx: number) => {
    if (formData.reasons.length <= 1) {
      alert("Please keep at least one romantic reason!");
      return;
    }
    const filtered = formData.reasons.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, reasons: filtered }));
  };

  // Letter Handlers
  const handleLetterMetaChange = (field: 'salutation' | 'closing', value: string) => {
    setFormData((prev) => ({
      ...prev,
      letter: {
        ...prev.letter,
        [field]: value,
      },
    }));
  };

  const handleLetterParaChange = (idx: number, value: string) => {
    const updatedParas = [...formData.letter.paragraphs];
    updatedParas[idx] = value;
    setFormData((prev) => ({
      ...prev,
      letter: {
        ...prev.letter,
        paragraphs: updatedParas,
      },
    }));
  };

  // Quiz Handlers
  const handleQuizChange = (qIdx: number, field: string, value: any) => {
    const updated = [...formData.quiz];
    updated[qIdx] = { ...updated[qIdx], [field]: value };
    setFormData((prev) => ({ ...prev, quiz: updated }));
  };

  const handleQuizOptionChange = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...formData.quiz];
    const updatedOptions = [...updated[qIdx].options];
    updatedOptions[oIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: updatedOptions };
    setFormData((prev) => ({ ...prev, quiz: updated }));
  };

  const addQuizQuestion = () => {
    const id = Date.now().toString();
    const newQuestion = {
      id,
      question: 'New Cute Trivia Question? 🧠',
      options: [
        'Sweet Answer Choice A',
        'Candid Option Choice B',
        'Loving Option Choice C',
        'Comical Option Choice D'
      ],
      correctAnswerIndex: 0,
      cuteFeedbackCorrect: 'Correct! You got it right! ❤️',
      cuteFeedbackIncorrect: 'Whoops! Let us remember this moment next time. 🥰'
    };
    setFormData((prev) => ({ ...prev, quiz: [...prev.quiz, newQuestion] }));
  };

  const removeQuizQuestion = (qIdx: number) => {
    if (formData.quiz.length <= 1) {
      alert("A scrapbook should keep at least one quiz challenge!");
      return;
    }
    const filtered = formData.quiz.filter((_, i) => i !== qIdx);
    setFormData((prev) => ({ ...prev, quiz: filtered }));
  };

  // Music Handlers
  const handleMusicChange = (idx: number, field: string, value: any) => {
    const defaultPlay = defaultScrapbookData.playlist || [];
    const currentPlaylist = formData.playlist && formData.playlist.length > 0 ? [...formData.playlist] : JSON.parse(JSON.stringify(defaultPlay));
    if (currentPlaylist[idx]) {
      currentPlaylist[idx] = { ...currentPlaylist[idx], [field]: value };
    }
    setFormData((prev) => ({ ...prev, playlist: currentPlaylist }));
  };

  const addMusicTrack = () => {
    const defaultPlay = defaultScrapbookData.playlist || [];
    const currentPlaylist = formData.playlist && formData.playlist.length > 0 ? [...formData.playlist] : JSON.parse(JSON.stringify(defaultPlay));
    const id = Date.now().toString();
    const newTrack = {
      id,
      title: 'Our Sweet Journey Song 🎵',
      artist: 'Favorite Romantic Cover',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', // default royalty-free fallback
      isSynth: false,
    };
    setFormData((prev) => ({ ...prev, playlist: [...currentPlaylist, newTrack] }));
  };

  const removeMusicTrack = (idx: number) => {
    const defaultPlay = defaultScrapbookData.playlist || [];
    const currentPlaylist = formData.playlist && formData.playlist.length > 0 ? [...formData.playlist] : JSON.parse(JSON.stringify(defaultPlay));
    if (currentPlaylist.length <= 1) {
      alert("Please keep at least one soundtrack in your playlist!");
      return;
    }
    const filtered = currentPlaylist.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, playlist: filtered }));
  };

  // Future Wishes Handlers
  const handleWishChange = (idx: number, field: string, value: string) => {
    const updated = [...formData.futureWishes];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData((prev) => ({ ...prev, futureWishes: updated }));
  };

  const addWishItem = () => {
    const id = Date.now().toString();
    const newItem = {
      id,
      title: 'Our Next Beautiful Dream 🌟',
      description: 'Describe the wonderful place we will go or active bucket list project we will do together!',
      icon: 'Camera'
    };
    setFormData((prev) => ({ ...prev, futureWishes: [...prev.futureWishes, newItem] }));
  };

  const removeWishItem = (idx: number) => {
    if (formData.futureWishes.length <= 1) {
      alert("Please keep at least one dream wish!");
      return;
    }
    const filtered = formData.futureWishes.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, futureWishes: filtered }));
  };

  // Surprise Handlers
  const handleSurpriseChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      surpriseDetails: {
        ...prev.surpriseDetails,
        [field]: value
      }
    }));
  };

  return (
    <>
      {/* Floating Gear Trigger Button in Bottom Left away from main layout items */}
      <button
        onClick={() => setIsOpen(true)}
        style={{ zIndex: 99 }}
        className="fixed bottom-6 left-6 bg-slate-900 border border-slate-800 hover:bg-rose-950 text-white rounded-full p-4 shadow-2xl hover:scale-105 transition-all flex items-center gap-2 group cursor-pointer"
        title="Customize Scrapbook Details"
      >
        <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-350 text-xs font-mono font-bold tracking-wider uppercase block">
          Customize App
        </span>
      </button>

      {/* Expanded Modal Editor Drawer Container */}
      {isOpen && (
        <div style={{ zIndex: 120 }} className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-end">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col relative">
            
            {/* Header section with branding details */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-rose-950">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide uppercase font-mono">
                    Scrapbook Editor
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Customize names, dates, text & photos in real-time
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-slate-800 hover:bg-rose-900 duration-200 text-slate-350 hover:text-white p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editing tabs slider bar */}
            <div className="flex bg-slate-50 border-b border-neutral-200 overflow-x-auto text-xs font-mono font-bold tracking-wider uppercase scrollbar-none shrink-0 cursor-pointer select-none">
              {[
                { id: 'general', label: 'Primary' },
                { id: 'features', label: 'Features Layout' },
                { id: 'timeline', label: 'Story' },
                { id: 'gallery', label: 'Photos' },
                { id: 'reasons', label: '10 Reasons' },
                { id: 'letter', label: 'Letter' },
                { id: 'quiz', label: 'Quiz' },
                { id: 'music', label: 'Music' },
                { id: 'wishes', label: 'Dreams' },
                { id: 'surprise', label: 'Surprise' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 border-b-2 transition-colors shrink-0 ${
                    activeTab === tab.id
                      ? 'border-rose-600 bg-white text-rose-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable forms body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* FEATURE TOGGLES */}
              {activeTab === 'features' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                      Feature Customizer
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                      Enable or disable features of the scrapbook based on your preferences. Enabled features appear in the scroll list and side navigation menu. All options are interactive.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 mt-4">
                    {[
                      {
                        key: 'countdown',
                        title: 'Birthday Countdown ⏰',
                        description: 'Displays a live ticking block calculating days, hours, and minutes remaining to her special birthday.',
                      },
                      {
                        key: 'timeline',
                        title: 'Milestone Story Timeline 💬',
                        description: 'Generates an interactive chronological list of dates where you met, shared laughs, or had key fights.',
                      },
                      {
                        key: 'gallery',
                        title: 'Polaroid Photo Wall 📸',
                        description: 'Implements an aesthetic wood-table board of polaroids where you can link photos and write titles.',
                      },
                      {
                        key: 'reasons',
                        title: '10 Reasons Why I Love Thee ❤️',
                        description: 'Presents a bento tile grid of 10 customized sticky post-it reasons highlighting what makes her unique.',
                      },
                      {
                        key: 'music',
                        title: 'Cozy Melodies Playlist 🎶',
                        description: 'Embeds a lo-fi soundtrack playlist and customized music track selectors to accompany your read.',
                      },
                      {
                        key: 'quiz',
                        title: 'Trivia Relationship Quiz 🧠',
                        description: 'Creates a custom multi-choice trivia card setup with immediate cute responses for correct/incorrect answers.',
                      },
                      {
                        key: 'letter',
                        title: 'Handwritten Love Letter ✉️',
                        description: 'Sets up a vintage retro typewriter-styled fold-out envelope containing private customized letters.',
                      },
                      {
                        key: 'futureWishes',
                        title: 'Wishes & Adventures Corkboard ✈️',
                        description: 'Renders a beautiful physical-looking dreams corkboard showing goals you aspire to create together.',
                      },
                      {
                        key: 'surprise',
                        title: 'Locked Virtual Surprise 🎁',
                        description: 'Spawns a shaking gift box wrapped in ribbons that opens to reveal interactive surprise plans.',
                      },
                      {
                        key: 'finalSignoff',
                        title: 'Forever Sign-off Page ♾️',
                        description: 'Concludes the virtual experience with a dedicated warm credit page written fully in custom signatures.',
                      },
                    ].map((feature) => {
                      const featuresState = formData.enabledFeatures || {
                        countdown: true,
                        timeline: true,
                        gallery: true,
                        reasons: true,
                        music: true,
                        quiz: true,
                        letter: true,
                        futureWishes: true,
                        surprise: true,
                        finalSignoff: true,
                      };
                      const isEnabled = featuresState[feature.key as keyof typeof featuresState] !== false;
                      return (
                        <div
                          key={feature.key}
                          onClick={() => handleToggleFeature(feature.key)}
                          className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                            isEnabled
                              ? 'border-rose-100 bg-rose-50/20 hover:bg-rose-50/40 text-slate-800'
                              : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 text-slate-400'
                          }`}
                        >
                          <div className="flex-1 pr-4">
                            <span className={`text-xs font-mono font-bold block ${isEnabled ? 'text-rose-700' : 'text-slate-500'}`}>
                              {feature.title}
                            </span>
                            <span className="text-[10px] text-slate-400 leading-snug block mt-0.5">
                              {feature.description}
                            </span>
                          </div>
                          
                          {/* Beautiful Custom iOS-like state toggle switch knob */}
                          <div
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-250 ease-in-out shrink-0 ${
                              isEnabled ? 'bg-rose-600' : 'bg-slate-250'
                            }`}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-250 ease-in-out ${
                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PRIMARY DETAILS */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono border-b border-slate-100 pb-1">
                    Couple details & Countdown
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono font-bold text-slate-400 block mb-1">
                        Her English Name
                      </label>
                      <input
                        type="text"
                        value={formData.herName}
                        onChange={(e) => handleTextChange('herName', e.target.value)}
                        className="w-full text-sm p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono font-bold text-slate-400 block mb-1">
                        Your English Name
                      </label>
                      <input
                        type="text"
                        value={formData.partnerName}
                        onChange={(e) => handleTextChange('partnerName', e.target.value)}
                        className="w-full text-sm p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-slate-400 block mb-1">
                      Her Birthdate (for Countdown Timer)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="datetime-local"
                        value={formData.birthdate}
                        onChange={(e) => handleTextChange('birthdate', e.target.value)}
                        className="w-full text-sm p-2.5 pl-10 border rounded-xl bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-slate-400 block mb-1">
                      Birthday Welcome Banner Card Cover Image (Unsplash/Imgur URL)
                    </label>
                    <input
                      type="text"
                      value={formData.welcomeImage}
                      onChange={(e) => handleTextChange('welcomeImage', e.target.value)}
                      className="w-full text-sm p-2.5 border rounded-xl bg-slate-50 focus:bg-white font-mono text-xs text-rose-800"
                      placeholder="https://..."
                    />
                    <div className="flex items-center gap-2 mt-1.5">
                      <label className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 py-1.5 px-3.5 rounded-lg font-mono font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
                        <span>Upload photo from phone / computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file, 800, 0.75);
                                handleTextChange('welcomeImage', compressed);
                              } catch (err) {
                                console.error("Error compressing welcome image:", err);
                              }
                            }
                          }}
                        />
                      </label>
                      {formData.welcomeImage && formData.welcomeImage.startsWith('data:') ? (
                        <span className="text-[10px] text-emerald-650 font-mono font-bold">✓ Custom photo loaded</span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-slate-400 block mb-1">
                      Hero Greetings message
                    </label>
                    <textarea
                      rows={4}
                      value={formData.welcomeMessage}
                      onChange={(e) => handleTextChange('welcomeMessage', e.target.value)}
                      className="w-full text-sm p-2.5 border rounded-xl bg-slate-50 focus:bg-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-slate-400 block mb-1">
                      Surprise Envelope Lock message (revealed on unwrapping Gift Box)
                    </label>
                    <textarea
                      rows={5}
                      value={formData.surpriseDetails.message}
                      onChange={(e) => {
                        const message = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          surpriseDetails: { ...prev.surpriseDetails, message },
                        }));
                      }}
                      className="w-full text-sm p-2.5 border rounded-xl bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {/* TIMELINE SECTION */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                      Milestones Timeline
                    </h4>
                    <button
                      onClick={addTimelineItem}
                      className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 duration-200 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add milestone
                    </button>
                  </div>

                  {formData.timeline.map((event, index) => (
                    <div key={event.id} className="p-4 border border-rose-50 rounded-xl bg-rose-50/20 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full font-bold">
                          Milestone event {index + 1}
                        </span>
                        <button
                          onClick={() => removeTimelineItem(index)}
                          className="p-1 px-2 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-lg flex items-center gap-1 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                          title="Delete Milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div>
                          <label className="text-[10px] font-mono font-bold text-slate-400 block">Title</label>
                          <input
                            type="text"
                            value={event.title}
                            onChange={(e) => handleTimelineChange(index, 'title', e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono font-bold text-slate-400 block">Date Label</label>
                          <input
                            type="text"
                            value={event.date}
                            onChange={(e) => handleTimelineChange(index, 'date', e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">Photo Image URL</label>
                        <input
                          type="text"
                          value={event.image || ''}
                          onChange={(e) => handleTimelineChange(index, 'image', e.target.value)}
                          className="w-full text-[10px] p-2 border rounded-lg bg-white font-mono text-indigo-700"
                          placeholder="https://..."
                        />
                        <div className="flex items-center gap-2 mt-1.5">
                          <label className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 py-1 px-2.5 rounded-md font-mono font-bold cursor-pointer inline-flex items-center justify-center gap-1 transition-colors">
                            <ImageIcon className="w-3 h-3 text-rose-600" />
                            <span>Upload milestone photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressed = await compressImage(file, 800, 0.75);
                                    handleTimelineChange(index, 'image', compressed);
                                  } catch (err) {
                                    console.error("Error compressing milestone image:", err);
                                  }
                                }
                              }}
                            />
                          </label>
                          {event.image && event.image.startsWith('data:') ? (
                            <span className="text-[9px] text-emerald-650 font-mono font-bold">✓ Uploaded local image</span>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 block mb-1.5">Event Theme Icon</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: 'MessageSquare', label: '💬 Chat' },
                            { name: 'Coffee', label: '☕ Canteen' },
                            { name: 'Heart', label: '❤️ Love' },
                            { name: 'CloudRain', label: '🌧️ Rain/Fight' },
                            { name: 'Bus', label: '🚌 Bus' },
                            { name: 'HeartHandshake', label: '🤝 NSS Band' },
                            { name: 'Sparkles', label: '✨ Sparkles' },
                            { name: 'Flame', label: '🔥 Conflict' },
                            { name: 'Gift', label: '🎁 Gift/Surprise' },
                            { name: 'MapPin', label: '📍 Meeting' },
                            { name: 'Camera', label: '📸 Photo' },
                            { name: 'Music', label: '🎵 Music' },
                            { name: 'Smile', label: '😊 Smile' },
                          ].map((option) => (
                            <button
                              key={option.name}
                              type="button"
                              onClick={() => handleTimelineChange(index, 'icon', option.name)}
                              className={`px-2 py-1 text-[10px] font-mono rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                                event.icon === option.name
                                  ? 'bg-rose-600 border-rose-600 text-white font-bold shadow-xs'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">Description Story</label>
                        <textarea
                          rows={3}
                          value={event.description}
                          onChange={(e) => handleTimelineChange(index, 'description', e.target.value)}
                          className="w-full text-xs p-2 border rounded-lg bg-white resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* GALLERY MANAGER */}
              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                      Polaroid Photos (5 to 15 recommended)
                    </h4>
                    <button
                      onClick={addGalleryItem}
                      className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 duration-200 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add photo
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {formData.gallery.map((photo, index) => (
                      <div key={photo.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex gap-4 items-center relative">
                        <div className="w-16 h-16 rounded-md bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {photo.url && photo.url.trim() !== '' ? (
                            <img src={photo.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="flex flex-col gap-1.5">
                            <input
                              type="text"
                              value={photo.url}
                              onChange={(e) => handleGalleryChange(index, 'url', e.target.value)}
                              placeholder="Image source URL"
                              className="w-full text-[10px] p-1.5 border rounded bg-white font-mono text-rose-800"
                            />
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 py-1 px-2.5 rounded-md font-mono font-bold cursor-pointer inline-flex items-center justify-center gap-1 transition-colors">
                                <ImageIcon className="w-3 h-3 text-rose-600" />
                                <span>Upload photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const compressed = await compressImage(file, 800, 0.75);
                                        handleGalleryChange(index, 'url', compressed);
                                      } catch (err) {
                                        console.error("Error compressing gallery image:", err);
                                      }
                                    }
                                  }}
                                />
                              </label>
                              {photo.url && photo.url.trim() !== '' && (
                                <button
                                  type="button"
                                  onClick={() => openPhotoEditor(index)}
                                  className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 py-1 px-2.5 rounded-md font-mono font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                                  title="Reposition, Zoom, Rotate or Crop Photo"
                                >
                                  <Move className="w-3 h-3 text-amber-600" />
                                  <span>Adjust/Crop Photo</span>
                                </button>
                              )}
                              {photo.url && photo.url.startsWith('data:') ? (
                                <span className="text-[9px] text-emerald-650 font-mono font-bold">✓ Uploaded local image</span>
                              ) : null}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={photo.caption}
                            onChange={(e) => handleGalleryChange(index, 'caption', e.target.value)}
                            placeholder="Cute caption"
                            className="w-full text-xs p-1.5 border rounded bg-white font-sans"
                          />
                        </div>
                        <button
                          onClick={() => removeGalleryItem(index)}
                          className="p-2 border border-rose-100 hover:bg-red-50 text-red-500 hover:text-red-600 duration-200 rounded-full"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* reasons */}
              {activeTab === 'reasons' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                      Reasons You Love Her
                    </h4>
                    <button
                      onClick={addReasonItem}
                      className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 duration-200 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add reason
                    </button>
                  </div>
                  {formData.reasons.map((reason, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <span className="w-7 h-7 rounded-full bg-slate-100 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => handleReasonChange(idx, e.target.value)}
                        className="w-full text-sm p-2.5 border rounded-xl bg-slate-50 focus:bg-white flex-1"
                        placeholder={`Reason ${idx + 1}`}
                      />
                      <button
                        onClick={() => removeReasonItem(idx)}
                        className="p-2.5 border border-rose-100 hover:bg-rose-50 text-rose-600 duration-200 rounded-xl cursor-pointer"
                        title="Delete Reason"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* HEARTFELT LETTER */}
              {activeTab === 'letter' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono border-b border-slate-100 pb-1">
                    Typewriter letter details
                  </h4>
                  <div>
                    <label className="text-xs font-mono font-bold text-slate-400 block mb-1">
                      Salutation
                    </label>
                    <input
                      type="text"
                      value={formData.letter.salutation}
                      onChange={(e) => handleLetterMetaChange('salutation', e.target.value)}
                      className="w-full text-sm p-2.5 border rounded-xl bg-slate-50 focus:bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semi font-mono block mb-1 mt-3">Paragraph 1</label>
                    <textarea
                      rows={3}
                      value={formData.letter.paragraphs[0] || ''}
                      onChange={(e) => handleLetterParaChange(0, e.target.value)}
                      className="w-full text-xs p-2 border rounded bg-slate-50"
                    />
                    <label className="text-sm font-semi font-mono block mb-1 mt-3">Paragraph 2</label>
                    <textarea
                      rows={3}
                      value={formData.letter.paragraphs[1] || ''}
                      onChange={(e) => handleLetterParaChange(1, e.target.value)}
                      className="w-full text-xs p-2 border rounded bg-slate-50"
                    />
                    <label className="text-sm font-semi font-mono block mb-1 mt-3">Paragraph 3</label>
                    <textarea
                      rows={3}
                      value={formData.letter.paragraphs[2] || ''}
                      onChange={(e) => handleLetterParaChange(2, e.target.value)}
                      className="w-full text-xs p-2 border rounded bg-slate-50"
                    />
                    <label className="text-sm font-semi font-mono block mb-1 mt-3">Paragraph 4</label>
                    <textarea
                      rows={3}
                      value={formData.letter.paragraphs[3] || ''}
                      onChange={(e) => handleLetterParaChange(3, e.target.value)}
                      className="w-full text-xs p-2 border rounded bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-slate-400 block mb-1">
                      Closing sign-off
                    </label>
                    <input
                      type="text"
                      value={formData.letter.closing}
                      onChange={(e) => handleLetterMetaChange('closing', e.target.value)}
                      className="w-full text-sm p-2.5 border rounded-xl bg-slate-50 focus:bg-white italic"
                    />
                  </div>
                </div>
              )}

              {/* QUIZ SECTION */}
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                      Trivia Quiz Cards
                    </h4>
                    <button
                      onClick={addQuizQuestion}
                      className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 duration-200 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add question
                    </button>
                  </div>

                  {formData.quiz.map((question, qIdx) => (
                    <div key={question.id} className="p-4 border border-rose-50 rounded-xl bg-slate-50/50 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full">
                          Trivia card {qIdx + 1}
                        </span>
                        <button
                          onClick={() => removeQuizQuestion(qIdx)}
                          className="p-1 px-2 border border-indigo-100 hover:bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-1 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">Question Text</label>
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => handleQuizChange(qIdx, 'question', e.target.value)}
                          className="w-full text-xs p-2 border rounded bg-white font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">Multiple choice options</label>
                        {question.options.map((option, oIdx) => (
                          <div key={oIdx} className="flex gap-2 items-center">
                            <input
                              type="radio"
                              name={`quiz-correct-${question.id}`}
                              checked={question.correctAnswerIndex === oIdx}
                              onChange={() => handleQuizChange(qIdx, 'correctAnswerIndex', oIdx)}
                              className="accent-rose-600 cursor-pointer"
                              title="Mark as Correct Answer"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleQuizOptionChange(qIdx, oIdx, e.target.value)}
                              className="w-full text-[11px] p-1.5 border rounded bg-white"
                              placeholder={`Option ${oIdx + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="text-[9px] font-mono font-bold text-slate-400 block">Feedback if Correct</label>
                          <input
                            type="text"
                            value={question.cuteFeedbackCorrect}
                            onChange={(e) => handleQuizChange(qIdx, 'cuteFeedbackCorrect', e.target.value)}
                            className="w-full text-[10px] p-1.5 border rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono font-bold text-slate-400 block">Feedback if Incorrect</label>
                          <input
                            type="text"
                            value={question.cuteFeedbackIncorrect}
                            onChange={(e) => handleQuizChange(qIdx, 'cuteFeedbackIncorrect', e.target.value)}
                            className="w-full text-[10px] p-1.5 border rounded bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MUSIC PLAYLIST SECTION */}
              {activeTab === 'music' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                      Cozy Playlist Soundtrack
                    </h4>
                    <button
                      onClick={addMusicTrack}
                      className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 duration-200 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Track
                    </button>
                  </div>

                  {(() => {
                    const defaultPlay = defaultScrapbookData.playlist || [];
                    const tracks = formData.playlist && formData.playlist.length > 0 ? formData.playlist : defaultPlay;
                    return tracks.map((track, index) => (
                      <div key={track.id} className="p-4 border border-rose-50 rounded-xl bg-slate-50/50 space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full">
                            Soundtrack track #{index + 1}
                          </span>
                          <button
                            onClick={() => removeMusicTrack(index)}
                            className="p-1 px-2 border border-indigo-100 hover:bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-1 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                            title="Delete Track"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Delete</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-slate-400 block">Track Title</label>
                            <input
                              type="text"
                              value={track.title}
                              onChange={(e) => handleMusicChange(index, 'title', e.target.value)}
                              className="w-full text-xs p-2 border rounded bg-white font-bold"
                              placeholder="Track Title"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-slate-400 block">Artist Name / Tag</label>
                            <input
                              type="text"
                              value={track.artist}
                              onChange={(e) => handleMusicChange(index, 'artist', e.target.value)}
                              className="w-full text-xs p-2 border rounded bg-white"
                              placeholder="Artist name"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono font-bold text-slate-400 block mb-1">
                            Audio Source Mode
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 text-xs font-mono text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                checked={track.isSynth === true}
                                onChange={() => handleMusicChange(index, 'isSynth', true)}
                                className="accent-rose-600"
                              />
                              <span>Musicbox Synth (Web Audio)</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-xs font-mono text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                checked={track.isSynth === false}
                                onChange={() => handleMusicChange(index, 'isSynth', false)}
                                className="accent-rose-600"
                              />
                              <span>Audio File (Stream link or upload)</span>
                            </label>
                          </div>
                        </div>

                        {!track.isSynth && (
                          <div className="space-y-2 pt-1 border-t border-slate-100 mt-2">
                            <div>
                              <label className="text-[10px] font-mono font-bold text-slate-400 block">External Audio URL (.mp3)</label>
                              <input
                                type="text"
                                value={track.url}
                                onChange={(e) => handleMusicChange(index, 'url', e.target.value)}
                                className="w-full text-[10px] p-2 border rounded bg-white font-mono text-indigo-700"
                                placeholder="https://www.soundhelix.com/examples/mp3/..."
                              />
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <label className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 py-1 px-2.5 rounded-md font-mono font-bold cursor-pointer inline-flex items-center justify-center gap-1 transition-colors">
                                <Music className="w-3.5 h-3.5 text-rose-600" />
                                <span>Upload Audio File (.mp3/.wav/.ogg)</span>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 450 * 1024) {
                                        alert("To ensure your scrapbook saves reliably in the cloud and works across all devices, audio uploads are limited to 450KB. For longer songs, please paste an external audio URL (like an mp3 link) or choose 'Musicbox Synth'!");
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        const base64 = ev.target?.result as string;
                                        handleMusicChange(index, 'url', base64);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              {track.url && track.url.startsWith('data:') ? (
                                <span className="text-[9px] text-emerald-650 font-mono font-bold">✓ Uploaded local audio track</span>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* FUTURE WISHES / BUCKET LIST SECTION */}
              {activeTab === 'wishes' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                      Dreams & Bucket List
                    </h4>
                    <button
                      onClick={addWishItem}
                      className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 duration-200 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Dream
                    </button>
                  </div>

                  {formData.futureWishes.map((wish, index) => (
                    <div key={wish.id} className="p-4 border border-indigo-50 rounded-xl bg-slate-50/50 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full">
                          Dream Wish #{index + 1}
                        </span>
                        <button
                          onClick={() => removeWishItem(index)}
                          className="p-1 px-2 border border-indigo-100 hover:bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-1 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                          title="Delete Wish"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Delete</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono font-bold text-slate-400 block">Wish Title</label>
                          <input
                            type="text"
                            value={wish.title}
                            onChange={(e) => handleWishChange(index, 'title', e.target.value)}
                            className="w-full text-xs p-2.5 border rounded-xl bg-white font-bold text-slate-800 focus:bg-white"
                            placeholder="e.g. Visit Paris together 🗼"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono font-bold text-slate-400 block">Icon Identifier</label>
                          <select
                            value={wish.icon}
                            onChange={(e) => handleWishChange(index, 'icon', e.target.value)}
                            className="w-full text-xs p-2.5 border rounded-xl bg-white text-slate-700 font-mono"
                          >
                            <option value="Heart">Heart ❤️</option>
                            <option value="Camera">Camera 📸</option>
                            <option value="Compass">Compass 🧭</option>
                            <option value="Coffee">Coffee ☕</option>
                            <option value="Gift">Gift 🎁</option>
                            <option value="Star">Star ⭐</option>
                            <option value="Sparkles">Sparkles ✨</option>
                            <option value="Smile">Smile 😊</option>
                            <option value="Calendar">Calendar 📅</option>
                            <option value="Music">Music 🎵</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 block mb-1">Description / Backstory</label>
                        <textarea
                          rows={2}
                          value={wish.description}
                          onChange={(e) => handleWishChange(index, 'description', e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-xl bg-white text-slate-700 leading-relaxed"
                          placeholder="Why this dream matter and what we will do..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* VIRTUAL SURPRISE SECTION */}
              {activeTab === 'surprise' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-1">
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                      Locked Surprise Settings
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-mono font-bold text-slate-600 block mb-1">
                        Surprise Message 🎁
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">
                        This is the sweet private message, certificate, voucher, or secret poem that gets revealed when she taps and unwraps the locked shaking gift box!
                      </p>
                      <textarea
                        rows={6}
                        value={formData.surpriseDetails.message}
                        onChange={(e) => handleSurpriseChange('message', e.target.value)}
                        className="w-full text-sm p-3.5 border rounded-2xl bg-slate-50 focus:bg-white text-slate-800 leading-relaxed font-sans"
                        placeholder="Write something truly magical here..."
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer triggers */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex gap-3 justify-end leading-none">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-mono font-bold uppercase tracking-wider bg-white border border-slate-250 hover:bg-slate-50 text-slate-550 px-4 py-3 rounded-full transition-colors cursor-pointer"
              >
                Close Editor
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="text-xs font-mono font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 duration-200 text-white px-5 py-3 rounded-full flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block shrink-0" />
                    <span>Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <span>Saved ✓</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <span>Error! ❌</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Scrapbook</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Interactive Photo Editor Modal Overlay */}
      {editingPhotoIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 md:p-8 z-[150] animate-fade-in">
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-2xl max-w-4xl w-full flex flex-col gap-6 max-h-[95vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
                  <Crop className="w-5 h-5 text-rose-500 animate-pulse" />
                  <span>Interactive Photo Adjustment</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Drag, zoom, rotate, and reposition your memory photo to fit the polaroid frame perfectly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPhotoIndex(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Left Side: Interactive Editor Canvas */}
              <div className="flex flex-col items-center gap-4">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider self-start">
                  1. Drag and Adjust
                </span>
                
                {/* Viewport Frame */}
                <div
                  className="relative w-[300px] h-[300px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-dashed border-rose-500/50 shadow-inner flex items-center justify-center cursor-move"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setEditorIsDragging(true);
                    setEditorDragStart({ x: e.clientX - editorPosition.x, y: e.clientY - editorPosition.y });
                  }}
                  onMouseMove={(e) => {
                    if (!editorIsDragging) return;
                    setEditorPosition({
                      x: e.clientX - editorDragStart.x,
                      y: e.clientY - editorDragStart.y
                    });
                  }}
                  onMouseUp={() => setEditorIsDragging(false)}
                  onMouseLeave={() => setEditorIsDragging(false)}
                  onTouchStart={(e) => {
                    setEditorIsDragging(true);
                    const touch = e.touches[0];
                    setEditorDragStart({ x: touch.clientX - editorPosition.x, y: touch.clientY - editorPosition.y });
                  }}
                  onTouchMove={(e) => {
                    if (!editorIsDragging) return;
                    const touch = e.touches[0];
                    setEditorPosition({
                      x: touch.clientX - editorDragStart.x,
                      y: touch.clientY - editorDragStart.y
                    });
                  }}
                  onTouchEnd={() => setEditorIsDragging(false)}
                >
                  {formData.gallery[editingPhotoIndex]?.url ? (
                    <img
                      ref={editorImgRef}
                      src={formData.gallery[editingPhotoIndex].url}
                      alt="Memory to adjust"
                      className="max-w-none max-h-none pointer-events-none select-none"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: `${imgDimensions.width}px`,
                        height: `${imgDimensions.height}px`,
                        transform: `translate(-50%, -50%) translate(${editorPosition.x}px, ${editorPosition.y}px) scale(${editorScale}) rotate(${editorRotate}deg)`,
                        transformOrigin: 'center center',
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">No image loaded</span>
                  )}
                  
                  {/* Rule of Thirds Guide overlay (subtle lines) */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* Drag helper tooltip */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-[9px] font-mono uppercase tracking-widest text-slate-300 px-2.5 py-0.5 rounded-full pointer-events-none">
                    Drag image inside frame
                  </div>
                </div>

                {/* Precision Controls */}
                <div className="w-full space-y-4">
                  
                  {/* Zoom / Rotate Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5 text-slate-400" /> Zoom ({Math.round(editorScale * 100)}%)
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditorScale(prev => Math.max(prev * 0.85, 0.05))}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded text-white cursor-pointer"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorScale(prev => Math.min(prev * 1.15, 8))}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold rounded text-white cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="4"
                        step="0.01"
                        value={editorScale}
                        onChange={(e) => setEditorScale(Number(e.target.value))}
                        className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                          <RotateCw className="w-3.5 h-3.5 text-slate-400" /> Rotate ({editorRotate}°)
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditorRotate(prev => (prev + 90) % 360)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] font-mono font-bold rounded text-white flex items-center gap-0.5 cursor-pointer"
                        >
                          +90°
                        </button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={editorRotate}
                        onChange={(e) => setEditorRotate(Number(e.target.value))}
                        className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* D-Pad positioner and quick buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 gap-4">
                    <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block text-center sm:text-left">Quick Transforms</span>
                      <div className="flex gap-1.5 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => {
                            const coverScale = Math.max(300 / imgDimensions.width, 300 / imgDimensions.height) || 1;
                            setEditorScale(coverScale);
                            setEditorPosition({ x: 0, y: 0 });
                            setEditorRotate(0);
                          }}
                          className="text-[10px] font-mono font-bold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const fitScale = Math.min(300 / imgDimensions.width, 300 / imgDimensions.height) || 1;
                            setEditorScale(fitScale);
                            setEditorPosition({ x: 0, y: 0 });
                            setEditorRotate(0);
                          }}
                          className="text-[10px] font-mono font-bold px-2.5 py-1 bg-rose-950/50 hover:bg-rose-900 border border-rose-800/50 text-rose-200 rounded-md transition-colors cursor-pointer"
                          title="Scale image so the whole photo fits inside the box"
                        >
                          Fit to Frame
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorPosition({ x: 0, y: 0 })}
                          className="text-[10px] font-mono font-bold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          Center
                        </button>
                      </div>
                    </div>

                    {/* Arrow Directional D-Pad */}
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditorPosition(p => ({ ...p, y: p.y - 15 }))}
                        className="absolute top-0 w-6 h-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:bg-rose-600 active:border-rose-600 rounded flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorPosition(p => ({ ...p, x: p.x - 15 }))}
                        className="absolute left-0 w-6 h-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:bg-rose-600 active:border-rose-600 rounded flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-3 h-3 bg-slate-900 rounded-full" />
                      <button
                        type="button"
                        onClick={() => setEditorPosition(p => ({ ...p, x: p.x + 15 }))}
                        className="absolute right-0 w-6 h-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:bg-rose-600 active:border-rose-600 rounded flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorPosition(p => ({ ...p, y: p.y + 15 }))}
                        className="absolute bottom-0 w-6 h-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:bg-rose-600 active:border-rose-600 rounded flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Side: Live Crop Preview */}
              <div className="flex flex-col items-center gap-4 justify-between h-full py-2">
                <div className="w-full flex flex-col items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider self-start">
                    2. Final Live Preview (500x500 square)
                  </span>
                  
                  <div className="relative w-[280px] h-[280px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                    {editorPreviewUrl ? (
                      <img
                        src={editorPreviewUrl}
                        alt="Live crop preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center space-y-2 p-4">
                        <div className="w-8 h-8 rounded-full border-2 border-t-rose-500 border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto" />
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Generating preview...</p>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-450 leading-relaxed text-center max-w-xs">
                    This preview reflects the exact bounding box, zoom, rotation, and alignment cropped down.
                  </p>
                </div>

                {/* Actions */}
                <div className="w-full flex gap-3 pt-6 md:pt-12 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingPhotoIndex(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-bold border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAdjustedPhoto}
                    disabled={editorSaveStatus === 'saving'}
                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editorSaveStatus === 'saving' ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block shrink-0" />
                        <span>Saving to Cloud...</span>
                      </>
                    ) : editorSaveStatus === 'saved' ? (
                      <>
                        <span>Saved ✓</span>
                      </>
                    ) : editorSaveStatus === 'error' ? (
                      <>
                        <span>Error! ❌</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Adjusted Photo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
