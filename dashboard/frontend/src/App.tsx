import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import UserPanel from './components/UserPanel';
import ProviderPanel from './components/ProviderPanel';
import Header from './components/Header';
import './App.css';

function App() {
  const { role } = useAuth();

  const renderPanel = () => {
    switch (role) {
      case 'admin':
        return <AdminPanel />;
      case 'user':
        return <UserPanel />;
      case 'provider':
        return <ProviderPanel />;
      default:
        return <Login />;
    }
  };

  return (
    <div className="App">
      <Header />
      <main className="container">
        {renderPanel()}
      </main>
    </div>
  );
}

export default App;
