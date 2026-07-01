import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Package, Plus, Trash2, Save, ArrowLeft, Eye, Truck } from 'lucide-react';

const PurchaseOrders = () => {
    const navigate = useNavigate();
    const [pos, setPos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [lines, setLines] = useState([{ item_id: '', ordered_quantity: 0, unit_cost: 0 }]);
    const [suppliers, setSuppliers] = useState([]);
    const [viewingPo, setViewingPo] = useState(null);
    const [isReceiving, setIsReceiving] = useState(false);
    const [receivedQuantities, setReceivedQuantities] = useState({});

    useEffect(() => {
        fetchPOs();
        fetchSuppliers();
    }, []);

    const fetchPOs = async () => {
        try {
            const res = await apiClient.get('/purchase-orders/');
            const grouped = res.data.reduce((acc, item) => {
                if (!acc[item.po_id]) {
                    acc[item.po_id] = {
                        po_id: item.po_id,
                        supplier_name: item.supplier_name,
                        supplier_id: item.supplier_id,
                        created_by: item.created_by,
                        po_status: item.po_status,
                        created_at: item.created_at,
                        lines: []
                    };
                }
                acc[item.po_id].lines.push({
                    item_id: item.item_id,
                    item_name: item.item_name,
                    ordered_quantity: item.ordered_quantity,
                    received_quantity: item.received_quantity,
                    pending_quantity: item.pending_quantity,
                    unit_cost: item.unit_cost,
                    line_total: item.line_total,
                    uom_symbol: item.uom_symbol
                });
                return acc;
            }, {});
            setPos(Object.values(grouped));
        } catch (err) {
            console.error('Failed to fetch POs');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await apiClient.get('/suppliers/');
            setSuppliers(res.data);
        } catch (err) {
            console.error('Failed to fetch suppliers');
        }
    };

    const viewPoDetails = async (poId) => {
        try {
            const res = await apiClient.get(`/purchase-orders/${poId}`);
            const poLines = res.data;
            setViewingPo({
                header: poLines[0],
                lines: poLines
            });
            // Initialize received quantities to pending
            const initialQuantities = {};
            poLines.forEach(line => {
                initialQuantities[line.item_id] = line.pending_quantity;
            });
            setReceivedQuantities(initialQuantities);
        } catch (err) {
            alert('Failed to fetch PO details');
        }
    };

    const addLine = () => setLines([...lines, { item_id: '', ordered_quantity: 0, unit_cost: 0 }]);
    
    const removeLine = (index) => {
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const updateLine = (index, field, value) => {
        const newLines = [...lines];
        newLines[index][field] = value;
        setLines(newLines);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const poRes = await apiClient.post('/purchase-orders/', {
                supplier_id: parseInt(selectedSupplier),
                created_by: 1 
            });
            const poId = poRes.data.po_id;

            for (const line of lines) {
                await apiClient.post(`/purchase-orders/${poId}/lines`, {
                    item_id: parseInt(line.item_id),
                    quantity: parseFloat(line.ordered_quantity),
                    unit_cost: parseFloat(line.unit_cost)
                });
            }

            alert('Purchase Order created successfully!');
            setIsCreating(false);
            fetchPOs();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to create PO');
        }
    };

    const handleReceiveGoods = async (poId) => {
        try {
            const grnRes = await apiClient.post('/goods-receipts/', { po_id: poId });
            const grnId = grnRes.data.grn_id;
            localStorage.setItem('current_po_id', poId.toString());
            alert('Goods received successfully!');
            navigate(`/grn/${grnId}`);
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to receive goods');
        }
    };

    const updateReceivedQuantity = (itemId, quantity) => {
        setReceivedQuantities(prev => ({
            ...prev,
            [itemId]: quantity
        }));
    };

    if (viewingPo) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">PO Details: #{viewingPo.header.po_id}</h1>
                    <div className="flex gap-3">
                        {viewingPo.header.po_status !== 'Completed' && (
                            <button 
                                onClick={() => handleReceiveGoods(viewingPo.header.po_id)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                            >
                                <Truck size={18} className="mr-2" /> Receive Goods
                            </button>
                        )}
                        <button onClick={() => setViewingPo(null)} className="flex items-center text-blue-600 hover:underline">
                            <ArrowLeft size={18} className="mr-1" /> Back to List
                        </button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Item</th>
                                <th className="px-6 py-4">Ordered Qty</th>
                                <th className="px-6 py-4">Received Qty</th>
                                <th className="px-6 py-4">Pending Qty</th>
                                <th className="px-6 py-4">Unit Cost</th>
                                <th className="px-6 py-4">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {viewingPo.lines.map((line, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{line.item_name}</td>
                                    <td className="px-6 py-4">{line.ordered_quantity} {line.uom_symbol}</td>
                                    <td className="px-6 py-4">{line.received_quantity} {line.uom_symbol}</td>
                                    <td className="px-6 py-4">{line.pending_quantity} {line.uom_symbol}</td>
                                    <td className="px-6 py-4">${line.unit_cost}</td>
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
                        <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={18} className="mr-2" /> Create PO
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">PO ID</th>
                                    <th className="px-6 py-4">Supplier</th>
                                    <th className="px-6 py-4">Created By</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {pos.map(po => (
                                    <tr key={po.po_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium">#{po.po_id}</td>
                                        <td className="px-6 py-4 text-gray-600">{po.supplier_name || po.supplier_id}</td>
                                        <td className="px-6 py-4 text-gray-600">{po.created_by}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                po.po_status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                po.po_status === 'Pending' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {po.po_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">{new Date(po.created_at).toLocaleDateString()}</td>
                                         <td className="px-6 py-4 text-center">
                                             <button 
                                                 onClick={() => viewPoDetails(po.po_id)}
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
                        <h1 className="text-2xl font-bold text-gray-800">Create Purchase Order</h1>
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                    required
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
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
                                        <label className="text-xs text-gray-500 uppercase font-bold">Unit Cost</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            value={line.unit_cost}
                                            onChange={(e) => updateLine(index, 'unit_cost', parseFloat(e.target.value))}
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
                                <Save size={18} className="mr-2" /> Create Purchase Order
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrders;
