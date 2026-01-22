import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import Spinner from './ui/Spinner';

const Chatbot: React.FC = () => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    const newHistory = [...history, userMessage];
    
    setHistory(newHistory);
    setInput('');
    setIsLoading(true);
    
    try {
      const responseStream = await streamChat(newHistory);
      const reader = responseStream.getReader();

      let modelResponse = '';
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        modelResponse += value;
        setHistory(prev => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1] = { role: 'model', parts: [{ text: modelResponse }] };
          return updatedHistory;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I couldn't process that. Please try again." }] }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, history]);

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg shadow-xl">
      <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto">
        {history.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-sky-600' : 'bg-slate-700'}`}>
              <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
            </div>
          </div>
        ))}
         {isLoading && history[history.length-1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="max-w-lg px-4 py-2 rounded-lg bg-slate-700 flex items-center">
              <Spinner className="h-5 w-5 mr-2 text-white" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-white"
            placeholder="Ask Gemini anything..."
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center font-semibold"
          >
            {isLoading ? <Spinner /> : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
