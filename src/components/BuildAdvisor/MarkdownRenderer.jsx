/**
 * Simple Markdown renderer for ChatGPT responses
 * Handles: headers, bold, italic, code blocks, inline code, lists, links
 */

function sanitizeUrl(url) {
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    const allowed = ['http:', 'https:', 'mailto:'];
    return allowed.includes(parsed.protocol) ? url : '#';
  } catch {
    return '#';
  }
}

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const renderMarkdown = (text) => {
    const elements = [];
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLang = '';
    let listItems = [];
    let listType = null;

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType === 'ordered' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={elements.length} className={listType === 'ordered' ? 'list-decimal list-inside space-y-1 my-2' : 'list-disc list-inside space-y-1 my-2'}>
            {listItems.map((item, i) => (
              <li key={i} className="text-gray-300">{renderInline(item)}</li>
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
          codeBlockContent = [];
        } else {
          elements.push(
            <div key={elements.length} className="my-3">
              {codeBlockLang && (
                <div className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-t border border-b-0 border-gray-700">
                  {codeBlockLang}
                </div>
              )}
              <pre className={`bg-gray-900 p-3 rounded${codeBlockLang ? '-b' : ''} overflow-x-auto border border-gray-700`}>
                <code className="text-sm text-green-400 font-mono">{codeBlockContent.join('\n')}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeBlockContent = [];
          codeBlockLang = '';
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        flushList();
        elements.push(<h3 key={elements.length} className="text-base font-semibold text-white mt-4 mb-2">{renderInline(line.slice(4))}</h3>);
        continue;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(<h2 key={elements.length} className="text-lg font-semibold text-white mt-4 mb-2">{renderInline(line.slice(3))}</h2>);
        continue;
      }
      if (line.startsWith('# ')) {
        flushList();
        elements.push(<h1 key={elements.length} className="text-xl font-bold text-white mt-4 mb-2">{renderInline(line.slice(2))}</h1>);
        continue;
      }

      // Unordered list
      const ulMatch = line.match(/^[\s]*[-*•]\s+(.+)/);
      if (ulMatch) {
        if (listType !== 'unordered') {
          flushList();
          listType = 'unordered';
        }
        listItems.push(ulMatch[1]);
        continue;
      }

      // Ordered list
      const olMatch = line.match(/^[\s]*(\d+)[.)]\s+(.+)/);
      if (olMatch) {
        if (listType !== 'ordered') {
          flushList();
          listType = 'ordered';
        }
        listItems.push(olMatch[2]);
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(<p key={elements.length} className="text-gray-300 my-2 leading-relaxed">{renderInline(line)}</p>);
    }

    // Flush any remaining list
    flushList();

    // Handle unclosed code block
    if (inCodeBlock && codeBlockContent.length > 0) {
      elements.push(
        <pre key={elements.length} className="bg-gray-900 p-3 rounded overflow-x-auto border border-gray-700 my-3">
          <code className="text-sm text-green-400 font-mono">{codeBlockContent.join('\n')}</code>
        </pre>
      );
    }

    return elements;
  };

  const renderInline = (text) => {
    if (!text) return text;

    // Process inline elements
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold **text** or __text__
      let match = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
      if (!match) match = remaining.match(/^(.*?)__(.+?)__/);
      if (match) {
        if (match[1]) parts.push(<span key={key++}>{renderInlineRest(match[1])}</span>);
        parts.push(<strong key={key++} className="font-semibold text-white">{match[2]}</strong>);
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Italic *text* or _text_
      match = remaining.match(/^(.*?)\*(.+?)\*/);
      if (!match) match = remaining.match(/^(.*?)_(.+?)_/);
      if (match && !match[1].endsWith('*')) {
        if (match[1]) parts.push(<span key={key++}>{renderInlineRest(match[1])}</span>);
        parts.push(<em key={key++} className="italic text-gray-200">{match[2]}</em>);
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Inline code `text`
      match = remaining.match(/^(.*?)`([^`]+)`/);
      if (match) {
        if (match[1]) parts.push(<span key={key++}>{renderInlineRest(match[1])}</span>);
        parts.push(<code key={key++} className="px-1.5 py-0.5 bg-gray-800 text-amber-400 rounded text-sm font-mono">{match[2]}</code>);
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Links [text](url)
      match = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        if (match[1]) parts.push(<span key={key++}>{renderInlineRest(match[1])}</span>);
        parts.push(
          <a
            key={key++}
            href={sanitizeUrl(match[3])}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {match[2]}
          </a>
        );
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // No more matches, add rest as text
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    return parts.length > 0 ? parts : text;
  };

  const renderInlineRest = (text) => {
    // Handle nested inline elements recursively but with a simpler approach
    // Just return the text for deeply nested cases to avoid infinite loops
    return text;
  };

  return (
    <div className={`markdown-content ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
}
