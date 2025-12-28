import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { Play, Pause, Search, ListPlus, Plus, Music, Heart, SkipForward, SkipBack, Maximize2, X, Trash2, Menu, Home, Library, Headphones, AlignLeft, Sparkles } from 'lucide-react';

const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;

const App = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [relatedSongs, setRelatedSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef(null);
  
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('pandabeats_ultra_v4');
    return saved ? JSON.parse(saved) : { "מועדפים": [] };
  });
  const [activePlaylist, setActivePlaylist] = useState("Search");

  useEffect(() => {
    localStorage.setItem('pandabeats_ultra_v4', JSON.stringify(playlists));
  }, [playlists]);

  // השלמה אוטומטית בחיפוש
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) { setSuggestions([]); return; }
      try {
        const res = await axios.get(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${query}`);
        setSuggestions(res.data[1].slice(0, 5));
      } catch (e) { console.error(e); }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // חישוב שירים דומים בכל פעם ששיר משתנה
  useEffect(() => {
    if (currentSong) {
      fetchRelatedSongs(currentSong.id);
    }
  }, [currentSong]);

  const fetchRelatedSongs = async (videoId) => {
    try {
      const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: 'snippet',
          type: 'video',
          relatedToVideoId: videoId,
          maxResults: 10,
          key: API_KEY
        }
      });
      setRelatedSongs(data.items.map(v => ({
        id: v.id.videoId,
        title: v.snippet.title,
        img: v.snippet.thumbnails.medium.url
      })));
    } catch (e) { console.error("Related songs error", e); }
  };

  const handlePlaySong = (song) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();
    }
    setCurrentSong(song);
    setIsPlaying(true);
    setShowLyrics(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const searchMusic = async (searchQuery = query) => {
    setQuery(searchQuery);
    setSuggestions([]);
    try {
      const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: { part: 'snippet', maxResults: 15, q: searchQuery, type: 'video', videoCategoryId: '10', key: API_KEY }
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
    // עדיפות לשיר הבא בתור הנוכחי, אם אין - קח מההמלצות
    const list = activePlaylist === "Search" ? results : playlists[activePlaylist];
    const idx = list.findIndex(s => s.id === currentSong?.id);
    
    if (idx !== -1 && idx < list.length - 1) {
      handlePlaySong(list[idx + 1]);
    } else if (relatedSongs.length > 0) {
      handlePlaySong(relatedSongs[0]); // Autoplay המלצות
    }
  };

  const handlePrev = () => {
    const list = activePlaylist === "Search" ? results : playlists[activePlaylist];
    const idx = list.findIndex(s => s.id === currentSong?.id);
    if (idx > 0) handlePlaySong(list[idx - 1]);
  };

  return (
    <div className="flex h-screen bg-[#020202] text-zinc-100 font-sans overflow-hidden relative">
      
      {/* Dynamic Glow Background */}
      {currentSong && (
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[150px] bg-blue-600 animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-purple-900"></div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-black/90 backdrop-blur-2xl border-r border-white/5 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-3xl">🐼</span>
            <h1 className="text-xl font-black tracking-tighter uppercase">Panda<span className="text-blue-500 font-outline">Beats</span></h1>
          </div>

          <nav className="space-y-1 mb-8">
            <button onClick={() => {setActivePlaylist("Search"); setIsSidebarOpen(false);}} className={`flex items-center gap-3 w-full p-3 rounded-xl transition ${activePlaylist === "Search" ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
              <Home size={18} /> דף הבית
            </button>
            <button onClick={() => {setActivePlaylist("מועדפים"); setIsSidebarOpen(false);}} className={`flex items-center gap-3 w-full p-3 rounded-xl transition ${activePlaylist === "מועדפים" ? 'bg-white/10 text-red-500' : 'text-zinc-500 hover:text-white'}`}>
              <Heart size={18} fill={activePlaylist === "מועדפים" ? "currentColor" : "none"} /> מועדפים
            </button>
          </nav>

          {/* מנגנון המלצות בתוך הסיידבר */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-4 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <Sparkles size={12} className="text-blue-500" /> המלצות בשבילך
            </div>
            <div className="space-y-3">
              {relatedSongs.length > 0 ? relatedSongs.map(song => (
                <div key={song.id} onClick={() => handlePlaySong(song)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition">
                  <img src={song.img} className="w-10 h-10 rounded-md object-cover grayscale group-hover:grayscale-0 transition" />
                  <div className="text-[11px] font-medium truncate w-40">{song.title}</div>
                </div>
              )) : <p className="text-[11px] text-zinc-600 px-2 italic">נגן שיר כדי לקבל המלצות...</p>}
            </div>
          </div>

          {/* Engine - Hidden */}
          {currentSong && (
            <div className="mt-auto pt-4 border-t border-white/5 opacity-10">
              <ReactPlayer url={`https://www.youtube.com/watch?v=${currentSong.id}`} playing={isPlaying} volume={1} muted={false} playsinline={true} width="100%" height="40px" onProgress={(p) => setPlayed(p.played)} onDuration={(d) => setDuration(d)} onEnded={handleNext} />
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative z-10">
        <header className="p-4 md:p-6 flex items-center justify-center sticky top-0 z-50">
          <button className="md:hidden absolute right-6 p-2 text-zinc-400" onClick={() => setIsSidebarOpen(true)}><Menu /></button>
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              className="w-full bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-2xl py-3 px-12 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-2xl"
              placeholder="חפש שירים, אמנים..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-zinc-900 border border-white/10 mt-2 rounded-2xl overflow-hidden shadow-2xl z-[100]">
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => searchMusic(s)} className="px-5 py-3 text-sm hover:bg-blue-600 cursor-pointer transition">
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-40">
          <div className="flex items-center justify-between mb-8 px-2">
             <h2 className="text-4xl font-black tracking-tighter">{activePlaylist === "Search" ? "Discovery" : activePlaylist}</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {(activePlaylist === "Search" ? results : playlists[activePlaylist]).map((song) => (
              <div key={song.id} className="group bg-zinc-900/20 p-4 rounded-[35px] hover:bg-zinc-800 transition-all border border-white/5 relative">
                <div className="relative aspect-square mb-4 overflow-hidden rounded-[25px]">
                  <img src={song.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer" onClick={() => handlePlaySong(song)}>
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition">
                      <Play fill="black" size={24} className="ml-1" />
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold truncate pr-1">{song.title}</div>
                <Heart onClick={() => {
                  const isLiked = playlists["מועדפים"].some(s => s.id === song.id);
                  setPlaylists({...playlists, "מועדפים": isLiked ? playlists["מועדפים"].filter(s => s.id !== song.id) : [...playlists["מועדפים"], song]});
                }} className={`absolute top-6 right-6 cursor-pointer transition ${playlists["מועדפים"].some(s => s.id === song.id) ? 'text-red-500 fill-red-500' : 'text-white/20 hover:text-white'}`} size={18} />
              </div>
            ))}
          </div>
        </main>

        {/* Player Bar */}
        {currentSong && (
          <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-5xl h-24 bg-zinc-950/80 backdrop-blur-3xl border border-white/10 rounded-[35px] px-8 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[150]">
            <div className="flex items-center gap-4 w-1/3">
              <img src={currentSong.img} className={`w-14 h-14 rounded-2xl object-cover shadow-2xl ${isPlaying ? 'animate-pulse' : ''}`} />
              <div className="hidden sm:block truncate">
                <div className="text-sm font-black truncate w-44 tracking-tight">{currentSong.title}</div>
                <div className="text-[9px] text-blue-500 font-bold uppercase tracking-[0.2em]">Panda Pro Audio</div>
              </div>
            </div>

            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center gap-8 mb-2">
                <SkipBack onClick={handlePrev} className="cursor-pointer text-zinc-500 hover:text-white transition" />
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition shadow-xl shadow-white/10">
                  {isPlaying ? <Pause size={22} fill="black"/> : <Play size={22} fill="black" className="ml-1"/>}
                </button>
                <SkipForward onClick={handleNext} className="cursor-pointer text-zinc-500 hover:text-white transition" />
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full relative overflow-hidden">
                <div className="absolute h-full bg-gradient-to-r from-blue-600 to-purple-500" style={{ width: `${played * 100}%` }}></div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-5 w-1/3">
               <AlignLeft onClick={() => setShowLyrics(true)} className="text-zinc-500 hover:text-blue-500 cursor-pointer transition" size={20} />
               <Maximize2 onClick={() => setIsFocusMode(true)} className="text-zinc-500 hover:text-white cursor-pointer transition" size={20} />
            </div>
          </footer>
        )}
      </div>

      {/* Lyrics Modal */}
      {showLyrics && currentSong && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center p-10 overflow-y-auto animate-in fade-in zoom-in duration-300">
          <button onClick={() => setShowLyrics(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white transition"><X size={32} /></button>
          <div className="max-w-2xl w-full text-center space-y-12">
            <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{currentSong.title}</h2>
            <div className="space-y-6">
              <p className="text-zinc-400 font-medium">המילים מחכות לך ב-Google Panda...</p>
              <a 
                href={`https://www.google.com/search?q=${encodeURIComponent(currentSong.title + " lyrics")}`} 
                target="_blank" 
                className="inline-block bg-blue-600 text-white px-10 py-4 rounded-full font-bold shadow-2xl hover:bg-blue-500 transition-all hover:scale-105 active:scale-95"
              >
                חפש מילים עכשיו 🐼
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode */}
      {isFocusMode && currentSong && (
        <div className="fixed inset-0 bg-black z-[250] flex flex-col items-center justify-center p-10 animate-in fade-in duration-700">
           <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-purple-900/40 opacity-60"></div>
           <button onClick={() => setIsFocusMode(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white z-10"><X size={40} /></button>
           <img src={currentSong.img} className={`w-[320px] h-[320px] md:w-[500px] md:h-[500px] object-cover rounded-[80px] shadow-[0_0_150px_rgba(37,99,235,0.4)] z-10 mb-12 transition-transform duration-[4000ms] ${isPlaying ? 'scale-110' : 'scale-95'}`} />
           <h2 className="text-4xl md:text-6xl font-black text-center z-10 tracking-tight leading-tight max-w-4xl">{currentSong.title}</h2>
           <p className="mt-6 text-blue-500 font-bold tracking-[0.6em] z-10 uppercase text-xs">PandaBeats Elite</p>
        </div>
      )}
    </div>
  );
};

export default App;
