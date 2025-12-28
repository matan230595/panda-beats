import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { Play, Pause, Search, ListPlus, Plus, Music, Heart, SkipForward, SkipBack, Maximize2, X, Trash2, Volume2 } from 'lucide-react';

const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;

const App = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef(null);
  
  // מערכת פלייליסטים ומועדפים - נשמר ב-LocalStorage
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('beats_pro_data');
    return saved ? JSON.parse(saved) : { "מועדפים": [], "פלייליסט חדש": [] };
  });
  const [activePlaylist, setActivePlaylist] = useState("מועדפים");

  useEffect(() => {
    localStorage.setItem('beats_pro_data', JSON.stringify(playlists));
  }, [playlists]);

  // פונקציית "שחרור שמע" לאייפון
  const unlockAudio = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();
    }
  };

  const handlePlaySong = (song) => {
    unlockAudio();
    setCurrentSong(song);
    setIsPlaying(true);
  };

  // קישור למערכת ההפעלה (Control Center)
  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: "Beats AI",
        artwork: [{ src: currentSong.img, sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
    }
  }, [currentSong]);

  const searchMusic = async () => {
    if (!query) return;
    try {
      const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: { part: 'snippet', maxResults: 12, q: query, type: 'video', videoCategoryId: '10', key: API_KEY }
      });
      setResults(data.items.map(v => ({
        id: v.id.videoId,
        title: v.snippet.title,
        img: v.snippet.thumbnails.medium.url
      })));
    } catch (e) { alert("שגיאה בחיפוש. בדוק את המפתח."); }
  };

  const toggleLike = (song) => {
    const isLiked = playlists["מועדפים"].some(s => s.id === song.id);
    let newList;
    if (isLiked) {
      newList = playlists["מועדפים"].filter(s => s.id !== song.id);
    } else {
      newList = [...playlists["מועדפים"], song];
    }
    setPlaylists({ ...playlists, "מועדפים": newList });
  };

  const handleNext = () => {
    const list = results.length > 0 ? results : playlists[activePlaylist];
    const idx = list.findIndex(s => s.id === currentSong?.id);
    if (idx !== -1 && idx < list.length - 1) handlePlaySong(list[idx + 1]);
  };

  const handlePrev = () => {
    const list = results.length > 0 ? results : playlists[activePlaylist];
    const idx = list.findIndex(s => s.id === currentSong?.id);
    if (idx > 0) handlePlaySong(list[idx - 1]);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden">
      
      {/* Side Navigation */}
      <aside className="w-64 bg-black/40 border-l border-white/5 hidden md:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse">
            <Music size={18} />
          </div>
          <h1 className="text-xl font-black tracking-tighter italic">BEATS AI</h1>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">הספריה שלך</p>
            {Object.keys(playlists).map(name => (
              <button 
                key={name} 
                onClick={() => {setActivePlaylist(name); setResults([]);}}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${activePlaylist === name && results.length === 0 ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-white/5'}`}
              >
                {name === "מועדפים" ? <Heart size={16} fill={activePlaylist === "מועדפים" ? "white" : "none"}/> : <ListPlus size={16}/>}
                <span className="text-sm font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative">
        <header className="p-6 flex justify-center bg-gradient-to-b from-black to-transparent">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              className="w-full bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl py-3 px-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="חפש שיר, אמן או פלייליסט..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-40">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black">{results.length > 0 ? 'תוצאות חיפוש' : activePlaylist}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {(results.length > 0 ? results : playlists[activePlaylist]).map((song) => (
              <div key={song.id} className="group bg-zinc-900/40 p-3 rounded-[24px] hover:bg-zinc-800 transition-all border border-white/5 relative">
                <div className="relative aspect-square mb-3 overflow-hidden rounded-[18px] shadow-xl">
                  <img src={song.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => handlePlaySong(song)}>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                      <Play fill="black" size={20} className="ml-1" />
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold truncate mb-2">{song.title}</div>
                <div className="flex justify-between items-center">
                  <Heart 
                    size={16} 
                    onClick={() => toggleLike(song)}
                    className={`cursor-pointer transition-colors ${playlists["מועדפים"].some(s => s.id === song.id) ? 'text-red-500 fill-red-500' : 'text-zinc-600 hover:text-white'}`} 
                  />
                  {results.length > 0 && (
                    <Plus size={16} className="text-zinc-600 hover:text-blue-500 cursor-pointer" onClick={() => {
                      const p = prompt("שם הפלייליסט להוספה:", "פלייליסט חדש");
                      if(p && playlists[p]) setPlaylists({...playlists, [p]: [...playlists[p], song]});
                    }}/>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Pro Player Bar */}
        {currentSong && (
          <footer className="fixed bottom-6 left-6 right-6 h-24 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[30px] px-6 flex items-center justify-between shadow-2xl z-50">
            <div className="flex items-center gap-4 w-1/3">
              <img src={currentSong.img} className={`w-14 h-14 rounded-2xl object-cover shadow-lg ${isPlaying ? 'animate-pulse' : ''}`} />
              <div className="hidden sm:block">
                <div className="text-sm font-bold truncate w-40">{currentSong.title}</div>
                <div className="text-[10px] text-blue-500 font-bold uppercase">מתנגן כעת</div>
              </div>
            </div>

            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center gap-8 mb-2">
                <SkipBack className="text-zinc-400 hover:text-white cursor-pointer transition" onClick={handlePrev} />
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                  {isPlaying ? <Pause size={20} fill="black"/> : <Play size={20} fill="black" className="ml-1"/>}
                </button>
                <SkipForward className="text-zinc-400 hover:text-white cursor-pointer transition" onClick={handleNext} />
              </div>
              <div className="w-full max-w-xs flex items-center gap-3">
                <span className="text-[9px] text-zinc-500 font-mono">{(played * duration || 0).toFixed(0)}s</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-blue-500" style={{ width: `${played * 100}%` }}></div>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">{(duration || 0).toFixed(0)}s</span>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 w-1/3">
               <Maximize2 size={18} className="text-zinc-400 cursor-pointer" onClick={() => setIsFocusMode(true)} />
            </div>
          </footer>
        )}

        {/* התיקון הקריטי לאייפון - נגן עם מנגנון שחזור אוטומטי */}
        {currentSong && (
          <div className="hidden">
            <ReactPlayer 
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${currentSong.id}`}
              playing={isPlaying}
              volume={1}
              muted={false}
              playsinline={true}
              config={{ youtube: { playerVars: { autoplay: 1, playsinline: 1, modestbranding: 1 } } }}
              onProgress={(p) => setPlayed(p.played)}
              onDuration={(d) => setDuration(d)}
              onEnded={handleNext}
              onPause={() => {
                // מנגנון שחזור: אם השיר נעצר בגלל ה-iOS, הוא מנסה לנגן שוב מיד
                if (isPlaying) setTimeout(() => setIsPlaying(true), 100);
              }}
            />
          </div>
        )}
      </div>

      {/* Focus Mode */}
      {isFocusMode && currentSong && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-10 animate-in fade-in">
          <button onClick={() => setIsFocusMode(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white"><X size={32} /></button>
          <img src={currentSong.img} className="w-72 h-72 md:w-[450px] md:h-[450px] object-cover rounded-[60px] shadow-[0_0_100px_rgba(59,130,246,0.3)] mb-10" />
          <h2 className="text-3xl md:text-5xl font-black text-center mb-6">{currentSong.title}</h2>
          <div className="flex items-center gap-10">
             <SkipBack size={32} onClick={handlePrev} className="cursor-pointer" />
             <button onClick={() => setIsPlaying(!isPlaying)} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
                {isPlaying ? <Pause size={30} fill="black"/> : <Play size={30} fill="black" className="ml-1"/>}
             </button>
             <SkipForward size={32} onClick={handleNext} className="cursor-pointer" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
