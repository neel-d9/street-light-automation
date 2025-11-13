import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import UserPanel from './components/UserPanel';
import ProviderPanel from './components/ProviderPanel';
import './App.css';

function App() {
  const { user } = useAuth();

  const renderPanel = () => {
    if (!user) {
      return <Login />;
    }

    switch (user.role) {
      case 'admin':
        return <AdminPanel />;
      case 'provider':
        return <ProviderPanel />;
      default:
        return <UserPanel />;
    }
  };

  return (
    <div className="App">
      <main className="container">
        {renderPanel()}
      </main>
    </div>
  );
}

export default App;
