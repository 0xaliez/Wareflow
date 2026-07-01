import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import { ArrowLeft, CheckCircle, Package, Trash2 } from 'lucide-react';

const GRNProcess = () => {
    const { grnId } = useParams();
    const navigate = useNavigate();
    const [grnData, setGrnData] = useState(null);
    const [lines, setLines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const poId = localStorage.getItem('current_po_id');
        if (poId) {
            setGrnData({ po_id: parseInt(poId), status: 'Draft' });
            fetchPOItems(poId);
        } else {
            setError('No PO ID found');
            setLoading(false);
        }
    }, []);

    const fetchPOItems = async (poId) => {
        try {
            const poRes = await apiClient.get(`/purchase-orders/${poId}`);
            const poItems = poRes.data.map(l => ({
                ...l,
                received_quantity: l.pending_quantity || 0
            }));
            setLines(poItems);
        } catch (err) {
            setError('Failed to load PO items');
        } finally {
            setLoading(false);
        }
    };

    const removeLine = (index) => setLines(lines.filter((_, i) => i !== index));

    const updateLine = (index, field, value) => {
        setLines(lines.map((line, i) => i === index ? { ...line, [field]: value } : line));
    };

    const handleConfirm = async () => {
        const linesToAdd = lines.filter(l => parseFloat(l.received_quantity) > 0);
        if (linesToAdd.length === 0) {
            alert('No items to receive.');
            return;
        }
        if (!window.confirm('Confirming this GRN will permanently update warehouse stock. Proceed?')) return;
        try {
            for (const line of linesToAdd) {
                await apiClient.post(`/goods-receipts/${grnId}/lines`, {
                    item_id: line.item_id,
                    quantity: parseFloat(line.received_quantity)
                });
            }
            await apiClient.patch(`/goods-receipts/${grnId}/confirm`, {});
            alert('GRN Confirmed! Stock has been updated.');
            navigate('/inventory');
        } catch (err) {
            alert(err.response?.data?.msg || 'Confirmation failed.');
        }
    };

    if (loading) return <div className="p-6">Loading GRN Details...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/purchase-orders')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Goods Receipt Note #{grnId}</h1>
                </div>
                <button 
                    onClick={handleConfirm}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm"
                >
                    <CheckCircle size={18} className="mr-2" /> Confirm & Update Stock
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Related PO</p>
                    <p className="text-lg font-semibold">#{grnData?.po_id}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {grnData?.status || 'Draft'}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Received Date</p>
                    <p className="text-lg font-semibold">{grnData?.received_at ? new Date(grnData.received_at).toLocaleDateString() : 'Not set'}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Package size={18} /> Received Items
                    </h3>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Ordered Qty</th>
                            <th className="px-6 py-4">Received Qty</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {lines.length > 0 ? lines.map((line, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">{line.item_name}</td>
                                <td className="px-6 py-4">{line.ordered_quantity} {line.uom_symbol}</td>
                                <td className="px-6 py-4">
                                    <input 
                                        type="number" 
                                        className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 w-32" 
                                        value={line.received_quantity}
                                        onChange={(e) => updateLine(index, 'received_quantity', parseFloat(e.target.value))}
                                    />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => removeLine(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove Item"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-gray-400 italic">
                                    No items to receive.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GRNProcess;