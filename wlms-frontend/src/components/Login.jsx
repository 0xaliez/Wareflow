import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await apiClient.post('/auth/login', { username, password });
            const { access_token, role, username: userUsername } = response.data;

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify({ username: userUsername, role }));

            alert('Login Successful!');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid username or password');
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900">
                {/* decorative arcs */}
                <svg
                    className="absolute right-0 top-0 h-full w-2/3 opacity-30"
                    viewBox="0 0 400 800"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M420 -40 C 250 100, 250 300, 420 460" stroke="white" strokeWidth="1" fill="none" />
                    <path d="M420 -100 C 220 80, 220 340, 420 520" stroke="white" strokeWidth="1" fill="none" />
                    <path d="M420 -160 C 190 60, 190 380, 420 580" stroke="white" strokeWidth="1" fill="none" />
                    <path d="M420 -220 C 160 40, 160 420, 420 640" stroke="white" strokeWidth="1" fill="none" />
                </svg>

                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <img src="./logo.png" alt="Logo" className="h-[350px]" />
                        
                    </div>
                    <p className="text-indigo-200 text-sm text-left">
                        © {new Date().getFullYear()} All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-sm">

                    <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">Welcome Back!</h2>
                    <p className="text-sm text-gray-500 mb-8">
                        Sign in to manage your dashboard, stay on top of your work, and keep everything running smoothly.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div
                        className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-md text-sm text-indigo-700 cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => { setUsername('admin'); setPassword('pass'); }}
                    >
                        <span className="font-semibold">Demo Account</span> — click to autofill
                        <span className="ml-2 text-indigo-400">admin / pass</span>
                    </div>


                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <User size={18} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    className="w-full pl-10 pr-4 py-2.5 border-b border-gray-300 focus:border-gray-900 outline-none transition-colors"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="w-full pl-10 pr-4 py-2.5 border-b border-gray-300 focus:border-gray-900 outline-none transition-colors"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-md transition duration-200"
                        >
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;   