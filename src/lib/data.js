import { supabase, q } from './supabase';

const P = 'accbars_patients';
const G = 'accbars_goals';
const S = 'accbars_sessions';
const E = 'accbars_exercises';

export const listPatients = () =>
  q(supabase.from(P).select('id, full_name, next_session_at, open_point, enneagram_type').order('next_session_at', { ascending: true, nullsFirst: false }).order('full_name'));

export const getPatient = (id) => q(supabase.from(P).select('*').eq('id', id).single());
export const createPatient = (row) => q(supabase.from(P).insert(row).select('id').single());
export const updatePatient = (id, patch) => q(supabase.from(P).update(patch).eq('id', id));
export const deletePatient = (id) => q(supabase.from(P).delete().eq('id', id));
export const rotateToken = (id) => q(supabase.rpc('accbars_rotate_token', { p_patient: id }));

export const listGoals = (patientId) => q(supabase.from(G).select('id, text, position').eq('patient_id', patientId).order('position').order('created_at'));
export const addGoals = (rows) => q(supabase.from(G).insert(rows));
export const deleteGoal = (id) => q(supabase.from(G).delete().eq('id', id));

export const listSessions = (patientId) =>
  q(supabase.from(S).select('*').eq('patient_id', patientId).order('session_date', { ascending: false }).order('created_at', { ascending: false }));
export const getSession = (id) => q(supabase.from(S).select('*').eq('id', id).single());
export const createSession = (patientId) => q(supabase.from(S).insert({ patient_id: patientId }).select('id').single());
export const updateSession = (id, patch) => q(supabase.from(S).update(patch).eq('id', id));
export const deleteSession = (id) => q(supabase.from(S).delete().eq('id', id));

export const listExercises = (patientId) =>
  q(supabase.from(E).select('*').eq('patient_id', patientId).order('given_on', { ascending: false }).order('created_at', { ascending: false }));
export const upsertSessionExercise = (row) => q(supabase.from(E).upsert(row, { onConflict: 'session_id' }));
export const deleteSessionExercise = (sessionId) => q(supabase.from(E).delete().eq('session_id', sessionId));
export const updateExercise = (id, patch) => q(supabase.from(E).update(patch).eq('id', id));

export const patientView = async (token) => {
  const rows = await q(supabase.rpc('accbars_patient_view', { p_token: token }));
  return rows?.[0] ?? null;
};
