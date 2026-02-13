# Bible Study Helper

## Project Overview
A React-based Progressive Web App (PWA) that helps users learn the order of events in Bible chapters through an interactive drag-and-drop game. Users select a chapter, then drag events into the correct chronological order and check their answers.

## Tech Stack
- **Framework:** React 19 (Create React App)
- **Language:** JavaScript (no TypeScript)
- **Styling:** Plain CSS (component-level `.css` files)
- **PWA:** Service worker via `cra-template-pwa`
- **Deployment:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)

## Project Structure
```
src/
├── App.js                  # Root component — routes between chapter select and game
├── App.css
├── index.js                # Entry point, registers service worker
├── index.css
├── components/
│   ├── ChapterSelect.js    # Chapter selection grid with book filter
│   ├── ChapterSelect.css
│   ├── DragDropGame.js     # Core drag-and-drop ordering game
│   └── DragDropGame.css
├── data/
│   └── bibleChapters.js    # All chapter/event data (static array)
├── service-worker.js
└── serviceWorkerRegistration.js
public/
├── index.html
├── manifest.json
└── (icons, favicon, robots.txt)
```

## Commands
- `npm start` — Start dev server
- `npm run build` — Production build (outputs to `build/`)
- `npm test` — Run tests

## Key Patterns

### Adding a New Chapter
Add a new object to the array in `src/data/bibleChapters.js` following this shape:
```js
{
  id: "book-chapter",          // unique identifier
  book: "Book Name",           // used for filtering
  chapter: 1,                  // chapter number
  title: "Chapter Title",
  events: [
    { id: "prefix-1", text: "Event description", order: 1 },
    // ... events in correct order (order field = correct position)
  ],
}
```

### Drag and Drop
`DragDropGame.js` implements both desktop (HTML5 drag events) and mobile (touch events) with live reorder — items shift in real time as you drag. Drop animations use CSS transitions.

### State Management
All state is local React state via `useState`. No external state library. The app has two views controlled by `selectedChapter` in `App.js`:
- `null` → show `ChapterSelect`
- selected → show `DragDropGame`
