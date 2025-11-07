import { useEffect, useState } from 'react';
// Using the corrected path from our previous conversations
import { useAuth } from '../context/AuthContext';

// Interface remains unchanged
interface Issue {
  id: number;
  submitted_by_user: string;
  light_id: number;
  type: string;
  description: string;
  status: string;
}

const AdminPanel = () => {
  const { logout } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
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

    fetchIssues();
  }, []);

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
            <table className="w-full min-w-[700px] text-left">

              <thead className="bg-blue-800">
              <tr>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">ID</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Submitted By</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Light ID</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Type</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Description</th>
                <th scope="col" className="p-4 text-md font-bold uppercase text-pink-300 tracking-wider">Status</th>
              </tr>
              </thead>

              <tbody className="divide-y divide-blue-800">
              {issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-blue-300">
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
                      <span className={`px-3 py-1 text-sm font-bold rounded-full capitalize
                                        ${issue.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-pink-500/20 text-pink-300'}`}>
                        {issue.status}
                      </span>
                        </td>

                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};

export default AdminPanel;