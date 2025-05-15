import React from 'react';
import AdvancedSubtitleGenerator from './components/AdvancedSubtitleGenerator';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <AdvancedSubtitleGenerator />
      </ErrorBoundary>
    </div>
  );
}

export default App;