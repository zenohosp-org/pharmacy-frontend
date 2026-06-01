import { useState, Fragment } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ContentLoader from '../shared/ContentLoader';
import './Table.css';

/**
 * Reusable data table.
 *
 * columns: [{ header, accessor, align, render(value, row) }]
 *   - accessor: key on the row object
 *   - align: 'left' | 'right' | 'center' (default 'left')
 *   - render: custom cell renderer; receives (value, row)
 * data: array of row objects
 * loading: shows the content loader instead of rows
 * emptyMessage: shown when data is empty
 * getRowKey: (row, index) => key  (defaults to row.id ?? index)
 *
 * Expandable rows (optional):
 *   renderExpanded(row): node shown in a sub-row when the row is expanded.
 *     When provided, a chevron toggle column is prepended.
 *   onExpand(row): called the first time a row is opened (e.g. lazy-load).
 */
export default function Table({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'No data found.',
    getRowKey,
    renderExpanded,
    onExpand,
}) {
    const expandable = typeof renderExpanded === 'function';
    const [openKeys, setOpenKeys] = useState(() => new Set());

    if (loading) {
        return <ContentLoader label="Loading…" />;
    }

    const keyFor = (row, ri) => (getRowKey ? getRowKey(row, ri) : (row.id ?? ri));
    const totalCols = columns.length + (expandable ? 1 : 0);

    const toggle = (key, row) => {
        setOpenKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
                onExpand?.(row);
            }
            return next;
        });
    };

    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        {expandable && <th className="col-expand" />}
                        {columns.map((col, i) => (
                            <th key={i} className={`col-${col.align || 'left'}`}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={totalCols} className="table-state">{emptyMessage}</td>
                        </tr>
                    ) : data.map((row, ri) => {
                        const key = keyFor(row, ri);
                        const isOpen = expandable && openKeys.has(key);
                        return (
                            <Fragment key={key}>
                                <tr>
                                    {expandable && (
                                        <td className="col-expand">
                                            <button
                                                type="button"
                                                className="table-expand-btn"
                                                onClick={() => toggle(key, row)}
                                                aria-label="Toggle row"
                                            >
                                                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>
                                        </td>
                                    )}
                                    {columns.map((col, ci) => (
                                        <td key={ci} className={`col-${col.align || 'left'}`}>
                                            {col.render
                                                ? col.render(col.accessor ? row[col.accessor] : row, row)
                                                : (col.accessor ? (row[col.accessor] ?? '—') : '—')}
                                        </td>
                                    ))}
                                </tr>
                                {isOpen && (
                                    <tr className="table-expanded-row">
                                        <td colSpan={totalCols}>{renderExpanded(row)}</td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
