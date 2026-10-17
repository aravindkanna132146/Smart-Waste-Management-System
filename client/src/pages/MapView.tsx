import React, { useEffect, useState, useRef } from 'react';
import { Map as MapIcon, AlertCircle } from 'lucide-react';
import { getBins } from '../services/api';
import { Bin } from '../types';
import { Spinner, StatusBadge, FillBar } from '../components/ui';
import { ToastContainer, useToast } from '../components/Toast';

type LeafletLib = typeof import('leaflet');

function getBinColor(status: Bin['status']) {
    if (status === 'Full') return '#ef4444';
    if (status === 'Nearly Full') return '#f59e0b';
    return '#22c55e';
}

export default function MapView() {
    const [bins, setBins] = useState<Bin[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapError, setMapError] = useState(false);
    const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        getBins()
            .then((res) => setBins(res.data.data))
            .catch((e) => addToast(e.message, 'error'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (loading || !mapRef.current || mapInstanceRef.current) return;
        const mappedBins = bins.filter((b) => b.latitude && b.longitude);
        if (mappedBins.length === 0) return;

        import('leaflet').then((L: LeafletLib) => {
            try {
                const map = L.map(mapRef.current!, {
                    center: [13.0827, 80.2707],
                    zoom: 15,
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19,
                }).addTo(map);

                mappedBins.forEach((bin) => {
                    const color = getBinColor(bin.status);
                    const icon = L.divIcon({
                        html: `<div style="
              width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
              background: ${color}; border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              transform: rotate(-45deg);
              display: flex; align-items: center; justify-content: center;
            "></div>`,
                        className: '',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                    });

                    L.marker([bin.latitude!, bin.longitude!], { icon })
                        .addTo(map)
                        .bindPopup(`
              <div style="font-family: Inter, sans-serif; min-width: 160px;">
                <strong>${bin.binId}</strong><br/>
                <span style="color: #6b7280; font-size: 12px;">${bin.location}</span><br/>
                <div style="margin-top: 6px;">
                  <span style="font-size: 12px;">Fill: <b>${bin.fillPercentage}%</b></span><br/>
                  <span style="font-size: 12px;">Status: <b style="color: ${color}">${bin.status}</b></span>
                </div>
              </div>
            `);
                });

                const group = L.featureGroup(mappedBins.map((b) => L.marker([b.latitude!, b.longitude!])));
                map.fitBounds(group.getBounds().pad(0.1));

                mapInstanceRef.current = map;
            } catch (e) {
                console.error('Map error:', e);
                setMapError(true);
            }
        }).catch(() => setMapError(true));

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [bins, loading]);

    const mappedBins = bins.filter((b) => b.latitude && b.longitude);
    const unmappedBins = bins.filter((b) => !b.latitude || !b.longitude);

    return (
        <div className="p-6 space-y-5">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div>
                <h1 className="text-2xl font-bold text-green-900">Map View</h1>
                <p className="text-sm text-gray-500 mt-0.5">{mappedBins.length} bins with coordinates</p>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-sm">
                {[
                    { color: '#22c55e', label: 'Normal' },
                    { color: '#f59e0b', label: 'Nearly Full' },
                    { color: '#ef4444', label: 'Full' },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                        <span>{label}</span>
                    </div>
                ))}
            </div>

            {/* Map */}
            <div className="card p-0 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-[480px]"><Spinner size={32} /></div>
                ) : mapError ? (
                    <div className="flex flex-col items-center justify-center h-[480px] text-gray-500">
                        <AlertCircle size={40} className="mb-3 text-red-400" />
                        <p className="font-semibold">Map could not be loaded</p>
                        <p className="text-sm mt-1">Check your internet connection. All other features remain functional.</p>
                    </div>
                ) : mappedBins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[480px] text-gray-400">
                        <MapIcon size={48} className="mb-3" />
                        <p className="font-semibold">No bins with coordinates</p>
                        <p className="text-sm mt-1">Add latitude/longitude when creating or editing bins.</p>
                    </div>
                ) : (
                    <div ref={mapRef} style={{ height: '480px', width: '100%' }} />
                )}
            </div>

            {/* Bins list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Mapped */}
                <div className="card">
                    <h2 className="text-base font-semibold text-gray-900 mb-3">Mapped Bins ({mappedBins.length})</h2>
                    {mappedBins.length === 0 ? (
                        <p className="text-sm text-gray-400">No mapped bins</p>
                    ) : (
                        <div className="space-y-2">
                            {mappedBins.map((bin) => (
                                <div key={bin.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: getBinColor(bin.status) }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{bin.binId} – {bin.location}</p>
                                        <FillBar percentage={bin.fillPercentage} size="sm" />
                                    </div>
                                    <StatusBadge status={bin.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Unmapped */}
                <div className="card">
                    <h2 className="text-base font-semibold text-gray-900 mb-3">Unmapped Bins ({unmappedBins.length})</h2>
                    {unmappedBins.length === 0 ? (
                        <p className="text-sm text-green-600">All bins have coordinates ✓</p>
                    ) : (
                        <div className="space-y-2">
                            {unmappedBins.map((bin) => (
                                <div key={bin.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                    <div className="w-3 h-3 rounded-full shrink-0 bg-gray-300" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{bin.binId} – {bin.location}</p>
                                        <p className="text-xs text-gray-400">No coordinates set</p>
                                    </div>
                                    <StatusBadge status={bin.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
