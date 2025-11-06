import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UserPanel = () => {
  const { logout } = useAuth();
  const [lightId, setLightId] = useState('');
  const [type, setType] = useState('issue');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setLightId('');
        setType('issue');
        setDescription('');
      } else {
        const data = await response.json();
        setMessage(data.detail || 'Failed to submit request.');
      }
    } catch (error) {
      setMessage('An error occurred.');
    }
  };

  return (
    <div>
      <h1>User Panel</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Light ID:</label>
          <input
            type="number"
            value={lightId}
            onChange={(e) => setLightId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="issue">Issue</option>
            <option value="request">Request</option>
          </select>
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default UserPanel;
