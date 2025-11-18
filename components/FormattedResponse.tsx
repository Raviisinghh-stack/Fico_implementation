import React, { Fragment } from 'react';

interface FormattedResponseProps {
  text: string;
}

export const FormattedResponse: React.FC<FormattedResponseProps> = ({ text }) => {

  const formatBold = (line: string) => {
    // Use a regex that captures content within **...** and replaces it with <strong>...</strong>
    // Also handle cases where bolding might be at the start or end of a line.
    return line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };
  
  const renderLines = () => {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={key} className="list-disc list-inside space-y-2 my-4 pl-4">
            {listItems.map((item, itemIndex) => (
              <li key={itemIndex} dangerouslySetInnerHTML={{ __html: formatBold(item) }} />
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        listItems.push(trimmedLine.replace(/^\s*[-*]\s*/, ''));
      } else {
        flushList(`ul-${index}`);
        const formattedLine = formatBold(line);
        if (trimmedLine.length > 0) {
          // A simple heuristic for headings: ends with a colon, or has no lowercase letters and is short.
          const isHeading = (trimmedLine.endsWith(':') && !trimmedLine.includes('http')) || 
                            (trimmedLine.length < 50 && !/[a-z]/.test(trimmedLine) && /[A-Z]/.test(trimmedLine));

          if (isHeading) {
            elements.push(<h3 key={index} className="text-lg font-semibold mt-6 mb-2 text-black" dangerouslySetInnerHTML={{ __html: formattedLine }} />);
          } else {
            elements.push(<p key={index} className="my-3" dangerouslySetInnerHTML={{ __html: formattedLine }} />);
          }
        }
      }
    });

    flushList('ul-last'); // Flush any remaining list items at the end

    return elements.map((el, index) => <Fragment key={index}>{el}</Fragment>);
  };

  return <div>{renderLines()}</div>;
};