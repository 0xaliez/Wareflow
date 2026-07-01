import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Users, Plus, Trash2, Edit, Eye } from 'lucide-react';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ username: '', password: '', role: '' });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get('/users/');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/users/', formData);
            alert('User created successfully!');
            setIsCreating(false);
            setFormData({ username: '', password: '', role: '' });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to create user');
        }
    };

    const handleDeactivate = async (userId) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await apiClient.patch(`/users/${userId}/deactivate`);
            alert('User deactivated!');
            fetchUsers();
        } catch (err) {
            alert('Failed to deactivate user');
        }
    };

    const handleChangePassword = async (userId) => {
        if (!newPassword) {
            alert('Enter new password');
            return;
        }
        try {
            await apiClient.patch(`/users/${userId}/change-password`, { password: newPassword });
            alert('Password updated!');
            setSelectedUser(null);
            setNewPassword('');
        } catch (err) {
            alert('Failed to change password');
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            {!isCreating && !selectedUser ? (
                <React.Fragment>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={18} className="mr-2" /> Create User
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Username</th>
                                    <th className="px-6 py-4">Roles</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created At</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map(user => (
                                    <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{user.username}</td>
                                        <td className="px-6 py-4">{user.roles?.join(', ') || 'None'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            <button 
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Change Password"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            {user.is_active && (
                                                <button 
                                                    onClick={() => handleDeactivate(user.user_id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Deactivate"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </React.Fragment>
            ) : selectedUser ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-md mx-auto">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Change Password for {selectedUser.username}</h2>
                    <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(selectedUser.user_id); }}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input 
                                type="password" 
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button 
                                type="button" 
                                onClick={() => { setSelectedUser(null); setNewPassword(''); }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Create User</h1>
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select 
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                required
                            >
                                <option value="">Select Role</option>
                                <option value="Administrator">Administrator</option>
                                <option value="Warehouse Staff">Warehouse Staff</option>
                                <option value="Logistics Staff">Logistics Staff</option>
                            </select>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            >
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UsersPage;