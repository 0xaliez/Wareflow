import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Package, Plus, Edit } from 'lucide-react';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [uom, setUom] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({
        item_name: '',
        uom_id: '',
        description: '',
        reorder_level: 0
    });

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRoles = storedUser.role ? [storedUser.role] : [];
    const canManage = userRoles.includes('Administrator') || userRoles.includes('Warehouse Staff');

    useEffect(() => {
        fetchItems();
        fetchUOM();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await apiClient.get('/items/');
            setItems(res.data);
        } catch (err) {
            console.error('Failed to fetch items:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUOM = async () => {
        try {
            const res = await apiClient.get('/items/uom/');
            setUom(res.data);
        } catch (err) {
            console.error('Failed to fetch UOM:', err);
            // Fallback hardcoded UOM
            setUom([
                { uom_id: 1, uom_symbol: 'KG' },
                { uom_id: 2, uom_symbol: 'PCS' },
                { uom_id: 3, uom_symbol: 'LTR' },
                { uom_id: 4, uom_symbol: 'M' },
                { uom_id: 5, uom_symbol: 'BOX' }
            ]);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/items/', formData);
            setIsCreating(false);
            setFormData({ item_name: '', uom_id: '', description: '', reorder_level: 0 });
            fetchItems();
        } catch (err) {
            console.error('Failed to create item:', err);
            alert('Failed to create item');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put(`/items/${currentItem.item_id}/`, formData);
            setIsUpdating(false);
            setCurrentItem(null);
            setFormData({ item_name: '', uom_id: '', description: '', reorder_level: 0 });
            fetchItems();
        } catch (err) {
            console.error('Failed to update item:', err);
            alert('Failed to update item');
        }
    };

    const startUpdate = (item) => {
        setCurrentItem(item);
        setFormData({
            item_name: item.item_name,
            uom_id: item.uom_id,
            description: item.description || '',
            reorder_level: item.reorder_level || 0
        });
        setIsUpdating(true);
    };

    const cancelForm = () => {
        setIsCreating(false);
        setIsUpdating(false);
        setCurrentItem(null);
        setFormData({ item_name: '', uom_id: '', description: '', reorder_level: 0 });
    };

    if (loading) return <div className="p-6">Loading inventory...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                {canManage && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={18} className="mr-2" /> Create Item
                    </button>
                )}
            </div>

            {(isCreating || isUpdating) && canManage && (
                <form onSubmit={isCreating ? handleCreate : handleUpdate} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">{isCreating ? 'Create New Item' : 'Update Item'}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            type="text" 
                            placeholder="Item Name" 
                            value={formData.item_name} 
                            onChange={(e) => setFormData({...formData, item_name: e.target.value})} 
                            required 
                            className="p-2 border rounded"
                        />
                        <select 
                            value={formData.uom_id} 
                            onChange={(e) => setFormData({...formData, uom_id: parseInt(e.target.value)})} 
                            required 
                            className="p-2 border rounded"
                        >
                            <option value="">Select UOM</option>
                            {uom.map(u => <option key={u.uom_id} value={u.uom_id}>{u.uom_symbol}</option>)}
                        </select>
                        <input 
                            type="text" 
                            placeholder="Description" 
                            value={formData.description} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})} 
                            className="p-2 border rounded"
                        />
                        <input 
                            type="number" 
                            placeholder="Reorder Level" 
                            value={formData.reorder_level} 
                            onChange={(e) => setFormData({...formData, reorder_level: parseInt(e.target.value)})} 
                            className="p-2 border rounded"
                        />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                            {isCreating ? 'Create' : 'Update'}
                        </button>
                        <button type="button" onClick={cancelForm} className="px-4 py-2 bg-gray-600 text-white rounded">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Available Qty</th>
                            <th className="px-6 py-4">Reserved Qty</th>
                            <th className="px-6 py-4">UOM</th>
                            <th className="px-6 py-4">Status</th>
                            {canManage && <th className="px-6 py-4 text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.map(item => {
                            const availableQty = item.available_quantity;
                            const reservedQty = item.reserved_quantity;
                            const status = item.available_quantity >= item.reorder_level ? 'Healthy' : 'Low Stock';
                            return (
                                <tr key={item.item_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{item.item_id}</td>
                                    <td className="px-6 py-4">{item.item_name}</td>
                                    <td className="px-6 py-4">{availableQty}</td>
                                    <td className="px-6 py-4">{reservedQty}</td>
                                    <td className="px-6 py-4">{item.uom_symbol}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            status === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {status}
                                        </span>
                                    </td>
                                    {canManage && (
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => startUpdate(item)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;