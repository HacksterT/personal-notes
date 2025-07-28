import React from 'react';
import { MessageCircle, ArrowDown } from 'lucide-react';

const ChatPanel = ({
  chatMessage,
  chatHistory,
  isLibrarianTyping,
  chatError,
  includeNoteContext,
  setChatMessage,
  setIncludeNoteContext,
  onChatSubmit,
  onInsertTextAtCursor
}) => {
  // Chat Message Components
  const LibrarianMessage = ({ message }) => (
    <div className="bg-brass/10 p-3 rounded-lg border border-brass/30 mb-3 group">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 bg-brass rounded-full flex items-center justify-center text-library-dark text-xs font-bold flex-shrink-0">
          L
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-brass text-sm font-medium mb-1">Study Librarian</div>
            <button
              onClick={() => onInsertTextAtCursor(message.content)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-brass/20 rounded text-brass hover:text-brass-light"
              title="Insert into study notes at cursor position"
            >
              <ArrowDown size={14} />
            </button>
          </div>
          <div className="text-cream text-sm leading-relaxed">
            {message.content}
          </div>
          <div className="text-brass-light text-xs mt-2 opacity-70">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );

  const UserMessage = ({ message }) => (
    <div className="bg-library-brown/30 p-3 rounded-lg border border-brass/20 mb-3 ml-8">
      <div className="text-cream text-sm leading-relaxed">
        {message.content}
      </div>
      <div className="text-brass-light text-xs mt-2 opacity-70 text-right">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );

  const TypingIndicator = () => (
    <div className="bg-brass/10 p-3 rounded-lg border border-brass/30 mb-3">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 bg-brass rounded-full flex items-center justify-center text-library-dark text-xs font-bold flex-shrink-0">
          L
        </div>
        <div className="flex-1">
          <div className="text-brass text-sm font-medium mb-1">Study Librarian</div>
          <div className="flex items-center gap-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-brass rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-brass rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-brass rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-brass-light text-xs ml-2">typing...</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-library-dark border-l border-brass/30 flex flex-col h-full">
      {/* AI Header */}
      <div className="p-2 border-b border-brass/30 bg-brass/10">
        <h3 className="text-xl font-cormorant text-brass flex items-center gap-2">
          <MessageCircle size={20} />
          Study Librarian
        </h3>
      </div>

      {/* Chat History Area - Flexible with Max Height */}
      <div className="flex-1 max-h-80 p-4 border-b border-brass/30 bg-library-dark/50 overflow-y-auto" id="chat-history">
        <div className="space-y-0">
          {chatHistory.length === 0 ? (
            <div className="text-center text-brass-light text-xs italic py-8">
              Start a conversation with the Study Librarian
            </div>
          ) : (
            chatHistory.map((message) => (
              <div key={message.id}>
                {message.type === 'user' ? (
                  <UserMessage message={message} />
                ) : (
                  <LibrarianMessage message={message} />
                )}
              </div>
            ))
          )}
          {isLibrarianTyping && <TypingIndicator />}
          {chatError && (
            <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30 mb-3">
              <div className="text-red-300 text-sm">
                Error: {chatError}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-b border-brass/30">
        <form onSubmit={onChatSubmit}>
          <textarea
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask about your current study, request biblical insights, or get theological guidance..."
            className="w-full p-2 bg-cream/90 border border-brass/30 rounded text-library-dark text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brass/50"
            rows="3"
          />
          <button 
            type="submit"
            className="w-full mt-2 px-3 py-2 bg-brass text-library-dark rounded font-medium hover:bg-brass/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            disabled={!chatMessage.trim()}
          >
            Ask Librarian
          </button>
        </form>
        
        {/* Include Note Context Toggle */}
        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="includeNote"
            checked={includeNoteContext}
            onChange={(e) => setIncludeNoteContext(e.target.checked)}
            className="text-brass focus:ring-brass"
          />
          <label htmlFor="includeNote" className="text-brass-light text-xs cursor-pointer">
            Include Note Context
          </label>
        </div>
      </div>

    </div>
  );
};

export default ChatPanel;