import React, { useState, useRef, useEffect } from 'react';
import { useWebLLM } from '../hooks/useWebLLM';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

export const AIChat: React.FC = () => {
  const { messages, sendMessage, isLoading, isReady, progress, debugLog } = useWebLLM();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isReady) return;
    sendMessage(input);
    setInput('');
  };

  const getCleanDisplayContent = (text: string) => {
    let clean = text.replace(/\[INVENTARIO ACTUAL:[\s\S]*/gi, '');
    clean = clean.replace(/Nota: El inventario actualizado es:[\s\S]*/gi, '');
    clean = clean.replace(/\[\s*\{\s*"id"[\s\S]*\}\s*\]/g, '');
    clean = clean.replace(/\{[\s\S]*?"acc?i[oó]n"[\s\S]*?\}/gi, '').trim();
    if (clean.endsWith(']')) clean = clean.slice(0, -1).trim();
    if (!clean) return '¡Acción realizada con éxito!';
    return clean;
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Bot className="bot-icon" />
        <div>
          <h3>Asistente IA (WebLLM)</h3>
          <span className={`status-indicator ${isReady ? 'ready' : 'loading'}`}>
            {isReady ? 'Conectado - Local' : 'Inicializando Motor...'}
          </span>
        </div>
      </div>

      {!isReady && (
        <div className="loading-overlay">
          <Loader2 className="spinner" size={32} />
          <p>Descargando modelo de IA (WebGPU)...</p>
          <small>{progress}</small>
          <p className="hint">Esto solo sucede la primera vez.</p>
        </div>
      )}

      <div className="messages-area">
        {messages.filter(m => m.role !== 'system').map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.role}`}>
            <div className="message-bubble">
              <div className="message-icon">
                {msg.role === 'assistant' ? <Sparkles size={16} /> : <User size={16} />}
              </div>
              <div className="message-content">{msg.role === 'assistant' ? getCleanDisplayContent(msg.content) : msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper assistant">
            <div className="message-bubble">
              <Loader2 className="spinner-small" size={16} />
              <div className="message-content">Pensando y ejecutando acciones...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {debugLog && (
        <div style={{ padding: '10px', background: 'rgba(255,0,0,0.1)', color: '#ffaaaa', fontSize: '11px', fontFamily: 'monospace', maxHeight: '100px', overflowY: 'auto' }}>
          <strong>Última salida IA Cruda:</strong><br/>
          {debugLog}
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Añade 5 libros de Cálculo..."
          disabled={!isReady || isLoading}
        />
        <button type="submit" disabled={!isReady || isLoading || !input.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
