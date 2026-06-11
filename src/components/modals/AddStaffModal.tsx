import React from 'react';
import { Plus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { StaffMember } from '../../types';

interface AddStaffModalProps {
  showAddStaffModal: boolean;
  setShowAddStaffModal: (show: boolean) => void;
  newStaffName: string;
  setNewStaffName: (name: string) => void;
  newStaffEmail: string;
  setNewStaffEmail: (email: string) => void;
  newStaffDept: string;
  setNewStaffDept: (dept: string) => void;
  newStaffRate: number;
  setNewStaffRate: (rate: number) => void;
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
}

export function AddStaffModal({
  showAddStaffModal,
  setShowAddStaffModal,
  newStaffName,
  setNewStaffName,
  newStaffEmail,
  setNewStaffEmail,
  newStaffDept,
  setNewStaffDept,
  newStaffRate,
  setNewStaffRate,
  setStaff,
}: AddStaffModalProps) {
  if (!showAddStaffModal) return null;

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const newEmp: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      email: newStaffEmail,
      department: newStaffDept,
      role: 'Employee',
      hourlyRate: Number(newStaffRate),
      overtimeRate: Math.round(Number(newStaffRate) * 1.5),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newStaffName)}&backgroundColor=1A3C6E&textColor=ffffff`
    };

    setStaff((prev) => [...prev, newEmp]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffRate(2500);
    setShowAddStaffModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f172a] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.56)] overflow-hidden max-w-md w-full border border-white/10"
      >
        <div className="bg-[#1A3C6E]/40 text-white p-5 flex justify-between items-center border-b border-white/5">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Plus className="h-5 w-5 text-[#D4A843] immersive-glow-gold" />
            Register New Employee Profile
          </h3>
          <button 
            type="button"
            onClick={() => setShowAddStaffModal(false)} 
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4">
          <div className="space-y-3 font-medium text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Full Employee Name</label>
              <input
                type="text"
                required
                placeholder="Chimaobi Adeleke"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Workplace Email</label>
              <input
                type="email"
                required
                placeholder="chimaobi.a@churchos.ng"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">Department</label>
                <select
                  value={newStaffDept}
                  onChange={(e) => setNewStaffDept(e.target.value)}
                  className="w-full text-xs border border-white/10 rounded-xl p-3 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-[#D4A843] cursor-pointer"
                >
                  <option value="Administration" className="bg-[#0b0f19] text-white">Administration</option>
                  <option value="Media & Communications" className="bg-[#0b0f19] text-white">Media & Comms</option>
                  <option value="Operations & Facilities" className="bg-[#0b0f19] text-white">Operations</option>
                  <option value="Finance & Accounts" className="bg-[#0b0f19] text-white">Finance & Accounts</option>
                  <option value="Pastoral & Care" className="bg-[#0b0f19] text-white">Pastoral Care</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Hourly Base Pay (₦)</label>
                <input
                  type="number"
                  required
                  min={500}
                  value={newStaffRate}
                  onChange={(e) => setNewStaffRate(parseInt(e.target.value) || 2500)}
                  className="w-full text-xs bg-slate-950 text-slate-100 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D4A843]"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setShowAddStaffModal(false)}
              className="border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#D4A843] text-slate-950 hover:bg-amber-500 px-5 py-2.5 rounded-xl shadow-lg border-0 cursor-pointer font-black"
            >
              Confirm Registration
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
