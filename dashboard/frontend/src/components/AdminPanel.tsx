import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    <div>
      <h1>Admin Panel</h1>
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Submitted By</th>
            <th>Light ID</th>
            <th>Type</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td>{issue.id}</td>
              <td>{issue.submitted_by_user}</td>
              <td>{issue.light_id}</td>
              <td>{issue.type}</td>
              <td>{issue.description}</td>
              <td>{issue.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default AdminPanel;
