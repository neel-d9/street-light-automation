import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = '';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        login({ username, role: data.role });
        setMessage(`Login successful! Role: ${data.role}`);
        setIsError(false);
      } else {
        setMessage(data.detail || 'Login failed');
        setIsError(true);
      }
    } catch (error) {
      setMessage('An error occurred during login.');
      setIsError(true);
      console.error('Login error:', error);
    }
  };

  return (
      <div className="flex flex-col md:flex-row min-h-screen w-full bg-blue-950">
        <div className="hidden md:block md:w-1/2 h-screen">
          <img
              src="/login_bg.jpeg"
              alt="Login Background"
              className="w-full h-full object-cover"
          />
        </div>
        <div
            className="w-full md:w-1/2 flex justify-center items-center
                   min-h-screen p-8 sm:p-12 md:p-16 relative overflow-hidden"
        >

          <div
              className="absolute top-1/4 -left-20 w-72 h-72 bg-pink-500 rounded-full
                     opacity-20 filter blur-3xl animate-pulse [animation-delay:-2s]"
          />
          <div
              className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500 rounded-full
                     opacity-15 filter blur-3xl animate-pulse [animation-delay:-4s]"
          />

          <form
              onSubmit={handleSubmit}
              className="w-full max-w-md relative z-10"
          >

            <div className="text-center">
              <h1 className="text-4xl mb-5 sm:text-5xl font-bold text-pink-300">
                Department of
              </h1>
              <h1 className="text-4xl sm:text-5xl font-bold text-pink-300 mb-2">
                Street Light
              </h1>
            </div>

            <div className="mt-16 sm:mt-20">
              <h2 className="text-3xl sm:text-4xl font-bold text-pink-400 text-center mb-2">
                Welcome Back
              </h2>

              <p className="text-pink-200 text-center text-base sm:text-lg mb-8">
                Please enter your credentials to log in.
              </p>

              <div className="mb-5">
                <label
                    htmlFor="username"
                    className="block text-pink-300 text-sm font-bold mb-2"
                >
                  Username
                </label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-1 py-2 bg-transparent
                           border-b-2 border-blue-700
                           text-pink-100 placeholder-pink-300 placeholder-opacity-60
                           focus:outline-none focus:border-pink-500 transition duration-300"
                    required
                />
              </div>

              <div className="mb-6">
                <label
                    htmlFor="password"
                    className="block text-pink-300 text-sm font-bold mb-2"
                >
                  Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-1 py-2 bg-transparent
                           border-b-2 border-blue-700
                           text-pink-100 placeholder-pink-300 placeholder-opacity-60
                           focus:outline-none focus:border-pink-500 transition duration-300"
                    required
                />
              </div>

              <button
                  type="submit"
                  className="w-full bg-pink-500 text-white font-bold py-3 px-4 rounded-lg
                         hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/30
                         transform hover:-translate-y-0.5 transition duration-300 ease-in-out"
              >
                Login
              </button>


              {message && (
                  <p className={`mt-6 text-center text-sm ${isError ? 'text-red-400' : 'text-green-400'}`}>
                    {message}
                  </p>
              )}
            </div>
          </form>
        </div>
      </div>
  );
};

export default Login;