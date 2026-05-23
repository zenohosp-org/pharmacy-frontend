import { useState, useEffect, useRef, useCallback } from 'react';
import './SearchDropdown.css';

/**
 * Reusable searchable dropdown.
 *
 * Two modes:
 *   - Async: pass `searchFn(query) => Promise<item[]>`. Results are fetched on every keystroke (debounced).
 *   - Local: pass `items=[...]` and optional `filterFn(item, q) => boolean`. Filters in-memory.
 *
 * Props:
 *   value             current text input value (controlled)
 *   onChange(text)    called on every keystroke
 *   onSelect(item)    called when user picks a result
 *   onClear()         optional — called when user clicks the × button
 *   searchFn          async search function (async mode)
 *   items             array of items (local mode)
 *   filterFn          (item, q) => bool — local-mode filter (default: stringify and includes)
 *   renderItem(item)  renders the row content inside .sd-item
 *   getKey(item)      returns unique key (default item.id)
 *   placeholder       input placeholder
 *   disabled          disables input
 *   hint              small text under input
 *   debounceMs        debounce for async mode (default 300)
 *   showAllOnFocus    if true, opens panel on focus even with empty query (default true)
 *   allowClear        if true, shows × button to clear selection (default true)
 *   selected          if truthy, indicates a selection has been made (shows clear button)
 *   className         extra class on root
 *   inputClassName    extra class on input element
 */
export default function SearchDropdown({
  value,
  onChange,
  onSelect,
  onClear,
  searchFn,
  items,
  filterFn,
  renderItem,
  getKey = (item) => item.id,
  placeholder = 'Search…',
  disabled = false,
  hint,
  debounceMs = 300,
  showAllOnFocus = true,
  allowClear = true,
  selected = false,
  className = '',
  inputClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const timerRef = useRef(null);
  const blurTimerRef = useRef(null);

  const defaultFilter = useCallback((item, q) => {
    const text = JSON.stringify(item).toLowerCase();
    return text.includes(q.toLowerCase());
  }, []);

  // Local-mode: recompute on items/value change
  useEffect(() => {
    if (searchFn) return;
    const q = (value || '').trim();
    const filter = filterFn || defaultFilter;
    setResults(q ? items.filter((i) => filter(i, q)) : items);
  }, [items, value, searchFn, filterFn, defaultFilter]);

  // Async-mode: debounced fetch
  useEffect(() => {
    if (!searchFn) return;
    if (selected) return; // don't re-search when a selection is already shown
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchFn(value || '');
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('SearchDropdown searchFn failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [value, searchFn, debounceMs, selected]);

  const handleFocus = async () => {
    clearTimeout(blurTimerRef.current);
    if (showAllOnFocus || (value && value.trim())) setOpen(true);
    // Async mode: if no results yet, fetch immediately so the user sees something on focus
    if (searchFn && !selected && results.length === 0 && !loading) {
      clearTimeout(timerRef.current);
      setLoading(true);
      try {
        const data = await searchFn(value || '');
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('SearchDropdown searchFn failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBlur = () => {
    // delay so onMouseDown on items can fire first
    blurTimerRef.current = setTimeout(() => setOpen(false), 180);
  };

  const handleSelect = (item) => {
    onSelect(item);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showClear = allowClear && selected;

  return (
    <div className={`sd-root ${className}`}>
      <div className="sd-input-wrap">
        <input
          type="text"
          className={`sd-input ${inputClassName}`}
          value={value || ''}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {showClear && (
          <button
            type="button"
            className="sd-clear"
            onMouseDown={(e) => {
              e.preventDefault();
              if (onClear) onClear();
            }}
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>
      {hint && <div className="sd-hint">{hint}</div>}
      {open && !disabled && (
        <div className="sd-panel" role="listbox">
          {loading && <div className="sd-empty">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="sd-empty">{value ? 'No matches' : 'Type to search'}</div>
          )}
          {!loading &&
            results.map((item, idx) => (
              <div
                key={getKey(item, idx)}
                role="option"
                aria-selected={idx === activeIdx}
                className={`sd-item ${idx === activeIdx ? 'sd-active' : ''}`}
                onMouseDown={() => handleSelect(item)}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                {renderItem ? renderItem(item) : String(item)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
