import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as userService from '../../services/userService';
import Navbar from '../../components/common/Navbar';
import { showToast } from '../../components/common/Toast';

export default function ChatPage() {
  const { listingId } = useParams();
  const { user } = useAuth();
  const { socket, joinThread, onMessage } = useSocket();
  
  const [listing, setListing] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    userService.getThread(listingId)
      .then(({ data }) => {
        setListing(data.listing);
        setMessages(data.messages);
      })
      .catch(() => showToast('Failed to load thread', 'error'))
      .finally(() => setLoading(false));
  }, [listingId]);

  useEffect(() => {
    if (!socket || !listingId) return;
    joinThread(listingId);
    
    const cleanup = onMessage((msg) => {
      // If it's for this listing, append it
      if (msg.listingId === listingId) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return cleanup;
  }, [socket, listingId, joinThread, onMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      const { data } = await userService.sendMessage(listingId, input);
      setInput('');
      // Optimistically add to UI
      setMessages(prev => [...prev, data.message]);
    } catch {
      showToast('Failed to send message', 'error');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center" style={{ padding: 'var(--space-12)' }}><span className="spinner spinner-lg" /></div>
      </>
    );
  }

  if (!listing) return (
    <>
      <Navbar />
      <div className="empty-state"><p className="empty-state-title">Chat not found or access denied</p></div>
    </>
  );

  const otherUser = user.role === 'donor' ? listing.claimedBy : listing.donorId;

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: 800, padding: 'var(--space-6)', height: 'calc(100vh - var(--nav-h))', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="card-flat" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
          <Link to={`/${user.role}/listings`} className="btn-icon">←</Link>
          <div className="avatar">{otherUser?.name?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <h1 className="font-semi text-lg">{otherUser?.name || 'Waiting for claim...'}</h1>
            <p className="text-sm text-muted">Chat about: {listing.foodName}</p>
          </div>
        </div>

        {/* Message Thread */}
        <div className="card-flat" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5)', background: 'var(--bg)' }}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">💬</span>
              <p className="empty-state-title">No messages yet</p>
              <p className="text-sm text-muted">Start the conversation to coordinate pickup.</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isMine = m.senderId?._id === user._id || m.senderId === user._id;
              const showAvatar = !isMine && (i === 0 || messages[i-1].senderId?._id !== m.senderId?._id);
              
              return (
                <div key={m._id || i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 'var(--space-2)' }}>
                  {!isMine && (
                    <div style={{ width: 32 }}>
                      {showAvatar && <div className="avatar" style={{ width: 32, height: 32 }}>{m.senderId?.name?.[0]}</div>}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '70%',
                    background: isMine ? 'var(--primary)' : 'var(--surface)',
                    color: isMine ? '#fff' : 'var(--text)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: isMine ? 'var(--radius-lg) var(--radius-lg) 0 var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 0',
                  }}>
                    <p>{m.content}</p>
                    <p style={{ fontSize: '0.65rem', marginTop: 4, opacity: 0.7, textAlign: isMine ? 'right' : 'left' }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        {otherUser ? (
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <input 
              className="form-input" 
              style={{ flex: 1 }} 
              placeholder="Type your message..." 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              disabled={!otherUser}
            />
            <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
              Send ✈️
            </button>
          </form>
        ) : (
          <div className="alert alert-info text-center" style={{ marginTop: 'var(--space-4)' }}>
            Chat will be enabled once an NGO claims this donation.
          </div>
        )}
      </div>
    </>
  );
}
