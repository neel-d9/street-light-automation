import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

interface Issue {
  id: number;
  submitted_by_user: string;
  light_id: number;
  type: string;
  description: string;
  status: string;
  override_start_time?: string;
  override_end_time?: string;
}

interface Streetlight {
  id: number;
  status: string;
}

interface TimelineEvent {
  status: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

interface TrafficInsight {
  time_bucket: string;
  traffic_level: string;
  activity_score: number;
}

const AdminPanel = () => {
  const { logout } = useAuth();

  // --- Issues & Requests State ---
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // --- Streetlights State ---
  const [streetlights, setStreetlights] = useState<Streetlight[]>([]);
  const [showAddLightModal, setShowAddLightModal] = useState(false);
  const [newLightId, setNewLightId] = useState('');
  const [newLightStatus, setNewLightStatus] = useState('OFF');

  // --- Analytics State ---
  const [chartDuration, setChartDuration] = useState('24h');
  const [chartLightId, setChartLightId] = useState<number | ''>('');
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficInsight[]>([]);

  // --- Data Fetching ---
  const fetchIssues = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/requests`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    }
  };

  const fetchStreetlights = async () => {
    try {
      const response = await fetch(`${API_URL}/api/streetlights`);
      if (response.ok) {
        const data = await response.json();
        setStreetlights(data);
        if (data.length > 0 && chartLightId === '') {
          setChartLightId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch streetlights:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!chartLightId) return;

    // 1. Fetch Timeline (Graph)
    try {
      console.log("Hello world")
      const response = await fetch(`${API_URL}/api/analytics/${chartLightId}/timeline?duration=${chartDuration}`);
      if (response.ok) {
        const data: TimelineEvent[] = await response.json();
        const formattedData: any[] = [];
        const statusMap: { [key: string]: number } = { 'OFF': 0, 'DIM': 1, 'ON': 2 };

        data.forEach(event => {
          formattedData.push({
            time: new Date(event.start_time).getTime(),
            statusLevel: statusMap[event.status],
            statusLabel: event.status,
            dateStr: new Date(event.start_time).toLocaleString()
          });
          formattedData.push({
            time: new Date(event.end_time).getTime(),
            statusLevel: statusMap[event.status],
            statusLabel: event.status,
            dateStr: new Date(event.end_time).toLocaleString()
          });
        });
        formattedData.sort((a, b) => a.time - b.time);
        setTimelineData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }

    // 2. Fetch Traffic Insights (Text/Grid)
    try {
      const response = await fetch(`${API_URL}/api/analytics/${chartLightId}/traffic?duration=${chartDuration}`);
      if (response.ok) {
        const data = await response.json();
        // Sort descending to show newest first
        setTrafficData(data.reverse());
      }
    } catch (error) {
      console.error('Failed to fetch traffic stats:', error);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchStreetlights();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [chartLightId, chartDuration]);

  // --- Handlers ---

  const handleUpdateRequest = async (id: number, status: string, startTime?: string, endTime?: string) => {
    try {
      const body: { status: string; override_start_time?: string; override_end_time?: string } = { status };
      if (startTime) body.override_start_time = new Date(startTime).toISOString();
      if (endTime) body.override_end_time = new Date(endTime).toISOString();

      const response = await fetch(`${API_URL}/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchIssues();
        if (showApproveModal) setShowApproveModal(false);
      }
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const openApproveModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowApproveModal(true);
  };

  const handleApproveSubmit = () => {
    if (selectedIssue && startTime && endTime) {
      handleUpdateRequest(selectedIssue.id, 'Approved', startTime, endTime);
    }
  };

  const handleAddLightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLightId) {
      alert('Please enter a Streetlight ID.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/streetlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(newLightId), status: newLightStatus }),
      });

      if (response.ok) {
        fetchStreetlights();
        setShowAddLightModal(false);
        setNewLightId('');
        setNewLightStatus('OFF');
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to register streetlight.');
      }
    } catch (error) {
      console.error('Error creating streetlight:', error);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const statusVal = payload[0].value;
      const statusStr = statusVal === 2 ? "ON" : statusVal === 1 ? "DIM" : "OFF";
      return (
          <div className="bg-blue-900 border border-blue-700 p-3 rounded shadow-lg z-50">
            <p className="text-pink-300 text-sm mb-1">{new Date(label).toLocaleString()}</p>
            <p className="text-cyan-300 font-bold">Status: {statusStr}</p>
          </div>
      );
    }
    return null;
  };

  return (
      <div className="min-h-screen w-full bg-blue-950 p-4 sm:p-8 md:p-12 relative overflow-hidden">

        {/* Background Decorations */}
        <div className="absolute -top-20 -left-40 w-96 h-96 bg-pink-500 rounded-full opacity-20 filter blur-3xl animate-pulse [animation-delay:-2s]" />
        <div className="absolute -bottom-20 -right-40 w-96 h-96 bg-cyan-500 rounded-full opacity-15 filter blur-3xl animate-pulse [animation-delay:-4s]" />

        <div className="w-full max-w-7xl mx-auto relative z-10 flex flex-col gap-8">

          {/* HEADER */}
          <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-6 sm:p-10 border border-blue-800">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start text-center sm:text-left">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-4xl font-extrabold text-pink-400 mb-2">Welcome, Admin</h1>
                <p className="text-2xl font-bold text-pink-300 mb-4">Department of Street Light - Control Panel</p>
                <p className="text-blue-200 max-w-2xl mx-auto sm:mx-0 text-base md:text-lg">
                  Manage citizen issues, override schedules, and maintain the streetlight infrastructure registry.
                </p>
              </div>
              <div className="w-full sm:w-auto">
                <button onClick={logout} className="w-full sm:w-auto bg-pink-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-pink-600 hover:shadow-lg transition duration-300">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 1: ISSUES TABLE */}
          <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-6 sm:p-8 border border-blue-800">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6 border-b border-blue-700 pb-2">
              Pending Issues & Requests
            </h2>
            <div className="overflow-x-auto rounded-lg border border-blue-800">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-blue-800">
                <tr>
                  <th className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">ID</th>
                  <th className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Submitted By</th>
                  <th className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Light ID</th>
                  <th className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Type</th>
                  <th className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Description</th>
                  <th className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Status</th>
                  <th className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-blue-800">
                {issues.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-blue-300">No issues or requests found.</td></tr>
                ) : (
                    issues.map((issue) => (
                        <tr key={issue.id} className="hover:bg-blue-800/50 transition-colors">
                          <td className="p-4 text-md text-pink-300">{issue.id}</td>
                          <td className="p-4 text-md text-pink-200">{issue.submitted_by_user}</td>
                          <td className="p-4 text-md font-medium text-pink-300">{issue.light_id}</td>
                          <td className="p-4">
                        <span className={`px-3 py-1 text-sm font-bold rounded-full capitalize ${issue.type === 'issue' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                          {issue.type}
                        </span>
                          </td>
                          <td className="p-4 text-md text-blue-300 max-w-sm whitespace-pre-wrap break-words">{issue.description}</td>
                          <td className="p-4">
                        <span className={`px-3 py-1 text-sm font-bold rounded-full capitalize ${
                            issue.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                issue.status === 'Seen' ? 'bg-blue-500/20 text-blue-300' :
                                    issue.status === 'Approved' ? 'bg-green-500/20 text-green-300' :
                                        'bg-red-500/20 text-red-300'
                        }`}>
                          {issue.status}
                        </span>
                          </td>
                          <td className="p-4 text-md text-blue-300">
                            {issue.status === 'pending' && (
                                <>
                                  {issue.type === 'issue' && (
                                      <button onClick={() => handleUpdateRequest(issue.id, 'Seen')} className="bg-blue-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-blue-600 transition text-xs">
                                        Mark Seen
                                      </button>
                                  )}
                                  {issue.type === 'request' && (
                                      <div className="flex gap-2">
                                        <button onClick={() => openApproveModal(issue)} className="bg-green-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-green-600 transition text-xs">
                                          Approve
                                        </button>
                                        <button onClick={() => handleUpdateRequest(issue.id, 'Rejected')} className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-red-600 transition text-xs">
                                          Reject
                                        </button>
                                      </div>
                                  )}
                                </>
                            )}
                          </td>
                        </tr>
                    ))
                )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: NETWORK STATUS */}
          <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-6 sm:p-8 border border-blue-800">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b border-blue-700 pb-2">
              <h2 className="text-2xl font-bold text-cyan-300">
                Street Light Network Status
              </h2>
              <button
                  onClick={() => setShowAddLightModal(true)}
                  className="mt-4 sm:mt-0 bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-500 hover:shadow-lg transition duration-300 flex items-center gap-2"
              >
                <span className="text-xl">+</span> Register New Light
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streetlights.length === 0 ? (
                  <p className="text-blue-300 col-span-full text-center py-8">No street lights registered in the system.</p>
              ) : (
                  streetlights.map((light) => (
                      <div key={light.id} className="bg-blue-950 border border-blue-800 rounded-lg p-5 flex justify-between items-center hover:border-pink-500/50 transition duration-300">
                        <div>
                          <h3 className="text-xl font-bold text-pink-200 mt-1">Streetlight ID: {light.id}</h3>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-blue-300 mb-1">Status</span>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                              light.status === 'ON'
                                  ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                  : light.status === 'DIM'
                                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                      : 'bg-gray-700/30 border-gray-600 text-gray-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${light.status !== 'OFF' ? 'bg-current animate-pulse' : 'bg-gray-500'}`}></div>
                            <span className="font-bold text-sm">{light.status}</span>
                          </div>
                        </div>
                      </div>
                  ))
              )}
            </div>
          </div>

          {/* SECTION 3: ANALYTICS DASHBOARD (MOVED TO BOTTOM) */}
          <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-6 sm:p-8 border border-blue-800 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-blue-700 pb-4">
              <h2 className="text-2xl font-bold text-cyan-300 mb-4 md:mb-0">
                Analytics Dashboard
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                    value={chartLightId}
                    onChange={(e) => setChartLightId(parseInt(e.target.value))}
                    className="bg-blue-950 text-pink-300 border border-blue-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                >
                  <option value="" disabled>Select Light</option>
                  {streetlights.map(light => (
                      <option key={light.id} value={light.id}>Streetlight {light.id}</option>
                  ))}
                </select>

                <select
                    value={chartDuration}
                    onChange={(e) => setChartDuration(e.target.value)}
                    className="bg-blue-950 text-pink-300 border border-blue-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                >
                  <option value="1h">Last 1 Hour</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="12h">Last 12 Hours</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>

            {/* Timeline Chart */}
            <div className="w-full h-[400px] mb-8">
              {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                      <XAxis
                          dataKey="time"
                          type="number"
                          domain={['dataMin', 'dataMax']}
                          tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          stroke="#93c5fd"
                      />
                      <YAxis
                          type="number"
                          domain={[0, 2.5]}
                          ticks={[0, 1, 2]}
                          tickFormatter={(val) => val === 2 ? '100W' : val === 1 ? '' : 'OFF'}
                          stroke="#93c5fd"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                          type="stepAfter"
                          dataKey="statusLevel"
                          stroke="#ffb6c1"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, fill: "#22d3ee" }}
                          animationDuration={500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="flex items-center justify-center h-full text-blue-300">
                    <p>No data available for the selected period.</p>
                  </div>
              )}
            </div>

            {/* Traffic Insights Grid */}
            <h3 className="text-xl font-bold text-pink-300 mb-4 border-b border-blue-800 pb-2">Traffic Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {trafficData.length > 0 ? (
                  trafficData.map((insight, idx) => (
                      <div key={idx} className="bg-blue-950 border border-blue-800 rounded p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-300 text-sm font-mono">{insight.time_bucket}</span>
                          <div className={`px-2 py-1 rounded text-xs font-bold uppercase 
                      ${insight.traffic_level.includes('High') ? 'bg-red-900 text-red-300' :
                              insight.traffic_level.includes('Low') ? 'bg-green-900 text-green-300' :
                                  'bg-gray-700 text-gray-300'}`}>
                            {insight.traffic_level}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-400">Activity Score</span>
                          <span className="text-xl font-bold text-white">{insight.activity_score}%</span>
                        </div>
                        {/* Simple progress bar for activity */}
                        <div className="w-full bg-blue-900 h-1.5 mt-2 rounded-full overflow-hidden">
                          <div
                              className={`h-full rounded-full ${insight.activity_score > 50 ? 'bg-pink-500' : 'bg-cyan-500'}`}
                              style={{ width: `${insight.activity_score}%` }}
                          ></div>
                        </div>
                      </div>
                  ))
              ) : (
                  <div className="col-span-full text-center text-blue-400 py-4">
                    No traffic insights generated for this period.
                  </div>
              )}
            </div>
          </div>

        </div>

        {/* MODALS */}
        {showApproveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-blue-900 border border-blue-700 p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-pink-400 mb-6">Approve Override Request</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-pink-300 mb-2 text-sm font-bold">Start Time</label>
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-3 rounded bg-blue-800 text-white border border-blue-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-pink-300 mb-2 text-sm font-bold">End Time</label>
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-3 rounded bg-blue-800 text-white border border-blue-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                  <button onClick={() => setShowApproveModal(false)} className="px-4 py-2 text-blue-300 font-bold hover:text-white transition">Cancel</button>
                  <button onClick={handleApproveSubmit} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 hover:shadow-lg transition">Confirm</button>
                </div>
              </div>
            </div>
        )}

        {showAddLightModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-blue-900 border border-blue-700 p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-cyan-300 mb-2">Register New Light</h2>
                <p className="text-blue-300 mb-6 text-sm">Add a new streetlight unit to the control system.</p>

                <form onSubmit={handleAddLightSubmit}>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-pink-300 mb-2 text-sm font-bold">Streetlight ID</label>
                      <input
                          type="number"
                          value={newLightId}
                          onChange={(e) => setNewLightId(e.target.value)}
                          placeholder="e.g., 1"
                          required
                          className="w-full p-3 rounded bg-blue-800 text-white border border-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-pink-300 mb-2 text-sm font-bold">Initial Status</label>
                      <select
                          value={newLightStatus}
                          onChange={(e) => setNewLightStatus(e.target.value)}
                          className="w-full p-3 rounded bg-blue-800 text-white border border-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="OFF">OFF</option>
                        <option value="DIM">DIM</option>
                        <option value="ON">ON</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end gap-4">
                    <button type="button" onClick={() => setShowAddLightModal(false)} className="px-4 py-2 text-blue-300 font-bold hover:text-white transition">Cancel</button>
                    <button type="submit" className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-500 hover:shadow-lg transition">Register Light</button>
                  </div>
                </form>
              </div>
            </div>
        )}

      </div>
  );
};

export default AdminPanel;