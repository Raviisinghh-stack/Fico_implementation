import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { QueryInput } from './components/QueryInput';
import { SolutionPage } from './components/SolutionPage';
import type { Source } from './types';
import {
  STEP_GUIDANCE_SYSTEM_PROMPT,
  EXPLAINER_SYSTEM_PROMPT,
  FSD_ANALYSIS_SYSTEM_PROMPT,
  TOPIC_VALIDATION_SYSTEM_PROMPT,
} from './constants';
import { pcmToWav } from './utils/audioUtils';

const App: React.FC = () => {
  const [implementationQuery, setImplementationQuery] = useState('');
  const [fsdQuery, setFsdQuery] = useState('');

  const [fsdFile, setFsdFile] = useState<File | null>(null);
  const [fsdFileContent, setFsdFileContent] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  
  const [solutionText, setSolutionText] = useState('');
  const [solutionSources, setSolutionSources] = useState<Source[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [view, setView] = useState<'main' | 'solution'>('main');

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const validateQueryTopic = useCallback(async (query: string): Promise<boolean> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ parts: [{ text: query }] }],
        config: {
        systemInstruction: TOPIC_VALIDATION_SYSTEM_PROMPT,
        temperature: 0,
        },
    });
    const resultText = response.text.trim().toUpperCase();
    return resultText === 'YES';
  }, [ai.models]);

  const handleQuery = useCallback(async (
    query: string, 
    systemInstruction: string, 
    useGrounding: boolean,
    model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'
  ) => {
    if (!process.env.API_KEY) {
      setError("Error: The Gemini API Key is missing. This app requires a valid API key to function.");
      return;
    }

    setAudioUrl(null);

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: query }] }],
        tools: useGrounding ? [{ googleSearch: {} }] : undefined,
        config: {
          systemInstruction,
        },
      });

      const text = response.text;
      setSolutionText(text);

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        const extractedSources = groundingChunks
          .map((chunk: any) => ({
            uri: chunk.web?.uri,
            title: chunk.web?.title,
          }))
          .filter((source: Source) => source.uri && source.title);
        setSolutionSources(extractedSources);
      } else {
        setSolutionSources([]);
      }
      setView('solution');
    } catch (e: any) {
      console.error(e);
      setError(`An error occurred: ${e.message}`);
    }
  }, [ai.models]);

  const handleImplementationQuery = async () => {
    const query = implementationQuery;
    if (!query.trim()) {
        setError('Please enter a query to proceed.');
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const isValid = await validateQueryTopic(query);
        if (isValid) {
            await handleQuery(query, STEP_GUIDANCE_SYSTEM_PROMPT, true, 'gemini-2.5-flash');
        } else {
            setError("Error: This query does not appear to be related to SAP FICO. Please ask a question about SAP Finance and Controlling.");
        }
    } catch (e: any) {
        console.error("Topic validation failed:", e);
        setError(`An error occurred during topic validation: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleConceptQuery = async () => {
    const query = implementationQuery;
     if (!query.trim()) {
        setError('Please enter a query to proceed.');
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const isValid = await validateQueryTopic(query);
        if (isValid) {
            await handleQuery(query, EXPLAINER_SYSTEM_PROMPT, false, 'gemini-2.5-flash-lite');
        } else {
            setError("Error: This query does not appear to be related to SAP FICO. Please ask a question about SAP Finance and Controlling.");
        }
    } catch (e: any) {
        console.error("Topic validation failed:", e);
        setError(`An error occurred during topic validation: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFsdAnalysis = async () => {
    const queryContent = fsdFileContent || fsdQuery;
    if (!queryContent.trim()) {
        setError("Please provide FSD requirements by pasting text or uploading a document.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const isValid = await validateQueryTopic(queryContent);
        if (isValid) {
            const fullQuery = `Analyze the following FSD requirements and provide a technical solution plan:\n\n${queryContent}`;
            await handleQuery(fullQuery, FSD_ANALYSIS_SYSTEM_PROMPT, true, 'gemini-2.5-flash');
        } else {
            setError("Error: The provided document or text does not appear to be related to SAP FICO requirements. Please provide a relevant FSD.");
        }
    } catch (e: any) {
        console.error("Topic validation failed:", e);
        setError(`An error occurred during topic validation: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  };


  const handleFileChange = useCallback((file: File) => {
    setFsdFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFsdFileContent(text);
      setError(null); // Clear previous errors
    };
    reader.onerror = (e) => {
      console.error("Error reading file:", e);
      setError("Failed to read the selected file.");
      setFsdFile(null);
      setFsdFileContent('');
    };
    reader.readAsText(file);
  }, []);

  const handleClearFile = useCallback(() => {
    setFsdFile(null);
    setFsdFileContent('');
  }, []);

  const handleTtsRequest = useCallback(async () => {
    if (!solutionText) {
      setError("There is no response text to read aloud.");
      return;
    }

    setIsTtsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
       const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: solutionText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Charon" }
                    }
                }
            },
        });

      const audioDataB64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioDataB64) {
          const wavBlob = pcmToWav(audioDataB64);
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);
      } else {
        throw new Error("No audio data received from API.");
      }

    } catch (e: any) {
      console.error("TTS Generation Error:", e);
      setError(`Could not generate audio: ${e.message}`);
    } finally {
      setIsTtsLoading(false);
    }
  }, [solutionText, ai.models]);

  const handleBackToMain = useCallback(() => {
    setView('main');
    setSolutionText('');
    setSolutionSources([]);
    setError(null);
    setAudioUrl(null);
  }, []);


  return (
    <div className="bg-gray-50 font-sans min-h-screen">
       <div className="container-bg flex flex-col items-center bg-gradient-to-br from-gray-800 to-gray-900 min-h-screen py-4 sm:py-8 px-4">
        <div className="card w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
          {view === 'main' ? (
             <>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 text-center">
                  SAP FICO Implementation Assistant
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mb-8 text-center">
                  Your expert guide for FICO configuration steps, concepts, and T-Codes.
                </p>

                <div className="space-y-8">
                  <QueryInput
                    title="Implementation Query / Concept Explainer"
                    placeholder="E.g., How to configure a new Company Code, or explain 'Cost Element'"
                    buttonText="Ask Consultant"
                    value={implementationQuery}
                    onChange={setImplementationQuery}
                    onSubmit={handleImplementationQuery}
                    isLoading={isLoading}
                    theme="indigo"
                    buttonText2="Explain Concept ✨"
                    onSubmit2={handleConceptQuery}
                    theme2="purple"
                  />

                  <div className="h-px bg-gray-200"></div>

                  <QueryInput
                    title="FSD Analysis & Solution Design 📝"
                    placeholder="Paste your FSD requirements here, or upload a document."
                    buttonText="Analyze FSD & Prepare Solution"
                    value={fsdQuery}
                    onChange={setFsdQuery}
                    onSubmit={handleFsdAnalysis}
                    isLoading={isLoading}
                    isTextArea={true}
                    theme="green"
                    onFileChange={handleFileChange}
                    fileName={fsdFile?.name}
                    onClearFile={handleClearFile}
                  />
                  
                </div>

                {isLoading && (
                  <div className="flex justify-center items-center p-4 mt-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                    <p className="text-indigo-600 font-medium">Consultant is thinking...</p>
                  </div>
                )}
                
                {error && (
                  <div className="mt-8 bg-red-50 border-red-200 text-red-700 p-4 rounded-lg text-left">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                  </div>
                )}
             </>
          ) : (
            <SolutionPage
              text={solutionText}
              sources={solutionSources}
              onBack={handleBackToMain}
              onTtsRequest={handleTtsRequest}
              isTtsLoading={isTtsLoading}
              audioUrl={audioUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
