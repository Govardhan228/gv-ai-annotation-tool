import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FolderKanban, PenTool, Box, Film, Tags,
  Workflow, ShieldCheck, BarChart3, Settings, Moon, Sun,
  ChevronsLeft, ChevronsRight, Search, Bell, GitBranch,
  Users, LogOut
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
      { id: 'projects', label: 'Projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Annotation',
    items: [
      { id: 'studio', label: 'Annotation Studio', icon: PenTool },
      { id: 'taxonomy', label: 'Taxonomy', icon: Tags },
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        useAppStore.setState({
          user: { id: session.user.id, email: session.user.email!, name, avatar: name.slice(0, 2).toUpperCase() },
          session,
        });
      } else {
        useAppStore.setState({ user: null, session: null });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const dm = darkMode;
  const sidebarW = sidebarCollapsed ? 'w-16' : 'w-60';

  if (isLoading) {
    return (
      <div className={`h-screen flex items-center justify-center ${dm ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const userName = user.name || 'Govardhan';
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
      <header className={`flex items-center justify-between h-12 px-3 border-b shrink-0 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-[11px]">GV</span>
            </div>
            <span className={`font-semibold text-sm ${dm ? 'text-white' : 'text-slate-900'}`}>GV.AI</span>
          </div>
          <div className={`w-px h-5 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <Search size={13} className={dm ? 'text-slate-500' : 'text-slate-400'} />
            <input
              placeholder="Search projects, tasks, classes..."
              className={`bg-transparent border-none outline-none text-xs w-56 ${dm ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
            />
            <kbd className={`text-[9px] px-1 py-0.5 rounded ${dm ? 'bg-slate-700 text-slate-500' : 'bg-white text-slate-400'}`}>⌘K</kbd>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className={`p-1.5 rounded-md transition-colors relative ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
            <Bell size={15} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>
          <div className={`w-px h-5 mx-1 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <button onClick={toggleDark} className={`p-1.5 rounded-md transition-colors ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
            {dm ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <div className={`w-px h-5 mx-1 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
              {userInitials}
            </div>
            <div className="text-left leading-none">
              <p className={`text-xs font-medium ${dm ? 'text-white' : 'text-slate-900'}`}>{userName}</p>
              <p className={`text-[10px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Owner</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className={`p-1.5 rounded-md transition-colors ml-1 ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`flex flex-col border-r shrink-0 transition-all duration-200 ${sidebarW} ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <nav className="flex-1 py-2 overflow-y-auto">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-3">
                {!sidebarCollapsed && (
                  <p className={`px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => {
                  const active = view === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium transition-colors relative ${
                        active
                          ? dm ? 'bg-blue-600/15 text-blue-400' : 'bg-blue-50 text-blue-700'
                          : dm ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      title={item.label}
                    >
                      {active && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />}
                      <item.icon size={16} className="shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      {!sidebarCollapsed && item.badge && (
                        <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${dm ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <button
            onClick={toggleSidebar}
            className={`flex items-center justify-center py-2 border-t transition-colors ${dm ? 'border-slate-800 hover:bg-slate-800 text-slate-500' : 'border-slate-200 hover:bg-slate-100 text-slate-400'}`}
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
