import React, { useState, useRef, useCallback, useEffect } from "react";
import "./DragDropGame.css";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DragDropGame({ chapter, onBack, onComplete }) {
  const [items, setItems] = useState(() => shuffleArray(chapter.events));
  const [dragIndex, setDragIndex] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [touchDragIndex, setTouchDragIndex] = useState(null);
  const listRef = useRef(null);

  // Reset when chapter changes
  useEffect(() => {
    setItems(shuffleArray(chapter.events));
    setSubmitted(false);
    setResults(null);
  }, [chapter]);

  // --- Desktop Drag and Drop (live reorder) ---
  const handleDragStart = useCallback((e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Make the default browser ghost semi-transparent
    if (e.target) {
      requestAnimationFrame(() => {
        e.target.style.opacity = "0.5";
      });
    }
  }, []);

  const handleDragOver = useCallback(
    (e, index) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;
      setItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(index, 0, moved);
        return next;
      });
      setDragIndex(index);
    },
    [dragIndex]
  );

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragIndex(null);
  }, []);

  const handleDragEnd = useCallback((e) => {
    if (e.target) e.target.style.opacity = "";
    setDragIndex(null);
  }, []);

  // --- Touch Drag and Drop (live reorder) ---
  const handleTouchStart = useCallback((e, index) => {
    setTouchDragIndex(index);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (touchDragIndex === null) return;
      const touch = e.touches[0];
      const elements = listRef.current?.children;
      if (!elements) return;

      for (let i = 0; i < elements.length; i++) {
        const rect = elements[i].getBoundingClientRect();
        if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          if (i !== touchDragIndex) {
            setItems((prev) => {
              const next = [...prev];
              const [moved] = next.splice(touchDragIndex, 1);
              next.splice(i, 0, moved);
              return next;
            });
            setTouchDragIndex(i);
          }
          break;
        }
      }
    },
    [touchDragIndex]
  );

  const handleTouchEnd = useCallback(() => {
    setTouchDragIndex(null);
  }, []);

  // --- Submit / Check ---
  const handleSubmit = () => {
    const correctCount = items.filter(
      (item, idx) => item.order === idx + 1
    ).length;
    const total = items.length;
    setResults({ correctCount, total });
    setSubmitted(true);
  };

  const handleRetry = () => {
    setItems(shuffleArray(chapter.events));
    setSubmitted(false);
    setResults(null);
  };

  const score = results
    ? Math.round((results.correctCount / results.total) * 100)
    : 0;

  return (
    <div className="drag-drop-game">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>
          &larr; Back
        </button>
        <div className="game-title">
          <h2>
            {chapter.book} {chapter.chapter}
          </h2>
          <p>{chapter.title}</p>
        </div>
      </div>

      {!submitted && (
        <p className="instruction">
          Drag and drop the events into the correct order.
        </p>
      )}

      {submitted && results && (
        <div className={`results-banner ${score === 100 ? "perfect" : ""}`}>
          <div className="score-display">
            <span className="score-number">{score}%</span>
            <span className="score-label">
              {results.correctCount} of {results.total} correct
            </span>
          </div>
          {score === 100 ? (
            <p className="score-msg">You got them all right!</p>
          ) : (
            <p className="score-msg">
              Review the results below. Green items are correct; red items are
              out of place.
            </p>
          )}
          <div className="results-actions">
            <button className="btn btn-primary" onClick={handleRetry}>
              Try Again
            </button>
            <button className="btn btn-secondary" onClick={onBack}>
              Pick Another Chapter
            </button>
          </div>
        </div>
      )}

      <ul
        className="event-list"
        ref={listRef}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => {
          const isCorrect = submitted && item.order === index + 1;
          const isWrong = submitted && item.order !== index + 1;
          const isDragging = dragIndex === index || touchDragIndex === index;

          return (
            <li
              key={item.id}
              className={[
                "event-item",
                isDragging ? "dragging" : "",
                isCorrect ? "correct" : "",
                isWrong ? "wrong" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              draggable={!submitted}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => !submitted && handleTouchStart(e, index)}
            >
              <span className="event-number">{index + 1}</span>
              <span className="event-grip">{submitted ? "" : "⠿"}</span>
              <span className="event-text">{item.text}</span>
              {submitted && isCorrect && (
                <span className="event-icon correct-icon">&#10003;</span>
              )}
              {submitted && isWrong && (
                <span className="event-icon wrong-icon">&#10007;</span>
              )}
            </li>
          );
        })}
      </ul>

      {!submitted && (
        <div className="submit-area">
          <button className="btn btn-primary btn-lg" onClick={handleSubmit}>
            Check My Answers
          </button>
        </div>
      )}
    </div>
  );
}

export default DragDropGame;
