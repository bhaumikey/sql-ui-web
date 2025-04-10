import { useState } from 'react';
import { Menu, X, Database, RefreshCw, Power, Play, AlertCircle } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = 'https://sql-ui-web-76co.vercel.app';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<{ query?: string; error?: string; columns?: string[]; rows?: Record<string, any>[] }[]>([]);
  const [schemas, setSchemas] = useState<{ name: string; schema: { column: string; type: string; key?: string }[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tables');
  const [connectionSettings, setConnectionSettings] = useState({
    host: 'sql3.freesqldatabase.com',
    user: 'sql3772356',
    password: 'dCH5ySIgYS', // replace with actual password once it's available
    database: 'sql3772356'
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleConnect = async () => {
    if (!connectionSettings.host || !connectionSettings.database || !connectionSettings.user) {
      toast.error('Please fill in all required connection fields');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/connect`, connectionSettings);
      setIsConnected(true);
      await fetchTableData();
      toast.success('Connected successfully!');
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.error || 'Failed to connect to database';
      toast.error(errorMessage);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.post(`${API_URL}/disconnect`);
      setIsConnected(false);
      setQueryResults([]);
      setSchemas([]);
      toast.success('Disconnected successfully!');
    } catch (error) {
      toast.error('Error disconnecting from database');
    }
  };

  const fetchTableData = async () => {
    try {
      const response = await axios.get(`${API_URL}/tables`);
      setSchemas(response.data);
    } catch (error) {
      toast.error('Failed to fetch table data');
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    try {
      setLoading(true);
      const queries = query.split(';').filter(q => q.trim());

      if (queries.length === 0) {
        toast.error('No valid queries found');
        return;
      }

      const response = await axios.post(`${API_URL}/execute`, { queries });
      setQueryResults(response.data);
      setActiveTab('results');
      toast.success('Query executed successfully!');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Query execution failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 overflow-y-auto">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p className="text-lg">Not connected</p>
          <p className="text-sm">Connect using the settings panel</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'tables':
        return (
          <div className="space-y-2 overflow-y-auto h-full">
            {schemas.map((table, idx) => (
              <div
                key={idx}
                className="bg-[#2a2a2a] p-3 rounded-lg hover:bg-[#3a3a3a] cursor-pointer transition-colors"
              >
                <h3 className="font-medium">{table.name}</h3>
                <p className="text-sm text-gray-400">{table.schema.length} columns</p>
              </div>
            ))}
          </div>
        );

      case 'schemas':
        return (
          <div className="space-y-4 overflow-y-auto h-full">
            {schemas.map((table, idx) => (
              <div key={idx} className="bg-[#2a2a2a] rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">{table.name}</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="px-2 py-1 text-left">Column</th>
                      <th className="px-2 py-1 text-left">Type</th>
                      <th className="px-2 py-1 text-left">Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.schema.map((col, colIdx) => (
                      <tr key={colIdx} className="hover:bg-[#3a3a3a]">
                        <td className="px-2 py-1">{col.column}</td>
                        <td className="px-2 py-1 text-green-400">{col.type}</td>
                        <td className="px-2 py-1 text-yellow-400">{col.key || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6 overflow-y-auto h-full">
            {queryResults.map((result, idx) => (
              <div key={idx} className="bg-[#2a2a2a] rounded-lg p-4">
                {result.query && (
                  <div className="text-gray-400 mb-2 font-mono text-sm">{result.query}</div>
                )}
                {result.error ? (
                  <div className="text-red-400">{result.error}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-600">
                          {result.columns?.map((col, colIdx) => (
                            <th key={colIdx} className="px-4 py-2 text-left text-gray-300 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows?.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-[#3a3a3a]">
                            {result.columns?.map((col, colIdx) => (
                              <td key={colIdx} className="px-4 py-2 whitespace-nowrap">
                                {row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 font-sans flex flex-col">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-[#1a1a1a] p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Database className="w-6 h-6" />
          DB Viewer
        </h1>
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
          aria-label="Toggle Settings"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          {/* Query Input */}
          <div className="mb-6">
            <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isConnected ? "Enter your SQL queries here (separate multiple queries with semicolons)..." : "Connect to a database to start querying..."}
                className="w-full h-32 bg-[#2a2a2a] text-gray-100 focus:outline-none resize-none font-mono p-2 rounded-lg"
                disabled={!isConnected}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={executeQuery}
                  disabled={!isConnected || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isConnected && !loading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 cursor-not-allowed text-gray-400'
                    }`}
                >
                  <Play className="w-4 h-4" />
                  Execute Query
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-[#1a1a1a] rounded-lg shadow-lg p-4 flex flex-col min-h-0">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-lg transition-colors flex-1 ${activeTab === 'tables' ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
                  }`}
              >
                Tables
              </button>
              <button
                onClick={() => setActiveTab('schemas')}
                className={`px-4 py-2 rounded-lg transition-colors flex-1 ${activeTab === 'schemas' ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
                  }`}
              >
                Schemas
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-4 py-2 rounded-lg transition-colors flex-1 ${activeTab === 'results' ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
                  }`}
              >
                Results
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {renderContent()}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 w-80 bg-[#1a1a1a] p-6 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            } shadow-2xl overflow-y-auto`}
          style={{ top: '4rem' }}
        >
          <h2 className="text-xl font-semibold mb-6">Database Connection</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Host</label>
              <input
                type="text"
                value={connectionSettings.host}
                onChange={(e) => setConnectionSettings(prev => ({ ...prev, host: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="localhost"
                disabled={isConnected}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Port</label>
              <input
                type="text"
                value={connectionSettings.port}
                onChange={(e) => setConnectionSettings(prev => ({ ...prev, port: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3306"
                disabled={isConnected}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Database</label>
              <input
                type="text"
                value={connectionSettings.database}
                onChange={(e) => setConnectionSettings(prev => ({ ...prev, database: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="mydb"
                disabled={isConnected}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={connectionSettings.user}
                onChange={(e) => setConnectionSettings(prev => ({ ...prev, user: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="root"
                disabled={isConnected}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={connectionSettings.password}
                onChange={(e) => setConnectionSettings(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                disabled={isConnected}
              />
            </div>

            <div className="pt-4 space-y-3">
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Power className="w-4 h-4" />
                  Connect
                </button>
              ) : (
                <>
                  <button
                    onClick={fetchTableData}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Tables
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Power className="w-4 h-4" />
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] p-4 text-center text-gray-400">
        <p>Designed by Bhaumik Patel</p>
      </footer>
    </div>
  );
}

export default App;