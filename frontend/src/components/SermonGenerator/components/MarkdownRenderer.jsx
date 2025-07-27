import React from 'react';

const MarkdownRenderer = ({ content }) => {
  const styles = `
    h1 { font-size: 24px; font-weight: 600; margin: 12px 0 8px 0; color: #654321; }
    h2 { font-size: 20px; font-weight: 600; margin: 10px 0 6px 0; color: #654321; }
    h3 { font-size: 18px; font-weight: 600; margin: 8px 0 5px 0; color: #654321; }
    h4 { font-size: 16px; font-weight: 600; margin: 6px 0 4px 0; color: #8B4513; }
    strong { font-weight: 600; color: #654321; }
    em { font-style: italic; color: #8B4513; }
    ul { margin: 8px 0; padding-left: 24px; }
    ol { margin: 8px 0; padding-left: 24px; }
    li { margin: 3px 0; }
    ul li { list-style-type: disc; }
    ul ul li { list-style-type: circle; }
    ul ul ul li { list-style-type: square; }
    ol li { list-style-type: decimal; }
    p { margin: 8px 0; line-height: 1.6; }
    blockquote { 
      margin: 12px 0; 
      padding: 8px 16px; 
      border-left: 4px solid #d4af37; 
      background-color: #f4f1e8; 
      font-style: italic; 
    }
    .scripture { 
      background-color: #ede8d3; 
      padding: 12px; 
      border-radius: 6px; 
      margin: 8px 0; 
      border-left: 4px solid #d4af37; 
    }
  `;
  
  const renderMarkdown = (text) => {
    let html = text;
    
    // Handle scripture references (custom formatting)
    html = html.replace(/\*Scripture: (.*?)\*/g, '<div class="scripture"><strong>Scripture:</strong> $1</div>');
    
    // Handle headers
    html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    // Handle blockquotes
    html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
    
    // Handle bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    
    // Handle ordered lists
    html = html.replace(/^\d+\.\s(.*)$/gm, '<ol><li>$1</li></ol>');
    html = html.replace(/<\/ol>\s*<ol>/g, '');
    
    // Handle unordered lists
    html = html.replace(/^[-*+]\s(.*)$/gm, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    
    // Handle paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // Clean up
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>|<ol>|<blockquote>)/g, '$1');
    html = html.replace(/(<\/ul>|<\/ol>|<\/blockquote>)<\/p>/g, '$1');
    
    return html;
  };

  return (
    <>
      <style>{styles}</style>
      <div 
        className="markdown-content leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    </>
  );
};

export default MarkdownRenderer;