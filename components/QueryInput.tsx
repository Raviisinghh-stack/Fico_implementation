import React from 'react';

interface QueryInputProps {
  title: string;
  placeholder: string;
  buttonText: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isTextArea?: boolean;
  theme: 'indigo' | 'green' | 'purple';
  onFileChange?: (file: File) => void;
  fileName?: string | null;
  onClearFile?: () => void;
  buttonText2?: string;
  onSubmit2?: () => void;
  theme2?: 'indigo' | 'green' | 'purple';
}

export const QueryInput: React.FC<QueryInputProps> = ({
  title,
  placeholder,
  buttonText,
  value,
  onChange,
  onSubmit,
  isLoading,
  isTextArea = false,
  theme,
  onFileChange,
  fileName,
  onClearFile,
  buttonText2,
  onSubmit2,
  theme2,
}) => {
  const themeClasses = {
    indigo: {
      ring: 'focus:ring-indigo-500',
      bg: 'bg-indigo-600',
      hoverBg: 'hover:bg-indigo-700',
      disabledBg: 'disabled:bg-indigo-400',
    },
    green: {
      ring: 'focus:ring-green-500',
      bg: 'bg-green-600',
      hoverBg: 'hover:bg-green-700',
      disabledBg: 'disabled:bg-green-400',
    },
    purple: {
      ring: 'focus:ring-purple-500',
      bg: 'bg-purple-600',
      hoverBg: 'hover:bg-purple-700',
      disabledBg: 'disabled:bg-purple-400',
    },
  };

  const currentTheme = themeClasses[theme];

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isTextArea) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileChange) {
        onFileChange(e.target.files[0]);
    }
    // Reset the input value to allow re-uploading the same file if needed
    e.target.value = '';
  };

  const InputComponent = isTextArea ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${currentTheme.ring} transition duration-150`}
      disabled={isLoading}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={handleKeyPress}
      placeholder={placeholder}
      className={`flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${currentTheme.ring} transition duration-150`}
      disabled={isLoading}
    />
  );

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">{title}</h2>
        {isTextArea && onFileChange && (
            <div className="mb-3">
                <div className="flex items-center flex-wrap gap-3">
                    <label className={`cursor-pointer px-4 py-2 text-sm bg-gray-600 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-700 transition duration-150 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span>Select Document</span>
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".txt,.md,.csv"
                            disabled={isLoading}
                        />
                    </label>
                    {fileName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-4V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate max-w-xs">{fileName}</span>
                            <button onClick={onClearFile} disabled={isLoading} className="text-red-500 hover:text-red-700 font-bold text-xl leading-none flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">&times;</button>
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Or paste content below. Supported formats: .txt, .md, .csv</p>
            </div>
        )}
      <div className={`flex flex-col ${isTextArea ? '' : 'sm:flex-row'} gap-3`}>
        {InputComponent}
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className={`px-6 py-3 text-white font-semibold rounded-lg shadow-md transition duration-150 transform hover:scale-[1.01] ${currentTheme.bg} ${currentTheme.hoverBg} ${currentTheme.disabledBg}`}
        >
          {buttonText}
        </button>
        {buttonText2 && onSubmit2 && theme2 && (
            <button
              onClick={onSubmit2}
              disabled={isLoading}
              className={`px-6 py-3 text-white font-semibold rounded-lg shadow-md transition duration-150 transform hover:scale-[1.01] ${themeClasses[theme2].bg} ${themeClasses[theme2].hoverBg} ${themeClasses[theme2].disabledBg}`}
            >
              {buttonText2}
            </button>
        )}
      </div>
    </div>
  );
};