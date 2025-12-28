import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { Play, Pause, Search, ListPlus, Plus, Disc, SkipForward, SkipBack, Maximize2, Volume2, X } from 'lucide-react';

// משתמש במשתנה סביבה עבור Vercel
const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;

const App = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('beats_playlists');
    return saved ? JSON.parse(saved) : { "המועדפים שלי": [] };
  });
  const [activePlaylist, setActivePlaylist] = useState("המועדפים שלי");

  // שמירה לזיכרון המקומי
  useEffect(() => {
    localStorage.setItem('beats_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // שליטה במסך הנעילה (iPhone Media Session)
  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: 'Beats AI',
        artwork: [{ src: currentSong.img, sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    }
  }, [currentSong]);

  const searchMusic = async () => {
    if (!query) return;
    try {
      const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: { part: 'snippet', maxResults: 15, q: query, type: 'video', key: API_KEY }
      });
      setResults(data.items);
    } catch (e) { console.error("API error", e); }
  };

  const addToPlaylist = (name, song) => {
    const updated = [...playlists[name]];
    if (!updated.find(s => s.id === song.id)) {
      updated.push(song);
      setPlaylists({ ...playlists, [name]: updated });
    }
  };

  const handleNext = () => {
    const list = playlists[activePlaylist];
    const currentIndex = list.findIndex(s => s.id === currentSong?.id);
    if (currentIndex !== -1 && currentIndex < list.length - 1) {
      setCurrentSong(list[currentIndex + 1]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`flex h-screen ${isFocusMode ? 'bg-black' : 'bg-[#0a0a0c]'} text-zinc-100 transition-all font-sans overflow-hidden`}>
      
      {/* Side Navigation */}
      {!isFocusMode && (
        <aside className="w-64 bg-black/40 backdrop-blur-xl border-l border-white/5 flex flex-col hidden md:flex">
          <div className="p-8 text-xl font-bold text-blue-500 flex items-center gap-2">
            <Disc className={isPlaying ? 'animate-spin-slow' : ''} /> Beats AI
          </div>
          <nav className="flex-1 px-4">
            <button onClick={() => {
              const n = prompt("שם הפלייליסט:");
              if(n) setPlaylists({...playlists, [n]: []});
            }} className="w-full flex items-center gap-2 p-2 hover:bg-zinc-800 rounded-lg text-sm text-zinc-400">
              <Plus size={16}/> צור פלייליסט
            </button>
            <div className="mt-6 space-y-1">
              {Object.keys(playlists).map(name => (
                <div key={name} onClick={() => setActivePlaylist(name)} 
                  className={`p-2 rounded-lg cursor-pointer text-sm ${activePlaylist === name ? 'bg-blue-600' : 'hover:bg-zinc-900'}`}>
                  {name}
                </div>
              ))}
            </div>
          </nav>
        </aside>
      )}

      {/* Main UI */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isFocusMode && (
          <header className="p-4 flex justify-center">
            <div className="relative w-full max-w-lg">
              <input className="w-full bg-zinc-900 border-none rounded-full py-2 px-10 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="חפש שיר..." value={query} onChange={(e)=>setQuery(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && searchMusic()} />
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(results.length > 0 ? results.map(v => ({id: v.id.videoId, title: v.snippet.title, img: v.snippet.thumbnails.medium.url})) : playlists[activePlaylist]).map((song) => (
              <div key={song.id} className="bg-zinc-900/40 p-3 rounded-2xl hover:bg-zinc-800 transition group">
                <div className="relative mb-2">
                  <img src={song.img} className="w-full aspect-video object-cover rounded-lg" />
                  <div onClick={() => {setCurrentSong(song); setIsPlaying(true);}} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer rounded-lg">
                    <Play fill="white" size={32}/>
                  </div>
                </div>
                <div className="text-xs font-bold truncate">{song.title}</div>
                <button onClick={() => addToPlaylist(activePlaylist, song)} className="mt-2 text-[10px] text-blue-500 uppercase font-bold">הוסף לאוסף +</button>
              </div>
            ))}
          </div>
        </main>

        {/* Player Bar */}
        <footer className="h-24 bg-black border-t border-white/5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 w-1/4">
            {currentSong && <img src={currentSong.img} className="w-12 h-12 rounded-lg object-cover" />}
            <div className="truncate text-sm font-bold">{currentSong?.title}</div>
          </div>
          
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center gap-6 mb-2">
              <SkipBack className="cursor-pointer" />
              <button onClick={() => setIsPlaying(!isPlaying)} className="bg-white text-black p-2 rounded-full">
                {isPlaying ? <Pause size={20} fill="black"/> : <Play size={20} fill="black"/>}
              </button>
              <SkipForward className="cursor-pointer" onClick={handleNext} />
            </div>
            <div className="w-full max-w-md h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{width: `${played*100}%`}}></div>
            </div>
          </div>

          <div className="w-1/4 flex justify-end gap-4">
            <button onClick={() => setIsFocusMode(!isFocusMode)}><Maximize2 size={18}/></button>
          </div>
        </footer>

        {currentSong && (
          <ReactPlayer 
            url={`https://www.youtube.com/watch?v=${currentSong.id}`}
            playing={isPlaying}
            onProgress={(p) => setPlayed(p.played)}
            onDuration={(d) => setDuration(d)}
            onEnded={handleNext}
            width="0" height="0"
            config={{ youtube: { playerVars: { autoplay: 1 } } }}
          />
        )}
      </div>
    </div>
  );
};

export default App;