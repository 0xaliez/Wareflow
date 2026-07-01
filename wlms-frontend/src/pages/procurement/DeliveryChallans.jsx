import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Truck, CheckCircle, Plus, Eye, ArrowLeft, Save } from 'lucide-react';

const DeliveryChallans = () => {
    const navigate = useNavigate();
    const [dcs, setDcs] = useState([]);
    const [packedSos, setPackedSos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedSo, setSelectedSo] = useState('');
    const [driverName, setDriverName] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [lines, setLines] = useState([]);
    const [viewingDc, setViewingDc] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRoles = user.role ? [user.role] : [];
    const isWarehouseStaff = userRoles.includes('Warehouse Staff');

    useEffect(() => {
        fetchDCs();
        if (isCreating) fetchPackedSOs();
    }, [isCreating]);

    const fetchDCs = async () => {
        try {
            const res = await apiClient.get('/delivery-challans/');
            const grouped = res.data.reduce((acc, item) => {
                if (!acc[item.dc_id]) {
                    acc[item.dc_id] = {
                        dc_id: item.dc_id,
                        so_id: item.so_id,
                        driver_name: item.driver_name,
                        vehicle_number: item.vehicle_number,
                        dc_status: item.dc_status,
                        created_at: item.created_at,
                        lines: []
                    };
                }
                acc[item.dc_id].lines.push({
                    item_id: item.item_id,
                    item_name: item.item_name,
                    shipped_quantity: item.shipped_quantity,
                    uom_symbol: item.uom_symbol
                });
                return acc;
            }, {});
            setDcs(Object.values(grouped));
        } catch (err) {
            console.error('Failed to fetch DCs');
        } finally {
            setLoading(false);
        }
    };

    const fetchPackedSOs = async () => {
        try {
            const res = await apiClient.get('/sales-orders/');
            const grouped = res.data.reduce((acc, item) => {
                if (!acc[item.so_id]) {
                    acc[item.so_id] = {
                        so_id: item.so_id,
                        customer_name: item.customer_name,
                        so_status: item.so_status
                    };
                }
                return acc;
            }, {});
            const uniqueSos = Object.values(grouped);
            const packed = uniqueSos.filter(so => so.so_status === 'Packed');
            setPackedSos(packed);
        } catch (err) {
            console.error('Failed to fetch Packed SOs');
        }
    };

    const fetchSoLines = async (soId) => {
        try {
            const res = await apiClient.get(`/sales-orders/${soId}`);
            const editableLines = res.data.map(line => ({
                ...line,
                shipQuantity: 0
            }));
            setLines(editableLines);
        } catch (err) {
            alert('Failed to fetch SO lines');
        }
    };

    const updateShipQuantity = (index, value) => {
        const newLines = [...lines];
        newLines[index].shipQuantity = parseFloat(value) || 0;
        setLines(newLines);
    };

    const handleSoChange = (soId) => {
        setSelectedSo(soId);
        if (soId) fetchSoLines(soId);
        else setSoLines([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSo || !driverName || !vehicleNumber) {
            alert('Please fill all fields');
            return;
        }
        try {
            const dcRes = await apiClient.post('/delivery-challans/', {
                so_id: parseInt(selectedSo),
                driver_name: driverName,
                vehicle_number: vehicleNumber
            });
            const dcId = dcRes.data.dc_id;

            // Add lines with shipQuantity > 0
            for (const line of lines) {
                if (line.shipQuantity > 0) {
                    await apiClient.post(`/delivery-challans/${dcId}/lines`, {
                        item_id: line.item_id,
                        quantity: line.shipQuantity
                    });
                }
            }

            alert('Delivery Challan created successfully!');
            setIsCreating(false);
            fetchDCs();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to create DC');
        }
    };

    const viewDcDetails = async (dcId) => {
        try {
            const res = await apiClient.get(`/delivery-challans/${dcId}`);
            setViewingDc({
                header: res.data[0],
                lines: res.data
            });
        } catch (err) {
            alert('Failed to fetch DC details');
        }
    };

    const handleDispatch = async () => {
        try {
            await apiClient.patch(`/delivery-challans/${viewingDc.header.dc_id}/dispatch`);
            alert('DC dispatched!');
            fetchDCs();
            viewDcDetails(viewingDc.header.dc_id);
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to dispatch');
        }
    };

    const handleDeliver = async () => {
        try {
            await apiClient.patch(`/delivery-challans/${viewingDc.header.dc_id}/deliver`);
            alert('DC delivered!');
            fetchDCs();
            viewDcDetails(viewingDc.header.dc_id);
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to deliver');
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    if (viewingDc) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">DC Details: #{viewingDc.header.dc_id}</h1>
                    <div className="flex gap-3">
                        {viewingDc.header.dc_status === 'Pending' && !isWarehouseStaff && (
                            <button 
                                onClick={handleDispatch}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Truck size={16} className="mr-2" /> Dispatch
                            </button>
                        )}
                        {viewingDc.header.dc_status === 'Dispatched' && !isWarehouseStaff && (
                            <button 
                                onClick={handleDeliver}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <CheckCircle size={16} className="mr-2" /> Deliver
                            </button>
                        )}
                        <button onClick={() => setViewingDc(null)} className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                </div>
                <div className="mb-4">
                    <p><strong>SO ID:</strong> #{viewingDc.header.so_id}</p>
                    <p><strong>Driver:</strong> {viewingDc.header.driver_name}</p>
                    <p><strong>Vehicle:</strong> {viewingDc.header.vehicle_number}</p>
                    <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            viewingDc.header.dc_status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            viewingDc.header.dc_status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                            {viewingDc.header.dc_status}
                        </span>
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Item</th>
                                <th className="px-6 py-4">Shipped Qty</th>
                                <th className="px-6 py-4">Unit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {viewingDc.lines.map((line, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{line.item_name}</td>
                                    <td className="px-6 py-4">{line.shipped_quantity}</td>
                                    <td className="px-6 py-4">{line.uom_symbol}</td>
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
                        <h1 className="text-2xl font-bold text-gray-800">Delivery Challans</h1>
                        {!isWarehouseStaff && (
                            <button 
                                onClick={() => setIsCreating(true)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={18} className="mr-2" /> Create DC
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">DC ID</th>
                                    <th className="px-6 py-4">SO ID</th>
                                    <th className="px-6 py-4">Driver</th>
                                    <th className="px-6 py-4">Vehicle</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {dcs.map(dc => (
                                    <tr key={dc.dc_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium">#{dc.dc_id}</td>
                                        <td className="px-6 py-4">#{dc.so_id}</td>
                                        <td className="px-6 py-4">{dc.driver_name}</td>
                                        <td className="px-6 py-4">{dc.vehicle_number}</td>
                                         <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                 dc.dc_status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                 dc.dc_status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                             }`}>
                                                 {dc.dc_status}
                                             </span>
                                         </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">{new Date(dc.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => viewDcDetails(dc.dc_id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Details"
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
                !isWarehouseStaff && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">Create Delivery Challan</h1>
                            <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
                                <ArrowLeft size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Order</label>
                                    <select 
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedSo}
                                        onChange={(e) => handleSoChange(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Packed SO</option>
                                        {packedSos.map(so => <option key={so.so_id} value={so.so_id}>SO #{so.so_id} - {so.customer_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {lines.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-700">Order Items to Ship</h3>
                                    {lines.map((line, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="col-span-4">
                                                <label className="text-xs text-gray-500 uppercase font-bold">Item</label>
                                                <p className="font-medium">{line.item_name}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs text-gray-500 uppercase font-bold">Ordered</label>
                                                <p>{line.ordered_quantity} {line.uom_symbol}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs text-gray-500 uppercase font-bold">Remaining</label>
                                                <p>{line.ordered_quantity - (line.shipped_quantity || 0)} {line.uom_symbol}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs text-gray-500 uppercase font-bold">Ship Qty</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                    value={line.shipQuantity}
                                                    onChange={(e) => updateShipQuantity(index, e.target.value)}
                                                    min="0"
                                                    max={line.ordered_quantity - (line.shipped_quantity || 0)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button 
                                    type="submit" 
                                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    <Save size={18} className="mr-2" /> Create Delivery Challan
                                </button>
                            </div>
                        </form>
                    </div>
                )
            )}
        </div>
    );
};

export default DeliveryChallans;