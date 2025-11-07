import { useState } from 'react';
// Corrected context path from previous interactions
import { useAuth } from '../context/AuthContext';

const UserPanel = () => {
  const { logout } = useAuth();
  const [lightId, setLightId] = useState('');
  const [type, setType] = useState('issue');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('http://localhost:8000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'user', // This should be dynamic in a real app
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
      } else {
        const data = await response.json();
        setMessage(data.detail || 'Failed to submit request.');
        setIsError(true);
      }
    } catch (error) {
      setMessage('An error occurred.');
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
        <div className="w-full max-w-3xl bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-6 sm:p-10 relative z-10 border border-blue-800">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-pink-400 mb-2">
              Welcome, User
            </h1>
            <p className="text-xl font-bold text-pink-300 mb-4">
              Department of Street Light - Citizen Portal
            </p>
            <p className="text-blue-200 max-w-2xl mx-auto text-sm sm:text-base">
              Here you can raise issues regarding streetlights in your area (e.g., a light is not working)
              or request a light to remain on for a specific period.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="lightId" className="block text-sm font-bold text-pink-300 mb-2">
                  Light ID
                </label>
                <input
                    id="lightId"
                    type="number"
                    value={lightId}
                    onChange={(e) => setLightId(e.target.value)}
                    required
                    placeholder="Enter the ID on the light pole"
                    className="w-full px-4 py-3 rounded-md bg-blue-800 border border-blue-700 text-pink-100 placeholder-pink-300 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-bold text-pink-300 mb-2">
                  Report Type
                </label>
                <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-blue-800 border border-blue-700 text-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="issue" className="bg-blue-900 text-pink-100">Issue (e.g., Not Working)</option>
                  <option value="request" className="bg-blue-900 text-pink-100">Request (e.g., Keep On)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-bold text-pink-300 mb-2">
                  Description
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Please provide details about the issue or request..."
                    className="w-full px-4 py-3 rounded-md bg-blue-800 border border-blue-700 text-pink-100 placeholder-pink-300 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <button
                type="submit"
                className="w-full bg-pink-500 text-white font-bold py-3 px-4 rounded-lg
                       hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/30
                       transform hover:-translate-y-0.5 transition duration-300 ease-in-out"
            >
              Submit Request
            </button>

            {message && (
                <p className={`mt-4 text-center text-sm font-medium ${isError ? 'text-red-400' : 'text-green-400'}`}>
                  {message}
                </p>
            )}
          </form>

          <button
              onClick={logout}
              className="w-full bg-transparent border border-pink-500 text-pink-500 font-bold py-2 px-4 rounded-lg
                     hover:bg-pink-500 hover:text-white transition duration-300"
          >
            Logout
          </button>

        </div>
      </div>
  );
};

export default UserPanel;