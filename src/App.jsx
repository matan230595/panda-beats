import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { Play, Pause, Search, ListPlus, Plus, Music, Heart, SkipForward, SkipBack, Maximize2, X, Volume2 } from 'lucide-react';

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
    const saved = localStorage.getItem('beats_ultra_v1');
    return saved ? JSON.parse(saved) : { "מועדפים": [] };
  });
  const [activePlaylist, setActivePlaylist] = useState("מועדפים");

  useEffect(() => {
    localStorage.setItem('beats_ultra_v1', JSON.stringify(playlists));
  }, [playlists]);

  // פונקציית זהב לאייפון - חייבים לקרוא לה בלחיצת כפתור
  const handlePlaySong = (song) => {
    // יוצר אינטראקציה ראשונית שהאייפון אוהב
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();
    }
    setCurrentSong(song);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: "Beats AI",
        artwork: [{ src: currentSong.img, sizes: '300x300', type: 'image/png' }]
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
        params: { part: 'snippet', maxResults: 15, q: query, type: 'video', videoCategoryId: '10', key: API_KEY }
      });
      setResults(data.items.map(v => ({
        id: v.id.videoId,
        title: v.snippet.title,
        img: v.snippet.thumbnails.medium.url
      })));
    } catch (e) { console.error(e); }
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
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 border-l border-white/5 hidden md:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center"><Music size={16} /></div>
          <h1 className="text-xl font-bold tracking-tighter">BEATS AI</h1>
        </div>
        <button onClick={() => {setActivePlaylist("מועדפים"); setResults([]);}} className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${activePlaylist === "מועדפים" ? 'bg-blue-600' : 'hover:bg-white/5'}`}>
          <Heart size={18} /> מועדפים
        </button>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative">
        
        {/* נגן הווידאו המינימלי - זה התיקון הקריטי! */}
        {currentSong && (
          <div className="fixed top-2 right-2 z-[60] w-[100px] h-[60px] overflow-hidden rounded-lg shadow-2xl border border-white/20">
            <ReactPlayer 
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${currentSong.id}`}
              playing={isPlaying}
              volume={1}
              muted={false}
              playsinline={true} // חשוב ביותר
              width="100%"
              height="100%"
              config={{
                youtube: {
                  playerVars: { 
                    autoplay: 1, 
                    playsinline: 1,
                    modestbranding: 1,
                    controls: 1 // מאפשר לאייפון להבין שזה נגן אמיתי
                  }
                }
              }}
              onProgress={(p) => setPlayed(p.played)}
              onDuration={(d) => setDuration(d)}
              onEnded={handleNext}
              onBuffer={() => console.log("Buffering...")}
              onPause={() => {
                // מנגנון שמוודא שזה לא עוצר סתם
                if (isPlaying) setTimeout(() => setIsPlaying(true), 500);
              }}
            />
          </div>
        )}

        <header className="p-6 flex justify-center">
          <input 
            className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl py-3 px-6 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="חפש שיר..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
          />
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-40">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {(results.length > 0 ? results : playlists[activePlaylist]).map((song) => (
              <div key={song.id} className="bg-zinc-900/50 p-4 rounded-3xl hover:bg-zinc-800 transition relative group">
                <img src={song.img} className="w-full aspect-square object-cover rounded-2xl mb-3" />
                <div className="text-sm font-bold truncate">{song.title}</div>
                <button onClick={() => handlePlaySong(song)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-3xl transition">
                  <Play fill="white" size={30} />
                </button>
                <Heart 
                  onClick={() => {
                    const isLiked = playlists["מועדפים"].some(s => s.id === song.id);
                    const newList = isLiked ? playlists["מועדפים"].filter(s => s.id !== song.id) : [...playlists["מועדפים"], song];
                    setPlaylists({...playlists, "מועדפים": newList});
                  }}
                  className={`absolute top-6 right-6 ${playlists["מועדפים"].some(s => s.id === song.id) ? 'text-red-500 fill-red-500' : 'text-white/50'}`} 
                  size={18} 
                />
              </div>
            ))}
          </div>
        </main>

        {/* Player Bar */}
        {currentSong && (
          <footer className="fixed bottom-6 left-6 right-6 h-20 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[25px] px-6 flex items-center justify-between z-50">
            <div className="flex items-center gap-4 w-1/3">
              <img src={currentSong.img} className="w-12 h-12 rounded-xl object-cover" />
              <div className="text-xs font-bold truncate max-w-[150px]">{currentSong.title}</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-6">
                <SkipBack onClick={handlePrev} className="cursor-pointer text-zinc-400" />
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
                  {isPlaying ? <Pause size={20} fill="black"/> : <Play size={20} fill="black" className="ml-1"/>}
                </button>
                <SkipForward onClick={handleNext} className="cursor-pointer text-zinc-400" />
              </div>
            </div>
            <div className="w-1/3 flex justify-end">
               <Maximize2 onClick={() => setIsFocusMode(true)} className="text-zinc-500 cursor-pointer" />
            </div>
          </footer>
        )}
      </div>

      {/* Focus Mode Overlay */}
      {isFocusMode && currentSong && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6">
          <button onClick={() => setIsFocusMode(false)} className="absolute top-8 right-8 text-zinc-500"><X size={32} /></button>
          <img src={currentSong.img} className="w-72 h-72 object-cover rounded-[50px] shadow-2xl mb-10" />
          <h2 className="text-2xl font-bold text-center mb-10 px-4">{currentSong.title}</h2>
          <div className="flex items-center gap-12">
            <SkipBack size={32} onClick={handlePrev} />
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center">
              {isPlaying ? <Pause size={40} fill="black"/> : <Play size={40} fill="black" className="ml-1"/>}
            </button>
            <SkipForward size={32} onClick={handleNext} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
