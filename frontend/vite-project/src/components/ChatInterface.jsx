import { useState, useEffect, useRef } from 'react';
import { Send, Loader } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import MessageList from './MessageList';

export default function ChatInterface({ recipient }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const { sendMessage, getConversationMessages, emitTyping } = useSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const conversationId = [user._id, recipient._id].sort().join('_');
  const messages = getConversationMessages(conversationId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing started
    emitTyping(recipient._id, true);

    // Set timeout to emit typing stopped
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(recipient._id, false);
    }, 1000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const messageContent = message.trim();
    setMessage('');
    
    // Clear typing indicator
    emitTyping(recipient._id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send message
    sendMessage(recipient._id, messageContent);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <img
            src={recipient.avatar}
            alt={`${recipient.firstName} ${recipient.lastName}`}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">
              {recipient.firstName} {recipient.lastName}
            </h3>
            <p className="text-sm text-gray-500">
              {isTyping ? 'Typing...' : 'Active now'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <MessageList messages={messages} currentUserId={user._id} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}