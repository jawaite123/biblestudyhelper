import React, { useState } from "react";
import bibleChapters from "../data/bibleChapters";
import "./ChapterSelect.css";

function ChapterSelect({ onSelect }) {
  const [filter, setFilter] = useState("");

  const books = [...new Set(bibleChapters.map((ch) => ch.book))];

  const filtered = filter
    ? bibleChapters.filter((ch) => ch.book === filter)
    : bibleChapters;

  return (
    <div className="chapter-select">
      <h2>Choose a Chapter to Study</h2>
      <p className="subtitle">
        Put the key events in the correct order by dragging and dropping.
      </p>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === "" ? "active" : ""}`}
          onClick={() => setFilter("")}
        >
          All
        </button>
        {books.map((book) => (
          <button
            key={book}
            className={`filter-btn ${filter === book ? "active" : ""}`}
            onClick={() => setFilter(book)}
          >
            {book}
          </button>
        ))}
      </div>

      <div className="chapter-grid">
        {filtered.map((chapter) => (
          <button
            key={chapter.id}
            className="chapter-card"
            onClick={() => onSelect(chapter)}
          >
            <span className="card-book">{chapter.book} {chapter.chapter}</span>
            <span className="card-title">{chapter.title}</span>
            <span className="card-count">{chapter.events.length} events</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ChapterSelect;
