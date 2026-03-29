import React, { useState, useRef } from 'react';
import axios from 'axios';
import './Editor.css';
const API_URL = import.meta.env.VITE_API_URL;

interface Keystroke {
  t: number;
  dt: number;
  type: 'char' | 'backspace' | 'paste';
}

const EditorPage: React.FC = () => {
  const [content, setContent] = useState('');
  const [keystrokes, setKeystrokes] = useState<Keystroke[]>([]);
  const [stats, setStats] = useState({ pasteCount: 0, backspaceCount: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  
  const lastTimeRef = useRef<number>(Date.now());

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;

    if (e.key === 'Backspace') {
      const newKeystroke: Keystroke = { t: now, dt, type: 'backspace' };
      setKeystrokes(prev => [...prev, newKeystroke]);
      setStats(prev => ({ ...prev, backspaceCount: prev.backspaceCount + 1 }));
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Regular character key
      const newKeystroke: Keystroke = { t: now, dt, type: 'char' };
      setKeystrokes(prev => [...prev, newKeystroke]);
    }
  };

  const handlePaste = () => {
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;

    const newKeystroke: Keystroke = { t: now, dt, type: 'paste' };
    setKeystrokes(prev => [...prev, newKeystroke]);
    setStats(prev => ({ ...prev, pasteCount: prev.pasteCount + 1 }));
  };

  const handleSave = async () => {
    console.log('Starting handleSave with content:', content.substring(0, 20) + '...');
    if (!content.trim()) {
      setSaveStatus('Cannot save empty session');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Saving...');

    const payload = {
      content,
      keystrokes,
      stats
    };
    console.log('Sending payload to backend:', payload);

    try {
      // Using relative URL with Vite proxy to handle environment differences
      const response = await axios.post(`${API_URL}/api/session/save`,payload);
      console.log('Backend response:', response.data);
      setSaveStatus(`Success: ${response.data.message}`);
    } catch (err: any) {
      console.error('Error saving session. Full error object:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setSaveStatus(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the current session? All tracked data will be lost.')) {
      setContent('');
      setKeystrokes([]);
      setStats({ pasteCount: 0, backspaceCount: 0 });
      setSaveStatus(null);
      lastTimeRef.current = Date.now();
    }
  };

  return (
    <div className="container">
      <h1>Vi-Notes</h1>
  
      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="Start writing here..."
        className="textarea"
      />
  
      <div className="statsContainer">
        <div><strong>Word Count:</strong> {content.trim() ? content.trim().split(/\s+/).length : 0}</div>
        <div><strong>Keystrokes:</strong> {keystrokes.length}</div>
       
        <div><strong>Pastes:</strong> {stats.pasteCount}</div>
        <div><strong>Backspaces:</strong> {stats.backspaceCount}</div>
  
        <div className="buttonGroup">
          <button onClick={handleClear} className="clearButton">
            Clear
          </button>
  
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`saveButton ${isSaving ? 'disabled' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      </div>
  
      {saveStatus && (
        <div
          className={`status ${
            saveStatus.startsWith('Error') ? 'error' : 'success'
          }`}
        >
          {saveStatus}
        </div>
      )}
    </div>
  );
};

export default EditorPage;
