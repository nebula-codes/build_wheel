import { useState, useEffect, useRef } from 'react';
import { compileBuildContext, createSystemPrompt, generateSuggestedQuestions } from './buildContext';
import MarkdownRenderer from './MarkdownRenderer';

const API_KEY_STORAGE_KEY = 'poe_build_advisor_openai_key';
const LEAGUE_STORAGE_KEY = 'poe_build_advisor_league';

// Current and recent leagues
const LEAGUES = [
  { id: 'phrecia', name: 'Phrecia (3.27)', current: true },
  { id: 'settlers', name: 'Settlers of Kalguur (3.25)', current: false },
  { id: 'necropolis', name: 'Necropolis (3.24)', current: false },
  { id: 'affliction', name: 'Affliction (3.23)', current: false },
  { id: 'standard', name: 'Standard', current: false },
];

/**
 * AI-powered build advisor using OpenAI's API
 */
export default function BuildAdvisor({ build, onClose, onBuildImport, className = '' }) {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('phrecia');
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importedBuild, setImportedBuild] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // The active build is either the imported one or the passed prop
  const activeBuild = importedBuild || build;

  // Load API key and league from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowApiKeySetup(true);
    }

    const savedLeague = localStorage.getItem(LEAGUE_STORAGE_KEY);
    if (savedLeague) {
      setSelectedLeague(savedLeague);
    }
  }, []);

  // Save league selection
  useEffect(() => {
    localStorage.setItem(LEAGUE_STORAGE_KEY, selectedLeague);
  }, [selectedLeague]);

  // Generate suggested questions when build changes
  useEffect(() => {
    if (activeBuild) {
      setSuggestedQuestions(generateSuggestedQuestions(activeBuild));
    }
  }, [activeBuild]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when ready
  useEffect(() => {
    if (apiKey && !showApiKeySetup) {
      inputRef.current?.focus();
    }
  }, [apiKey, showApiKeySetup]);

  // Clear messages when build changes
  useEffect(() => {
    setMessages([]);
  }, [activeBuild?.id, activeBuild?.name]);

  const saveApiKey = () => {
    if (apiKeyInput.trim().startsWith('sk-')) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setShowApiKeySetup(false);
      setError(null);
    } else {
      setError('Invalid API key format. OpenAI keys start with "sk-"');
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setApiKeyInput('');
    setShowApiKeySetup(true);
    setMessages([]);
  };

  const getLeagueContext = () => {
    const league = LEAGUES.find(l => l.id === selectedLeague);
    return league ? league.name : 'Phrecia (3.27)';
  };

  const importBuildFromUrl = async () => {
    if (!importUrl.trim()) return;

    setImportLoading(true);
    setError(null);

    try {
      const url = importUrl.trim();
      let buildData = null;

      if (url.includes('maxroll.gg')) {
        // Extract build info from Maxroll URL
        buildData = await parseMaxrollUrl(url);
      } else if (url.includes('poe.ninja')) {
        // Extract build info from poe.ninja URL
        buildData = await parsePoeNinjaUrl(url);
      } else {
        throw new Error('Unsupported URL. Please use a Maxroll or poe.ninja build URL.');
      }

      setImportedBuild(buildData);
      setShowUrlImport(false);
      setImportUrl('');
      setMessages([]); // Clear previous conversation

      if (onBuildImport) {
        onBuildImport(buildData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const parseMaxrollUrl = async (url) => {
    // Extract build name from URL
    const urlParts = url.split('/');
    const buildSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    const buildName = buildSlug
      .replace(/-/g, ' ')
      .replace(/league starter|guide|build/gi, '')
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Create a build object with the URL for context
    return {
      id: `maxroll-${Date.now()}`,
      name: buildName || 'Maxroll Build',
      source: 'Maxroll',
      guideUrl: url,
      description: `Build imported from Maxroll guide. Full guide available at: ${url}`,
      importedFromUrl: true,
      urlType: 'maxroll',
      // Note: actual scraping would require server-side processing due to CORS
      // The AI will use the URL context to provide relevant advice
    };
  };

  const parsePoeNinjaUrl = async (url) => {
    // Parse poe.ninja character URL
    // Format: https://poe.ninja/poe1/builds/keepers/character/AccountName/CharacterName
    const match = url.match(/character\/([^/]+)\/([^/?]+)/);
    const accountName = match ? match[1] : 'Unknown';
    const charName = match ? match[2] : 'Unknown Character';

    // Extract class/skill from URL params if present
    const urlObj = new URL(url);
    const skillParam = urlObj.searchParams.get('skills');
    const classParam = urlObj.searchParams.get('class');

    return {
      id: `poeninja-${Date.now()}`,
      name: charName,
      className: classParam || 'Unknown',
      source: 'poe.ninja',
      guideUrl: url,
      description: `Character "${charName}" from account "${accountName}" on poe.ninja ladder.`,
      skills: skillParam ? skillParam.split(',').map(s => s.replace(/\+/g, ' ')) : [],
      importedFromUrl: true,
      urlType: 'poeninja',
    };
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !apiKey || isLoading) return;

    const userMessage = { role: 'user', content: messageText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Compile build context with league info
      const buildContext = compileBuildContext(activeBuild);
      const leagueContext = getLeagueContext();
      const systemPrompt = createSystemPrompt(buildContext, leagueContext);

      // Prepare messages for API
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        userMessage
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 1500,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your key and try again.');
        } else if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          throw new Error(
            `Rate limited by OpenAI. This usually means:\n` +
            `• Your account needs billing enabled (free tier has strict limits)\n` +
            `• You've exceeded your monthly quota\n` +
            `• Too many requests in a short period\n\n` +
            `Check your usage at platform.openai.com/usage${retryAfter ? `\nRetry after: ${retryAfter}s` : ''}`
          );
        } else if (response.status === 402) {
          throw new Error('Insufficient credits. Please add billing at platform.openai.com/account/billing');
        } else if (response.status === 403) {
          throw new Error('Access denied. Your API key may not have access to this model.');
        } else {
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message);
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleSuggestedQuestion = (question) => {
    sendMessage(question);
  };

  const clearImportedBuild = () => {
    setImportedBuild(null);
    setMessages([]);
  };

  return (
    <div className={`bg-gray-900/50 rounded-lg border border-gray-800 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Build Advisor</h3>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">
              {activeBuild ? activeBuild.name : 'No build selected'}
              {importedBuild && <span className="text-amber-400 ml-1">(imported)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* League Selector */}
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-green-500 focus:outline-none"
            title="Select league for context"
          >
            {LEAGUES.map(league => (
              <option key={league.id} value={league.id}>
                {league.name} {league.current && '✓'}
              </option>
            ))}
          </select>

          {/* Import URL Button */}
          <button
            onClick={() => setShowUrlImport(!showUrlImport)}
            className={`p-1.5 rounded transition-colors ${showUrlImport ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            title="Import build from URL"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>

          {apiKey && (
            <button
              onClick={() => setShowApiKeySetup(true)}
              className="p-1.5 bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
              title="Change API key"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* URL Import Panel */}
      {showUrlImport && (
        <div className="p-4 border-b border-gray-800 bg-amber-900/20">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Import Build from URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="Paste Maxroll or poe.ninja build URL..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={importBuildFromUrl}
                  disabled={importLoading || !importUrl.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors flex items-center gap-2"
                >
                  {importLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Import'
                  )}
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Supported: <span className="text-green-400">maxroll.gg</span> build guides, <span className="text-blue-400">poe.ninja</span> character pages
            </div>
            {importedBuild && (
              <div className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2">
                <span className="text-sm text-amber-300">Currently using: {importedBuild.name}</span>
                <button
                  onClick={clearImportedBuild}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Key Setup */}
      {showApiKeySetup && (
        <div className="p-4 border-b border-gray-800 bg-gray-800/50">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveApiKey}
                disabled={!apiKeyInput.trim()}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors"
              >
                Save Key
              </button>
              {apiKey && (
                <button
                  onClick={() => setShowApiKeySetup(false)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  Cancel
                </button>
              )}
              {apiKey && (
                <button
                  onClick={clearApiKey}
                  className="px-3 py-1.5 text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  Remove Key
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Your API key is stored locally in your browser. Get one at{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline"
              >
                platform.openai.com
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {!activeBuild && !showApiKeySetup && apiKey && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-sm">Select a build from the list or import one from a URL</p>
              <button
                onClick={() => setShowUrlImport(true)}
                className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded transition-colors"
              >
                Import Build from URL
              </button>
            </div>
          </div>
        )}

        {activeBuild && messages.length === 0 && !showApiKeySetup && apiKey && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm">Ask me anything about your <span className="text-white font-medium">{activeBuild.name}</span> build!</p>
              <p className="text-xs text-gray-500 mt-1">League: {getLeagueContext()}</p>
            </div>

            {/* Suggested Questions */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.slice(0, 4).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-green-900/50 text-green-100'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <MarkdownRenderer content={msg.content} className="text-sm" />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">
            <div className="whitespace-pre-wrap">{error}</div>
            {error.includes('platform.openai.com') && (
              <a
                href="https://platform.openai.com/account/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-red-300 hover:text-red-200 underline"
              >
                Open OpenAI Billing Settings
              </a>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* More Suggestions (after conversation starts) */}
      {activeBuild && messages.length > 0 && messages.length < 6 && !isLoading && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1">
            {suggestedQuestions.slice(4, 7).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedQuestion(q)}
                className="text-xs px-2 py-1 bg-gray-800/50 hover:bg-gray-800 text-gray-400 rounded transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      {apiKey && !showApiKeySetup && activeBuild && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your build..."
              disabled={isLoading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Powered by GPT-4o-mini • League: {getLeagueContext()}
          </p>
        </form>
      )}
    </div>
  );
}
