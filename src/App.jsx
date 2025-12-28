import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { Play, Pause, Search, Heart, SkipForward, SkipBack, Maximize2, X, Menu, Home, Library, Headphones, AlignLeft } from 'lucide-react';

const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;

const App = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [played, setPlayed] = useState(0);
  const playerRef = useRef(null);
  
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('pb_v6');
    return saved ? JSON.parse(saved) : { "מועדפים": [] };
  });

  // מנגנון השלמה אוטומטית (Autocomplete)
  useEffect(() => {
    const fetchSugg = async () => {
      if (query.trim().length < 2) { setSuggestions([]); return; }
      try {
        const res = await axios.get(`https://suggestqueries.google.com/complete/search?client=chrome&ds=yt&q=${encodeURIComponent(query)}`);
        setSuggestions(res.data[1] || []);
      } catch (e) { console.log("Autocomplete offline"); }
    };
    const t = setTimeout(fetchSugg, 300);
    return () => clearTimeout(t);
  }, [query]);

  const searchMusic = async (q = query) => {
    setSuggestions([]);
    setQuery(q);
    try {
      const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: { part: 'snippet', maxResults: 15, q: q, type: 'video', videoCategoryId: '10', key: API_KEY }
      });
      setResults(data.items.map(v => ({
        id: v.id.videoId, title: v.snippet.title, img: v.snippet.thumbnails.medium.url
      })));
    } catch (e) { 
        console.error(e);
        alert("שגיאת חיפוש - בדוק את ה-API KEY שלך בקובץ ה-env"); 
    }
  };

  const handleNext = () => {
    const idx = results.findIndex(s => s.id === currentSong?.id);
    if (idx !== -1 && idx < results.length - 1) {
        setCurrentSong(results[idx + 1]);
        setIsPlaying(true);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[600] w-72 bg-zinc-950 border-r border-white/5 transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐼</span>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">Panda<span className="text-blue-500">Beats</span></h1>
            </div>
            <button className="md:hidden text-zinc-500" onClick={() => setIsSidebarOpen(false)}><X size={28}/></button>
          </div>
          <nav className="space-y-2">
            <button className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white/5 text-white font-bold" onClick={() => setIsSidebarOpen(false)}><Home size={22}/> דף הבית</button>
            <button className="flex items-center gap-4 w-full p-4 rounded-2xl text-zinc-500 hover:bg-white/5 transition" onClick={() => setIsSidebarOpen(false)}><Heart size={22}/> מועדפים</button>
            <button className="flex items-center gap-4 w-full p-4 rounded-2xl text-zinc-500 hover:bg-white/5 transition" onClick={() => setIsSidebarOpen(false)}><Library size={22}/> פלייליסטים</button>
          </nav>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Header */}
        <header className="p-4 md:p-6 flex items-center gap-4 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-[100]">
          <button className="md:hidden p-3 bg-zinc-900 rounded-2xl text-blue-500 shadow-lg" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24}/>
          </button>
          
          <div className="relative flex-1 max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              className="w-full bg-zinc-900 border border-white/5 rounded-[20px] py-4 px-12 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-xl"
              placeholder="מה בא לך לשמוע?..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
            />
            
            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-zinc-900 border border-white/10 mt-2 rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[200]">
                {suggestions.map((s, i) => (
                  <div key={i} className="px-6 py-4 hover:bg-blue-600 cursor-pointer text-sm font-medium border-b border-white/5 last:border-0 transition-colors" onClick={() => searchMusic(s)}>{s}</div>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Music Feed */}
        <main className="flex-1 overflow-y-auto p-6 pb-40 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-black mb-8 tracking-tight">Discovery 🐼</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map(song => (
                <div key={song.id} className="bg-zinc-900/40 p-4 rounded-[30px] hover:bg-zinc-800 transition-all cursor-pointer group border border-white/5" onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
                  <div className="relative aspect-square mb-4 overflow-hidden rounded-[22px] shadow-xl">
                    <img src={song.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play fill="white" size={32} />
                    </div>
                  </div>
                  <div className="text-sm font-bold truncate px-1">{song.title}</div>
                </div>
              ))}
            </div>
            {results.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                <Headphones size={48} className="mb-4 opacity-20" />
                <p>חפש שיר כדי להתחיל את המסיבה</p>
              </div>
            )}
          </div>
        </main>

        {/* Floating Player Bar */}
        {currentSong && (
          <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl h-24 bg-blue-600 rounded-[35px] px-6 flex items-center justify-between shadow-[0_15px_40px_rgba(37,99,235,0.4)] z-[400] animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-4 w-1/3 min-w-0">
              <img src={currentSong.img} className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white/20" />
              <div className="hidden sm:block truncate">
                <div className="text-sm font-black truncate w-40 text-white">{currentSong.title}</div>
                <div className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">PandaBeats Pro</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <button onClick={() => setIsPlaying(!isPlaying)} className="w-14 h-14 bg-white text-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                {isPlaying ? <Pause size={28} fill="currentColor"/> : <Play size={28} fill="currentColor" className="ml-1"/>}
              </button>
            </div>

            <div className="flex justify-end gap-5 w-1/3">
              <div className="opacity-0 absolute pointer-events-none">
                <ReactPlayer 
                  ref={playerRef}
                  url={`https://www.youtube.com/watch?v=${currentSong.id}`} 
                  playing={isPlaying} 
                  playsinline
                  onProgress={(e) => setPlayed(e.played)} 
                  onEnded={handleNext}
                  width="0" height="0"
                />
              </div>
              <Maximize2 className="text-white/80 cursor-pointer hover:text-white" size={24}/>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;
