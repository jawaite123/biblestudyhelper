import React, { useState, useRef, useCallback, useEffect } from "react";
import "./DragDropGame.css";

const LONG_PRESS_MS = 300;
const MOVE_THRESHOLD = 5;

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
  const [activeDrag, setActiveDrag] = useState(null);
  const [justDroppedId, setJustDroppedId] = useState(null);
  const [pressingId, setPressingId] = useState(null);
  const listRef = useRef(null);
  const ghostRef = useRef(null);
  const dragDataRef = useRef(null);
  const isDraggingRef = useRef(false);
  const pendingRef = useRef(null);

  // Derive score live from current item positions
  const correctCount = items.filter(
    (item, idx) => item.order === idx + 1
  ).length;
  const total = items.length;
  const score = Math.round((correctCount / total) * 100);

  // Reset when chapter changes
  useEffect(() => {
    setItems(shuffleArray(chapter.events));
    setSubmitted(false);
  }, [chapter]);

  // Cancel a pending long-press
  const cancelPending = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    if (pending.cleanup) pending.cleanup();
    setPressingId(null);
    pendingRef.current = null;
  }, []);

  // Clean up pending on unmount
  useEffect(() => {
    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer);
        if (pendingRef.current.cleanup) pendingRef.current.cleanup();
      }
    };
  }, []);

  const handlePointerDown = useCallback(
    (e, index) => {
      if (isDraggingRef.current || pendingRef.current) return;
      // Don't call e.preventDefault() — let the browser scroll normally

      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const item = items[index];
      const startX = e.clientX;
      const startY = e.clientY;

      // If the pointer moves too far before the timer fires, cancel
      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
          cancelPending();
        }
      };
      const onUp = () => cancelPending();

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);

      const cleanup = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
      };

      // After the long-press delay, activate drag mode
      const timer = setTimeout(() => {
        cleanup();
        pendingRef.current = null;
        isDraggingRef.current = true;

        dragDataRef.current = {
          offsetX: startX - rect.left,
          offsetY: startY - rect.top,
          id: item.id,
        };

        setPressingId(null);
        setActiveDrag({
          id: item.id,
          text: item.text,
          width: rect.width,
          initialX: rect.left,
          initialY: rect.top,
        });
      }, LONG_PRESS_MS);

      pendingRef.current = { timer, cleanup };
      setPressingId(item.id);
    },
    [items, cancelPending]
  );

  // Attach document-level pointer listeners while dragging
  useEffect(() => {
    if (!activeDrag) return;

    // Block touch-scrolling for the duration of the drag
    const preventScroll = (e) => e.preventDefault();

    const handleMove = (e) => {
      e.preventDefault();
      const data = dragDataRef.current;
      if (!data) return;

      // Update ghost position
      if (ghostRef.current) {
        ghostRef.current.style.left = `${e.clientX - data.offsetX}px`;
        ghostRef.current.style.top = `${e.clientY - data.offsetY}px`;
      }

      // Determine target index from pointer Y vs list children midpoints
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

      // Live-reorder: move the dragged item to the target slot
      setItems((prev) => {
        const currentIdx = prev.findIndex((item) => item.id === data.id);
        if (currentIdx === targetIdx || currentIdx === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(currentIdx, 1);
        next.splice(targetIdx, 0, moved);
        return next;
      });
    };

    const handleUp = () => {
      const data = dragDataRef.current;
      if (data) {
        setJustDroppedId(data.id);
        setTimeout(() => setJustDroppedId(null), 400);
      }

      setActiveDrag(null);
      dragDataRef.current = null;
      isDraggingRef.current = false;
    };

    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("pointermove", handleMove, { passive: false });
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleUp);

    return () => {
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleUp);
    };
  }, [activeDrag]);

  // --- Submit / Check ---
  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleRetry = () => {
    setItems(shuffleArray(chapter.events));
    setSubmitted(false);
  };

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
          Hold an event to pick it up, then drag it into the correct order.
        </p>
      )}

      {submitted && (
        <div className={`results-banner ${score === 100 ? "perfect" : ""}`}>
          <div className="score-display">
            <span className="score-number">{score}%</span>
            <span className="score-label">
              {correctCount} of {total} correct
            </span>
          </div>
          {score === 100 ? (
            <p className="score-msg">You got them all right!</p>
          ) : (
            <p className="score-msg">
              Hold and drag the red items to fix them.
            </p>
          )}
          <div className="results-actions">
            <button className="btn btn-secondary" onClick={handleRetry}>
              Start Over
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
          const isDragging = activeDrag?.id === item.id;
          const isPressing = pressingId === item.id;
          const isJustDropped = justDroppedId === item.id;

          return (
            <li
              key={item.id}
              data-item-id={item.id}
              className={[
                "event-item",
                isPressing ? "pressing" : "",
                isDragging ? "dragging" : "",
                isJustDropped ? "just-dropped" : "",
                isCorrect ? "correct" : "",
                isWrong ? "wrong" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onPointerDown={(e) => handlePointerDown(e, index)}
            >
              <span className="event-number">{index + 1}</span>
              <span className="event-grip">{"\u2817"}</span>
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
          <span className="event-grip">{"\u2817"}</span>
          <span className="event-text">{activeDrag.text}</span>
        </div>
      )}

      <div className="submit-area">
        <button className="btn btn-primary btn-lg" onClick={handleSubmit}>
          {submitted ? "Check Again" : "Check My Answers"}
        </button>
      </div>
    </div>
  );
}

export default DragDropGame;
