# Super Challenge Supabase Setup

## Environment

Frontend hanya memakai anon key:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` di Vite/Vercel frontend.

## Migrations

Jalankan SQL di folder `supabase/migrations/` secara berurutan:

1. `001_schema.sql`
2. `002_rls_policies.sql`
3. `003_rpc_bracket.sql`
4. `004_seed_default_data.sql`

Seed membuat tournament `super-challenge`, 16 tim, 15 match single elimination, dan default BO3.

## Admin Pertama

1. Buka Supabase Dashboard.
2. Masuk Authentication.
3. Buat user admin dengan email dan password.
4. Ambil `user_id` dari user tersebut.
5. Jalankan SQL:

```sql
insert into public.admin_users (user_id, email, display_name, role, active)
values (
  'PASTE_AUTH_USER_ID_DI_SINI',
  'admin@email.com',
  'Admin',
  'admin',
  true
);
```

Setelah itu login lewat `/admin`.

## Migrasi Data Lama

Di Admin Panel:

- `Export Supabase JSON`: backup data Supabase.
- `Import Legacy JSON`: upload JSON hasil export lama.
- `Upload Browser localStorage`: membaca key lama `superchallenge_*` di browser admin saat ini dan mengirimnya ke Supabase.

Setelah migrasi, Supabase menjadi source of truth. Browser hanya menyimpan cache:

- `superchallenge_cache_last_known_good`
- `superchallenge_cache_updated_at`

## Vercel

Set env production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`vercel.json` sudah mengarahkan semua route SPA ke `/`, sehingga refresh `/admin`, `/jadwal`, dan `/peringkat` tidak 404.
