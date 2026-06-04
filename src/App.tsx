import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUp,
  Copy, 
  Volume2, 
  ThumbsUp, 
  ThumbsDown, 
  Share, 
  MessageSquare, 
  Clock, 
  Settings,
  Lightbulb,
  X
} from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
};

const STARTER_CARDS = [
  { id: 1, icon: '🕌', text: 'Намаз уақыты' },
  { id: 2, icon: '🌙', text: 'Ораза шарттары' },
  { id: 3, icon: '💰', text: 'Зекет есептеу' },
  { id: 4, icon: '💍', text: 'Неке ережесі' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat'|'history'|'settings'>('chat');
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);
  const scrollViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = { id: Date.now().toString(), text: inputText.trim(), sender: 'user' };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    const aiMsgId = (Date.now() + 1).toString();
    
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: aiMsgId, text: '', sender: 'ai' }]);
      
      let responseText = "Уағалейкум ассалам! Қайырлы таң. Адамзат тағы бір күнге жетіп, интернет арқылы мәтін алмасуды жалғастырып жатыр екен. Ғаламның таңғаларлық құбылыстарының бірі осы шығар.\n\nҚалай көмектесе аламын?\n\n(Бұл Ханафи мәзһабына негізделген жауап үлгісі. Толық ақпарат алу үшін нақтырақ сұрасаңыз болады. Мысалы, намаз уақыттары, оразаның шарттары немесе зекет есептеу туралы сұрақтар қоюыңызға болады.)";
      
      if (isThinkingEnabled) {
         responseText = "[Ойлау басталды... Деректерді талдау...]\n\n" + responseText;
      }

      let i = 0;
      const timer = setInterval(() => {
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, text: responseText.slice(0, i + 1) } : m
        ));
        i += 2; // Stream 2 chars at a time for smooth speed
        if (i >= responseText.length) {
          // make sure the final text perfectly matches the target text including the final character if odd length
          setMessages(prev => prev.map(m => 
            m.id === aiMsgId ? { ...m, text: responseText } : m
          ));
          clearInterval(timer);
        }
      }, 15);
    }, 400);
  };

  const handleCardClick = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-black font-sans transition-colors duration-300">
      {/* Mobile container boundary mimicking RN Web output */}
      <div className="w-full max-w-md h-full bg-white dark:bg-[#121212] flex flex-col relative shadow-2xl sm:border sm:border-gray-200 sm:dark:border-neutral-800 overflow-hidden">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          <div className="flex-shrink-0 h-10 flex items-center justify-center border-b border-transparent dark:border-transparent">
          </div>

          {/* Scrollable messages area */}
          <div ref={scrollViewRef} className="flex-1 overflow-y-auto px-4 pb-36">
            
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pt-10 pb-20">
                <div className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
                  Daraq
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-12 text-center">
                  Ханафи бағытындағы ассистент
                </div>
                
                {/* 2x2 grid Starter Cards */}
                <div className="w-full grid grid-cols-2 gap-3 mt-auto">
                  {STARTER_CARDS.map(card => (
                    <button 
                      key={card.id}
                      onClick={() => handleCardClick(card.text)}
                      className="flex flex-col items-start justify-center p-4 rounded-3xl border border-gray-200 dark:border-neutral-800 bg-transparent hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors focus:outline-none"
                    >
                      <span className="text-2xl mb-2">{card.icon}</span>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {card.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-8 pt-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {msg.sender === 'user' ? (
                      <div className="max-w-[85%] bg-[#D1F2D9] text-[#0f3d2a] px-5 py-3 rounded-3xl font-medium shadow-sm break-words">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="max-w-[95%] flex flex-col space-y-3">
                        <div className="text-neutral-900 dark:text-neutral-100 text-[15px] leading-relaxed tracking-tight break-words whitespace-pre-wrap">
                          {msg.text || "..."}
                        </div>
                        <div className="flex items-center space-x-4 text-neutral-400 dark:text-neutral-500 mt-1">
                          <button className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                            <Copy size={16} />
                          </button>
                          <button className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                            <Volume2 size={16} />
                          </button>
                          <div className="flex items-center space-x-2">
                            <button className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                              <ThumbsUp size={16} />
                            </button>
                            <button className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                              <ThumbsDown size={16} />
                            </button>
                          </div>
                          <button className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                            <Share size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Bar Overlay */}
        <div className="absolute bottom-[4.5rem] left-0 w-full px-4 transform bg-gradient-to-t from-white via-white to-transparent dark:from-[#121212] dark:via-[#121212] dark:to-transparent pt-8 pb-3">
          <div className="flex flex-col w-full mx-auto relative px-1">
            
            <div className="flex w-full space-x-2">
              {/* Thinking Toggle & Input Wrapper */}
              <div className="flex-1 flex flex-col bg-gray-100 dark:bg-neutral-800 rounded-3xl border border-transparent focus-within:border-gray-300 dark:focus-within:border-neutral-600 transition-colors pt-2 pb-1.5 px-1.5 shadow-sm">
                
                {/* Thinking Button (Inside Input Box style) */}
                <div className="flex items-start px-2 mb-1">
                  <button 
                    onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                      isThinkingEnabled 
                        ? 'border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50' 
                        : 'border-transparent bg-transparent text-gray-400 dark:text-neutral-500 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Lightbulb size={14} className={isThinkingEnabled ? "text-blue-500 dark:text-blue-400" : ""} />
                    <span>Ойлау</span>
                    {isThinkingEnabled && <X size={12} className="ml-1 opacity-70" />}
                  </button>
                </div>

                <div className="flex items-end w-full px-2">
                  <textarea
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Daraq-қа жауап беру..."
                    className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 py-1.5 overflow-y-auto"
                    rows={1}
                    style={{ height: '36px' }}
                  />
                  
                  <button 
                    onClick={inputText.trim() ? handleSend : undefined}
                    disabled={!inputText.trim()}
                    className={`flex-shrink-0 w-8 h-8 mb-0.5 ml-2 flex items-center justify-center rounded-full text-white transition-all duration-200 ${
                      inputText.trim() 
                        ? 'bg-[#10a37f] hover:bg-[#0e8f6e] opacity-100 scale-100 shadow-md' 
                        : 'bg-gray-300 dark:bg-neutral-600 opacity-50 scale-95 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp size={18} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Tab Bar */}
        <div className="absolute bottom-0 w-full h-[4.5rem] bg-white dark:bg-[#121212] flex justify-around items-center px-6 pb-2 pt-1 border-t border-gray-100 dark:border-neutral-900 text-neutral-400 dark:text-neutral-500">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${activeTab === 'chat' ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
          >
            <MessageSquare size={24} className={activeTab === 'chat' ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Чат</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${activeTab === 'history' ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
          >
            <Clock size={24} />
            <span className="text-[10px] font-medium">Тарих</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${activeTab === 'settings' ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-medium">Баптаулар</span>
          </button>
        </div>

      </div>
    </div>
  );
}
