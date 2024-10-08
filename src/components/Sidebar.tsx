import React, { useState, useEffect } from 'react';
import { Hash, Users, Plus, LogOut } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useFirestore } from '../hooks/useFirestore';

interface Channel {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  online: boolean;
}

const Sidebar: React.FC = () => {
  const [newChannelName, setNewChannelName] = useState('');
  const navigate = useNavigate();

  const { documents: channels } = useFirestore<Channel>('channels');
  const { documents: users } = useFirestore<User>('users', [where('id', '!=', auth.currentUser?.uid || 'none')]);

  useEffect(() => {
    const setUserOnline = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { online: true });
      }
    };
    setUserOnline();

    return () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        updateDoc(userRef, { online: false });
      }
    };
  }, []);

  const handleChannelClick = (channelId: string) => {
    navigate(`/channel/${channelId}`);
  };

  const handleDirectMessageClick = (userId: string) => {
    navigate(`/dm/${userId}`);
  };

  const handleAddChannel = async () => {
    if (newChannelName.trim()) {
      try {
        await addDoc(collection(db, 'channels'), { 
          name: newChannelName.trim(),
          createdBy: auth.currentUser?.uid,
          createdAt: serverTimestamp()
        });
        setNewChannelName('');
      } catch (error) {
        console.error("Error adding channel:", error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { online: false });
      }
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="bg-indigo-800 text-white w-64 flex-shrink-0 h-full overflow-y-auto flex flex-col">
      <div className="p-4 flex-grow">
        <h1 className="text-2xl font-bold mb-4 hidden md:block">Slack Clone</h1>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
            <span className="flex items-center">
              <Hash className="mr-2" size={18} /> Channels
            </span>
            <Plus size={18} className="cursor-pointer" onClick={handleAddChannel} />
          </h2>
          <div className="mb-2 flex">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="New channel name"
              className="flex-grow p-1 text-black rounded-l text-sm"
            />
            <button onClick={handleAddChannel} className="bg-indigo-600 px-2 rounded-r text-sm">Add</button>
          </div>
          <ul className="space-y-1">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="cursor-pointer hover:bg-indigo-700 p-1 rounded text-sm"
                onClick={() => handleChannelClick(channel.id)}
              >
                # {channel.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <Users className="mr-2" size={18} /> Direct Messages
          </h2>
          <ul className="space-y-1">
            {users.map((user) => (
              <li
                key={user.id}
                className="cursor-pointer hover:bg-indigo-700 p-1 rounded flex items-center text-sm"
                onClick={() => handleDirectMessageClick(user.id)}
              >
                <div className={`w-2 h-2 ${user.online ? 'bg-green-500' : 'bg-gray-500'} rounded-full mr-2`}></div>
                {user.name || user.email}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="p-4 border-t border-indigo-700">
        <button onClick={handleSignOut} className="flex items-center text-white hover:text-indigo-200 text-sm">
          <LogOut size={18} className="mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;