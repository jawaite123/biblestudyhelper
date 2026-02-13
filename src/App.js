import React, { useState } from "react";
import ChapterSelect from "./components/ChapterSelect";
import DragDropGame from "./components/DragDropGame";
import "./App.css";

function App() {
  const [selectedChapter, setSelectedChapter] = useState(null);

  return (
    <div className="App">
      <header className="app-header">
        <h1 className="app-logo" onClick={() => setSelectedChapter(null)}>
          Bible Study Helper
        </h1>
      </header>

      <main>
        {selectedChapter ? (
          <DragDropGame
            chapter={selectedChapter}
            onBack={() => setSelectedChapter(null)}
          />
        ) : (
          <ChapterSelect onSelect={setSelectedChapter} />
        )}
      </main>
    </div>
  );
}

export default App;
