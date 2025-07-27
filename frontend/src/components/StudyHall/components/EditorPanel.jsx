import React from 'react';
import { BookOpen } from 'lucide-react';
import TagBoxes from '../../Settings/shared/TagBoxes';

const EditorPanel = ({
  studyNotes,
  editorCategory,
  isNewDocument,
  editingContentData,
  currentTags,
  editingContentId,
  aiAnalysisInProgress,
  onContentChange,
  onCategoryChange,
  onTagsChange
}) => {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto library-scrollbar">
      {/* Key Themes Section */}
      <div className="bg-gradient-to-br from-wood-light/10 via-brass/5 to-wood-light/10 border-l-4 border-wood-light rounded-r-lg p-6 shadow-sm">
        <h3 className="text-xl font-cormorant text-wood-dark mb-6 flex items-center gap-2">
          <BookOpen size={20} />
          Theological Insights
        </h3>
        
        {aiAnalysisInProgress ? (
          <div className="text-center py-6">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-6 w-6 border-2 border-brass border-t-transparent rounded-full"></div>
              <div className="text-brass text-sm font-medium">
                The Librarian is analyzing your content for key themes...
              </div>
              <div className="text-wood-dark/60 text-xs">
                This may take up to a minute
              </div>
            </div>
          </div>
        ) : !isNewDocument && editingContentData ? (
          <div className="space-y-6">
            {/* Key Themes */}
            {editingContentData.key_themes && editingContentData.key_themes.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-lg font-cormorant text-wood-dark/90 flex items-center gap-2">
                  ✨ Key Themes
                </h4>
                <div className="bg-white/60 rounded-lg p-4 border border-brass/20">
                  <div className="space-y-2">
                    {editingContentData.key_themes.map((theme, themeIndex) => (
                      <div key={themeIndex} className="flex items-start gap-2">
                        <span className="text-brass/60 mt-1">•</span>
                        <span className="text-wood-dark text-sm leading-relaxed">{theme}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-lg font-cormorant text-wood-dark/90 flex items-center gap-2">
                  ✨ Key Themes
                </h4>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-amber-700 text-sm italic">
                    💡 Save your document with at least a paragraph of content, and the Librarian will analyze it to reveal 3 key theological themes. Each save generates fresh insights as your content evolves!
                  </p>
                </div>
              </div>
            )}

            {/* Thought Questions */}
            {editingContentData.thought_questions && editingContentData.thought_questions.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-lg font-cormorant text-wood-dark/90 flex items-center gap-2">
                  💭 Reflection Questions
                </h4>
                <div className="bg-brass/10 rounded-lg p-4 border-l-4 border-brass/40">
                  <div className="space-y-3">
                    {editingContentData.thought_questions.map((question, qIndex) => (
                      <div key={qIndex} className="flex items-start gap-3">
                        <span className="text-brass/70 font-bold mt-1 text-sm">Q{qIndex + 1}</span>
                        <p className="text-wood-dark text-sm leading-relaxed italic">
                          "{question}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-lg font-cormorant text-wood-dark/90 flex items-center gap-2">
                  💭 Reflection Questions
                </h4>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-amber-700 text-sm italic">
                    🤔 Once you save substantial content, the Librarian will craft 2 thoughtful reflection questions to deepen your spiritual understanding and application.
                  </p>
                </div>
              </div>
            )}

            {/* Tags Cloud */}
            {editingContentData.tags && editingContentData.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {editingContentData.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="bg-gradient-to-r from-brass/20 to-brass/10 text-wood-dark px-3 py-1 rounded-full text-xs font-medium border border-brass/30 hover:from-brass/30 hover:to-brass/20 transition-all duration-200 cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-amber-700 text-sm italic">
                  🏷️ The Librarian will automatically identify up to 5 relevant theological topics and themes from your saved content to help with organization and discovery.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-3 opacity-60">✍️</div>
            <p className="text-wood-dark/60 text-sm leading-relaxed mb-3">
              {isNewDocument 
                ? "Begin writing your study notes or journal entry. Once you save with substantial content (at least a paragraph), the Librarian will generate personalized theological insights, reflection questions, and topic tags to enrich your spiritual study!"
                : "Edit an existing document to see its AI-generated theological themes, reflection questions, and related topics appear here."
              }
            </p>
            <p className="text-brass/70 text-xs font-medium">
              Keep saving... keep getting new insights!
            </p>
          </div>
        )}
      </div>

      {/* Content Editor */}
      <div className="bg-white/80 border border-brass/30 rounded-lg p-6">
        {/* Category Radio Buttons */}
        <div className="flex items-center gap-6 mb-4 pb-4 border-b border-brass/20">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editorCategory"
                  value="study-notes"
                  checked={editorCategory === 'study-notes'}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="text-brass focus:ring-brass"
                />
                <span className="text-wood-dark font-medium">Study Notes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editorCategory"
                  value="journal"
                  checked={editorCategory === 'journal'}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="text-brass focus:ring-brass"
                />
                <span className="text-wood-dark font-medium">Journal</span>
              </label>
            </div>
            
            {/* Tag Editing Section */}
            <div className="flex items-center gap-2">
              <TagBoxes
                tags={currentTags}
                contentId={editingContentId}
                onTagsChange={editingContentId ? onTagsChange : undefined}
                compact={true}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Title */}
        <h3 className="text-xl font-cormorant text-wood-dark mb-4">
          {editorCategory === 'study-notes' ? 'Study Notes' : 'Journal Entry'}
        </h3>

        {/* Content Editor */}
        <textarea
          id="study-notes-editor"
          value={studyNotes}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={
            isNewDocument && studyNotes === '' 
              ? editorCategory === 'study-notes' 
                ? `Title: Your Study Title Here\n\nMain Scripture Reference: [Book Chapter:Verse]\n\n--- Study Notes ---\n\nKey theological concepts:\n• \n• \n• \n\nCross-references:\n• \n• \n\nPersonal insights:\n\n\nQuestions for further study:\n1. \n2. \n\nPractical applications:\n•` 
                : `Title: Your Journal Entry Title\n\nDate: ${new Date().toLocaleDateString()}\nScripture Reference: [Optional]\n\n--- Personal Reflection ---\n\nWhat is God teaching me?\n\n\nHow do I feel about this?\n\n\nWhat am I struggling with?\n\n\nPrayers and gratitude:\n\n\nNext steps:`
              : editorCategory === 'study-notes'
                ? "Continue your study notes..."
                : "Continue your journal entry..."
          }
          className="w-full h-64 p-4 border border-brass/20 rounded-lg resize-none focus:outline-none focus:border-brass text-library-dark leading-relaxed"
          style={{ fontSize: '14px' }}
        />
        
        {/* Template Instructions */}
        {isNewDocument && studyNotes === '' && (
          <p className="text-xs text-wood-dark/60 mt-2 italic">
            💡 Template shown above - start typing to begin your {editorCategory === 'study-notes' ? 'study notes' : 'journal entry'}. 
            The title (first line) will be used as the document title when saved.
          </p>
        )}
      </div>

      {/* Resource Viewer */}
      <div className="bg-brass/10 border border-brass/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-cormorant text-wood-dark flex items-center gap-2">
            📖 Resource Viewer
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4 opacity-60">📄</div>
          <p className="text-library-dark/70 italic">
            Resource viewer will be connected when ResourcePanel is integrated
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;