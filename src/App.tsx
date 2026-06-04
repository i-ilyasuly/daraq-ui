import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUp,
  Copy, 
  Check,
  Lightbulb,
  Menu,
  SquarePen,
  MoreVertical,
  Search,
  MessageCircle,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import Markdown from 'react-markdown';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isComplete?: boolean;
};

const API_BASE_URL = '';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const scrollViewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
    }
  }, [messages, isLoading, isError]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleSend = async (forcedText?: string) => {
    const textToSend = (forcedText !== undefined ? forcedText : inputText).trim();
    if (!textToSend) return;
    
    // Clear states
    setIsError(false);
    setLastQuery(textToSend);

    // Save and send user message
    const newMessage: Message = { id: Date.now().toString(), text: textToSend, sender: 'user' };
    setMessages((prev) => [...prev, newMessage]);
    
    if (forcedText === undefined) {
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '36px';
      }
    }

    setIsLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: textToSend,
          thinking: isThinkingEnabled
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned error code ${response.status}`);
      }

      const data = await response.json();
      setIsLoading(false);

      // Extract backend response text dynamically
      let responseText = data.response || data.reply || data.message;
      if (!responseText) {
        if (typeof data === 'string') {
          responseText = data;
        } else {
          responseText = JSON.stringify(data);
        }
      }

      // Add empty message for the streaming effect
      setMessages((prev) => [...prev, { id: aiMsgId, text: '', sender: 'ai' }]);
      
      let fullText = responseText;
      if (isThinkingEnabled) {
         fullText = "[Ойлау басталды... Деректерді талдау...]\n\n" + fullText;
      }

      let i = 0;
      const timer = setInterval(() => {
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, text: fullText.slice(0, i + 1) } : m
        ));
        i += 3; // Stream slightly faster for dynamic feeling
        if (i >= fullText.length) {
          setMessages(prev => prev.map(m => 
            m.id === aiMsgId ? { ...m, text: fullText, isComplete: true } : m
          ));
          clearInterval(timer);
        }
      }, 15);

    } catch (err) {
      console.error('Error fetching chat data: ', err);
      setIsLoading(false);
      setIsError(true);
    }
  };

  const handleRetry = () => {
    if (lastQuery) {
      handleSend(lastQuery);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-black font-sans transition-colors duration-300">
      {/* Mobile container boundary mimicking RN Web output */}
      <div className="w-full max-w-md h-full bg-white dark:bg-[#121212] flex flex-col relative shadow-2xl sm:border sm:border-gray-200 sm:dark:border-neutral-800 overflow-hidden">
        
        {/* Drawer Overlay */}
        {isDrawerOpen && (
          <div className="absolute inset-0 z-50 flex overflow-hidden animate-fade-in">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/40 transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            ></div>
            
            {/* Drawer Content */}
            <div className="relative w-[82%] max-w-[320px] h-full bg-white dark:bg-[#171717] flex flex-col shadow-2xl transform transition-transform">
              
              {/* Header */}
              <div className="flex justify-between items-center p-4">
                <span className="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">Daraq</span>
                <div className="flex items-center space-x-3">
                  <button className="text-neutral-600 dark:text-neutral-300 p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                    <Search size={22}/>
                  </button>
                  <div className="w-8 h-8 bg-[#10a37f] rounded-full flex items-center justify-center text-white font-semibold text-sm">Д</div>
                </div>
              </div>
              
              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto px-2 pb-24">
                <div className="px-3 py-2 text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 mt-2">Бекітілген</div>
                <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800/50 text-left transition-colors cursor-pointer">
                  <MessageCircle size={20} className="text-neutral-700 dark:text-neutral-300 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-[15px] truncate text-neutral-800 dark:text-neutral-200 font-medium">20 млн табыс үшін қолданушылар</span>
                </button>
                
                <div className="px-3 py-2 text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 mt-4 mb-1">Соңғылары</div>
                {[
                  'Сәлемдесу мен көмек', 
                  'Жағдай туралы сұрақ', 
                  'Дарақ сөзі мен мағынасы', 
                  'Қауіпсіздік мәселесі', 
                  'Gemini API ақы туралы', 
                  'Стартап идеялары 2026',
                  'Жақсы шешім қабылдау',
                  'Жоба архитектурасы',
                  'Араб тіліне аударма',
                  'ИП мен ООО айырмашылығы',
                  'Компромис туралы түсінік',
                  'Техникалық қызмет туралы түсінік'
                ].map((item, idx) => (
                  <button key={idx} className="w-full text-left px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800/50 text-[15px] truncate text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer">
                    {item}
                  </button>
                ))}
              </div>
              
              {/* New Chat FAB inside Drawer */}
              <button 
                className="absolute bottom-6 right-4 bg-[#10a37f] hover:bg-[#0e8f6e] text-white px-5 py-3.5 rounded-full flex items-center space-x-2 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                onClick={() => {
                  setMessages([]); 
                  setIsDrawerOpen(false);
                  setInputText('');
                  setIsError(false);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = '36px';
                  }
                }}
              >
                <SquarePen size={20} />
                <span className="font-medium text-[15px]">Чат</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Main App Bar */}
          <div className="flex-shrink-0 h-14 flex items-center justify-between px-2 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md z-10 w-full transition-colors absolute top-0 left-0 border-b border-gray-100 dark:border-neutral-900">
            <button onClick={() => setIsDrawerOpen(true)} className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors focus:outline-none cursor-pointer">
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => { 
                  setMessages([]); 
                  setInputText(''); 
                  setIsError(false);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = '36px';
                  }
                }} 
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors focus:outline-none cursor-pointer"
                title="Жаңа чат"
              >
                <SquarePen size={22} />
              </button>
              <button className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors focus:outline-none cursor-pointer">
                <MoreVertical size={24} />
              </button>
            </div>
          </div>

          {/* Scrollable messages area */}
          <div ref={scrollViewRef} className="flex-1 overflow-y-auto px-4 pb-36 pt-18 text-neutral-900 dark:text-white">
            
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pt-10 pb-20">
                <div className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
                  Daraq
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-12 text-center">
                  Ханафи бағытындағы ассистент
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-8 pt-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {msg.sender === 'user' ? (
                      <div className="max-w-[85%] bg-[#D1F2D9] text-[#0f3d2a] px-5 py-3 rounded-3xl font-medium shadow-sm break-words animate-[scale-in_0.2s_ease-out]">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="max-w-[95%] flex flex-col space-y-3">
                        <div className="text-neutral-900 dark:text-neutral-100 text-[15px] leading-relaxed tracking-tight break-words whitespace-pre-wrap">
                          <Markdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                              strong: ({ children }) => <strong className="font-bold text-neutral-900 dark:text-white">{children}</strong>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                              ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-1.5">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-md font-bold mt-2.5 mb-1">{children}</h3>,
                              code: ({ children }) => <code className="bg-gray-150 dark:bg-neutral-850 px-1.5 py-0.5 rounded font-mono text-xs text-[#0f3d2a] dark:text-[#D1F2D9] font-medium">{children}</code>
                            }}
                          >
                            {msg.text || "..."}
                          </Markdown>
                        </div>
                        {msg.isComplete && (
                          <div className="flex items-center space-x-4 text-neutral-400 dark:text-neutral-500 mt-1">
                            <button 
                              onClick={() => handleCopy(msg.text, msg.id)}
                              className="hover:text-neutral-850 dark:hover:text-neutral-200 transition-colors flex items-center space-x-1.5 py-1 px-2 rounded-lg bg-gray-50 dark:bg-neutral-800/40 border border-gray-100 dark:border-neutral-800/80 cursor-pointer text-xs"
                              title="Көшіріп алу"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={14} className="text-[#10a37f]" />
                                  <span className="text-[#10a37f] font-medium animate-fade-in">Көшірілді!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>Көшіру</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading / Typing indicator */}
                {isLoading && (
                  <div className="flex flex-col items-start space-y-2 mt-4 px-1">
                    <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
                      <div className="flex space-x-1">
                        <span className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-sm font-medium animate-pulse ml-2 text-neutral-600 dark:text-neutral-300">Жауап дайындалуда...</span>
                    </div>
                  </div>
                )}

                {/* Error & Retry view */}
                {isError && (
                  <div className="flex flex-col items-start space-y-3 mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 animate-[scale-in_0.2s_ease-out] max-w-[90%]">
                    <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <span className="text-sm font-semibold">Байланыс үзілді. Қайталап көріңіз.</span>
                    </div>
                    <button 
                      onClick={handleRetry} 
                      className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 rounded-full text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>Қайта жіберу</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Bar Overlay */}
        <div className="absolute bottom-0 left-0 w-full px-4 transform bg-gradient-to-t from-white via-white to-transparent dark:from-[#121212] dark:via-[#121212] dark:to-transparent pt-10 pb-4 z-10">
          <div className="flex flex-col w-full mx-auto relative px-1">
            
            <div className="flex w-full space-x-2 font-sans">
              {/* Thinking Toggle & Input Wrapper */}
              <div className="flex-1 flex flex-col bg-gray-100 dark:bg-neutral-800 rounded-3xl border border-transparent focus-within:border-gray-300 dark:focus-within:border-neutral-600 transition-colors pt-2 pb-1.5 px-1.5 shadow-sm">
                
                {/* Thinking Button (Inside Input Box style) */}
                <div className="flex items-start px-2 mb-1">
                  <button 
                    onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border cursor-pointer ${
                      isThinkingEnabled 
                        ? 'border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50' 
                        : 'border-transparent bg-transparent text-gray-400 dark:text-neutral-500 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Lightbulb size={14} className={isThinkingEnabled ? "text-blue-500 dark:text-blue-400" : ""} />
                    <span>Ойлау</span>
                  </button>
                </div>

                <div className="flex items-end w-full px-2">
                  <textarea
                    ref={textareaRef}
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
                    onClick={() => handleSend()}
                    disabled={!inputText.trim() || isLoading}
                    className={`flex-shrink-0 w-8 h-8 mb-0.5 ml-2 flex items-center justify-center rounded-full text-white transition-all duration-200 cursor-pointer ${
                      inputText.trim() && !isLoading
                        ? 'bg-[#10a37f] hover:bg-[#0e8f6e] opacity-100 scale-100 shadow-md' 
                        : 'bg-gray-300 dark:bg-neutral-600 opacity-50 scale-95 cursor-not-allowed'
                    }`}
                    title="Send"
                  >
                    <ArrowUp size={18} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
