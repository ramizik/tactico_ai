/**
 * AIChat - AI Assistant Chat Interface
 * A fixed chat window positioned above the AI chat button with animated blob, message bubbles, and smooth transitions.
 *
 * Features:
 * - Fixed position window above the AI chat button at bottom-right
 * - Animated morphing blob before chat starts (white, dark green, light yellow gradient)
 * - Clean input field at bottom with send button
 * - User messages on right (green bubbles), AI on left (gray/white bubbles)
 * - Smooth fade animations when transitioning from blob to chat
 * - Minimize/maximize functionality
 *
 * BACKEND_HOOK:
 * - POST /api/chat/send { message, sessionId }
 * - GET /api/chat/history/:sessionId
 * - WebSocket connection for streaming responses
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatProps {
  onClose: () => void;
  matchInfo?: string;
}

export const AIChat = ({ onClose, matchInfo }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChatStarted = messages.length > 0;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // BACKEND_HOOK: POST /api/chat/send { message: inputValue, sessionId }
    // Simulate AI response with delay
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateMockResponse(),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mock AI response generator
  const generateMockResponse = (): string => {
    const responses = [
      "That's a great question! Based on your team's recent performance, I'd recommend focusing on maintaining possession in the midfield.",
      "I've analyzed your last match. The defense showed strong organization, but there's room to improve transitions from defense to attack.",
      "Your team's pressing intensity has increased by 15% over the last three games. Keep up the good work!",
      "To improve your attacking play, consider using more width and exploiting the flanks during build-up phases.",
      "I can help you with tactical analysis, player performance insights, and match preparation strategies. What would you like to know more about?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <div
      className="fixed shadow-2xl z-50 flex flex-col"
      style={{
        bottom: '32px',
        right: '32px',
        width: isMinimized ? '360px' : '400px',
        height: isMinimized ? 'auto' : '520px',
        maxWidth: 'calc(100vw - 64px)',
        maxHeight: 'calc(100vh - 120px)',
        background: 'linear-gradient(to bottom, #000000, #1a3311, #477023)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar with Controls */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <h3 className="text-white" style={{ fontWeight: 700, fontSize: '1.125rem' }}>
          {matchInfo ? `AI Coach - ${matchInfo}` : 'AI Coach'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white"
            aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Center Section - Animated Blob or Chat Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <AnimatePresence mode="wait">
              {!hasChatStarted ? (
                // Animated Blob Section (Before Chat Starts)
                <motion.div
                  key="blob-section"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="h-full flex flex-col items-center justify-center"
                >
                  {/* Animated Morphing Blob */}
                  <div className="relative mb-8">
                    <svg width="200" height="200" viewBox="0 0 300 300" className="drop-shadow-2xl">
                      <defs>
                        <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9">
                            <animate
                              attributeName="stopColor"
                              values="#ffffff; #E3F26F; #ffffff"
                              dur="6s"
                              repeatCount="indefinite"
                            />
                          </stop>
                          <stop offset="50%" stopColor="#477023" stopOpacity="0.8">
                            <animate
                              attributeName="stopColor"
                              values="#477023; #E3F26F; #477023"
                              dur="8s"
                              repeatCount="indefinite"
                            />
                          </stop>
                          <stop offset="100%" stopColor="#E3F26F" stopOpacity="0.9">
                            <animate
                              attributeName="stopColor"
                              values="#E3F26F; #477023; #E3F26F"
                              dur="7s"
                              repeatCount="indefinite"
                            />
                          </stop>
                        </linearGradient>
                        <filter id="goo">
                          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                          <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                            result="goo"
                          />
                        </filter>
                      </defs>
                      <g filter="url(#goo)">
                        <circle fill="url(#blobGradient)" cx="150" cy="150" r="80">
                          <animate
                            attributeName="r"
                            values="80; 95; 75; 90; 80"
                            dur="10s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="cx"
                            values="150; 160; 140; 155; 150"
                            dur="8s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle fill="url(#blobGradient)" cx="200" cy="150" r="60">
                          <animate
                            attributeName="r"
                            values="60; 50; 70; 55; 60"
                            dur="9s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="cy"
                            values="150; 140; 160; 145; 150"
                            dur="7s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle fill="url(#blobGradient)" cx="180" cy="200" r="50">
                          <animate
                            attributeName="r"
                            values="50; 65; 45; 60; 50"
                            dur="11s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="cx"
                            values="180; 170; 190; 175; 180"
                            dur="6s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    </svg>
                  </div>

                  {/* "Start Your Chat" Text */}
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: '#E3F26F',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Start Your Chat
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-gray-300 mt-3 text-center max-w-md px-4"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Ask me anything about tactics, player performance, or match analysis
                  </motion.p>
                </motion.div>
              ) : (
                // Chat Messages Section
                <motion.div
                  key="messages-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full space-y-4"
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-3 shadow-sm ${message.sender === 'user'
                          ? 'rounded-[20px] rounded-br-[5px]'
                          : 'rounded-[20px] rounded-bl-[5px]'
                          }`}
                        style={{
                          backgroundColor: message.sender === 'user' ? '#477023' : '#f3f4f6',
                          color: message.sender === 'user' ? '#ffffff' : '#1f2937',
                          fontWeight: 500,
                          lineHeight: 1.5,
                          fontSize: '0.9rem',
                        }}
                      >
                        {message.text}
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div
                        className="px-4 py-3 rounded-[20px] rounded-bl-[5px] bg-gray-100 shadow-sm"
                        style={{ fontWeight: 500 }}
                      >
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 rounded-full bg-gray-400"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 rounded-full bg-gray-400"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 rounded-full bg-gray-400"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Field (Bottom Area) */}
          <div className="border-t border-gray-700 px-6 py-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <div
              className="flex items-center gap-3 border-2 px-4 py-2 transition-all focus-within:shadow-md"
              style={{
                borderRadius: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-white text-sm"
                style={{ fontWeight: 500 }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="flex-shrink-0 p-2 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: inputValue.trim() ? '#477023' : '#d1d5db',
                }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
