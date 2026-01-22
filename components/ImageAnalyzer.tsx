import React, { useState } from 'react';
import { analyzeImageAndText } from '../services/geminiService';
import { fileToGenerativePart } from '../utils/fileUtils';
import Spinner from './ui/Spinner';

const ImageAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('What do you see in this image?');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysis('');
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !prompt.trim()) {
      setError('Please upload an image and provide a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis('');

    try {
      const imagePart = await fileToGenerativePart(image);
      const response = await analyzeImageAndText(prompt, imagePart);
      setAnalysis(response.text);
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg shadow-xl h-full overflow-y-auto text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Input */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold text-sky-400">Image Analysis with Gemini</h2>
          <div>
            <label htmlFor="image-upload" className="block text-sm font-medium text-slate-300 mb-2">
              Upload Image
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
            />
          </div>
          {imagePreview && (
            <div className="mt-4">
              <img src={imagePreview} alt="Preview" className="max-h-60 w-auto rounded-lg shadow-md" />
            </div>
          )}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">
              Your Question
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g., Describe this image, what is the object in the top left, etc."
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !image}
            className="w-full px-4 py-2 bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg"
          >
            {isLoading ? <><Spinner /> Analyzing...</> : 'Analyze Image'}
          </button>
        </div>

        {/* Right Column: Output */}
        <div className="flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-slate-300">Analysis Result</h3>
          <div className="flex-1 p-4 bg-slate-900 rounded-lg border border-slate-700 overflow-y-auto">
            {isLoading && !analysis && (
                <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400">Generating analysis...</p>
                </div>
            )}
            {error && <p className="text-red-400">{error}</p>}
            {analysis && <p className="whitespace-pre-wrap text-slate-200">{analysis}</p>}
            {!isLoading && !analysis && !error && (
                <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">Upload an image and ask a question to see the analysis here.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;