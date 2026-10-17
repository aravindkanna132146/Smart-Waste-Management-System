import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Trash2, Truck, Bell, Map, BarChart3, Settings, X, Menu, Leaf
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/bins', icon: Trash2, label: 'Bin Monitoring' },
    { to: '/tasks', icon: Truck, label: 'Collection Management' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
    { to: '/map', icon: Map, label: 'Map View' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
    return (
        <>
            {/* Overlay for mobile */}
            {open && (
                <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
            )}

            <aside
                className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-30 flex flex-col
          transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <Leaf size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-green-900 leading-tight">SmartWaste</p>
                            <p className="text-xs text-gray-400 leading-tight">Management System</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-gray-100">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <div className="space-y-0.5">
                        {navItems.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/'}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-green-50 text-green-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon size={18} className={isActive ? 'text-green-600' : 'text-gray-400'} />
                                        {label}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* SDG Footer */}
                <div className="p-4 border-t border-gray-100">
                    <div className="bg-green-50 rounded-lg p-3 text-xs text-green-700">
                        <p className="font-semibold">🌍 UN SDG Goal 11</p>
                        <p className="text-green-600 mt-0.5">Sustainable Cities & Communities</p>
                    </div>
                </div>
            </aside>
        </>
    );
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
    return (
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 sticky top-0 z-10">
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                aria-label="Open menu"
            >
                <Menu size={20} className="text-gray-600" />
            </button>
        </header>
    );
}
