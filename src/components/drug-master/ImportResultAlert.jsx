import Alert from '../shared/Alert';

export default function ImportResultAlert({ result }) {
  if (!result) return null;
  return (
    <Alert tone="success" className="section-gap">
      Imported {result.imported} drug(s).
      {result.errors?.length > 0 && (
        <div className="import-errors">
          <strong>{result.errors.length} row(s) skipped:</strong>
          <ul>
            {result.errors.slice(0, 10).map((err, i) => (
              <li key={i}>Row {err.row || '?'}: {err.reason || err.error}</li>
            ))}
          </ul>
        </div>
      )}
    </Alert>
  );
}
