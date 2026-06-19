import React, { useState } from 'react';
import { migrateDemoData, type MigrationResult } from '../../../core/services/migrateDemoData';

const AdminMigrate: React.FC = () => {
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await migrateDemoData();
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white">
        <h4 className="mb-0">Migrate Demo Content</h4>
      </div>
      <div className="card-body">
        <p className="text-muted">
          This action imports visible demo Tours, Hotels, Flights, Cars, Activities, and default homepage settings into Firestore.
          It is idempotent: existing records with the same ID are skipped.
        </p>
        <button
          className="btn btn-primary d-flex align-items-center"
          onClick={handleMigrate}
          disabled={loading}
        >
          {loading && <span className="spinner-border spinner-border-sm me-2" role="status" />}
          <i className="isax isax-import me-2" />
          Run Migration
        </button>

        {error && (
          <div className="alert alert-danger mt-4">
            <i className="isax isax-warning-2 me-2" />
            {error}
          </div>
        )}

        {result && (
          <div className="alert alert-success mt-4">
            <h6 className="mb-2">Migration complete</h6>
            <ul className="mb-0">
              <li>Tours imported: {result.tours}</li>
              <li>Hotels imported: {result.hotels}</li>
              <li>Flights imported: {result.flights}</li>
              <li>Cars imported: {result.cars}</li>
              <li>Activities imported: {result.activities}</li>
              <li>Homepage settings created: {result.homepage ? 'Yes' : 'Already exists'}</li>
            </ul>
            {result.errors.length > 0 && (
              <div className="mt-3 text-danger">
                <strong>Errors:</strong>
                <ul className="mb-0">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMigrate;
