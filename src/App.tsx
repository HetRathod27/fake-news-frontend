import { useState, useEffect } from 'react'
import './App.css'

// API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('Current API URL:', API_URL); // For debugging

interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  features: string[];
  explanation: string;
}

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const analyzeContent = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      if (!title.trim() || !content.trim()) {
        throw new Error('Please fill in both title and content');
      }

      console.log('Sending request to:', `${API_URL}/api/analyze`);
      
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ title, content }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);

      if (!data || typeof data.isFake !== 'boolean') {
        throw new Error('Invalid response from server');
      }

      setResult(data);
      await fetchHistory();
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      console.log('Fetching history from:', `${API_URL}/api/history`);
      
      const response = await fetch(`${API_URL}/api/history`, {
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      console.log('Deleting item:', id);
      
      const response = await fetch(`${API_URL}/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setHistory(history.filter(item => item._id !== id));
    } catch (error) {
      console.error('Error deleting history item:', error);
      setError('Failed to delete history item');
    }
  };

  const handleHistoryItemClick = (item: any) => {
    setResult({
      isFake: item.isFake,
      confidence: item.confidence,
      features: item.features,
      explanation: item.explanation
    });
    setTitle(item.title);
    setContent(item.content);
    // Scroll to the result section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container">
      <header>
        <h1>🔍 Fake News Detector</h1>
        <p>Analyze content to detect potential fake news using advanced AI</p>
      </header>

      <main>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <section className="input-section">
          <div className="input-group">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              className="title-input"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter article content..."
              className="content-input"
            />
            <button 
              onClick={analyzeContent}
              disabled={loading || !title || !content}
              className="analyze-button"
            >
              {loading ? 'Analyzing...' : 'Analyze Content'}
            </button>
          </div>
        </section>

        {result && (
          <section className={`result-section ${result.isFake ? 'fake' : 'real'}`}>
            <h2>Analysis Result</h2>
            <div className="result-card">
              <div className="result-header">
                <span className={`status-badge ${result.isFake ? 'fake' : 'real'}`}>
                  {result.isFake ? '⚠️ Potentially Fake News' : '✅ Likely Real News'}
                </span>
                <span className="confidence">
                  Confidence: {result.confidence}%
                </span>
              </div>
              
              <p className="explanation">{result.explanation}</p>
              
              {result.features && result.features.length > 0 && (
                <div className="features">
                  <h3>Key Findings:</h3>
                  <ul>
                    {result.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="history-section">
            <h2>Recent Analyses</h2>
            <div className="history-grid">
              {history.map((item) => (
                <div 
                  key={item._id} 
                  className={`history-card ${item.isFake ? 'fake' : 'real'}`}
                  onClick={() => handleHistoryItemClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="history-card-header">
                    <h3>{item.title}</h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when deleting
                        deleteHistoryItem(item._id);
                      }}
                      className="delete-button"
                      aria-label="Delete history item"
                    >
                      ×
                    </button>
                  </div>
                  <p className="truncate">{item.content}</p>
                  <div className="history-footer">
                    <span className={`status-badge small ${item.isFake ? 'fake' : 'real'}`}>
                      {item.isFake ? '⚠️ Fake' : '✅ Real'}
                    </span>
                    <span className="confidence small">
                      {item.confidence.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
