/**
 * Team Management Store (Zustand)
 * Manages users, roles, team assignments, and audit logs
 */

import { create } from 'zustand';
import { User, TeamMemberAssignment, UserInvitation, AuditLog } from '../types/team';
import { UserRole } from '../types/permissions';

interface TeamState {
  // Users
  users: User[];
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  removeUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
  getUsersByRole: (role: UserRole) => User[];

  // Team Assignments
  assignments: TeamMemberAssignment[];
  assignUserToProject: (assignment: TeamMemberAssignment) => void;
  unassignUserFromProject: (userId: string, projectId: string) => void;
  updateAssignment: (assignmentId: string, updates: Partial<TeamMemberAssignment>) => void;
  getProjectMembers: (projectId: string) => TeamMemberAssignment[];
  getUserProjects: (userId: string) => TeamMemberAssignment[];

  // Invitations
  invitations: UserInvitation[];
  inviteUser: (invitation: UserInvitation) => void;
  acceptInvitation: (invitationId: string) => void;
  cancelInvitation: (invitationId: string) => void;
  getProjectInvitations: (projectId: string) => UserInvitation[];

  // Audit Log
  auditLogs: AuditLog[];
  logAction: (log: AuditLog) => void;
  getAuditLogs: (filters?: { userId?: string; targetType?: string; startDate?: Date; endDate?: Date }) => AuditLog[];

  // Utilities
  persistTeamData: () => Promise<void>;
  loadTeamData: () => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  users: [],
  assignments: [],
  invitations: [],
  auditLogs: [],

  addUser: (user: User) =>
    set((state) => {
      const exists = state.users.find((u) => u.id === user.id);
      if (exists) return {};
      return { users: [...state.users, user] };
    }),

  updateUser: (userId: string, updates: Partial<User>) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, ...updates, updatedAt: new Date() } : u
      ),
    })),

  removeUser: (userId: string) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    })),

  getUserById: (userId: string) => {
    return get().users.find((u) => u.id === userId);
  },

  getUsersByRole: (role: UserRole) => {
    return get().users.filter((u) => u.role === role);
  },

  assignUserToProject: (assignment: TeamMemberAssignment) =>
    set((state) => {
      const exists = state.assignments.find(
        (a) => a.userId === assignment.userId && a.projectId === assignment.projectId
      );
      if (exists) return {};
      return { assignments: [...state.assignments, assignment] };
    }),

  unassignUserFromProject: (userId: string, projectId: string) =>
    set((state) => ({
      assignments: state.assignments.filter(
        (a) => !(a.userId === userId && a.projectId === projectId)
      ),
    })),

  updateAssignment: (assignmentId: string, updates: Partial<TeamMemberAssignment>) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === assignmentId ? { ...a, ...updates } : a
      ),
    })),

  getProjectMembers: (projectId: string) => {
    return get().assignments.filter(
      (a) => a.projectId === projectId && a.status === 'active'
    );
  },

  getUserProjects: (userId: string) => {
    return get().assignments.filter(
      (a) => a.userId === userId && a.status === 'active'
    );
  },

  inviteUser: (invitation: UserInvitation) =>
    set((state) => ({
      invitations: [...state.invitations, invitation],
    })),

  acceptInvitation: (invitationId: string) =>
    set((state) => ({
      invitations: state.invitations.map((inv) =>
        inv.id === invitationId
          ? { ...inv, status: 'accepted' as const, acceptedAt: new Date() }
          : inv
      ),
    })),

  cancelInvitation: (invitationId: string) =>
    set((state) => ({
      invitations: state.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv
      ),
    })),

  getProjectInvitations: (projectId: string) => {
    return get().invitations.filter(
      (inv) => inv.projectId === projectId && inv.status === 'pending'
    );
  },

  logAction: (log: AuditLog) =>
    set((state) => ({
      auditLogs: [...state.auditLogs, log],
    })),

  getAuditLogs: (filters) => {
    let logs = get().auditLogs;

    if (filters?.userId) {
      logs = logs.filter((log) => log.userId === filters.userId);
    }
    if (filters?.targetType) {
      logs = logs.filter((log) => log.targetType === filters.targetType);
    }
    if (filters?.startDate) {
      logs = logs.filter((log) => log.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      logs = logs.filter((log) => log.createdAt <= filters.endDate!);
    }

    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  persistTeamData: async () => {
    const state = get();
    // TODO: Implement API call to persist team data
    // await API.saveTeamData({ users: state.users, assignments: state.assignments, invitations: state.invitations });
    console.log('Persisting team data');
  },

  loadTeamData: async () => {
    // TODO: Implement API call to load team data
    // const data = await API.loadTeamData();
    // set({ users: data.users, assignments: data.assignments, invitations: data.invitations });
    console.log('Loading team data');
  },
}));
