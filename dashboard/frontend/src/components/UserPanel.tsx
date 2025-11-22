import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = (import.meta.env.VITE_API_URL as string) || '';

interface Issue {
  id: number;
  light_id: number;
  type: string;
  description: string;
  status: string;
}

const UserPanel = () => {
  const { user, logout } = useAuth();
  const [lightId, setLightId] = useState('');
  const [type, setType] = useState('issue');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [userRequests, setUserRequests] = useState<Issue[]>([]);

  const fetchUserRequests = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/users/${user.username}/requests`);
      if (response.ok) {
        const data = await response.json();
        setUserRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch user requests:', error);
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!user) {
      setMessage('You must be logged in to submit a request.');
      setIsError(true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          light_id: parseInt(lightId),
          type,
          description,
        }),
      });
      if (response.ok) {
        setMessage('Request submitted successfully!');
        setIsError(false);
        setLightId('');
        setType('issue');
        setDescription('');
        fetchUserRequests(); // Refresh the list of requests
      } else {
        const data = await response.json();
        setMessage(data.detail || 'Failed to submit request.');
        setIsError(true);
      }
    } catch (error) {
      setMessage('An error occurred. '+{error});
      setIsError(true);
    }
  };

  return (
      <div className="min-h-screen w-full bg-blue-950 flex justify-center items-center p-4 sm:p-8 relative overflow-hidden">
        <div
            className="absolute -top-20 -left-40 w-96 h-96 bg-pink-500 rounded-full
                   opacity-20 filter blur-3xl animate-pulse [animation-delay:-2s]"
        />
        <div
            className="absolute -bottom-20 -right-40 w-96 h-96 bg-cyan-500 rounded-full
                   opacity-15 filter blur-3xl animate-pulse [animation-delay:-4s]"
        />
        <div className="w-full max-w-4xl bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-6 sm:p-10 relative z-10 border border-blue-800">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-pink-400 mb-2">
              Welcome, {user?.username}
            </h1>
            <p className="text-xl font-bold text-pink-300 mb-4">
              Department of Street Light - Citizen Portal
            </p>
            <p className="text-blue-200 max-w-2xl mx-auto text-sm sm:text-base">
              Here you can raise issues regarding streetlights in your area or request a light to remain on.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-pink-300 mb-4">Submit a New Request</h2>
              <form onSubmit={handleSubmit} className="mb-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="lightId" className="block text-sm font-bold text-pink-300 mb-2">Light ID</label>
                    <input id="lightId" type="number" value={lightId} onChange={(e) => setLightId(e.target.value)} required placeholder="Enter the ID on the light pole" className="w-full px-4 py-2 rounded-md bg-blue-800 border border-blue-700 text-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-bold text-pink-300 mb-2">Report Type</label>
                    <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 rounded-md bg-blue-800 border border-blue-700 text-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500">
                      <option value="issue">Issue (e.g., Not Working)</option>
                      <option value="request">Request (e.g., Keep On)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-bold text-pink-300 mb-2">Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder="Please provide details..." className="w-full px-4 py-2 rounded-md bg-blue-800 border border-blue-700 text-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-6 bg-pink-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-600 transition">Submit Request</button>
                {message && <p className={`mt-4 text-center text-sm ${isError ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-pink-300 mb-4">Your Submitted Requests</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {userRequests.length > 0 ? userRequests.map(req => (
                  <div key={req.id} className="bg-blue-800/50 p-4 rounded-lg border border-blue-700">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-pink-300">Light ID: {req.light_id}</p>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full capitalize ${
                        req.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        req.status === 'Seen' ? 'bg-blue-500/20 text-blue-300' :
                        req.status === 'Approved' ? 'bg-green-500/20 text-green-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>{req.status}</span>
                    </div>
                    <p className="text-sm text-blue-300 mt-2">{req.description}</p>
                  </div>
                )) : <p className="text-blue-300 text-center py-8">You have not submitted any requests.</p>}
              </div>
            </div>
          </div>

          <button onClick={logout} className="w-full mt-8 bg-transparent border border-pink-500 text-pink-500 font-bold py-2 px-4 rounded-lg hover:bg-pink-500 hover:text-white transition">
            Logout
          </button>
        </div>
      </div>
  );
};

export default UserPanel;
