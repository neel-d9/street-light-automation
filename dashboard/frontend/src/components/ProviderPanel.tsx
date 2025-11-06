import { useAuth } from '../context/AuthContext';

const ProviderPanel = () => {
  const { logout } = useAuth();

  return (
    <div>
      <h1>Provider Panel</h1>
      <p>Provider Dashboard</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default ProviderPanel;
