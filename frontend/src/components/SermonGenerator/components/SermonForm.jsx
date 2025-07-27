import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

const SermonForm = ({
  inputText,
  onInputChange,
  sermonType,
  onSermonTypeChange,
  speakingStyle,
  onSpeakingStyleChange,
  sermonLength,
  onSermonLengthChange,
  outputFormat,
  onOutputFormatChange,
  onGenerate,
  onClear,
  onLoadTemplate,
  isLoading,
  templates
}) => {
  return (
    <div className="space-y-6">
      {/* Input Text Area */}
      <div className="space-y-3">
        <h3 className="text-lg font-cormorant text-wood-dark">Sermon Notes & Content</h3>
        <textarea
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Paste your sermon notes, study content, or biblical passage here. Include scriptures, themes, main points, and any ideas you want to develop..."
          className="w-full h-40 p-4 border border-wood-light/30 rounded-lg resize-none focus:outline-none focus:border-brass text-wood-dark leading-relaxed"
          style={{ fontSize: '14px' }}
        />
      </div>

      {/* Configuration Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sermon Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-wood-dark">Sermon Type</label>
          <select
            value={sermonType}
            onChange={(e) => onSermonTypeChange(e.target.value)}
            className="w-full p-3 border border-wood-light/30 rounded-lg focus:outline-none focus:border-brass text-wood-dark"
          >
            <option value="topical">Topical</option>
            <option value="expository">Expository</option>
            <option value="narrative">Narrative</option>
            <option value="apologetic">Apologetic</option>
            <option value="practical">Practical</option>
          </select>
        </div>

        {/* Speaking Style */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-wood-dark">Speaking Style</label>
          <select
            value={speakingStyle}
            onChange={(e) => onSpeakingStyleChange(e.target.value)}
            className="w-full p-3 border border-wood-light/30 rounded-lg focus:outline-none focus:border-brass text-wood-dark"
          >
            <option value="conversational">Conversational</option>
            <option value="authoritative">Authoritative</option>
            <option value="storytelling">Storytelling</option>
            <option value="academic">Academic</option>
            <option value="inspirational">Inspirational</option>
          </select>
        </div>

        {/* Sermon Length */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-wood-dark">Target Length</label>
          <select
            value={sermonLength}
            onChange={(e) => onSermonLengthChange(e.target.value)}
            className="w-full p-3 border border-wood-light/30 rounded-lg focus:outline-none focus:border-brass text-wood-dark"
          >
            <option value="10-15">10-15 minutes</option>
            <option value="20-25">20-25 minutes</option>
            <option value="30-35">30-35 minutes</option>
            <option value="45+">45+ minutes</option>
          </select>
        </div>

        {/* Output Format */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-wood-dark">Output Format</label>
          <select
            value={outputFormat}
            onChange={(e) => onOutputFormatChange(e.target.value)}
            className="w-full p-3 border border-wood-light/30 rounded-lg focus:outline-none focus:border-brass text-wood-dark"
          >
            <option value="full">Full Sermon</option>
            <option value="outline">Detailed Outline</option>
            <option value="bullets">Bullet Points</option>
            <option value="notes">Notes + Outline</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onGenerate}
          disabled={isLoading || !inputText.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brass text-white rounded-lg hover:bg-brass/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Generating...
            </>
          ) : (
            'Generate Sermon'
          )}
        </button>
        
        <button
          onClick={onClear}
          className="px-6 py-3 bg-wood-light/20 text-wood-dark hover:bg-wood-light/30 rounded-lg transition-colors border border-wood-light/30"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SermonForm;