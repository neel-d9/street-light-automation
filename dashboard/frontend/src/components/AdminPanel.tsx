import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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

const AdminPanel = () => {
  const { logout } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchIssues = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/requests');
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpdateRequest = async (id: number, status: string, startTime?: string, endTime?: string) => {
    try {
      const body: { status: string; override_start_time?: string; override_end_time?: string } = { status };
      if (startTime) body.override_start_time = new Date(startTime).toISOString();
      if (endTime) body.override_end_time = new Date(endTime).toISOString();

      const response = await fetch(`http://localhost:8000/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchIssues(); // Re-fetch to show updated status
        if (showModal) setShowModal(false);
      } else {
        console.error('Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const openApproveModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setShowModal(true);
  };

  const handleApproveSubmit = () => {
    if (selectedIssue && startTime && endTime) {
      handleUpdateRequest(selectedIssue.id, 'Approved', startTime, endTime);
    }
  };
  
  return (
      <div className="min-h-screen w-full bg-blue-950 p-4 sm:p-8 md:p-12 relative overflow-hidden">

        <div
            className="absolute -top-20 -left-40 w-96 h-96 bg-pink-500 rounded-full
                   opacity-20 filter blur-3xl animate-pulse [animation-delay:-2s]"
        />
        <div
            className="absolute -bottom-20 -right-40 w-96 h-96 bg-pink-500 rounded-full
                   opacity-15 filter blur-3xl animate-pulse [animation-delay:-4s]"
        />

        <div className="w-full max-w-7xl mx-auto bg-blue-900 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-6 sm:p-10 relative z-10 border border-blue-800">

          <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-8 text-center sm:text-left">

            <div className="mb-4 sm:mb-0">
              <h1 className="text-4xl font-extrabold text-pink-400 mb-2">
                Welcome, Admin
              </h1>
              <p className="text-2xl font-bold text-pink-300 mb-4">
                Department of Street Light - Control Panel
              </p>
              <p className="text-blue-200 max-w-2xl mx-auto sm:mx-0 text-base md:text-lg">
                Here you can check new issues, monitor pending requests from users, and manage the status of all reported items.
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <button
                  onClick={logout}
                  className="w-full sm:w-auto bg-pink-500 text-white font-bold py-2 px-5 rounded-lg
                         hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/30
                         transform hover:-translate-y-0.5 transition duration-300 ease-in-out"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-blue-800">
            <table className="w-full min-w-[900px] text-left">

              <thead className="bg-blue-800">
              <tr>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">ID</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Submitted By</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Light ID</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Type</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Description</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Status</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Actions</th>
              </tr>
              </thead>

              <tbody className="divide-y divide-blue-800">
              {issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-blue-300">
                      No issues or requests found.
                    </td>
                  </tr>
              ) : (
                  issues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-blue-800/50 transition-colors">

                        <td className="p-4 text-md text-pink-300">{issue.id}</td>

                        <td className="p-4 text-md text-pink-200">{issue.submitted_by_user}</td>

                        <td className="p-4 text-md font-medium text-pink-300">{issue.light_id}</td>

                        <td className="p-4">
                      <span className={`px-3 py-1 text-sm font-bold rounded-full capitalize
                                        ${issue.type === 'issue'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-green-500/20 text-green-300'}`}>
                        {issue.type}
                      </span>
                        </td>

                        <td className="p-4 text-md text-blue-300 max-w-sm whitespace-pre-wrap break-words">
                          {issue.description}
                        </td>

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
                                <button onClick={() => handleUpdateRequest(issue.id, 'Seen')} className="bg-blue-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-blue-600 transition">
                                  Mark as Seen
                                </button>
                              )}
                              {issue.type === 'request' && (
                                <div className="flex gap-2">
                                  <button onClick={() => openApproveModal(issue)} className="bg-green-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-green-600 transition">
                                    Approve
                                  </button>
                                  <button onClick={() => handleUpdateRequest(issue.id, 'Rejected')} className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-red-600 transition">
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
        
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-blue-900 p-8 rounded-lg shadow-2xl w-full max-w-md">
              <h2 className="text-2xl font-bold text-pink-400 mb-4">Approve Override</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-pink-300 mb-2">Start Time</label>
                  <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2 rounded bg-blue-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <div>
                  <label className="block text-pink-300 mb-2">End Time</label>
                  <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2 rounded bg-blue-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button onClick={() => setShowModal(false)} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition">Cancel</button>
                <button onClick={handleApproveSubmit} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default AdminPanel;
