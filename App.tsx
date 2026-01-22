import React from 'react';
import ContentExtractor from './components/ContentExtractor';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="mb-6 text-center">
        <p className="font-montserrat text-4xl font-bold text-[#091f2f]">
          <span className="uppercase">CITY</span>{' '}
          <span className="normal-case italic font-normal">of</span>{' '}
          <span className="relative inline-block">
            <span className="uppercase">BOSTON</span>
            <span
              className="absolute bottom-[-4px] left-0 w-full h-[6px] bg-[#fb4d42]"
              aria-hidden="true"
            ></span>
          </span>
        </p>
        <h1 className="text-4xl font-bold text-[#091f2f] uppercase">
          Permit Page Template Filler
        </h1>
        <p className="mt-4 text-slate-600">
          Automatically populate templates from documents or text using AI.
        </p>
      </header>
      
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-7xl mx-auto flex-1">
          <ContentExtractor />
        </div>
      </main>
    </div>
  );
};

export default App;
