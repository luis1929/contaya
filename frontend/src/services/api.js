import { supabase } from './supabase';

export const api = {
  health: async () => {
    const { data, error } = await supabase.from('health').select('*').limit(1);
    return { status: 'ok' };
  },
  upload: async (file) => {
    const fileName = `${Date.now()}_${file.name}`;
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);
    if (fileError) throw fileError;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    const doc = {
      original_name: file.name,
      filename: fileName,
      file_url: publicUrl,
      size: file.size,
      mimetype: file.type,
      type: detectType(file.name),
      uploaded_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([doc])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getDocuments: async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  deleteDocument: async (id) => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

function detectType(name) {
  const n = name.toLowerCase();
  if (n.includes('factura') || n.includes('invoice')) return 'invoice';
  if (n.includes('nota') && n.includes('credito')) return 'credit_note';
  if (n.includes('nota') && n.includes('debito')) return 'debit_note';
  if (n.includes('extracto') || n.includes('estado') || n.includes('bank')) return 'statement';
  if (n.includes('recibo') || n.includes('receipt')) return 'receipt';
  return 'other';
}
