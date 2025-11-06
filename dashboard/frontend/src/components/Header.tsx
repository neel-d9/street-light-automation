import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { role, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header-title">Street Light Automation</div>
      {role && (
        <div className="header-user-info">
          <span>Welcome, {role}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      )}
    </header>
  );
};

export default Header;
