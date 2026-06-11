import React from 'react';
import { 
  MapPin, 
  Building, 
  User, 
  Compass, 
  Clock, 
  Check, 
  X 
} from 'lucide-react';
import { motion } from 'motion/react';
import { WorkingLocation } from '../types';

interface GeofenceWidgetProps {
  locations: WorkingLocation[];
  selectedOfficeId: string;
  setSelectedOfficeId: (id: string) => void;
  activeOffice: WorkingLocation;
  isOutOfBounds: boolean;
  distance: number;
  isLocating: boolean;
  geoError: string | null;
  userCoords: { latitude: number; longitude: number } | null;
  triggerRealGPS: () => void;
}

export function GeofenceWidget({
  locations,
  selectedOfficeId,
  setSelectedOfficeId,
  activeOffice,
  isOutOfBounds,
  distance,
  isLocating,
  geoError,
  userCoords,
  triggerRealGPS,
}: GeofenceWidgetProps) {
  return (
    <div className="bg-[#0f172a]/55 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/5 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 mb-5">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
            Geofence Guard Area & GPS Status
          </h3>
          <p className="text-xs text-slate-400">Restricts employee checkins to within designated site radius</p>
        </div>
        
        {/* Select target Workplace */}
        <div className="flex items-center gap-3">
          <select 
            value={selectedOfficeId} 
            onChange={(e) => setSelectedOfficeId(e.target.value)}
            className="text-xs bg-[#070b14] text-white border border-white/10 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4A843] cursor-pointer"
          >
            {locations.map(l => (
              <option key={l.id} value={l.id} className="bg-[#0b0f19] text-white">{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulated GIS map representation */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Interactive Visual Radar Plot */}
        <div className="bg-slate-950/70 h-64 rounded-xl relative overflow-hidden flex items-center justify-center border border-white/5 shadow-inner transition-all duration-300 w-full">
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: 'radial-gradient(ellipse at center, #10b981 1px, transparent 1px)', 
            backgroundSize: '16px 16px' 
          }} />

          {/* Concentric Circle geofence radar sweep animation */}
          <div className="absolute h-48 w-48 rounded-full border border-[#D4A843]/15 flex items-center justify-center animate-pulse" />
          <div className="absolute h-36 w-36 rounded-full border border-[#D4A843]/20 flex items-center justify-center" />
          <div className="absolute h-20 w-20 rounded-full bg-[#1A3C6E]/20 border border-[#D4A843]/30 flex items-center justify-center" />

          {/* Workplace coordinate focal pin */}
          <div className="absolute z-10 text-center">
            <div className="h-6 w-6 bg-[#D4A843] rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 mx-auto animate-bounce">
              <Building className="h-3 w-3 text-slate-950" />
            </div>
            <span className="text-[9px] text-slate-300 font-bold block mt-1 bg-slate-950/80 px-2 py-0.5 rounded-full border border-white/5">
              {activeOffice.name.split(' ')[0]} HQ
            </span>
          </div>

          {/* Employee virtual placement dot */}
          <motion.div 
            animate={{ 
              x: isOutOfBounds ? 70 : 15, 
              y: isOutOfBounds ? -60 : 15 
            }} 
            transition={{ type: 'spring', damping: 15 }}
            className="absolute z-20"
          >
            <div className="relative">
              <span className="absolute -top-1 -left-1 inline-flex h-4 w-4 rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
              <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-md border-2 border-white ${isOutOfBounds ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`}>
                 <User className="h-2 w-2 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Radar Line sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/5 to-transparent origin-center animate-spin" style={{ animationDuration: '6s' }} />

          {/* Map Labels details overlays */}
          <div className="absolute top-2 left-2 bg-slate-950/90 px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-400 flex flex-col border border-white/5">
            <span>Office Lat: {activeOffice.latitude.toFixed(4)}</span>
            <span>Office Lng: {activeOffice.longitude.toFixed(4)}</span>
          </div>

          <div className="absolute bottom-2 left-2 bg-slate-950/90 px-2.5 py-1 rounded-md text-[10px] font-mono flex items-center gap-1 border border-white/5">
            <span className={`h-2 w-2 rounded-full ${isOutOfBounds ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className="text-white">Emp Distance: {distance.toLocaleString()}m</span>
          </div>

          <div className="absolute top-2 right-2 flex gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-[#D4A843] px-2 py-0.5 rounded border border-white/5">
              Radar Lock
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
