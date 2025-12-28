import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { Play, Pause, Search, ListPlus, Plus, Disc, SkipForward, SkipBack, Maximize2, Volume2, X, Music, Heart, LayoutGrid } from 'lucide-react';

const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;

const App = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const playerRef = useRef(null);
  
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('beats_v5_playlists');
    return saved ? JSON.parse(saved) : { "המועדפים שלי": [] };
  });
  const [activePlaylist, setActivePlaylist] = useState("המועדפים שלי");

  useEffect(() => {
    localStorage.setItem('beats_v5_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // פתרון סאונד לאייפון: "משחרר" את חסימת האודיו של iOS
  const unlockAudio = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
  };

  const handlePlaySong = (song) => {
    unlockAudio(); // פותח את החסימה
    setCurrentSong(song);
    setIsPlaying(true);
  };

  // שליטה במסך הנעילה ובמרכז הבקרה (iPhone Control Center)
  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: 'Beats AI Player',
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
        params: { 
          part: 'snippet', 
          maxResults: 15, 
          q: query, 
          type: 'video', 
          videoCategoryId: '10',
          key: API_KEY 
        }
      });
      setResults(data.items);
    } catch (e) { 
      console.error("Search error", e);
      alert("חיבור ה-API נכשל. בדוק את המפתח ב-Vercel.");
    }
  };

  const handleNext = () => {
    const list = results.length > 0 ? results.map(v => ({id: v.id.videoId, title: v.snippet.title, img: v.snippet.thumbnails.medium.url})) : playlists[activePlaylist];
    const currentIndex = list.findIndex(s => s.id === currentSong?.id);
    if (currentIndex !== -1 && currentIndex < list.length - 1) {
      setCurrentSong(list[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    const list = results.length > 0 ? results.map(v => ({id: v.id.videoId, title: v.snippet.title, img: v.snippet.thumbnails.medium.url})) : playlists[activePlaylist];
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
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden relative">
      
      {/* Background Glow Effect */}
      {currentSong && !isFocusMode && (
        <div 
          className="absolute inset-0 opacity-20 blur-[120px] transition-all duration-1000"
          style={{ background: `radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 50%)` }}
        ></div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-black/60 backdrop-blur-xl border-l border-white/5 hidden lg:flex flex-col z-10">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Music size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter">BEATS AI</span>
        </div>
        
        <nav className="flex-1 px-6 space-y-4">
          <button onClick={() => setActivePlaylist("המועדפים שלי")} className={`w-full text-right p-3 rounded-xl transition ${activePlaylist === "המועדפים שלי" ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
            <div className="flex items-center gap-3"><Heart size={18}/> מועדפים</div>
          </button>
          <div className="h-[1px] bg-white/5 my-4"></div>
          <p className="text-[10px] uppercase font-bold text-zinc-600 px-2 tracking-widest">הפלייליסטים שלך</p>
          {Object.keys(playlists).map(name => (
            <div key={name} onClick={() => setActivePlaylist(name)} className={`p-3 rounded-xl cursor-pointer text-sm transition ${activePlaylist === name ? 'text-blue-500' : 'text-zinc-500 hover:text-white'}`}>
              {name}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        <header className="p-6 flex justify-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="relative w-full max-w-2xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              className="w-full bg-zinc-900/50 backdrop-blur-2xl border border-white/5 rounded-2xl py-4 px-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="חפש מוזיקה מכל העולם..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-40">
          <h2 className="text-4xl font-black mb-10 tracking-tight">{results.length > 0 ? 'תוצאות' : activePlaylist}</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {(results.length > 0 ? results.map(v => ({id: v.id.videoId, title: v.snippet.title, img: v.snippet.thumbnails.medium.url})) : playlists[activePlaylist]).map((song) => (
              <div key={song.id} className="group cursor-pointer" onClick={() => handlePlaySong(song)}>
                <div className="relative aspect-square mb-4 rounded-[32px] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 group-active:scale-95">
                  <img src={song.img} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                      <Play fill="black" size={28} className="ml-1" />
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-sm truncate group-hover:text-blue-400 transition-colors">{song.title}</h3>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-tighter">YouTube Audio</p>
              </div>
            ))}
          </div>
        </main>

        {/* Floating Pro Player */}
        {currentSong && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl z-50 animate-in slide-in-from-bottom-10 duration-700">
            <div className="bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[35px] p-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              
              <div className="flex items-center gap-4 w-1/4">
                <div className="relative">
                  <img src={currentSong.img} className={`w-14 h-14 rounded-2xl object-cover shadow-2xl transition-transform duration-500 ${isPlaying ? 'scale-110 rotate-2' : ''}`} />
                  {isPlaying && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-black animate-ping"></div>}
                </div>
                <div className="hidden md:block truncate">
                  <div className="text-sm font-bold truncate w-48">{currentSong.title}</div>
                  <div className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em]">Live Audio</div>
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 max-w-md">
                <div className="flex items-center gap-8 mb-3">
                  <SkipBack className="text-zinc-500 hover:text-white cursor-pointer transition active:scale-90" onClick={handlePrev} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} 
                    className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl"
                  >
                    {isPlaying ? <Pause size={24} fill="black"/> : <Play size={24} fill="black" className="ml-1"/>}
                  </button>
                  <SkipForward className="text-zinc-500 hover:text-white cursor-pointer transition active:scale-90" onClick={handleNext} />
                </div>
                
                <div className="w-full flex items-center gap-3 px-2">
                  <span className="text-[10px] font-mono text-zinc-500 w-10 text-left">{formatTime(played * duration)}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full relative cursor-pointer overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${played * 100}%` }}></div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 w-10 text-right">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-5 w-1/4 pr-4">
                <button onClick={() => setIsFocusMode(true)} className="text-zinc-500 hover:text-white transition-colors">
                  <Maximize2 size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* The Audio Engine (Fixed for iOS) */}
        {currentSong && (
          <div className="hidden">
            <ReactPlayer 
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${currentSong.id}`}
              playing={isPlaying}
              volume={1}
              muted={false} // אסור שיהיה מושתק באייפון
              playsinline={true}
              config={{
                youtube: {
                  playerVars: { 
                    autoplay: 1, 
                    playsinline: 1,
                    modestbranding: 1,
                    rel: 0
                  }
                }
              }}
              onProgress={(p) => setPlayed(p.played)}
              onDuration={(d) => setDuration(d)}
              onEnded={handleNext}
              onReady={() => console.log("Player Ready")}
              onError={(e) => console.log("Player Error", e)}
            />
          </div>
        )}
      </div>

      {/* Focus Mode View */}
      {isFocusMode && currentSong && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
          <div 
            className="absolute inset-0 opacity-40 blur-[150px]"
            style={{ background: `radial-gradient(circle at center, #2563eb 0%, transparent 70%)` }}
          ></div>
          <button onClick={() => setIsFocusMode(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white z-20">
            <X size={40} />
          </button>
          
          <div className="relative z-10 text-center space-y-8">
            <img 
              src={currentSong.img} 
              className={`w-[320px] h-[320px] md:w-[500px] md:h-[500px] object-cover rounded-[80px] shadow-[0_0_120px_rgba(37,99,235,0.4)] transition-transform duration-[3000ms] ${isPlaying ? 'scale-105' : 'scale-95'}`} 
            />
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-4 line-clamp-2">{currentSong.title}</h2>
              <p className="text-blue-500 font-bold tracking-[0.5em] uppercase text-sm">Now Playing • Beats AI</p>
            </div>
            
            <div className="flex items-center justify-center gap-12 pt-8">
               <SkipBack size={32} className="text-zinc-600 hover:text-white cursor-pointer" onClick={handlePrev} />
               <button onClick={() => setIsPlaying(!isPlaying)} className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition shadow-2xl">
                 {isPlaying ? <Pause size={40} fill="black"/> : <Play size={40} fill="black" className="ml-2"/>}
               </button>
               <SkipForward size={32} className="text-zinc-600 hover:text-white cursor-pointer" onClick={handleNext} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
