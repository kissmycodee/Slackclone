import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '../hooks/useFirestore';

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: any;
  reactions: { [key: string]: string[] };
  fileUrl?: string;
}

const ChatArea: React.FC = () => {
  const [newMessage, setNewMessage] = useState('');
  const { channelId, userId } = useParams<{ channelId?: string; userId?: string }>();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatId = channelId || userId;
  const collectionPath = channelId ? `channels/${chatId}/messages` : `directMessages/${chatId}/messages`;

  const { documents: messages } = useFirestore<Message>(collectionPath, [orderBy('timestamp', 'asc'), limit(50)]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !fileInputRef.current?.files?.length) return;

    const user = auth.currentUser;
    if (!user) return;

    let fileUrl = '';
    if (fileInputRef.current?.files?.length) {
      // Implement file upload logic here
    }

    try {
      await addDoc(collection(db, collectionPath), {
        user: user.displayName || user.email,
        content: newMessage,
        timestamp: serverTimestamp(),
        reactions: {},
        fileUrl,
      });

      setNewMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const messageRef = doc(db, collectionPath, messageId);
    const messageDoc = await getDoc(messageRef);
    const currentReactions = messageDoc.data()?.reactions || {};

    try {
      if (currentReactions[reaction]?.includes(user.uid)) {
        await updateDoc(messageRef, {
          [`reactions.${reaction}`]: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(messageRef, {
          [`reactions.${reaction}`]: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            <div className="font-bold text-sm">{message.user} <span className="text-gray-500 text-xs font-normal">{message.timestamp?.toDate().toLocaleTimeString()}</span></div>
            <div className="text-sm">{message.content}</div>
            {message.fileUrl && (
              <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                Attached File
              </a>
            )}
            <div className="mt-1 flex flex-wrap">
              {Object.entries(message.reactions).map(([reaction, users]) => (
                <button
                  key={reaction}
                  onClick={() => handleReaction(message.id, reaction)}
                  className="mr-2 mb-2 px-2 py-1 bg-gray-200 rounded-full text-xs"
                >
                  {reaction} {users.length}
                </button>
              ))}
              <button onClick={() => handleReaction(message.id, '👍')} className="mr-2 mb-2 text-sm">👍</button>
              <button onClick={() => handleReaction(message.id, '❤️')} className="mr-2 mb-2 text-sm">❤️</button>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="border-t p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg p-2 mb-2 sm:mb-0 sm:mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <div className="flex">
            <label className="cursor-pointer bg-gray-200 p-2 rounded-l-lg">
              <Paperclip size={20} />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
              />
            </label>
            <button
              type="button"
              className="bg-gray-200 p-2"
              onClick={() => {/* Implement emoji picker */}}
            >
              <Smile size={20} />
            </button>
            <button
              type="submit"
              className="bg-indigo-500 text-white p-2 rounded-r-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatArea;