import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaFile, FaImage } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { User, Message } from '@/types';

interface ChatBoxProps {
  currentUser: User;
  recipient: User;
  messages: Message[];
  onSendMessage: (message: Message) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ 
  currentUser, 
  recipient, 
  messages, 
  onSendMessage 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTyping = () => {
    // In a real app, you would emit a socket event here to show typing indicator
    setIsTyping(true);
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
    return () => clearTimeout(timeout);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: uuidv4(),
      senderId: currentUser.id,
      receiverId: recipient.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    onSendMessage(message);
    setNewMessage('');
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // In a real app, you would upload the file to a server here
    // For now, we'll just add a message with the file name
    const file = files[0];
    
    const message: Message = {
      id: uuidv4(),
      senderId: currentUser.id,
      receiverId: recipient.id,
      content: `Sent a file: ${file.name}`,
      timestamp: new Date().toISOString(),
      read: false,
      attachments: [file.name],
    };
    
    onSendMessage(message);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-white p-4 border-b flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 mr-3">
          {recipient.profilePicture ? (
            <img 
              src={recipient.profilePicture} 
              alt={recipient.name} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-primary text-white flex items-center justify-center">
              {recipient.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-medium">{recipient.name}</h3>
          <p className="text-xs text-gray-500">{recipient.role.charAt(0).toUpperCase() + recipient.role.slice(1)}</p>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => {
          const isMine = message.senderId === currentUser.id;
          return (
            <div 
              key={message.id} 
              className={`flex mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-3/4 px-4 py-2 rounded-lg ${
                  isMine 
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white border rounded-tl-none'
                }`}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex items-center mb-2 text-sm">
                    {message.attachments[0].endsWith('.pdf') ? (
                      <FaFile className={isMine ? 'text-white' : 'text-primary'} />
                    ) : (
                      <FaImage className={isMine ? 'text-white' : 'text-primary'} />
                    )}
                    <span className="ml-2">{message.attachments[0]}</span>
                  </div>
                )}
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMine && (
                    <span className="ml-2">
                      {message.read ? 'Read' : 'Sent'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="text-xs text-gray-500 ml-4 mb-4">
            {recipient.name} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat input */}
      <form onSubmit={handleSubmit} className="bg-white p-3 border-t flex items-center">
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button 
          type="button" 
          className="p-2 text-gray-500 hover:text-primary"
          onClick={handleFileUpload}
        >
          <FaFile />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 form-input border-0 focus:ring-0"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleTyping}
        />
        <button 
          type="submit" 
          className="p-2 text-primary hover:text-primary/80"
          disabled={!newMessage.trim()}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default ChatBox; 