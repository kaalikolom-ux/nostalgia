const { Client } = require('pg');

const client = new Client({
  host: 'db.wlokctkwupttckkrigti.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'H/!@isd@7EL9rs3',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  // Create restorations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.restorations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      title TEXT DEFAULT 'Old Memory',
      original_url TEXT NOT NULL,
      restored_url TEXT NOT NULL,
      restoration_type TEXT NOT NULL,
      settings JSONB DEFAULT '{}'::jsonb,
      likes_count INT DEFAULT 0,
      is_public BOOLEAN DEFAULT true
    );

    ALTER TABLE public.restorations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read on restorations" ON public.restorations;
    CREATE POLICY "Allow public read on restorations" ON public.restorations
      FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public insert on restorations" ON public.restorations;
    CREATE POLICY "Allow public insert on restorations" ON public.restorations
      FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public update on restorations" ON public.restorations;
    CREATE POLICY "Allow public update on restorations" ON public.restorations
      FOR UPDATE USING (true);

    DROP POLICY IF EXISTS "Allow public delete on restorations" ON public.restorations;
    CREATE POLICY "Allow public delete on restorations" ON public.restorations
      FOR DELETE USING (true);
  `);
  console.log('Table "restorations" created and RLS policies configured.');

  // Create storage bucket and storage policies
  await client.query(`
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('nostalgia-photos', 'nostalgia-photos', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    DROP POLICY IF EXISTS "Public Access Nostalgia Bucket" ON storage.objects;
    CREATE POLICY "Public Access Nostalgia Bucket" ON storage.objects
      FOR SELECT USING (bucket_id = 'nostalgia-photos');

    DROP POLICY IF EXISTS "Public Insert Nostalgia Bucket" ON storage.objects;
    CREATE POLICY "Public Insert Nostalgia Bucket" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'nostalgia-photos');

    DROP POLICY IF EXISTS "Public Update Nostalgia Bucket" ON storage.objects;
    CREATE POLICY "Public Update Nostalgia Bucket" ON storage.objects
      FOR UPDATE USING (bucket_id = 'nostalgia-photos');

    DROP POLICY IF EXISTS "Public Delete Nostalgia Bucket" ON storage.objects;
    CREATE POLICY "Public Delete Nostalgia Bucket" ON storage.objects
      FOR DELETE USING (bucket_id = 'nostalgia-photos');
  `);
  console.log('Storage bucket "nostalgia-photos" configured with public policies.');

  await client.end();
  console.log('Setup finished successfully!');
}

setup().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});
