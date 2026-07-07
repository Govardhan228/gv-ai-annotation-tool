import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FolderKanban, PenTool, Box, Film, Tags,
  Workflow, ShieldCheck, BarChart3, Settings, Moon, Sun,
  ChevronsLeft, ChevronsRight, Search, Bell, GitBranch,
  Users, LogOut, Zap, Car
} from 'lucide-react';
import Dashboard from './views/DashboardView';
import ProjectsView from './views/ProjectsView';
import StudioView from './views/StudioView';
import TaxonomyManager from './views/TaxonomyManagerView';
import QACenter from './views/QACenterView';
import WorkflowsView from './views/WorkflowsView';
import AnalyticsView from './views/AnalyticsView';
import ImportExportView from './views/ImportExportView';
import TeamView from './views/TeamView';
import SettingsView from './views/SettingsView';
import AuthPage from './views/AuthPage';
import { useAppStore } from './store/appStore';
import { supabase } from './services/supabaseClient';

export type ViewId =
  | 'dashboard' | 'projects' | 'studio' | 'taxonomy'
  | 'qa' | 'workflows' | 'analytics' | 'import-export'
  | 'team' | 'settings';

const NAV_GROUPS: { label: string; items: { id: ViewId; label: string; icon: React.FC<any>; badge?: string }[] }[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'projects', label: 'Datasets', icon: FolderKanban },
    ],
  },
  {
    label: 'Annotation',
    items: [
      { id: 'studio', label: 'Annotation Studio', icon: PenTool },
      { id: 'taxonomy', label: 'Object Taxonomy', icon: Tags },
    ],
  },
  {
    label: 'Quality',
    items: [
      { id: 'qa', label: 'QA Center', icon: ShieldCheck, badge: '12' },
      { id: 'workflows', label: 'Workflows', icon: GitBranch },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'import-export', label: 'Import / Export', icon: Workflow },
      { id: 'team', label: 'Team', icon: Users },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

function App() {
  const [view, setView] = useState<ViewId>('dashboard');
  const { darkMode, toggleDark, sidebarCollapsed, toggleSidebar, loadSeedData, user, isLoading, checkAuth, signOut } = useAppStore();

  useEffect(() => { loadSeedData(); }, [loadSeedData]);
  useEffect(() => { checkAuth(); }, [checkAuth]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        useAppStore.setState({
          user: { id: session.user.id, email: session.user.email!, name, avatar: name.slice(0, 2).toUpperCase() },
          session,
          isLoading: false,
        });
      } else {
        useAppStore.setState({ user: null, session: null, isLoading: false });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const dm = darkMode;
  const sidebarW = sidebarCollapsed ? 'w-16' : 'w-60';

  if (isLoading) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center gap-4 ${dm ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="relative">
          <div className="w-12 h-12 border-3 border-blue-500/20 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-3 border-transparent border-t-blue-500 rounded-full animate-spin" />
        </div>
        <div className={`text-sm font-medium ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Loading workspace...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const userName = user.name || 'User';
  const userAvatar = user.avatar || userName.slice(0, 2).toUpperCase();
  const userInitials = userAvatar;

  const ViewSwitch = () => {
    switch (view) {
      case 'dashboard': return <Dashboard onNavigate={setView} />;
      case 'projects': return <ProjectsView onNavigate={setView} />;
      case 'studio': return <StudioView />;
      case 'taxonomy': return <TaxonomyManager />;
      case 'qa': return <QACenter />;
      case 'workflows': return <WorkflowsView />;
      case 'analytics': return <AnalyticsView />;
      case 'import-export': return <ImportExportView />;
      case 'team': return <TeamView />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard onNavigate={setView} />;
    }
  };

  return (
    <div className={`h-screen flex flex-col ${dm ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top bar */}
      <header className={`flex items-center justify-between h-14 px-4 border-b shrink-0 backdrop-blur-md ${dm ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          {/* Logo - AV/autonomous vehicle themed */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Car size={16} className="text-white" />
            </div>
            <span className={`font-bold text-sm tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>AutoAnnotate</span>
          </div>

          <div className={`w-px h-6 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />

          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${dm ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-100 hover:bg-slate-200'}`}>
            <Search size={14} className={dm ? 'text-slate-500' : 'text-slate-400'} />
            <input
              placeholder="Search datasets, labels, frames..."
              className={`bg-transparent border-none outline-none text-xs w-56 ${dm ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
            />
            <kbd className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${dm ? 'bg-slate-700 text-slate-500' : 'bg-white text-slate-400 shadow-sm'}`}>⌘K</kbd>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <button className={`p-2 rounded-lg transition-colors relative group ${dm ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full notification-dot" />
          </button>

          <div className={`w-px h-5 mx-1 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />

          {/* Theme toggle */}
          <button onClick={toggleDark} className={`p-2 rounded-lg transition-colors group ${dm ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
            {dm ? <Sun size={16} className="group-hover:rotate-12 transition-transform" /> : <Moon size={16} className="group-hover:-rotate-12 transition-transform" />}
          </button>

          <div className={`w-px h-5 mx-1 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />

          {/* User */}
          <div className="flex items-center gap-3 pl-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
              {userInitials}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className={`text-xs font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>{userName}</p>
              <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Owner</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className={`p-2 rounded-lg transition-colors ml-1 ${dm ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`flex flex-col border-r shrink-0 transition-all duration-300 ${sidebarW} ${dm ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200'} backdrop-blur-sm`}>
          <nav className="flex-1 py-3 overflow-y-auto">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-4">
                {!sidebarCollapsed && (
                  <p className={`px-4 mb-2 text-[10px] font-semibold uppercase tracking-wider ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
                    {group.label}
                  </p>
                )}
                {group.items.map((item, i) => {
                  const active = view === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 text-xs font-medium transition-all relative group ${
                        active
                          ? dm ? 'bg-gradient-to-r from-blue-600/15 to-cyan-500/5 text-blue-400' : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700'
                          : dm ? 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      } mx-2 rounded-lg animate-fade-in stagger-${(i % 4) + 1}`}
                      title={item.label}
                    >
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-r" />}
                      <item.icon size={16} className={`shrink-0 transition-transform ${active ? '' : 'group-hover:scale-110'}`} strokeWidth={active ? 2 : 1.75} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      {!sidebarCollapsed && item.badge && (
                        <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-bold ${dm ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Collapse button */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center justify-center py-3 border-t transition-colors ${dm ? 'border-slate-800 hover:bg-slate-800 text-slate-600 hover:text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600'}`}
          >
            {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          <ViewSwitch />
        </main>
      </div>
    </div>
  );
}

export default App;
