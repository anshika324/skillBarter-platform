import { formatDistanceToNow } from 'date-fns';

export default function MessageList({ messages, currentUserId }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender._id === currentUserId;
        
        return (
          <div
            key={message._id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                isOwnMessage
                  ? 'bg-rose-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
              }`}
            >
              {!isOwnMessage && (
                <p className="text-xs text-gray-500 mb-1">
                  {message.sender.firstName} {message.sender.lastName}
                </p>
              )}
              
              <p className="text-sm break-words">{message.content}</p>
              
              <p
                className={`text-xs mt-1 ${
                  isOwnMessage ? 'text-rose-100' : 'text-gray-400'
                }`}
              >
                {formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}