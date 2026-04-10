import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        'http://127.0.0.1:5001';
      console.log('🔌 Connecting to socket:', socketUrl);
      
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setConnected(true);
        newSocket.emit('join', user._id);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setConnected(false);
      });

      // Receive new message FROM OTHER USER
      newSocket.on('receive-message', (message) => {
        console.log('📨 RECEIVED message from other user:', message);
        const conversationId = getConversationId(user._id, message.sender._id);
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), message]
        }));

        // Update unread count
        setUnreadCounts(prev => ({
          ...prev,
          [message.sender._id]: (prev[message.sender._id] || 0) + 1
        }));
      });

      // Message sent confirmation (YOUR OWN message)
      newSocket.on('message-sent', (message) => {
        console.log('✅ YOUR message sent successfully:', message);
        const conversationId = getConversationId(user._id, message.recipient._id || message.recipient);
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), message]
        }));
      });

      // Messages loaded
      newSocket.on('messages-loaded', (loadedMessages) => {
        console.log('📥 Messages loaded:', loadedMessages.length);
        if (loadedMessages.length > 0) {
          const firstMsg = loadedMessages[0];
          const otherUserId = firstMsg.sender._id === user._id ? 
            (firstMsg.recipient._id || firstMsg.recipient) : 
            firstMsg.sender._id;
          const conversationId = getConversationId(user._id, otherUserId);
          
          setMessages(prev => ({
            ...prev,
            [conversationId]: loadedMessages
          }));
        }
      });

      // Online users list
      newSocket.on('online-users', (userIds) => {
        console.log('🟢 Online users:', userIds);
        setOnlineUsers(new Set(userIds));
      });

      // User came online
      newSocket.on('user-online', (userId) => {
        console.log('🟢 User came online:', userId);
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      // User went offline
      newSocket.on('user-offline', (userId) => {
        console.log('⚫ User went offline:', userId);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const getConversationId = (userId1, userId2) => {
    const ids = [userId1, userId2].sort();
    return `${ids[0]}_${ids[1]}`;
  };

  const sendMessage = (recipientId, content, messageType = 'text') => {
    if (socket && connected && content.trim()) {
      socket.emit('send-message', {
        senderId: user._id,
        recipientId,
        content: content.trim(),
        messageType
      });
    }
  };

  const getMessages = (userId1, userId2) => {
    if (socket && connected) {
      socket.emit('get-messages', { userId1, userId2, limit: 50 });
    }
  };

  const markAsRead = (conversationId) => {
    if (socket && connected) {
      socket.emit('mark-read', { conversationId, userId: user._id });
      const otherUserId = conversationId.split('_').find(id => id !== user._id);
      if (otherUserId) {
        setUnreadCounts(prev => ({ ...prev, [otherUserId]: 0 }));
      }
    }
  };

  const emitTyping = (recipientId, isTyping) => {
    if (socket && connected) {
      socket.emit('typing', { recipientId, isTyping });
    }
  };

  const getConversationMessages = (conversationId) => {
    return messages[conversationId] || [];
  };

  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  };

  const value = {
    socket,
    connected,
    messages,
    onlineUsers,
    unreadCounts,
    sendMessage,
    getMessages,
    markAsRead,
    emitTyping,
    getConversationMessages,
    getTotalUnreadCount,
    isOnline: (userId) => onlineUsers.has(userId)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
