import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Package, 
    Truck, 
    Users, 
    ShoppingCart, 
    LogOut, 
    Menu, 
    X 
} from 'lucide-react';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRoles = storedUser.role ? [storedUser.role] : [];
    const [user, setUser] = useState(storedUser);

    useEffect(() => {
        if (!storedUser.username) navigate('/login');
    }, [navigate, storedUser.username]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = userRoles.includes('Administrator') ? [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
        { name: 'Suppliers', path: '/suppliers', icon: <Users size={20} /> },
        { name: 'Customers', path: '/customers', icon: <Users size={20} /> },
        { name: 'Purchase Orders', path: '/purchase-orders', icon: <ShoppingCart size={20} /> },
        { name: 'Sales Orders', path: '/sales-orders', icon: <Truck size={20} /> },
        { name: 'Delivery Challans', path: '/delivery-challans', icon: <Truck size={20} /> },
        { name: 'Users', path: '/users', icon: <Users size={20} /> },
    ] : [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['Warehouse Staff', 'Logistics Staff'] },
        { name: 'Inventory', path: '/inventory', icon: <Package size={20} />, roles: ['Warehouse Staff', 'Logistics Staff'] },
        { name: 'Suppliers', path: '/suppliers', icon: <Users size={20} />, roles: ['Warehouse Staff'] },
        { name: 'Customers', path: '/customers', icon: <Users size={20} />, roles: ['Logistics Staff'] },
        { name: 'Purchase Orders', path: '/purchase-orders', icon: <ShoppingCart size={20} />, roles: ['Warehouse Staff'] },
        { name: 'Sales Orders', path: '/sales-orders', icon: <Truck size={20} />, roles: ['Warehouse Staff', 'Logistics Staff'] },
        { name: 'Delivery Challans', path: '/delivery-challans', icon: <Truck size={20} />, roles: ['Logistics Staff'] },
    ].filter(item => item.roles.some(role => userRoles.includes(role)));

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-slate-900 text-white flex flex-col`}>
                <div className="p-4 flex items-center justify-between border-b border-slate-800">
                    {isSidebarOpen && <span className="font-bold text-xl truncate"><img src="./logo.png" /></span>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className="flex items-center p-3 rounded-lg hover:bg-slate-800 transition-colors group"
                        >
                            <span className="text-gray-400 group-hover:text-white transition-colors">
                                {item.icon}
                            </span>
                            {isSidebarOpen && <span className="ml-3 font-medium">{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center w-full p-3 rounded-lg hover:bg-red-600 transition-colors text-gray-400 hover:text-white"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <h2 className="text-lg font-semibold text-gray-700">Warehouse Management</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{user.username || 'User'}</p>
                            <p className="text-xs text-gray-500">{userRoles.join(', ') || 'Role'}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {(user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
