import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import SuppliersPage from './pages/master/SuppliersPage';
import CustomersPage from './pages/master/CustomersPage';
import PurchaseOrders from './pages/procurement/PurchaseOrders';
import GRNProcess from './pages/procurement/grn/GRNProcess';
import SalesOrders from './pages/procurement/SalesOrders';
import DeliveryChallans from './pages/procurement/DeliveryChallans';
import UsersPage from './pages/procurement/Users';

const PlaceholderPage = ({ title }) => (
    <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600 mt-2">This module is under development.</p>
    </div >
);

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/suppliers" element={<SuppliersPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/grn/:grnId" element={<GRNProcess />} />
                    <Route path="/sales-orders" element={<SalesOrders />} />
                    <Route path="/delivery-challans" element={<DeliveryChallans />} />
                    <Route path="/users" element={<UsersPage />} />
                </Route>

                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
