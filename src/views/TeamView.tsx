import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, MoreVertical, Shield, Eye, CheckCircle2, Clock, User, Crown, Trash2, CreditCard as Edit2, X, Check, ChevronDown, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { supabase } from '../services/supabaseClient';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  count: number;
  initials: string;
  color: string;
  created_at?: string;
}

const ROLES = [
  { value: 'owner', label: 'Owner', icon: Crown, color: 'bg-amber-500', text: 'text-amber-500' },
  { value: 'admin', label: 'Admin', icon: Shield, color: 'bg-blue-500', text: 'text-blue-500' },
  { value: 'reviewer', label: 'Reviewer', icon: Eye, color: 'bg-violet-500', text: 'text-violet-500' },
  { value: 'annotator', label: 'Annotator', icon: User, color: 'bg-emerald-500', text: 'text-emerald-500' },
  { value: 'viewer', label: 'Viewer', icon: Eye, color: 'bg-slate-400', text: 'text-slate-400' },
];

const COLORS = [
  'from-amber-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-slate-400 to-slate-500',
  'from-orange-500 to-amber-500',
  'from-indigo-500 to-blue-500',
];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function TeamView() {
  const dm = useAppStore((s) => s.darkMode);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'count' | 'status'>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('annotator');
  const [formStatus, setFormStatus] = useState('active');
  const [formCount, setFormCount] = useState(0);

  const loadMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('team_members').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setMembers(data.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        count: m.annotation_count || 0,
        initials: getInitials(m.name),
        color: getColor(m.name),
        created_at: m.created_at,
      })));
    } else {
      // Fallback to local data if table doesn't exist
      setMembers([
        { id: '1', name: 'Govardhan', email: 'govardhan@gv.ai', role: 'owner', status: 'active', count: 980, initials: 'GV', color: getColor('Govardhan') },
        { id: '2', name: 'Alice Chen', email: 'alice@gv.ai', role: 'admin', status: 'active', count: 412, initials: 'AC', color: getColor('Alice Chen') },
        { id: '3', name: 'Bob Smith', email: 'bob@gv.ai', role: 'reviewer', status: 'active', count: 745, initials: 'BS', color: getColor('Bob Smith') },
        { id: '4', name: 'Carol Davis', email: 'carol@gv.ai', role: 'annotator', status: 'active', count: 523, initials: 'CD', color: getColor('Carol Davis') },
        { id: '5', name: 'Dan Wilson', email: 'dan@gv.ai', role: 'annotator', status: 'active', count: 801, initials: 'DW', color: getColor('Dan Wilson') },
        { id: '6', name: 'Eve Park', email: 'eve@gv.ai', role: 'viewer', status: 'invited', count: 0, initials: 'EP', color: getColor('Eve Park') },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { loadMembers(); }, []);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('annotator');
    setFormStatus('active');
    setFormCount(0);
  };

  const addMember = async () => {
    if (!formName.trim() || !formEmail.trim()) return;
    const newMember = {
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      status: formStatus,
      annotation_count: formCount,
    };
    const { error } = await supabase.from('team_members').insert([newMember]);
    if (!error) {
      setShowAdd(false);
      resetForm();
      loadMembers();
    } else {
      // Fallback: add to local state
      setMembers([...members, {
        id: genLocalId(),
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        status: formStatus,
        count: formCount,
        initials: getInitials(formName.trim()),
        color: getColor(formName.trim()),
      }]);
      setShowAdd(false);
      resetForm();
    }
  };

  const updateMember = async (id: string) => {
    const updates = {
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      status: formStatus,
      annotation_count: formCount,
    };
    const { error } = await supabase.from('team_members').update(updates).eq('id', id);
    if (!error) {
      setShowEdit(null);
      resetForm();
      loadMembers();
    } else {
      // Fallback: update local state
      setMembers(members.map(m => m.id === id ? {
        ...m,
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        status: formStatus,
        count: formCount,
        initials: getInitials(formName.trim()),
        color: getColor(formName.trim()),
      } : m));
      setShowEdit(null);
      resetForm();
    }
  };

  const deleteMember = async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (!error) {
      setDeleteConfirm(null);
      loadMembers();
    } else {
      setMembers(members.filter(m => m.id !== id));
      setDeleteConfirm(null);
    }
  };

  const openEdit = (member: TeamMember) => {
    setFormName(member.name);
    setFormEmail(member.email);
    setFormRole(member.role);
    setFormStatus(member.status);
    setFormCount(member.count);
    setShowEdit(member.id);
  };

  const filtered = members.filter(m => {
    if (filterRole && m.role !== filterRole) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'role') cmp = a.role.localeCompare(b.role);
    else if (sortBy === 'count') cmp = a.count - b.count;
    else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
    return sortDesc ? -cmp : cmp;
  });

  const toggleSort = (field: 'name' | 'role' | 'count' | 'status') => {
    if (sortBy === field) setSortDesc(!sortDesc);
    else { setSortBy(field); setSortDesc(false); }
  };

  const card = `rounded-xl border ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;
  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${dm ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>Team</h1>
          <p className={`text-sm mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{members.length} members</p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors">
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      {/* Role distribution */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {ROLES.map((r) => {
          const count = members.filter((m) => m.role === r.value).length;
          const active = filterRole === r.value;
          return (
            <button
              key={r.value}
              onClick={() => setFilterRole(active ? null : r.value)}
              className={`${card} p-3 flex items-center gap-2.5 transition-all ${active ? 'ring-2 ring-blue-500' : 'hover:shadow-sm'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.color} text-white`}>
                <r.icon size={14} />
              </div>
              <div>
                <p className={`text-base font-bold ${dm ? 'text-white' : 'text-slate-900'}`}>{count}</p>
                <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{r.label}s</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & filters */}
      <div className={`flex items-center gap-2 mb-3`}>
        <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border text-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <Search size={14} className={dm ? 'text-slate-500' : 'text-slate-400'} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className={`bg-transparent border-none outline-none flex-1 text-sm ${dm ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
          />
        </div>
        {filterRole && (
          <button
            onClick={() => setFilterRole(null)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border ${dm ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            {ROLES.find(r => r.value === filterRole)?.label} <X size={10} className="inline ml-1" />
          </button>
        )}
      </div>

      {/* Members table */}
      <div className={`${card} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-xs ${dm ? 'text-slate-500' : 'text-slate-400'} border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
              <th className="px-4 py-2 font-medium cursor-pointer hover:opacity-70" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1">Member <ArrowUpDown size={10} /></div>
              </th>
              <th className="px-3 py-2 font-medium cursor-pointer hover:opacity-70" onClick={() => toggleSort('role')}>
                <div className="flex items-center gap-1">Role <ArrowUpDown size={10} /></div>
              </th>
              <th className="px-3 py-2 font-medium cursor-pointer hover:opacity-70" onClick={() => toggleSort('count')}>
                <div className="flex items-center gap-1">Annotations <ArrowUpDown size={10} /></div>
              </th>
              <th className="px-3 py-2 font-medium cursor-pointer hover:opacity-70" onClick={() => toggleSort('status')}>
                <div className="flex items-center gap-1">Status <ArrowUpDown size={10} /></div>
              </th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-xs text-slate-500">Loading...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-xs text-slate-500">No members found.</td></tr>
            ) : (
              sorted.map((m) => {
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(m)}
                          className={`p-1.5 rounded ${dm ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(m.id)}
                          className={`p-1.5 rounded ${dm ? 'hover:bg-rose-900/30 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || showEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowAdd(false); setShowEdit(null); }} />
          <div className={`relative w-full max-w-md mx-4 rounded-xl shadow-2xl ${dm ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
              <h2 className={`text-base font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>{showEdit ? 'Edit Member' : 'Add Team Member'}</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={`text-xs font-medium mb-1 block ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Full Name</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Govardhan" className={inputClass} />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Email</label>
                <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" placeholder="name@gv.ai" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-medium mb-1 block ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Role</label>
                  <div className="relative">
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${dm ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Status</label>
                  <div className="relative">
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                    >
                      <option value="active">Active</option>
                      <option value="invited">Invited</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${dm ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </div>
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Annotation Count</label>
                <input
                  value={formCount}
                  onChange={(e) => setFormCount(parseInt(e.target.value) || 0)}
                  type="number"
                  min={0}
                  className={inputClass}
                />
              </div>
            </div>
            <div className={`flex items-center justify-end gap-2 p-4 border-t ${dm ? 'border-slate-800' : 'border-slate-100'}`}>
              <button onClick={() => { setShowAdd(false); setShowEdit(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${dm ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Cancel</button>
              <button
                onClick={() => showEdit ? updateMember(showEdit) : addMember()}
                disabled={!formName.trim() || !formEmail.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {showEdit ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative w-full max-w-sm mx-4 rounded-xl shadow-2xl p-5 ${dm ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <h3 className={`text-base font-semibold mb-2 ${dm ? 'text-white' : 'text-slate-900'}`}>Remove Member?</h3>
            <p className={`text-sm mb-4 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
              This will remove {members.find(m => m.id === deleteConfirm)?.name} from the team. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className={`px-4 py-2 rounded-lg text-sm font-medium ${dm ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>Cancel</button>
              <button onClick={() => deleteMember(deleteConfirm)} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function genLocalId(): string {
  return `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
