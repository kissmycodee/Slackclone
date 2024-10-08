import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Auth from './components/Auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Menu } from 'lucide-react';

function App() {
  const [user, loading] = useAuthState(auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        name: user.displayName || user.email,
        email: user.email,
        lastSeen: serverTimestamp(),
        online: true
      }, { merge: true });
    }
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <div className={`md:hidden ${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity`} onClick={() => setSidebarOpen(false)}></div>
        <div className={`md:relative md:translate-x-0 fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-200 ease-in-out z-30 md:z-0 w-64 md:w-auto`}>
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm z-10">
            <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 flex items-center">
              <button className="md:hidden mr-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu size={24} />
              </button>
              <h1 className="text-lg font-semibold">Slack Clone</h1>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <Routes>
              <Route path="/channel/:channelId" element={<ChatArea />} />
              <Route path="/dm/:userId" element={<ChatArea />} />
              <Route path="/" element={<Navigate to="/channel/general" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;