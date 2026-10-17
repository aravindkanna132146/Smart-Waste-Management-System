import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar, TopBar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import BinMonitoring from './pages/BinMonitoring';
import CollectionManagement from './pages/CollectionManagement';
import Alerts from './pages/Alerts';
import MapView from './pages/MapView';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <BrowserRouter>
            <div className="flex h-screen overflow-hidden bg-gray-50">
                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <TopBar onMenuClick={() => setSidebarOpen(true)} />
                    <main className="flex-1 overflow-y-auto">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/bins" element={<BinMonitoring />} />
                            <Route path="/tasks" element={<CollectionManagement />} />
                            <Route path="/alerts" element={<Alerts />} />
                            <Route path="/map" element={<MapView />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
}
