import React, { useState, useEffect, useCallback } from 'react';
// import { TerminalInput } from './components/TerminalInput'; // REMOVED
// import { TerminalOutput } from './components/TerminalOutput'; // REMOVED
// import { NetworkTopology } from './components/NetworkTopology'; // REMOVED
import { TracerouteVisualization } from './components/TracerouteVisualization'; // ADDED
import { TracerouteControl } from './components/TracerouteControl'; // ADDED
import { StatusPanel } from './components/StatusPanel';
import { tracerouteService } from './services/tracerouteService';
import { TraceRoute, TracerouteOptions } from './types/traceroute';
import { Terminal, List, Map as MapIcon, Settings, Database, Info } from 'lucide-react'; // Added List, MapIcon, Settings, Database, Info. Removed Activity.

// Placeholder for TraceList component
interface TraceListProps {
  traces: TraceRoute[];
  selectedTraceId: string | null;
  onSelectTrace: (traceId: string) => void;
}
const TraceList: React.FC<TraceListProps> = ({ traces, selectedTraceId, onSelectTrace }) => (
  <div className="bg-white rounded-lg shadow-lg p-4">
    <h3 className="text-lg font-semibold text-gray-900 mb-3">Trace History</h3>
    {traces.length === 0 && <p className="text-sm text-gray-500">No traces yet.</p>}
    <ul className="space-y-2 max-h-60 overflow-y-auto">
      {traces.slice().reverse().map(trace => ( // Show newest first
        <li key={trace.id}>
          <button
            onClick={() => onSelectTrace(trace.id)}
            className={`w-full text-left p-2 rounded-md text-sm ${selectedTraceId === trace.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            <div className="font-medium">{trace.destination}</div>
            <div className="text-xs text-gray-500">
              {new Date(trace.startTime).toLocaleString()} - {trace.status}
            </div>
          </button>
        </li>
      ))}
    </ul>
  </div>
);

// Placeholder for HopDetailsList component (to show textual hop list)
interface HopDetailsListProps {
  trace: TraceRoute;
}
const HopDetailsList: React.FC<HopDetailsListProps> = ({ trace }) => {
  // This can be adapted from the old HopVisualization component logic
  return (
    <div className="space-y-2 p-4 bg-gray-50 rounded-lg max-h-[calc(100vh-250px)] overflow-y-auto">
      <h4 className="text-md font-semibold text-gray-800 mb-2">Hops for {trace.destination}</h4>
      {trace.hops.map((hop) => (
        <div key={hop.hopNumber} className="p-3 border bg-white rounded-md shadow-sm text-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono font-semibold">{hop.hopNumber}. {hop.hostname || hop.ipAddress}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${hop.averageTime < 50 ? 'bg-green-100 text-green-700' : hop.averageTime < 150 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {hop.averageTime >= 0 ? `${hop.averageTime.toFixed(1)}ms` : 'N/A'}
            </span>
          </div>
          {hop.ipAddress !== '*' && (
            <div className="text-xs text-gray-600">
              IP: {hop.ipAddress} | Loss: {hop.packetLoss.toFixed(1)}%
              {hop.location?.city && ` | ${hop.location.city}`}
            </div>
          )}
          {hop.ipAddress === '*' && <span className="text-xs text-red-500">Request timeout</span>}
        </div>
      ))}
      {trace.hops.length === 0 && <p className="text-gray-500">No hops recorded yet.</p>}
    </div>
  );
};


// Placeholder for TraceDetailView component
interface TraceDetailViewProps {
  trace: TraceRoute;
  showDetailsToggle: boolean; // from App's state, for the visualization
  onToggleDetails: () => void; // from App's state
}
const TraceDetailView: React.FC<TraceDetailViewProps> = ({ trace, showDetailsToggle, onToggleDetails }) => {
  const [activeTab, setActiveTab] = useState<'map' | 'hops'>('map');

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('map')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'map' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <MapIcon className="inline w-4 h-4 mr-1" /> Network Map
          </button>
          <button
            onClick={() => setActiveTab('hops')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'hops' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <List className="inline w-4 h-4 mr-1" /> Hop Details
          </button>
        </nav>
      </div>
      <div className="flex-grow overflow-y-auto">
        {activeTab === 'map' && trace && (
          <TracerouteVisualization trace={trace} showDetails={showDetailsToggle} onToggleDetails={onToggleDetails} />
        )}
        {activeTab === 'hops' && trace && (
          <HopDetailsList trace={trace} />
        )}
      </div>
    </div>
  );
};


function App() {
  const [currentTrace, setCurrentTrace] = useState<TraceRoute | null>(null);
  const [allTraces, setAllTraces] = useState<TraceRoute[]>([]);
  const [uptime, setUptime] = useState(0);
  const [startTime] = useState(new Date());
  const [showTraceDetails, setShowTraceDetails] = useState(true); // For the graph's internal details toggle

  // Mock settings/DB state for TracerouteControl
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);


  useEffect(() => {
    const interval = setInterval(() => {
      const traces = tracerouteService.getAllTraces();
      setAllTraces(traces);
      
      if (!currentTrace && traces.length > 0) {
        setCurrentTrace(traces[traces.length - 1]);
      } else if (currentTrace) {
        // Update currentTrace if it's still in the list (e.g., status changed)
        const updatedCurrent = traces.find(t => t.id === currentTrace.id);
        if (updatedCurrent) {
          setCurrentTrace(updatedCurrent);
        } else { // Current trace was cleared or removed
          setCurrentTrace(traces.length > 0 ? traces[traces.length - 1] : null);
        }
      }
      
      setUptime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, currentTrace]);

  const handleStartTrace = useCallback(async (destination: string, options: Partial<TracerouteOptions>) => {
    const newTrace = await tracerouteService.startTraceroute(destination, options);
    if (newTrace) {
      setCurrentTrace(newTrace); // Set the newly started trace as current
    }
  }, []);

  const handleStopTrace = useCallback((traceId: string) => {
    tracerouteService.stopTrace(traceId);
  }, []);
  
  const handleSelectTrace = (traceId: string) => {
    const selected = allTraces.find(t => t.id === traceId);
    setCurrentTrace(selected || null);
  };

  const activeTraceIds = allTraces.filter(trace => trace.status === 'running').map(t => t.id);

  const systemInfo = {
    activeTraces: activeTraceIds.length,
    totalTraces: allTraces.length,
    uptime
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-gray-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Terminal className="w-7 h-7 text-blue-400" />
              <h1 className="text-2xl font-semibold">VisTrace</h1>
            </div>
            <div className="text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-68px)]"> {/* Adjusted height for new header */}
        
        {/* Left Sidebar */}
        <div className="w-full md:w-96 bg-gray-50 p-4 space-y-4 border-r border-gray-200 overflow-y-auto">
          <TracerouteControl
            onStartTrace={handleStartTrace}
            onStopTrace={handleStopTrace} // Pass the general stop trace for specific ID
            activeTraces={activeTraceIds} // Pass IDs of active traces
            onShowSettings={() => setShowSettingsModal(true)}
            onShowDatabase={() => setShowDatabaseModal(true)}
            isDbConnected={isDbConnected}
          />
          <StatusPanel 
            trace={currentTrace} 
            systemInfo={systemInfo}
          />
          <TraceList
            traces={allTraces}
            selectedTraceId={currentTrace?.id || null}
            onSelectTrace={handleSelectTrace}
          />
        </div>

        {/* Main View Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentTrace ? (
            <TraceDetailView 
              trace={currentTrace} 
              showDetailsToggle={showTraceDetails} 
              onToggleDetails={() => setShowTraceDetails(s => !s)} 
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-10 bg-white rounded-lg shadow-md">
                <Info className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No Trace Selected</h2>
                <p className="text-gray-500">
                  Select a trace from the history or start a new one using the controls in the sidebar.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals for Settings/DB - basic placeholders */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Application Settings</h3>
            <p>Settings placeholder...</p>
            <button onClick={() => setShowSettingsModal(false)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Close</button>
          </div>
        </div>
      )}
      {showDatabaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Database Configuration</h3>
            <p>Database config placeholder...</p>
            <label className="flex items-center mt-2">
              <input type="checkbox" checked={isDbConnected} onChange={(e) => setIsDbConnected(e.target.checked)} className="mr-2"/>
              Simulate DB Connection
            </label>
            <button onClick={() => setShowDatabaseModal(false)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
