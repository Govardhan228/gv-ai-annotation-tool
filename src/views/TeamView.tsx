import React, { useState } from 'react';
import { Users, UserPlus, Mail, MoreVertical, Shield, Eye, CheckCircle2, Clock, User, Crown, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const ROLES = [
  { value: 'owner', label: 'Owner', icon: Crown, color: 'bg-amber-500' },
  { value: 'admin', label: 'Admin', icon: Shield, color: 'bg-blue-500' },
  { value: 'reviewer', label: 'Reviewer', icon: Eye, color: 'bg-violet-500' },
  { value: 'annotator', label: 'Annotator', icon: User, color: 'bg-emerald-500' },
  { value: 'viewer', label: 'Viewer', icon: Eye, color: 'bg-slate-400' },
];

export default function TeamView() {
  const dm = useAppStore((s) => s.darkMode);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('annotator');

  const card = `rounded-xl border ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;

  const members = [
    { id: '1', name: 'Alice Chen', email: 'alice@gv.ai', role: 'owner', status: 'active', initials: 'AC', color: 'from-amber-500 to-orange-500', count: 980 },
    { id: '2', name: 'Bob Smith', email: 'bob@gv.ai', role: 'admin', status: 'active', initials: 'BS', color: 'from-blue-500 to-cyan-500', count: 412 },
    { id: '3', name: 'Carol Davis', email: 'carol@gv.ai', role: 'reviewer', status: 'active', initials: 'CD', color: 'from-violet-500 to-purple-500', count: 745 },
    { id: '4', name: 'Dan Wilson', email: 'dan@gv.ai', role: 'annotator', status: 'active', initials: 'DW', color: 'from-emerald-500 to-teal-500', count: 523 },
    { id: '5', name: 'Eve Park', email: 'eve@gv.ai', role: 'annotator', status: 'active', initials: 'EP', color: 'from-rose-500 to-pink-500', count: 801 },
    { id: '6', name: 'Frank Garcia', email: 'frank@gv.ai', role: 'viewer', status: 'invited', initials: 'FG', color: 'from-slate-400 to-slate-500', count: 0 },
  ];

  const pending = [
    { email: 'grace@external.com', role: 'annotator', sent: '2h ago' },
    { email: 'henry@partner.io', role: 'reviewer', sent: '1d ago' },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>Team</h1>
          <p className={`text-sm mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{members.length} members · {pending.length} pending invitations</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm">
          <UserPlus size={16} /> Invite Member
        </button>
      </div>

      {/* Role distribution */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {ROLES.map((r) => {
          const count = members.filter((m) => m.role === r.value).length;
          return (
            <div key={r.value} className={`${card} p-3 flex items-center gap-2.5`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.color} text-white`}>
                <r.icon size={14} />
              </div>
              <div>
                <p className={`text-base font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{count}</p>
                <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{r.label}s</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members table */}
      <div className={`${card} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-xs ${dm ? 'text-slate-500' : 'text-slate-400'} border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
              <th className="px-4 py-2 font-medium">Member</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Annotations</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const role = ROLES.find((r) => r.value === m.role)!;
              return (
                <tr key={m.id} className={`border-b last:border-0 ${dm ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-slate-50 hover:bg-slate-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-xs font-semibold`}>{m.initials}</div>
                      <div>
                        <p className={`font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{m.name}</p>
                        <p className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <role.icon size={12} className={dm ? 'text-slate-400' : 'text-slate-500'} />
                      <span className={dm ? 'text-slate-300' : 'text-slate-700'}>{role.label}</span>
                    </span>
                  </td>
                  <td className={`px-3 py-3 text-xs ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{m.count.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    {m.status === 'active' ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-500"><CheckCircle2 size={12} /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-500"><Clock size={12} /> Invited</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className={`p-1.5 rounded ${dm ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}><MoreVertical size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div className={`${card} p-4 mt-4`}>
          <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dm ? 'text-white' : 'text-slate-900'}`}><Mail size={15} /> Pending Invitations</h3>
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.email} className={`flex items-center gap-3 p-2.5 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dm ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <Mail size={14} className={dm ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${dm ? 'text-white' : 'text-slate-900'}`}>{p.email}</p>
                  <p className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Invited as {p.role} · {p.sent}</p>
                </div>
                <button className={`p-1.5 rounded ${dm ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowInvite(false)} />
          <div className={`relative w-full max-w-md mx-4 rounded-xl shadow-2xl ${dm ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
              <h2 className={`text-base font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Invite Team Member</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={`text-xs font-medium ${dm ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="colleague@company.com"
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${dm ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`} autoFocus />
              </div>
              <div>
                <label className={`text-xs font-medium ${dm ? 'text-slate-300' : 'text-slate-700'}`}>Role</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {ROLES.slice(0, 4).map((r) => (
                    <button key={r.value} onClick={() => setInviteRole(r.value)}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 text-left transition-all ${inviteRole === r.value ? 'border-blue-500 bg-blue-500/10' : dm ? 'border-slate-700' : 'border-slate-200'}`}>
                      <r.icon size={14} className={inviteRole === r.value ? 'text-blue-500' : dm ? 'text-slate-400' : 'text-slate-500'} />
                      <span className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={`flex items-center justify-end gap-2 p-4 border-t ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowInvite(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${dm ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Cancel</button>
              <button onClick={() => { setShowInvite(false); setInviteEmail(''); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Send Invitation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
