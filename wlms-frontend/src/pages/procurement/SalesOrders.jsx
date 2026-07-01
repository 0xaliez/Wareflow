import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Package, Plus, Trash2, Save, ArrowLeft, Eye } from 'lucide-react';

const SalesOrders = () => {
    const navigate = useNavigate();
    const [sos, setSos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [lines, setLines] = useState([{ item_id: '', ordered_quantity: 0, unit_price: 0 }]);
    const [customers, setCustomers] = useState([]);
    const [viewingSo, setViewingSo] = useState(null);

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRoles = storedUser.role ? [storedUser.role] : [];
    
    useEffect(() => {
        fetchSOs();
        fetchCustomers();
    }, []);

    const fetchSOs = async () => {
        try {
            const res = await apiClient.get('/sales-orders/');
            const grouped = res.data.reduce((acc, item) => {
                if (!acc[item.so_id]) {
                    acc[item.so_id] = {
                        so_id: item.so_id,
                        customer_name: item.customer_name,
                        customer_id: item.customer_id,
                        created_by: item.created_by,
                        so_status: item.so_status,
                        created_at: item.created_at,
                        total_amount: item.total_amount,
                        lines: []
                    };
                }
                acc[item.so_id].lines.push({
                    item_id: item.item_id,
                    item_name: item.item_name,
                    ordered_quantity: item.ordered_quantity,
                    shipped_quantity: item.shipped_quantity,
                    unit_price: item.unit_price,
                    line_total: item.line_total,
                    uom_symbol: item.uom_symbol
                });
                return acc;
            }, {});
            setSos(Object.values(grouped));
        } catch (err) {
            console.error('Failed to fetch SOs');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await apiClient.get('/customers/');
            setCustomers(res.data);
        } catch (err) {
            console.error('Failed to fetch customers');
        }
    };

    const viewSoDetails = async (soId) => {
        try {
            const res = await apiClient.get(`/sales-orders/${soId}`);
            setViewingSo({
                header: res.data[0],
                lines: res.data
            });
        } catch (err) {
            alert('Failed to fetch SO details');
        }
    };

    const addLine = () => setLines([...lines, { item_id: '', ordered_quantity: 0, unit_price: 0 }]);
    
    const removeLine = (index) => setLines(lines.filter((_, i) => i !== index));

    const updateLine = (index, field, value) => {
        const newLines = [...lines];
        newLines[index][field] = value;
        setLines(newLines);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCustomer || isNaN(parseInt(selectedCustomer))) {
            alert('Please select a valid customer');
            return;
        }
        try {
            const soRes = await apiClient.post('/sales-orders/', {
                customer_id: parseInt(selectedCustomer)
            });
            const soId = soRes.data.so_id;

            for (const line of lines) {
                await apiClient.post(`/sales-orders/${soId}/lines`, {
                    item_id: parseInt(line.item_id),
                    quantity: parseFloat(line.ordered_quantity),
                    unit_price: parseFloat(line.unit_price)
                });
            }

            alert('Sales Order created successfully!');
            setIsCreating(false);
            fetchSOs();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to create SO');
        }
    };

    const handleAdvanceStatus = async () => {
        try {
            await apiClient.patch(`/sales-orders/${viewingSo.header.so_id}/advance`);
            alert('SO status advanced!');
            fetchSOs();
            setViewingSo(null);
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to advance status');
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    if (viewingSo) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">SO Details: #{viewingSo.header.so_id}</h1>
                    <div className="flex gap-3">
                        {viewingSo.header.so_status !== 'Completed' && viewingSo.header.so_status !== 'Delivered' && 
                            !userRoles.includes('Logistics Staff') ? ( <button 
                                onClick={handleAdvanceStatus}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                            >
                                Advance Status
                            </button>
                            ) : null
                        }
                        <button onClick={() => setViewingSo(null)} className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Item</th>
                                <th className="px-6 py-4">Ordered Qty</th>
                                <th className="px-6 py-4">Shipped Qty</th>
                                <th className="px-6 py-4">Unit Price</th>
                                <th className="px-6 py-4">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {viewingSo.lines.map((line, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{line.item_name}</td>
                                    <td className="px-6 py-4">{line.ordered_quantity} {line.uom_symbol}</td>
                                    <td className="px-6 py-4">{line.shipped_quantity || 0} {line.uom_symbol}</td>
                                    <td className="px-6 py-4">${line.unit_price}</td>
                                    <td className="px-6 py-4 font-medium">${line.line_total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {!isCreating ? (
                <React.Fragment>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Sales Orders</h1>
                        {userRoles.includes('Logistics Staff') || userRoles.includes('Administrator') ? ( <button 
                            onClick={() => setIsCreating(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={18} className="mr-2" /> Create SO
                        </button>) : null
                        }
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">SO ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sos.map(so => (
                                    <tr key={so.so_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium">#{so.so_id}</td>
                                        <td className="px-6 py-4 text-gray-600">{so.customer_name || so.customer_id}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                so.so_status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                so.so_status === 'Pending' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {so.so_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">{new Date(so.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => viewSoDetails(so.so_id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Items"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </React.Fragment>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Create Sales Order</h1>
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-700">Order Items</h3>
                                <button 
                                    type="button" 
                                    onClick={addLine}
                                    className="flex items-center text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                                >
                                    <Plus size={14} className="mr-1" /> Add Item
                                </button>
                            </div>

                            {lines.map((line, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                                    <div className="col-span-5">
                                        <label className="text-xs text-gray-500 uppercase font-bold">Item ID / Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            value={line.item_id}
                                            onChange={(e) => updateLine(index, 'item_id', e.target.value)}
                                            placeholder="Item ID"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-xs text-gray-500 uppercase font-bold">Quantity</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            value={line.ordered_quantity}
                                            onChange={(e) => updateLine(index, 'ordered_quantity', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-xs text-gray-500 uppercase font-bold">Unit Price</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            value={line.unit_price}
                                            onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => removeLine(index)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button 
                                type="submit" 
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            >
                                <Save size={18} className="mr-2" /> Create Sales Order
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SalesOrders;