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
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [justDroppedId, setJustDroppedId] = useState(null);
  const listRef = useRef(null);
  const ghostRef = useRef(null);
  const dragDataRef = useRef(null);
  const dropTargetRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Reset when chapter changes
  useEffect(() => {
    setItems(shuffleArray(chapter.events));
    setSubmitted(false);
    setResults(null);
  }, [chapter]);

  const handlePointerDown = useCallback(
    (e, index) => {
      if (submitted || isDraggingRef.current) return;
      e.preventDefault();
      isDraggingRef.current = true;

      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();

      dragDataRef.current = {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        startIndex: index,
      };
      dropTargetRef.current = index;

      setActiveDrag({
        index,
        id: el.dataset.itemId,
        text: items[index].text,
        width: rect.width,
        initialX: rect.left,
        initialY: rect.top,
      });
      setDropTargetIndex(index);
    },
    [submitted, items]
  );

  // Attach document-level pointer listeners while dragging
  useEffect(() => {
    if (!activeDrag) return;

    const handleMove = (e) => {
      e.preventDefault();
      if (ghostRef.current && dragDataRef.current) {
        ghostRef.current.style.left = `${e.clientX - dragDataRef.current.offsetX}px`;
        ghostRef.current.style.top = `${e.clientY - dragDataRef.current.offsetY}px`;
      }

      // Determine drop target by checking midpoints of list children
      const elements = listRef.current?.children;
      if (!elements) return;

      let targetIdx = elements.length - 1;
      for (let i = 0; i < elements.length; i++) {
        const rect = elements[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          targetIdx = i;
          break;
        }
      }
      dropTargetRef.current = targetIdx;
      setDropTargetIndex(targetIdx);
    };

    const handleUp = () => {
      const fromIndex = dragDataRef.current?.startIndex;
      const toIndex = dropTargetRef.current;

      if (fromIndex != null && toIndex != null && fromIndex !== toIndex) {
        setItems((prev) => {
          const next = [...prev];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return next;
        });
      }

      setJustDroppedId(activeDrag.id);
      setTimeout(() => setJustDroppedId(null), 400);

      setActiveDrag(null);
      setDropTargetIndex(null);
      dragDataRef.current = null;
      dropTargetRef.current = null;
      isDraggingRef.current = false;
    };

    document.addEventListener("pointermove", handleMove, { passive: false });
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleUp);
    };
  }, [activeDrag]);

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

      <ul className="event-list" ref={listRef}>
        {items.map((item, index) => {
          const isCorrect = submitted && item.order === index + 1;
          const isWrong = submitted && item.order !== index + 1;
          const isDragging = activeDrag?.index === index;
          const isJustDropped = justDroppedId === item.id;
          const isDropTarget =
            activeDrag && !isDragging && dropTargetIndex === index;

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
              onPointerDown={(e) => handlePointerDown(e, index)}
            >
              <span className="event-number">{index + 1}</span>
              <span className="event-grip">{submitted ? "" : "\u2817"}</span>
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

      {/* Floating ghost that follows the pointer */}
      {activeDrag && (
        <div
          className="drag-ghost"
          ref={ghostRef}
          style={{
            left: activeDrag.initialX,
            top: activeDrag.initialY,
            width: activeDrag.width,
          }}
        >
          <span className="event-number">{activeDrag.index + 1}</span>
          <span className="event-grip">{"\u2817"}</span>
          <span className="event-text">{activeDrag.text}</span>
        </div>
      )}

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
