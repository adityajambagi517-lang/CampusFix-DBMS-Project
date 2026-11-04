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
  PlusCircle
} from 'lucide-react';
import { Complaint, LocationHotspot } from '@/types';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { TiltCard3D } from '@/components/ui/TiltCard3D';
import { GlowButton } from '@/components/ui/GlowButton';

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

  return (
    <div className="relative min-h-[calc(100vh-6rem)] space-y-8 py-6 pb-20">
      <AmbientGlow variant="multi" />

      {/* Header */}
      <div className="relative z-10 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Interactive Campus Facilities Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-sky-400" />
            <span>Campus Infrastructure Map</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time status beacons mapped directly to PostgreSQL <code className="text-sky-300 font-mono">location</code> and <code className="text-sky-300 font-mono">vw_location_hotspots</code>.
          </p>
        </div>

        <Link href="/dashboard/student">
          <GlowButton variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
            Report Issue on Map
          </GlowButton>
        </Link>
      </div>

      {/* Status Legend Strip */}
      <div className="relative z-10 flex flex-wrap items-center gap-4 text-xs text-slate-400 glass-panel p-3.5 rounded-2xl border border-white/10">
        <span className="font-semibold text-white">Facility Status Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
          <span>Operational (0 active issues)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Active Maintenance Orders</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>Critical Safety / Escalated</span>
        </div>
      </div>

      {/* 3D Interactive Building Cards */}
      {loading ? (
        <div className="relative z-10 glass-panel rounded-3xl p-14 text-center text-slate-400">
          Loading campus infrastructure spatial data...
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildingGroups.map((bld) => {
            const hasCritical = bld.criticalIssues > 0;
            const hasActive = bld.activeIssues > 0;
            const statusColor = hasCritical
              ? 'rgba(244, 63, 94, 0.3)'
              : hasActive
              ? 'rgba(245, 158, 11, 0.3)'
              : 'rgba(16, 185, 129, 0.25)';

            return (
              <TiltCard3D
                key={bld.buildingName}
                glowColor={statusColor}
                onClick={() => setSelectedBuilding(bld)}
              >
                <div className="p-6 h-full flex flex-col justify-between space-y-6">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-sky-400">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {bld.code}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1 group-hover:text-sky-300">
                          {bld.buildingName}
                        </h3>
                      </div>
                    </div>

                    {/* Status Beacon */}
                    <div>
                      {hasCritical ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-400" /> Critical
                        </span>
                      ) : hasActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <span className="w-2 h-2 rounded-full bg-amber-400" /> {bld.activeIssues} Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Clear
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rooms covered */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Monitored Rooms & Zones
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {bld.rooms.slice(0, 3).map((r, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded-lg border border-white/5"
                        >
                          {r}
                        </span>
                      ))}
                      {bld.rooms.length > 3 && (
                        <span className="text-[11px] text-slate-400 self-center">
                          +{bld.rooms.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                    <div className="text-slate-400">
                      Total Tickets: <strong className="text-white">{bld.complaints.length}</strong>
                    </div>
                    <div className="flex items-center gap-1 text-sky-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Inspect Facility</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      )}

      {/* Building Detail Modal (Animmaster Spring Slide) */}
      <AnimatePresence>
        {selectedBuilding && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedBuilding.buildingName}</h2>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedBuilding.totalLocations} Managed Rooms · {selectedBuilding.activeIssues} Active Work Orders
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBuilding(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rooms in building */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Facility Zones
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedBuilding.rooms.map((r, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5 text-xs text-slate-300 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complaints associated with this building */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Associated Complaints ({selectedBuilding.complaints.length})
                </h4>
                {selectedBuilding.complaints.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 text-center text-xs text-slate-400">
                    No complaints registered for this building.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedBuilding.complaints.map((c) => (
                      <div
                        key={c.complaint_id}
                        className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>#{c.complaint_id}</span>
                            <span>{c.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {c.room} · {c.category_name} · Status: <span className="font-semibold text-sky-300">{c.status}</span>
                          </div>
                        </div>
                        <Link href={`/complaints/${c.complaint_id}`}>
                          <GlowButton variant="secondary" size="sm" icon={<ArrowRight className="w-3 h-3" />}>
                            View
                          </GlowButton>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <GlowButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBuilding(null)}
                >
                  Close
                </GlowButton>
                <Link href="/dashboard/student">
                  <GlowButton
                    variant="primary"
                    size="sm"
                    icon={<PlusCircle className="w-4 h-4" />}
                  >
                    Report Issue Here
                  </GlowButton>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

