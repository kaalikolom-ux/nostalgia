import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wlokctkwupttckkrigti.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yemRbPZpPgk2uh0Bux_PFA__aXEyzV3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload an image (Blob or File) to Supabase Storage
 */
export async function uploadImageToStorage(fileOrBlob, folder = 'uploads') {
  try {
    const ext = fileOrBlob.type === 'image/png' ? 'png' : 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('nostalgia-photos')
      .upload(fileName, fileOrBlob, {
        contentType: fileOrBlob.type || 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('nostalgia-photos')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Storage upload error:', err);
    return null;
  }
}

/**
 * Save restoration metadata in Supabase DB
 */
export async function saveRestorationRecord({
  title = 'Old Photo Memory',
  originalUrl,
  restoredUrl,
  restorationType,
  settings = {}
}) {
  try {
    const { data, error } = await supabase
      .from('restorations')
      .insert([
        {
          title,
          original_url: originalUrl,
          restored_url: restoredUrl,
          restoration_type: restorationType,
          settings,
          is_public: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.warn('Supabase DB save error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('DB save error:', err);
    return null;
  }
}

/**
 * Fetch recent restorations from Supabase
 */
export async function fetchRecentRestorations(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('restorations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase DB fetch error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('DB fetch error:', err);
    return [];
  }
}
