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
 */
export default function Table({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'No data found.',
    getRowKey,
}) {
    if (loading) {
        return <ContentLoader label="Loading…" />;
    }

    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className={`col-${col.align || 'left'}`}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="table-state">{emptyMessage}</td>
                        </tr>
                    ) : data.map((row, ri) => (
                        <tr key={getRowKey ? getRowKey(row, ri) : (row.id ?? ri)}>
                            {columns.map((col, ci) => (
                                <td key={ci} className={`col-${col.align || 'left'}`}>
                                    {col.render
                                        ? col.render(col.accessor ? row[col.accessor] : row, row)
                                        : (col.accessor ? (row[col.accessor] ?? '—') : '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
