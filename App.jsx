import { useEffect, useRef, useState } from "react";
import {
  AudioLines, Bot, ChevronDown, CircleHelp, Clock3, Command, Mic, MicOff,
  Plus, Send, Settings2, Sparkles, Volume2, VolumeX, Waves, X, Zap
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const suggestions = [
  { icon: "✦", title: "Explain a complex topic", prompt: "Explain how artificial intelligence works in simple terms." },
  { icon: "⌘", title: "Help me write code", prompt: "Help me write a clean JavaScript function and explain it." },
  { icon: "◷", title: "Plan my day", prompt: "Help me make a realistic, productive plan for today." },
  { icon: "↗", title: "Brainstorm new ideas", prompt: "Give me five creative project ideas and explain what makes each useful." }
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const recognitionRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function speak(text) {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    if (voiceName) {
      const selected = window.speechSynthesis.getVoices().find(v => v.name === voiceName);
      if (selected) utterance.voice = selected;
    }
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(rawText) {
    const text = rawText.trim();
    if (!text || thinking) return;
    setError("");
    setInput("");
    const nextMessages = [...messages, { id: makeId(), role: "user", content: text }];
    setMessages(nextMessages);
    setThinking(true);
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })).slice(-20)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
      const assistantMessage = { id: makeId(), role: "assistant", content: data.answer };
      setMessages(prev => [...prev, assistantMessage]);
      speak(data.answer);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  }

  function startListening() {
    setError("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input isn't supported in this browser. Try Google Chrome or Microsoft Edge, or type your message below.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    window.speechSynthesis?.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    let finalTranscript = "";
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      setInput((finalTranscript + " " + interim).trim());
    };
    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(event.error === "not-allowed"
          ? "Microphone access was blocked. Allow microphone access in your browser settings."
          : `Voice input error: ${event.error}`);
      }
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      if (finalTranscript.trim()) sendMessage(finalTranscript.trim());
    };
    recognition.start();
  }

  function newChat() {
    if (messages.length) {
      setHistory(prev => [{ id: makeId(), title: messages.find(m => m.role === "user")?.content.slice(0, 32) || "Conversation", messages }, ...prev].slice(0, 10));
    }
    setMessages([]);
    setInput("");
    setError("");
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function restoreChat(item) {
    if (messages.length) {
      setHistory(prev => [{ id: makeId(), title: messages.find(m => m.role === "user")?.content.slice(0, 32) || "Conversation", messages }, ...prev].slice(0, 10));
    }
    setMessages(item.messages);
  }

  const browserVoices = typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis.getVoices() : [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={e => { e.preventDefault(); newChat(); }}>
          <span className="brand-mark"><Waves size={21} /></span>
          <span>Aura<span className="brand-ai"> AI</span></span>
        </a>
        <button className="new-chat" onClick={newChat}><Plus size={17} /> New conversation <span className="shortcut">⌘ K</span></button>
        <div className="side-label">YOUR SPACE</div>
        <button className="nav-item active" onClick={newChat}><Sparkles size={17} /> Voice assistant</button>
        <button className="nav-item" onClick={() => setShowSettings(true)}><Settings2 size={17} /> Preferences</button>
        <div className="history-heading"><span>RECENT CONVERSATIONS</span><Clock3 size={14} /></div>
        <div className="history-list">
          {history.length === 0 ? <p className="empty-history">Your conversations will appear here.</p> : history.map(item => (
            <button key={item.id} className="history-item" onClick={() => restoreChat(item)} title={item.title}>{item.title}</button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon"><Zap size={16} /></div><div><strong>Your AI companion</strong><p>Ideas, answers, and more.</p></div></div>
          <div className="profile"><div className="profile-avatar">A</div><div className="profile-text"><strong>Aura Assistant</strong><span>Personal workspace</span></div><ChevronDown size={16} className="muted-icon" /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Waves size={18}/></span> Aura AI</div>
          <div className="mode-pill"><span className="status-dot" /> AI VOICE MODE</div>
          <div className="top-actions">
            <button className="icon-button" title={voiceEnabled ? "Mute spoken replies" : "Enable spoken replies"} onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) { window.speechSynthesis?.cancel(); setSpeaking(false); } }}><span className="sr-only">Toggle voice replies</span>{voiceEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
            <button className="icon-button" title="Preferences" onClick={() => setShowSettings(true)}><Settings2 size={18}/></button>
          </div>
        </header>

        <section className={`conversation ${messages.length ? "has-messages" : ""}`}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className={`orb-wrap ${listening ? "is-listening" : ""} ${thinking ? "is-thinking" : ""} ${speaking ? "is-speaking" : ""}`}>
                <div className="orb-halo halo-one" /><div className="orb-halo halo-two" />
                <div className="orb"><div className="orb-shine"/><div className="orb-core"/></div>
                <div className="orb-spark spark-one">✦</div><div className="orb-spark spark-two">✧</div>
              </div>
              <div className="eyebrow"><span className="eyebrow-line"/> YOUR PERSONAL AI <span className="eyebrow-line"/></div>
              <h1>{listening ? "I'm listening." : thinking ? "One moment..." : speaking ? "Speaking to you" : "A little more human."}<br/><span>{listening ? "Go ahead, I'm here." : "A lot more helpful."}</span></h1>
              <p className="welcome-subtitle">Your ideas, questions, and curiosities — just say the word.</p>
              <div className="voice-control">
                <button className={`mic-button ${listening ? "listening" : ""}`} onClick={startListening} aria-label={listening ? "Stop listening" : "Start voice input"}>
                  {listening ? <MicOff size={23}/> : <Mic size={23}/>}
                  <span className="mic-ripple"/><span className="mic-ripple ripple-two"/>
                </button>
                <div className="voice-control-label"><strong>{listening ? "Listening now" : "Tap to speak"}</strong><span>{listening ? "Speak naturally · tap to stop" : "I'm ready when you are"}</span></div>
                <div className={`waveform ${listening || speaking ? "wave-active" : ""}`} aria-hidden="true">{Array.from({length: 13}, (_,i) => <i key={i} style={{"--i": i}} />)}</div>
              </div>
              <div className="suggestions">
                <div className="suggestions-title">A FEW THINGS WE CAN DO</div>
                <div className="suggestion-grid">
                  {suggestions.map(s => <button className="suggestion-card" key={s.title} onClick={() => sendMessage(s.prompt)}><span className="suggestion-icon">{s.icon}</span><span>{s.title}</span><span className="suggestion-arrow">↗</span></button>)}
                </div>
              </div>
            </div>
          ) : (
            <div className="message-list">
              <div className="chat-heading"><div><span className="eyebrow-small">YOUR CONVERSATION</span><h2>Let's talk<span className="heading-dot">.</span></h2></div><button className="text-button" onClick={newChat}><Plus size={15}/> New chat</button></div>
              {messages.map(m => <article className={`message ${m.role}`} key={m.id}><div className={`message-avatar ${m.role}`}>{m.role === "assistant" ? <Waves size={17}/> : "Y"}</div><div className="message-body"><div className="message-meta">{m.role === "assistant" ? "AURA AI" : "YOU"}<span>·</span>{m.role === "assistant" ? "Assistant" : "Message"}</div><p>{m.content}</p>{m.role === "assistant" && <button className="read-aloud" onClick={() => speak(m.content)}><Volume2 size={14}/> Read aloud</button>}</div></article>)}
              {thinking && <div className="thinking-row"><div className="message-avatar assistant"><Waves size={17}/></div><div><span className="thinking-dots"><i/><i/><i/></span><span className="thinking-text">Aura is thinking</span></div></div>}
              <div ref={endRef}/>
            </div>
          )}
        </section>

        <div className="composer-wrap">
          {error && <div className="error-banner"><CircleHelp size={16}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={15}/></button></div>}
          <form className="composer" onSubmit={e => { e.preventDefault(); sendMessage(input); }}>
            <button type="button" className={`composer-mic ${listening ? "listening" : ""}`} onClick={startListening} title="Speak a message">{listening ? <MicOff size={19}/> : <Mic size={19}/>}</button>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder={listening ? "Listening... speak now" : "Ask Aura anything..."} aria-label="Message Aura" />
            <span className="composer-divider"/>
            <span className="composer-hint"><Command size={12}/> Enter</span>
            <button className="send-button" type="submit" disabled={!input.trim() || thinking} aria-label="Send message"><Send size={17}/></button>
          </form>
          <div className="footer-note"><Sparkles size={12}/> AI can make mistakes. Verify important information.</div>
        </div>
      </main>

      {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><section className="settings-modal" onClick={e => e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow-small">PERSONALIZE</span><h3>Preferences</h3></div><button className="icon-button" onClick={() => setShowSettings(false)}><X size={18}/></button></div><label className="setting-row"><span><strong>Spoken replies</strong><small>Read AI responses aloud</small></span><input type="checkbox" checked={voiceEnabled} onChange={e => setVoiceEnabled(e.target.checked)}/></label><label className="setting-field"><span>Voice</span><select value={voiceName} onChange={e => setVoiceName(e.target.value)}><option value="">Default system voice</option>{browserVoices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}</select></label><p className="settings-note">Voice options depend on the voices installed in your browser or operating system.</p><button className="modal-done" onClick={() => setShowSettings(false)}>Done</button></section></div>}
    </div>
  );
}
