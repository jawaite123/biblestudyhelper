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
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [justDroppedId, setJustDroppedId] = useState(null);
  const draggedIdRef = useRef(null);
  const dragStartIndexRef = useRef(null);
  const listRef = useRef(null);

  // Reset when chapter changes
  useEffect(() => {
    setItems(shuffleArray(chapter.events));
    setSubmitted(false);
    setResults(null);
  }, [chapter]);

  // --- Reorder on drop ---
  const reorderItems = useCallback((fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const finishDrag = useCallback(() => {
    reorderItems(dragStartIndexRef.current, dropTargetIndex);
    setDragIndex(null);
    setDropTargetIndex(null);
    if (draggedIdRef.current) {
      setJustDroppedId(draggedIdRef.current);
      draggedIdRef.current = null;
      setTimeout(() => setJustDroppedId(null), 400);
    }
    dragStartIndexRef.current = null;
  }, [dropTargetIndex, reorderItems]);

  // --- Desktop Drag and Drop ---
  const handleDragStart = useCallback((e, index) => {
    setDragIndex(index);
    setDropTargetIndex(index);
    dragStartIndexRef.current = index;
    draggedIdRef.current = e.target.dataset.itemId;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback(
    (e, index) => {
      e.preventDefault();
      if (dragIndex === null) return;
      setDropTargetIndex(index);
    },
    [dragIndex]
  );

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    finishDrag();
  }, [finishDrag]);

  const handleDragEnd = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  // --- Touch Drag and Drop ---
  const handleTouchStart = useCallback((e, index) => {
    setTouchDragIndex(index);
    setDropTargetIndex(index);
    dragStartIndexRef.current = index;
    const el = e.target.closest('.event-item');
    if (el) draggedIdRef.current = el.dataset.itemId;
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
          setDropTargetIndex(i);
          break;
        }
      }
    },
    [touchDragIndex]
  );

  const handleTouchEnd = useCallback(() => {
    reorderItems(dragStartIndexRef.current, dropTargetIndex);
    setTouchDragIndex(null);
    setDropTargetIndex(null);
    if (draggedIdRef.current) {
      setJustDroppedId(draggedIdRef.current);
      draggedIdRef.current = null;
      setTimeout(() => setJustDroppedId(null), 400);
    }
    dragStartIndexRef.current = null;
  }, [dropTargetIndex, reorderItems]);

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
          const isJustDropped = justDroppedId === item.id;
          const isActive = dragIndex !== null || touchDragIndex !== null;
          const isDropTarget = isActive && !isDragging && dropTargetIndex === index;

          return (
            <li
              key={item.id}
              data-item-id={item.id}
              className={[
                "event-item",
                isDragging ? "dragging" : "",
                isJustDropped ? "just-dropped" : "",
                isDropTarget ? "drop-target" : "",
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
