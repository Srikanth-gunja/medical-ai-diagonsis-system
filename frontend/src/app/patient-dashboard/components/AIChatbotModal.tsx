'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { chatbotApi } from '@/lib/api';
import { logger } from '@/lib/logger';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface AIChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Safe markdown renderer - NO dangerouslySetInnerHTML
const renderMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let inList = false;

  // Escape HTML to prevent XSS
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Process inline formatting safely - returns React nodes, not HTML
  const processLine = (line: string, index: number): React.ReactNode => {
    // First escape HTML
    const processed = escapeHtml(line);

    // Split by markers and create React elements
    const parts: React.ReactNode[] = [];
    const remaining = processed;
    let key = 0;

    // Process bold: **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    let lastIndex = 0;

    while ((match = boldRegex.exec(processed)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{processed.slice(lastIndex, match.index)}</span>);
      }
      parts.push(<strong key={key++}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < processed.length) {
      parts.push(<span key={key++}>{processed.slice(lastIndex)}</span>);
    }

    // If no bold found, return as is
    if (parts.length === 0) {
      return <span key={index}>{processed}</span>;
    }

    return <span key={index}>{parts}</span>;
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc ml-5 my-2 space-y-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  lines.forEach((line, index) => {
    // Check for bullet points
    const bulletMatch = line.match(/^\s*[*•-]\s+(.+)$/);
    const numberedMatch = line.match(/^\s*\d+\.\s+(.+)$/);

    if (bulletMatch || numberedMatch) {
      inList = true;
      const content = bulletMatch ? bulletMatch[1] : numberedMatch![1];
      listItems.push(<li key={`item-${index}`}>{processLine(content, index)}</li>);
    } else {
      if (inList) {
        flushList();
      }

      if (line.trim() === '') {
        elements.push(<br key={`br-${index}`} />);
      } else {
        elements.push(
          <span key={index} className="block">
            {processLine(line, index)}
          </span>
        );
      }
    }
  });

  // Flush any remaining list items
  if (inList) {
    flushList();
  }

  return elements;
};

const AIChatbotModal = ({ isOpen, onClose }: AIChatbotModalProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content:
        "Hello! I'm your AI Health Assistant. How can I help you today? You can ask me about symptoms, health concerns, or get personalized doctor recommendations.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage(userMessage.content);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      logger.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content:
          "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    'I have a headache',
    'Recommend a doctor',
    'How do I book an appointment?',
    'What are my health records?',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-elevation-3 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
              <Icon name="SparklesIcon" variant="solid" size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">AI Health Assistant</h3>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-xs text-text-secondary">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-muted rounded-lg transition-base"
            aria-label="Close AI chatbot"
            title="Close"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-text-primary rounded-bl-md'
                }`}
              >
                <div className="text-sm">
                  {message.type === 'bot' ? renderMarkdown(message.content) : message.content}
                </div>
                <p
                  className={`text-xs mt-1 ${message.type === 'user' ? 'text-primary-foreground/70' : 'text-text-secondary'}`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex space-x-2">
                  <div
                    className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-text-secondary mb-2">Quick prompts:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(prompt)}
                  className="px-3 py-1.5 text-xs bg-muted text-text-secondary hover:text-primary rounded-full transition-base"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 h-12 px-4 bg-muted border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="h-12 px-4 bg-primary text-primary-foreground rounded-lg hover:shadow-elevation-2 disabled:opacity-50 disabled:cursor-not-allowed transition-base"
              aria-label="Send message"
              title="Send"
            >
              <Icon name="PaperAirplaneIcon" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbotModal;
