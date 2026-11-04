'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Layers,
  Activity,
  X,
  PlusCircle,
  Compass
} from 'lucide-react';
import { Complaint, LocationHotspot } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import Campus3DViewer from '@/components/campus/Campus3DViewer';

interface BuildingGroup {
  buildingName: string;
  code: string;
  totalLocations: number;
  rooms: string[];
  activeIssues: number;
  criticalIssues: number;
  complaints: Complaint[];
}

export default function CampusMapPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [hotspots, setHotspots] = useState<LocationHotspot[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/master-data').then((r) => r.json()),
      fetch('/api/complaints').then((r) => r.json()),
      fetch('/api/analytics').then((r) => r.json()),
    ])
      .then(([mData, cData, aData]) => {
        if (mData.locations) setLocations(mData.locations);
        if (cData.complaints) setComplaints(cData.complaints);
        if (aData.locationHotspots) setHotspots(aData.locationHotspots);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Aggregate by building
  const buildingGroups: BuildingGroup[] = React.useMemo(() => {
    const map = new Map<string, BuildingGroup>();

    locations.forEach((loc) => {
      if (!map.has(loc.building)) {
        let code = 'BLD';
        if (loc.building.includes('Tech')) code = 'TP';
        else if (loc.building.includes('Academic')) code = 'ABA';
        else if (loc.building.includes('Library')) code = 'LIB';
        else if (loc.building.includes('Boys')) code = 'BH1';
        else if (loc.building.includes('Girls')) code = 'GH2';

        map.set(loc.building, {
          buildingName: loc.building,
          code,
          totalLocations: 0,
          rooms: [],
          activeIssues: 0,
          criticalIssues: 0,
          complaints: [],
        });
      }

      const group = map.get(loc.building)!;
      group.totalLocations++;
      const roomDesc = `${loc.floor} — ${loc.room}`;
      if (!group.rooms.includes(roomDesc)) group.rooms.push(roomDesc);
    });

    complaints.forEach((c) => {
      const group = map.get(c.building);
      if (group) {
        group.complaints.push(c);
        if (c.status !== 'RESOLVED' && c.status !== 'CLOSED') {
          group.activeIssues++;
          if (c.priority === 'CRITICAL' || c.status === 'ESCALATED') {
            group.criticalIssues++;
          }
        }
      }
    });

    return Array.from(map.values());
  }, [locations, complaints]);

  const handleSelectFrom3D = (buildingName: string) => {
    const group = buildingGroups.find((b) => b.buildingName === buildingName);
    if (group) setSelectedBuilding(group);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="saas-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Interactive 3D Digital Twin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-brand-400" />
            <span>Campus Infrastructure Map</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real 3D campus visualization mapped directly to PostgreSQL <code className="text-brand-300 font-mono">location</code> and <code className="text-brand-300 font-mono">vw_location_hotspots</code>.
          </p>
        </div>

        <Link href="/dashboard/student">
          <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
            Report Issue on Map
          </Button>
        </Link>
      </div>

      {/* Real 3D Campus Digital Twin Environment */}
      <div className="space-y-2">
        <Campus3DViewer
          locations={locations}
          complaints={complaints}
          hotspots={hotspots}
          onSelectBuilding={handleSelectFrom3D}
          selectedBuildingName={selectedBuilding?.buildingName}
        />
      </div>

      {/* Building Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-400" />
            <span>Campus Facilities Directory</span>
          </h2>
          <span className="text-xs text-slate-400">Click any card or 3D building to inspect live work orders</span>
        </div>

        {loading ? (
          <div className="saas-card p-8">
            <LoadingSkeleton lines={4} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildingGroups.map((bld) => {
              const hasCritical = bld.criticalIssues > 0;
              const hasActive = bld.activeIssues > 0;

              return (
                <div
                  key={bld.buildingName}
                  onClick={() => setSelectedBuilding(bld)}
                  className={`saas-card saas-card-interactive p-6 flex flex-col justify-between space-y-6 ${
                    selectedBuilding?.buildingName === bld.buildingName ? 'border-brand-500 shadow-glow-primary' : ''
                  }`}
                >
                  {/* Top Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                          {bld.code}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">
                          {bld.buildingName}
                        </h3>
                      </div>
                    </div>

                    {/* Status Beacon */}
                    <div>
                      {hasCritical ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" /> Critical
                        </span>
                      ) : hasActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {bld.activeIssues} Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Clear
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Monitored Rooms */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Monitored Zones & Rooms
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {bld.rooms.slice(0, 3).map((r, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-white/5 text-slate-300 px-2.5 py-0.5 rounded-md border border-white/5"
                        >
                          {r}
                        </span>
                      ))}
                      {bld.rooms.length > 3 && (
                        <span className="text-[11px] text-slate-500 self-center">
                          +{bld.rooms.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                    <div className="text-slate-400">
                      Total Tickets: <strong className="text-white">{bld.complaints.length}</strong>
                    </div>
                    <div className="flex items-center gap-1 text-brand-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Inspect Facility</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Building Detail Modal */}
      <AnimatePresence>
        {selectedBuilding && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="saas-card max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto border border-white/10 shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center border border-brand-500/25">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedBuilding.buildingName}</h2>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedBuilding.totalLocations} Monitored Rooms · {selectedBuilding.activeIssues} Active Work Orders
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBuilding(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Facility Zones */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Facility Zones
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedBuilding.rooms.map((r, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-400" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Associated Complaints */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Facility Tickets ({selectedBuilding.complaints.length})
                </h4>
                {selectedBuilding.complaints.length === 0 ? (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-slate-400">
                    No complaints registered for this building.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedBuilding.complaints.map((c) => (
                      <div
                        key={c.complaint_id}
                        className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-white flex items-center gap-2">
                            <span className="font-mono text-slate-400">#{c.complaint_id}</span>
                            <span>{c.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {c.room} · {c.category_name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={c.status} />
                          <Link href={`/complaints/${c.complaint_id}`}>
                            <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3 h-3" />}>
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBuilding(null)}
                >
                  Close
                </Button>
                <Link href="/dashboard/student">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<PlusCircle className="w-4 h-4" />}
                  >
                    Report Issue Here
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
