import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { Play, Pause, Search, ListPlus, Plus, Music, Heart, SkipForward, SkipBack, Maximize2, X, Trash2, Menu, Home, Library } from 'lucide-react';

const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;

const App = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef(null);
  
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('beats_pro_v2');
    return saved ? JSON.parse(saved) : { "מועדפים": [] };
  });
  const [activePlaylist, setActivePlaylist] = useState("Search"); // Search, ״מועדפים״, או שם פלייליסט

  useEffect(() => {
    localStorage.setItem('beats_pro_v2', JSON.stringify(playlists));
  }, [playlists]);

  const handlePlaySong = (song) => {
    if (window.AudioContext || window.webkitAudioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    }
    setCurrentSong(song);
    setIsPlaying(true);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

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
        params: { part: 'snippet', maxResults: 15, q: query, type: 'video', videoCategoryId: '10', key: API_KEY }
      });
      setResults(data.items.map(v => ({
        id: v.id.videoId,
        title: v.snippet.title,
        img: v.snippet.thumbnails.medium.url
      })));
      setActivePlaylist("Search");
    } catch (e) { console.error(e); }
  };

  const handleNext = () => {
    const list = activePlaylist === "Search" ? results : playlists[activePlaylist];
    const idx = list.findIndex(s => s.id === currentSong?.id);
    if (idx !== -1 && idx < list.length - 1) handlePlaySong(list[idx + 1]);
  };

  const handlePrev = () => {
    const list = activePlaylist === "Search" ? results : playlists[activePlaylist];
    const idx = list.findIndex(s => s.id === currentSong?.id);
    if (idx > 0) handlePlaySong(list[idx - 1]);
  };

  const toggleLike = (song) => {
    const isLiked = playlists["מועדפים"].some(s => s.id === song.id);
    const newList = isLiked ? playlists["מועדפים"].filter(s => s.id !== song.id) : [...playlists["מועדפים"], song];
    setPlaylists({...playlists, "מועדפים": newList});
  };

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 font-sans overflow-hidden">
      
      {/* Sidebar - Mobile Responsive */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-64 bg-black border-r border-white/5 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Music size={18} />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter">BEATS AI</h1>
            <button className="md:hidden mr-auto" onClick={() => setIsSidebarOpen(false)}><X /></button>
          </div>

          <nav className="space-y-2 flex-1">
            <button onClick={() => {setActivePlaylist("Search"); setIsSidebarOpen(false);}} className={`flex items-center gap-3 w-full p-3 rounded-xl transition ${activePlaylist === "Search" ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
              <Home size={18} /> דף הבית
            </button>
            <button onClick={() => {setActivePlaylist("מועדפים"); setIsSidebarOpen(false);}} className={`flex items-center gap-3 w-full p-3 rounded-xl transition ${activePlaylist === "מועדפים" ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
              <Heart size={18} className={activePlaylist === "מועדפים" ? 'fill-white' : ''} /> מועדפים
            </button>
            
            <div className="pt-6">
              <div className="flex items-center justify-between px-2 mb-4">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">פלייליסטים</p>
                <Plus size={14} className="cursor-pointer text-zinc-500 hover:text-white" onClick={() => {
                  const name = prompt("שם הפלייליסט:");
                  if(name) setPlaylists({...playlists, [name]: []});
                }}/>
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[30vh]">
                {Object.keys(playlists).map(name => name !== "מועדפים" && (
                  <button key={name} onClick={() => {setActivePlaylist(name); setIsSidebarOpen(false);}} className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm transition ${activePlaylist === name ? 'text-blue-500 bg-blue-500/5' : 'text-zinc-500 hover:text-white'}`}>
                    <Library size={16} /> {name}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* הנגן המינימלי מוטמע בתחתית הסיידבר - רחוק משורת החיפוש */}
          {currentSong && (
            <div className="mt-auto pt-4 border-t border-white/5">
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-white/10">
                <ReactPlayer 
                  ref={playerRef}
                  url={`https://www.youtube.com/watch?v=${currentSong.id}`}
                  playing={isPlaying}
                  volume={1}
                  muted={false}
                  playsinline={true}
                  width="100%"
                  height="100%"
                  config={{ youtube: { playerVars: { autoplay: 1, playsinline: 1, modestbranding: 1, controls: 1 } } }}
                  onProgress={(p) => setPlayed(p.played)}
                  onDuration={(d) => setDuration(d)}
                  onEnded={handleNext}
                />
              </div>
              <p className="text-[9px] text-zinc-600 mt-2 text-center uppercase tracking-tighter">iOS Background Engine Active</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative">
        <header className="p-4 md:p-6 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <button className="md:hidden p-2 text-zinc-400" onClick={() => setIsSidebarOpen(true)}><Menu /></button>
          <div className="relative flex-1 max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              className="w-full bg-zinc-900/80 border border-white/5 rounded-2xl py-3 px-12 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="חפש שיר או אמן..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-40">
          <h2 className="text-3xl font-black mb-8 tracking-tight">
            {activePlaylist === "Search" ? (results.length > 0 ? "תוצאות חיפוש" : "גלה מוזיקה חדשה") : activePlaylist}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(activePlaylist === "Search" ? results : playlists[activePlaylist]).map((song) => (
              <div key={song.id} className="group bg-zinc-900/30 p-4 rounded-[24px] hover:bg-white/5 transition-all border border-white/5 relative">
                <div className="relative aspect-square mb-4 overflow-hidden rounded-[20px] shadow-2xl">
                  <img src={song.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer" onClick={() => handlePlaySong(song)}>
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl scale-75 group-hover:scale-100 transition-transform">
                      <Play fill="black" size={24} className="ml-1" />
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold truncate pr-1 mb-3">{song.title}</div>
                <div className="flex justify-between items-center px-1">
                  <Heart 
                    size={18} 
                    onClick={() => toggleLike(song)}
                    className={`cursor-pointer transition-colors ${playlists["מועדפים"].some(s => s.id === song.id) ? 'text-red-500 fill-red-500' : 'text-zinc-600 hover:text-white'}`} 
                  />
                  <div className="flex gap-3">
                    {activePlaylist !== "Search" && (
                      <Trash2 size={16} className="text-zinc-600 hover:text-red-500 cursor-pointer" onClick={() => {
                        const newList = playlists[activePlaylist].filter(s => s.id !== song.id);
                        setPlaylists({...playlists, [activePlaylist]: newList});
                      }}/>
                    )}
                    <ListPlus size={18} className="text-zinc-600 hover:text-blue-500 cursor-pointer" onClick={() => {
                      const pName = prompt("שם הפלייליסט להוספה:", Object.keys(playlists)[1]);
                      if(pName && playlists[pName]) setPlaylists({...playlists, [pName]: [...playlists[pName], song]});
                    }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Floating Player Bar */}
        {currentSong && (
          <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-5xl h-24 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] px-6 flex items-center justify-between shadow-2xl z-[100] animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-4 w-1/3">
              <img src={currentSong.img} className={`w-14 h-14 rounded-2xl object-cover shadow-lg ${isPlaying ? 'animate-pulse' : ''}`} />
              <div className="hidden sm:block truncate">
                <div className="text-sm font-bold truncate w-40">{currentSong.title}</div>
                <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">מתנגן כעת</div>
              </div>
            </div>

            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center gap-8 mb-2">
                <SkipBack className="text-zinc-400 hover:text-white cursor-pointer transition active:scale-90" onClick={handlePrev} />
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition shadow-xl">
                  {isPlaying ? <Pause size={22} fill="black"/> : <Play size={22} fill="black" className="ml-1"/>}
                </button>
                <SkipForward className="text-zinc-400 hover:text-white cursor-pointer transition active:scale-90" onClick={handleNext} />
              </div>
              <div className="w-full max-w-xs h-1 bg-white/10 rounded-full relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300" style={{ width: `${played * 100}%` }}></div>
              </div>
            </div>

            <div className="flex justify-end gap-5 w-1/3">
               <Maximize2 className="text-zinc-500 hover:text-white cursor-pointer" onClick={() => setIsFocusMode(true)} />
            </div>
          </footer>
        )}
      </div>

      {/* Focus Mode Overlay */}
      {isFocusMode && currentSong && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          <button onClick={() => setIsFocusMode(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white"><X size={40} /></button>
          <img src={currentSong.img} className={`w-72 h-72 md:w-[500px] md:h-[500px] object-cover rounded-[60px] shadow-[0_0_120px_rgba(37,140,246,0.4)] mb-12 transition-transform duration-1000 ${isPlaying ? 'scale-105' : 'scale-95'}`} />
          <h2 className="text-3xl md:text-5xl font-black text-center mb-10 max-w-3xl line-clamp-2 leading-tight">{currentSong.title}</h2>
          <div className="flex items-center gap-12">
            <SkipBack size={36} onClick={handlePrev} className="cursor-pointer text-zinc-400 hover:text-white" />
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
              {isPlaying ? <Pause size={40} fill="black"/> : <Play size={40} fill="black" className="ml-2"/>}
            </button>
            <SkipForward size={36} onClick={handleNext} className="cursor-pointer text-zinc-400 hover:text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
