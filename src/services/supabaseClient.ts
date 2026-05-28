import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const projectService = {
  async create(data: any) {
    const { data: d, error } = await supabase.from('projects').insert([data]).select();
    return { data: d?.[0], error };
  },
  async list() {
    const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
    return { data, error };
  },
  async get(id: string) {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
    return { data, error };
  },
  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('projects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select();
    return { data: data?.[0], error };
  },
  async remove(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    return { error };
  },
};

export const annotationService = {
  async create(data: any) {
    const { data: d, error } = await supabase.from('annotations').insert([data]).select();
    return { data: d?.[0], error };
  },
  async list(projectId: string) {
    const { data, error } = await supabase.from('annotations').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    return { data, error };
  },
  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('annotations').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select();
    return { data: data?.[0], error };
  },
  async remove(id: string) {
    const { error } = await supabase.from('annotations').delete().eq('id', id);
    return { error };
  },
  async batchCreate(items: any[]) {
    const { data, error } = await supabase.from('annotations').insert(items).select();
    return { data, error };
  },
};

export const classService = {
  async create(data: any) {
    const { data: d, error } = await supabase.from('annotation_classes').insert([data]).select();
    return { data: d?.[0], error };
  },
  async list(projectId: string) {
    const { data, error } = await supabase.from('annotation_classes').select('*').eq('project_id', projectId).order('sort_order');
    return { data, error };
  },
  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('annotation_classes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select();
    return { data: data?.[0], error };
  },
  async remove(id: string) {
    const { error } = await supabase.from('annotation_classes').delete().eq('id', id);
    return { error };
  },
};

export const attributeService = {
  async create(data: any) {
    const { data: d, error } = await supabase.from('class_attributes').insert([data]).select();
    return { data: d?.[0], error };
  },
  async list(classId: string) {
    const { data, error } = await supabase.from('class_attributes').select('*').eq('class_id', classId).order('sort_order');
    return { data, error };
  },
  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('class_attributes').update(updates).eq('id', id).select();
    return { data: data?.[0], error };
  },
  async remove(id: string) {
    const { error } = await supabase.from('class_attributes').delete().eq('id', id);
    return { error };
  },
};

export const taskService = {
  async create(data: any) {
    const { data: d, error } = await supabase.from('tasks').insert([data]).select();
    return { data: d?.[0], error };
  },
  async list(projectId: string) {
    const { data, error } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    return { data, error };
  },
  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select();
    return { data: data?.[0], error };
  },
};

export const reviewService = {
  async create(data: any) {
    const { data: d, error } = await supabase.from('reviews').insert([data]).select();
    return { data: d?.[0], error };
  },
  async list(projectId: string) {
    const { data, error } = await supabase.from('reviews').select('*, review_comments(*)').eq('project_id', projectId);
    return { data, error };
  },
  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase.from('reviews').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select();
    return { data: data?.[0], error };
  },
  async addComment(data: any) {
    const { data: d, error } = await supabase.from('review_comments').insert([data]).select();
    return { data: d?.[0], error };
  },
};

export const saveService = {
  async save(projectId: string, data: any[], saveType: string = 'auto') {
    const { data: d, error } = await supabase.from('annotation_saves').insert([{ project_id: projectId, annotations_data: data, save_type: saveType }]).select();
    return { data: d?.[0], error };
  },
  async history(projectId: string, limit: number = 50) {
    const { data, error } = await supabase.from('annotation_saves').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(limit);
    return { data, error };
  },
  async restore(saveId: string) {
    const { data, error } = await supabase.from('annotation_saves').select('annotations_data').eq('id', saveId).maybeSingle();
    return { data, error };
  },
};

export const teamService = {
  async addMember(data: any) {
    const { data: d, error } = await supabase.from('team_members').insert([data]).select();
    return { data: d?.[0], error };
  },
  async list(projectId: string) {
    const { data, error } = await supabase.from('team_members').select('*').eq('project_id', projectId);
    return { data, error };
  },
  async remove(id: string) {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    return { error };
  },
};
