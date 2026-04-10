import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MessageSquare, Send, Search, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../utils/runtimeUrls';

// Prefer relative URL so Vite proxy can forward to backend.
const API_BASE = getApiBaseUrl();

const Messages = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    socket, 
    connected, 
    getConversationMessages, 
    isOnline, 
    getMessages, 
    sendMessage, 
    markAsRead 
  } = useSocket();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isFetchingRef = useRef(false);
  const userIdParam = searchParams.get('user');

  useEffect(() => {
    if (!user?._id) return;
    fetchRecentConversations();
  }, [user?._id]);

  useEffect(() => {
    if (userIdParam && socket) {
      openConversationById(userIdParam);
    }
  }, [userIdParam, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  useEffect(() => {
    if (socket) {
      socket.on('user-typing', ({ userId, isTyping }) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      });

      return () => {
        socket.off('user-typing');
      };
    }
  }, [socket]);

  const fetchRecentConversations = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const shouldShowLoader = conversations.length === 0;
    if (shouldShowLoader) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const conversationsRes = await axios.get(`${API_BASE}/users/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const conversationUsers = conversationsRes.data.users || [];
      if (conversationUsers.length > 0) {
        setConversations(conversationUsers);
        return;
      }

      // Fallback: discover users when no conversations exist yet.
      const searchRes = await axios.get(`${API_BASE}/users/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 }
      });
      const apiUsers = searchRes.data.users || [];
      const withoutCurrentUser = apiUsers.filter((u) => String(u?._id || '') !== String(user?._id || ''));
      const uniqueUsers = Array.from(new Map(withoutCurrentUser.map((u) => [u._id, u])).values());
      setConversations(uniqueUsers);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      if (shouldShowLoader) setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const openConversationById = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/users/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      openConversation(response.data);
    } catch (error) {
      console.error('Error opening conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const openConversation = (otherUser) => {
    setSelectedConversation(otherUser);
    
    if (socket && connected) {
      console.log('📥 Loading messages for:', otherUser._id);
      getMessages(user._id, otherUser._id);
      
      const conversationId = getConversationId(user._id, otherUser._id);
      markAsRead(conversationId);
    }
  };

  const getConversationId = (userId1, userId2) => {
    const ids = [userId1, userId2].sort();
    return `${ids[0]}_${ids[1]}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !selectedConversation) return;

    console.log('📤 Sending message');
    sendMessage(selectedConversation._id, messageText);
    setMessageText('');
    
    if (socket) {
      socket.emit('typing', { recipientId: selectedConversation._id, isTyping: false });
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    
    if (socket && selectedConversation) {
      socket.emit('typing', { recipientId: selectedConversation._id, isTyping: true });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { recipientId: selectedConversation._id, isTyping: false });
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const conversationMessages = selectedConversation 
    ? getConversationMessages(getConversationId(user._id, selectedConversation._id))
    : [];

  const filteredConversations = conversations.filter(conv => 
    searchQuery === '' || 
    `${conv.firstName} ${conv.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvatarUrl = (person) => {
    if (person?.avatar) return person.avatar;
    const name = `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  return (
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] bg-gray-50 p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full min-h-0">
        <div className="grid grid-cols-12 gap-0 h-full min-h-0 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          {/* Conversations List */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r border-gray-200 flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
              
              {!connected && (
                <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  Connecting...
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No conversations</p>
                  <Link to="/skills" className="text-primary-600 text-sm hover:underline">
                    Browse skills to chat
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => openConversation(conv)}
                    className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedConversation?._id === conv._id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={getAvatarUrl(conv)}
                        alt={conv.firstName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isOnline(conv._id) && (
                        <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900">
                        {conv.firstName} {conv.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {isOnline(conv._id) ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                  <img
                    src={getAvatarUrl(selectedConversation)}
                    alt={selectedConversation.firstName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.firstName} {selectedConversation.lastName}
                    </h3>
                    <div className="flex items-center text-sm">
                      <Circle className={`w-2 h-2 mr-1 ${isOnline(selectedConversation._id) ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'}`} />
                      <span className="text-gray-600">
                        {isOnline(selectedConversation._id) ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <Link to={`/profile/${selectedConversation._id}`} className="btn btn-ghost text-sm">
                    View Profile
                  </Link>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 bg-gray-50">
                  {conversationMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No messages yet</p>
                      <p className="text-gray-500">Start the conversation!</p>
                    </div>
                  ) : (
                    conversationMessages.map((msg, index) => {
                      const isOwn = msg.sender._id === user._id;
                      const showAvatar = index === 0 || conversationMessages[index - 1].sender._id !== msg.sender._id;

                      return (
                        <div
                          key={msg._id || index}
                          className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
                        >
                          {showAvatar ? (
                            <img src={getAvatarUrl(msg.sender)} alt={msg.sender.firstName} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8" />
                          )}
                          
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
                            <div className={`px-4 py-2 rounded-2xl ${isOwn ? 'bg-primary-600 text-white' : 'bg-white border text-gray-900'}`}>
                              <p className="text-sm break-words">{msg.content}</p>
                            </div>
                            <span className="text-xs text-gray-500 mt-1">
                              {msg.createdAt ? formatRelativeTime(msg.createdAt) : 'Just now'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {typingUsers.has(selectedConversation._id) && (
                    <div className="flex items-center space-x-2">
                      <img src={getAvatarUrl(selectedConversation)} alt={selectedConversation.firstName} className="w-8 h-8 rounded-full" />
                      <div className="bg-white border rounded-2xl px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                  {!connected && (
                    <p className="text-sm text-red-600 mb-2">Connecting to chat server...</p>
                  )}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={handleTyping}
                      placeholder={connected ? "Type a message..." : "Connecting..."}
                      className="flex-1 px-4 py-3 border rounded-full focus:ring-2 focus:ring-primary-500"
                      disabled={!connected}
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim() || !connected}
                      className="btn btn-primary rounded-full w-12 h-12 p-0 flex items-center justify-center disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your Messages</h3>
                  <p className="text-gray-600">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
