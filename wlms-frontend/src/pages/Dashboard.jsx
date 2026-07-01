import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { LayoutDashboard, AlertTriangle, Package, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await apiClient.get('/inventory/dashboard');
                setStats(response.data);
            } catch (err) {
                setError('Failed to fetch dashboard statistics.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-6 text-gray-500">Loading statistics...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Warehouse Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Package size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 uppercase font-bold">Total Items</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.total_items || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 uppercase font-bold">Low Stock Items</p>
                    <p className="text-3xl font-bold text-red-600">{stats?.low_stock_items || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 uppercase font-bold">In Transit</p>
                    <p className="text-3xl font-bold text-orange-600">{stats?.in_transit || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <LayoutDashboard size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 uppercase font-bold">Estimated Revenue</p>
                    <p className="text-3xl font-bold text-purple-600">${stats?.revenue_pending?.toLocaleString() || '0'}</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Charts</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Sales Orders</h3>
                        <div className="flex items-center justify-center">
                            <div 
                                className="w-32 h-32 rounded-full"
                                style={{
                                    background: `conic-gradient(
                                        #fbbf24 0% ${(stats?.so_pending / stats?.total_sales_orders) * 100 || 0}%,
                                        #3b82f6 ${(stats?.so_pending / stats?.total_sales_orders) * 100 || 0}% ${((stats?.so_pending + stats?.so_processing) / stats?.total_sales_orders) * 100 || 0}%,
                                        #10b981 ${((stats?.so_pending + stats?.so_processing) / stats?.total_sales_orders) * 100 || 0}% ${((stats?.so_pending + stats?.so_processing + stats?.so_packed) / stats?.total_sales_orders) * 100 || 0}%,
                                        #6b7280 ${((stats?.so_pending + stats?.so_processing + stats?.so_packed) / stats?.total_sales_orders) * 100 || 0}% 100%
                                    )`
                                }}
                            ></div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Pending</span>
                                <span className="text-sm font-medium">{stats?.so_pending || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Processing</span>
                                <span className="text-sm font-medium">{stats?.so_processing || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Packed</span>
                                <span className="text-sm font-medium">{stats?.so_packed || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Completed</span>
                                <span className="text-sm font-medium">{stats?.so_completed || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Purchase Orders</h3>
                        <div className="flex items-center justify-center">
                            <div 
                                className="w-32 h-32 rounded-full"
                                style={{
                                    background: `conic-gradient(
                                        #ef4444 0% ${(stats?.po_pending / stats?.total_purchase_orders) * 100 || 0}%,
                                        #f59e0b ${(stats?.po_pending / stats?.total_purchase_orders) * 100 || 0}% 100%
                                    )`
                                }}
                            ></div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Pending</span>
                                <span className="text-sm font-medium">{stats?.po_pending || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Partial</span>
                                <span className="text-sm font-medium">{stats?.po_partial || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
