import { supabase } from './supabase';

const TABLE = 'documents';

export async function getDocuments() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDocument(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createDocument(doc) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([doc])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function uploadFile(file) {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file);
  if (error) throw error;
  return data;
}

export async function getFileUrl(path) {
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(path);
  return data.publicUrl;
}
