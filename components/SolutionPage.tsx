import React from 'react';
import type { Source } from '../types';
import { FormattedResponse } from './FormattedResponse';

interface SolutionPageProps {
  text: string;
  sources: Source[];
  onBack: () => void;
  onTtsRequest: () => void;
  isTtsLoading: boolean;
  audioUrl: string | null;
}

export const SolutionPage: React.FC<SolutionPageProps> = ({
  text,
  sources,
  onBack,
  onTtsRequest,
  isTtsLoading,
  audioUrl,
}) => {
  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition duration-150 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Queries
      </button>
      
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 border-b pb-3">Solution Details</h2>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <button
          onClick={onTtsRequest}
          disabled={isTtsLoading || !text}
          className="px-4 py-2 bg-pink-600 text-white text-sm font-semibold rounded-full shadow-md hover:bg-pink-700 transition duration-150 disabled:bg-pink-400 disabled:cursor-not-allowed flex-shrink-0"
        >
          {isTtsLoading ? 'Generating...' : 'Read Aloud ✨'}
        </button>
        {audioUrl && (
            <audio src={audioUrl} controls autoPlay className="w-full sm:w-2/3 h-10"></audio>
        )}
      </div>
      
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 min-h-[200px] text-black">
        <FormattedResponse text={text} />
      </div>

      {sources.length > 0 && (
        <div className="mt-8 border-t pt-4 border-gray-200">
          <p className="font-semibold text-gray-700 mb-2">Sources:</p>
          <ul className="space-y-1 text-sm text-gray-600">
            {sources.map((source, index) => (
              <li key={index}>
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 hover:underline transition duration-150"
                >
                  {index + 1}. {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};