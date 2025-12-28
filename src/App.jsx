import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { Play, Pause, Search, ListPlus, Plus, Disc, SkipForward, SkipBack, Maximize2, Volume2, X, Music, Heart } from 'lucide-react';

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
  
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('beats_v4_playlists');
    return saved ? JSON.parse(saved) : { "המועדפים שלי": [] };
  });
  const [activePlaylist, setActivePlaylist] = useState("המועדפים שלי");

  useEffect(() => {
    localStorage.setItem('beats_v4_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // הגדרות Media Session - זה מה שמאפשר שליטה מה-Control Center ומהאייפון
  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: 'Beats AI',
        artwork: [
          { src: currentSong.img, sizes: '512x512', type: 'image/png' },
          { src: currentSong.img, sizes: '384x384', type: 'image/png' },
        ]
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
        params: { 
          part: 'snippet', 
          maxResults: 15, 
          q: query, 
          type: 'video', 
          videoCategoryId: '10', // קטגוריית מוזיקה בלבד
          key: API_KEY 
        }
      });
      setResults(data.items);
    } catch (e) { alert("שגיאה בחיפוש. וודא שהמפתח תקין."); }
  };

  const handleNext = () => {
    const list = playlists[activePlaylist];
    const currentIndex = list.findIndex(s => s.id === currentSong?.id);
    if (currentIndex !== -1 && currentIndex < list.length - 1) {
      setCurrentSong(list[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    const list = playlists[activePlaylist];
    const currentIndex = list.findIndex(s => s.id === currentSong?.id);
    if (currentIndex > 0) {
      setCurrentSong(list[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex h-screen bg-[#020202] text-zinc-100 font-sans overflow-hidden">
      
      {/* Sidebar - Desktop Only */}
      <aside className="w-72 bg-black border-l border-white/5 hidden lg:flex flex-col">
        <div className="p-8 text-2xl font-black italic tracking-tighter text-blue-500 flex items-center gap-3">
          <div className={`p-2 bg-blue-500/10 rounded-xl ${isPlaying ? 'animate-pulse' : ''}`}>
            <Music size={24} />
          </div>
          BEATS AI
        </div>
        
        <nav className="flex-1 px-6 space-y-6 overflow-y-auto">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">ספריה</p>
            <button onClick={() => {
              const n = prompt("שם הפלייליסט:");
              if(n) setPlaylists({...playlists, [n]: []});
            }} className="w-full flex items-center gap-3 p-3 bg-zinc-900/50 hover:bg-blue-600/20 rounded-2xl text-sm transition-all group">
              <Plus size={18} className="group-hover:rotate-90 transition-transform" /> צור פלייליסט חדש
            </button>
          </div>

          <div className="space-y-1">
            {Object.keys(playlists).map(name => (
              <div key={name} onClick={() => setActivePlaylist(name)} 
                className={`p-3 rounded-2xl cursor-pointer text-sm font-medium transition-all ${activePlaylist === name ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:bg-zinc-900'}`}>
                {name}
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Top Header */}
        <header className="p-6 flex justify-between items-center bg-gradient-to-b from-black to-transparent z-10">
          <div className="relative w-full max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              className="w-full bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-2xl py-3 px-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="חפש שיר, אמן או אלבום..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
            />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 pb-32">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-black">{results.length > 0 ? 'תוצאות חיפוש' : activePlaylist}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(results.length > 0 ? results.map(v => ({id: v.id.videoId, title: v.snippet.title, img: v.snippet.thumbnails.medium.url})) : playlists[activePlaylist]).map((song) => (
              <div key={song.id} className="group bg-zinc-900/30 backdrop-blur-sm border border-white/5 p-4 rounded-[32px] hover:bg-white/5 transition-all duration-300">
                <div className="relative aspect-square mb-4 overflow-hidden rounded-[24px]">
                  <img src={song.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button 
                      onClick={() => {setCurrentSong(song); setIsPlaying(true);}}
                      className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300"
                    >
                      <Play fill="black" size={24} className="ml-1" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-bold truncate pr-1">{song.title}</div>
                <div className="flex justify-between items-center mt-3">
                  <button onClick={() => {
                    const target = prompt("לאיזה פלייליסט להוסיף?", activePlaylist);
                    if(target && playlists[target]) {
                      const updated = [...playlists[target], song];
                      setPlaylists({...playlists, [target]: updated});
                    }
                  }} className="text-[10px] font-bold text-zinc-500 hover:text-blue-500 flex items-center gap-1 transition-colors">
                    <ListPlus size={14} /> הוסף
                  </button>
                  <Heart size={14} className="text-zinc-700 hover:text-red-500 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Player Bar - Floating Glassmorphism */}
        {currentSong && (
          <footer className="fixed bottom-6 left-6 right-6 h-24 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[30px] px-6 flex items-center justify-between shadow-2xl z-50 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-center gap-4 w-1/3">
              <img src={currentSong.img} className={`w-14 h-14 rounded-2xl object-cover shadow-lg ${isPlaying ? 'animate-pulse' : ''}`} />
              <div className="hidden sm:block truncate">
                <div className="text-sm font-bold truncate w-40">{currentSong.title}</div>
                <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">מתנגן כעת</div>
              </div>
            </div>

            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center gap-8 mb-2">
                <SkipBack className="text-zinc-400 hover:text-white cursor-pointer transition" onClick={handlePrev} />
                <button 
                  onClick={() => setIsPlaying(!isPlaying)} 
                  className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-white/10"
                >
                  {isPlaying ? <Pause size={20} fill="black"/> : <Play size={20} fill="black" className="ml-1"/>}
                </button>
                <SkipForward className="text-zinc-400 hover:text-white cursor-pointer transition" onClick={handleNext} />
              </div>
              
              <div className="w-full max-w-xs flex items-center gap-3">
                <span className="text-[9px] font-mono text-zinc-500">{formatTime(played * duration)}</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full relative">
                  <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" style={{ width: `${played * 100}%` }}></div>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 w-1/3 text-zinc-400">
              <Volume2 size={18} className="hidden sm:block" />
              <button onClick={() => setIsFocusMode(!isFocusMode)} className="hover:text-white transition">
                <Maximize2 size={18} />
              </button>
            </div>
          </footer>
        )}

        {/* Hidden YouTube Engine - iOS Background Fix */}
        {currentSong && (
          <div className="pointer-events-none absolute h-0 w-0 overflow-hidden">
            <ReactPlayer 
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${currentSong.id}`}
              playing={isPlaying}
              onProgress={(p) => setPlayed(p.played)}
              onDuration={(d) => setDuration(d)}
              onEnded={handleNext}
              playsinline={true} // קריטי לאייפון
              config={{
                youtube: {
                  playerVars: { 
                    autoplay: 1, 
                    modestbranding: 1,
                    playsinline: 1,
                    origin: window.location.origin
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Focus Mode Overlay */}
      {isFocusMode && currentSong && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
          <button onClick={() => setIsFocusMode(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white">
            <X size={32} />
          </button>
          <img src={currentSong.img} className={`w-[300px] md:w-[500px] aspect-square object-cover rounded-[60px] shadow-[0_0_100px_rgba(59,130,246,0.3)] mb-12 ${isPlaying ? 'scale-105' : 'scale-95'} transition-transform duration-[2000ms]`} />
          <h2 className="text-3xl md:text-5xl font-black text-center max-w-3xl mb-4 line-clamp-2">{currentSong.title}</h2>
          <div className="text-blue-500 font-bold tracking-[0.3em] uppercase">Beats AI Experience</div>
        </div>
      )}
    </div>
  );
};

export default App;
