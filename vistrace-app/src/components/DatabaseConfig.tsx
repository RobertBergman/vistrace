import React, { useState } from 'react';
import { DatabaseConfig } from '../types/traceroute';
import { Database, Check, X, AlertCircle } from 'lucide-react';

interface DatabaseConfigProps {
  onConnect: (config: DatabaseConfig) => Promise<boolean>;
  onDisconnect: () => void;
  isConnected: boolean;
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigProps> = ({
  onConnect,
  onDisconnect,
  isConnected,
  onClose
}) => {
  const [config, setConfig] = useState<DatabaseConfig>({
    url: '',
    username: '',
    password: '',
    database: 'vistrace'
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setError(null);

    try {
      const success = await onConnect(config);
      if (!success) {
        setError('Failed to connect to database. Please check your credentials.');
      }
    } catch (err) {
      setError('Connection failed. Please verify your database configuration.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-network-success">
              <Check className="w-5 h-5" />
              <span>Connected to PostgreSQL database</span>
            </div>
            
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-700">
                Traceroute data is now being saved to your PostgreSQL database. 
                You can view historical data and perform advanced queries.
              </p>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Disconnect Database
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database URL
              </label>
              <input
                type="text"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="postgresql://localhost:5432"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="postgres"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database Name
              </label>
              <input
                type="text"
                value={config.database}
                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                placeholder="vistrace"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                If database connection fails, traceroute data will be stored in local memory. 
                A new database will be created if it doesn't exist.
              </p>
            </div>

            <button
              type="submit"
              disabled={isConnecting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to Database'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};