'use client';

import { useState } from 'react';
import { FaDatabase, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { API } from '@/constants/api';
import { showToast } from '@/components/ui/Toast';

/**
 * B2B Migration Tool - Admin Component
 * One-time tool to backfill legacy B2B registrations that are missing b2bApprovalStatus
 */
export default function B2BMigrationTool() {
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const runMigration = async () => {
    if (!confirm('This will update all legacy B2B users. Continue?')) return;

    try {
      setMigrating(true);
      setShowResults(false);
      
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/migrations/backfill-b2b-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (data.success) {
        setResults(data.results);
        setShowResults(true);
        showToast.success(`Successfully backfilled ${data.results.updated} B2B users`);
      } else {
        showToast.error(data.message || 'Migration failed');
      }
    } catch (error) {
      showToast.error('Error running migration: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
          <FaDatabase size={24} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Legacy B2B Registration Fix
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Some B2B registrations were created before the approval system was properly implemented. 
            This tool will find and fix those registrations so they appear in the approval queue.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={runMigration}
              disabled={migrating}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center gap-2"
            >
              <FaDatabase />
              {migrating ? 'Running Migration...' : 'Fix Legacy B2B Users'}
            </button>

            {results && (
              <button
                onClick={() => setShowResults(!showResults)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showResults ? 'Hide' : 'Show'} Results
              </button>
            )}
          </div>

          {/* Migration Results */}
          {showResults && results && (
            <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FaCheck className="text-green-600" />
                <h4 className="font-semibold text-gray-900">Migration Complete</h4>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                  <div className="text-xs text-gray-600">Found</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.updated}</div>
                  <div className="text-xs text-gray-600">Updated</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>

              {results.users && results.users.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-sm text-gray-700">Updated Users:</h5>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {results.users.map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="text-gray-700 font-mono text-xs">{user.email}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'approved' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning Notice */}
          <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
            <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>Note:</strong> This is a one-time migration. After running, all legacy B2B users will appear 
              in the approval queue. Future registrations will automatically appear without needing this tool.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
