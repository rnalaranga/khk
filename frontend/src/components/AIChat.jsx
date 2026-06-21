import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

const CAT_IMAGE = {
  'Engine Oil': '/prod_oil.png',
  'Brake Pads': '/prod_brakes.png',
  'Chemicals': '/prod_chemical.png',
  'Combo Deals': '/prod_oil.png',
  'Filters': '/prod_oil.png',
  'Coolant': '/prod_chemical.png',
  'Wiper Blades': '/prod_brakes.png',
  'Brake Washers': '/prod_brakes.png',
};

export default function AIChat({ onAddToCart, categories, isOpen, setIsOpen }) {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I am your AI Parts Assistant. What are you looking for today? (e.g., "I need brake pads for a Toyota Corolla")' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const data = await res.json();
      
      let botResponse = '';
      if (data.products && data.products.length > 0) {
        botResponse = `I found ${data.products.length} matching products for you!`;
        setMessages(prev => [
          ...prev, 
          { type: 'bot', text: botResponse },
          { type: 'products', products: data.products }
        ]);
      } else {
        botResponse = "I couldn't find any specific products matching that description in our catalog right now. Could you try checking the categories?";
        setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: "Sorry, I'm having trouble connecting to my brain right now. Please try again later!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button and Tooltip */}
      {!isOpen && (
        <div className="ai-chat-btn-container" style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="ai-tooltip" style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)', 
            padding: '10px 16px', 
            borderRadius: 24, 
            boxShadow: 'var(--shadow)',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            animation: 'slideInRight 0.5s ease-out'
          }} onClick={() => setIsOpen(true)}>
            <Sparkles size={16} color="var(--red)" /> Ask AI Assistant
          </div>
          <button 
            onClick={() => setIsOpen(true)}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--red), #ff4d4d)',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(228, 0, 15, 0.4)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            className="ai-chat-btn"
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Sparkles size={28} />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="ai-chat-window"
          style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          width: 380,
          height: 600,
          maxHeight: '80vh',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(90deg, rgba(228,0,15,0.2), transparent)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'var(--red)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="white" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--white)' }}>AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start'
              }}>
                {msg.type === 'products' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', paddingBottom: 8 }}>
                    {msg.products.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/shop?search=${encodeURIComponent(p.name)}`);
                        }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 12, 
                          background: 'var(--bg-surface)', 
                          padding: 10, 
                          borderRadius: 12, 
                          border: '1px solid var(--border)',
                          width: '100%',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-card)'}
                        onMouseOut={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                      >
                        <img 
                          src={(p.images && p.images.length > 0) ? `/api/uploads/${p.images[0]}` : (p.image_url ? `/api/uploads/${p.image_url}` : (p.image || CAT_IMAGE[p.category] || '/placeholder.png'))} 
                          alt={p.name}
                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, background: 'white' }} 
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ color: 'var(--red)', fontWeight: 'bold', fontSize: '0.9rem', marginTop: 4 }}>
                            Rs. {p.price.toLocaleString()}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
                          style={{
                            background: 'var(--bg-body)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Search in Shop"
                        >
                          <Search size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: 16,
                    background: msg.type === 'user' ? 'var(--red)' : 'var(--bg-surface)',
                    color: msg.type === 'user' ? '#fff' : 'var(--text-main)',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    borderBottomRightRadius: msg.type === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.type === 'bot' ? 4 : 16,
                  }}>
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
                <Loader2 size={16} className="spinner" /> AI is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: 16,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 12,
            background: 'var(--bg-body)'
          }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="E.g., I need coolant for Honda Civic"
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: '10px 16px',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              style={{
                background: 'var(--red)',
                border: 'none',
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !input.trim() ? 0.5 : 1
              }}
            >
              <Send size={18} style={{ marginLeft: -2 }} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes slideInRight { 0% { opacity: 0; transform: translateX(20px); } 100% { opacity: 1; transform: translateX(0); } }
        
        @media (max-width: 768px) {
          .ai-chat-btn-container {
            display: none !important;
          }
          .ai-chat-window {
            bottom: 85px !important;
            right: 16px !important;
            left: 16px !important;
            width: auto !important;
            z-index: 2000 !important;
          }
        }
      `}</style>
    </>
  );
}
