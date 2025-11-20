import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

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

const ProviderPanel = () => {
    const { logout } = useAuth();

    // --- State ---
    const [streetlights, setStreetlights] = useState<Streetlight[]>([]);
    const [selectedLightId, setSelectedLightId] = useState<number | ''>('');
    const [timePeriod, setTimePeriod] = useState('24h');

    // We need two forms of data:
    // 1. rawEvents: Array of intervals for calculating power sums.
    // 2. graphData: Formatted points for drawing the step-line chart.
    const [rawEvents, setRawEvents] = useState<TimelineEvent[]>([]);
    const [graphData, setGraphData] = useState<any[]>([]);

    // --- 1. Fetch Streetlights List ---
    useEffect(() => {
        const fetchStreetlights = async () => {
            try {
                const response = await fetch(`${API_URL}/api/streetlights`);
                if (response.ok) {
                    const data = await response.json();
                    setStreetlights(data);
                    // Default to first light if available
                    if (data.length > 0) setSelectedLightId(data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch lights', error);
            }
        };
        fetchStreetlights();
    }, []);

    // --- 2. Fetch Analytics Data ---
    useEffect(() => {
        if (!selectedLightId) return;

        const fetchHistory = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/analytics/${selectedLightId}/timeline?duration=${timePeriod}`);
                if (response.ok) {
                    const data: TimelineEvent[] = await response.json();
                    setRawEvents(data); // Store raw intervals for math

                    // Format for Line Chart (Step Chart)
                    const formattedPoints: any[] = [];
                    const statusMap: { [key: string]: number } = { 'OFF': 0, 'DIM': 1, 'ON': 2 };

                    data.forEach(event => {
                        // Start point
                        formattedPoints.push({
                            time: new Date(event.start_time).getTime(),
                            statusLevel: statusMap[event.status],
                            statusLabel: event.status,
                            dateStr: new Date(event.start_time).toLocaleString()
                        });
                        // End point (creates the flat line of the step)
                        formattedPoints.push({
                            time: new Date(event.end_time).getTime(),
                            statusLevel: statusMap[event.status],
                            statusLabel: event.status,
                            dateStr: new Date(event.end_time).toLocaleString()
                        });
                    });

                    setGraphData(formattedPoints);
                }
            } catch (error) {
                console.error('Failed to fetch history', error);
            }
        };
        fetchHistory();
    }, [selectedLightId, timePeriod]);

    // --- 3. Calculate Power Stats (Memoized) ---
    const stats = useMemo(() => {
        if (!rawEvents || rawEvents.length === 0) {
            return { smartKWh: 0, standardKWh: 0, savings: 0, activeHours: 0 };
        }

        let smartWattMinutes = 0;
        let firstActiveTime: number | null = null;
        let lastActiveTime: number | null = null;

        // Iterate through raw intervals
        rawEvents.forEach(event => {
            const duration = event.duration_minutes;

            // Smart Calculation: specific wattage per status
            if (event.status === 'ON') {
                smartWattMinutes += duration * 80; // 80W for ON
            } else if (event.status === 'DIM') {
                smartWattMinutes += duration * 10; // 10W for DIM
            }

            // Determine the "Active Window" (Time between first ON/DIM and last ON/DIM)
            // This represents when the light *should* be on in a non-smart system
            if (event.status !== 'OFF') {
                const start = new Date(event.start_time).getTime();
                const end = new Date(event.end_time).getTime();

                if (firstActiveTime === null || start < firstActiveTime) firstActiveTime = start;
                if (lastActiveTime === null || end > lastActiveTime) lastActiveTime = end;
            }
        });

        // --- Standard Solution Calculation ---
        // Assumption: Without smart tech, light stays ON (80W) continuously
        // from the first moment it turned on until the last moment it turned off.
        let standardWattMinutes = 0;
        let totalActiveMinutes = 0;

        if (firstActiveTime !== null && lastActiveTime !== null) {
            // @ts-ignore
            const diffMs = lastActiveTime - firstActiveTime;
            totalActiveMinutes = diffMs / (1000 * 60); // Convert ms to minutes
            standardWattMinutes = totalActiveMinutes * 80; // 80W constant burn
        }

        // Convert Watt-Minutes to kWh
        // (Watts * Minutes) / 60 = Watt-Hours
        // Watt-Hours / 1000 = kWh
        const smartKWh = smartWattMinutes / (60 * 1000);
        const standardKWh = standardWattMinutes / (60 * 1000);

        // Calculate Savings %
        let savings = 0;
        if (standardKWh > 0) {
            savings = ((standardKWh - smartKWh) / standardKWh) * 100;
        }

        return {
            smartKWh: parseFloat(smartKWh.toFixed(3)),
            standardKWh: parseFloat(standardKWh.toFixed(3)),
            savings: Math.round(savings),
            activeHours: (totalActiveMinutes / 60).toFixed(1)
        };
    }, [rawEvents]);

    // Chart Data for Bar Chart
    const comparisonData = [
        { name: 'Smart Solution', usage: stats.smartKWh, fill: '#22d3ee' },     // Cyan
        { name: 'Standard Solution', usage: stats.standardKWh, fill: '#ec4899' } // Pink
    ];

    // Tooltip for Line Chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const statusVal = payload[0].value;
            const statusStr = statusVal === 2 ? "ON (80W)" : statusVal === 1 ? "DIM (10W)" : "OFF (0W)";
            return (
                <div className="bg-blue-900 border border-blue-700 p-3 rounded shadow-lg z-50">
                    <p className="text-pink-300 text-xs mb-1">{new Date(label).toLocaleString()}</p>
                    <p className="text-cyan-300 font-bold text-sm">{statusStr}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen w-full bg-blue-950 p-4 sm:p-8 md:p-12 relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute -top-20 -left-40 w-96 h-96 bg-purple-600 rounded-full opacity-20 filter blur-3xl animate-pulse [animation-delay:-2s]" />
            <div className="absolute -bottom-20 -right-40 w-96 h-96 bg-blue-600 rounded-full opacity-15 filter blur-3xl animate-pulse [animation-delay:-4s]" />

            <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-col gap-8">

                {/* HEADER */}
                <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-6 sm:p-10 border border-blue-800">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start text-center sm:text-left">
                        <div className="mb-4 sm:mb-0">
                            <h1 className="text-4xl font-extrabold text-cyan-400 mb-2">Provider Portal</h1>
                            <p className="text-xl font-medium text-blue-200">Energy Consumption & Efficiency Dashboard</p>
                        </div>
                        <button onClick={logout} className="bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold py-2 px-6 rounded-lg transition duration-300">
                            Logout
                        </button>
                    </div>
                </div>

                {/* CONTROLS SECTION */}
                <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-xl p-6 border border-blue-800">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-blue-300 text-sm mb-2 font-bold">Select Streetlight</label>
                            <select
                                value={selectedLightId}
                                onChange={(e) => setSelectedLightId(Number(e.target.value))}
                                className="w-full bg-blue-950 text-white border border-blue-700 rounded p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                            >
                                {streetlights.map(light => (
                                    <option key={light.id} value={light.id}>Pole ID: {light.id}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-blue-300 text-sm mb-2 font-bold">Analysis Period</label>
                            <select
                                value={timePeriod}
                                onChange={(e) => setTimePeriod(e.target.value)}
                                className="w-full bg-blue-950 text-white border border-blue-700 rounded p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                            >
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* TIMELINE CHART SECTION */}
                <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-6 sm:p-8 border border-blue-800">
                    <h2 className="text-2xl font-bold text-white mb-6 border-b border-blue-700 pb-4">
                        Activity Timeline
                    </h2>
                    <div className="w-full h-[300px]">
                        {graphData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={graphData}>
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
                                        domain={[0, 2.2]}
                                        ticks={[0, 1, 2]}
                                        tickFormatter={(val) => val === 2 ? 'ON' : val === 1 ? 'DIM' : 'OFF'}
                                        stroke="#93c5fd"
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="stepAfter"
                                        dataKey="statusLevel"
                                        stroke="#ec4899"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, fill: "#22d3ee" }}
                                        animationDuration={500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-blue-400">
                                No activity data found for this period.
                            </div>
                        )}
                    </div>
                </div>

                {/* POWER USAGE & SAVINGS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left: Stats Breakdown */}
                    <div className="space-y-6">
                        {/* Smart Stats */}
                        <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md p-6 rounded-xl border border-cyan-900/50 relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500" />
                            <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-wider mb-2">Smart System (Actual Usage)</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-black text-white">{stats.smartKWh}</span>
                                <span className="text-xl text-cyan-200 mb-1">kWh</span>
                            </div>
                            <p className="text-blue-300 text-sm mt-3">
                                Calculated dynamically: <span className="text-white">10W</span> (Dim) + <span className="text-white">80W</span> (Active).
                            </p>
                        </div>

                        {/* Standard Stats */}
                        <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md p-6 rounded-xl border border-pink-900/50 relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 left-0 w-2 h-full bg-pink-500" />
                            <h4 className="text-pink-400 font-bold text-sm uppercase tracking-wider mb-2">Legacy System (Projected)</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-black text-white">{stats.standardKWh}</span>
                                <span className="text-xl text-pink-200 mb-1">kWh</span>
                            </div>
                            <p className="text-blue-300 text-sm mt-3">
                                Based on continuous <span className="text-white">80W</span> burn during the {stats.activeHours} hour active window.
                            </p>
                        </div>
                    </div>

                    {/* Right: Comparison Chart & Savings */}
                    <div className="bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-xl border border-blue-800 p-6 flex flex-col justify-between shadow-lg">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-1">Efficiency Comparison</h3>
                            <p className="text-blue-300 text-sm">Total Active Window: {stats.activeHours} Hours</p>
                        </div>

                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#93c5fd" hide />
                                    <YAxis type="category" dataKey="name" stroke="#93c5fd" width={100} tick={{fontSize: 12}} />
                                    <Tooltip
                                        cursor={{fill: '#1e3a8a', opacity: 0.4}}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e3a8a', color: '#fff' }}
                                    />
                                    <Bar dataKey="usage" barSize={30} radius={[0, 5, 5, 0]}>
                                        {comparisonData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4 bg-green-900/30 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
                            <span className="text-green-400 font-bold uppercase tracking-wide">Total Energy Saved</span>
                            <span className="text-3xl font-black text-green-300">{stats.savings}%</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProviderPanel;