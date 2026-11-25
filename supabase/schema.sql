-- Quintal: schema Supabase (Etapa 1). Execute inteiro no SQL Editor.
create extension if not exists "pgcrypto";

-- PERFIS ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'Novo usuário',
  avatar_url text,
  cover_url text,
  bio text default '',
  status text default '',                       -- "No trabalho", "Jogando bola"
  testimonials_need_approval boolean not null default true,
  created_at timestamptz not null default now()
);

-- AMIZADES / BLOQUEIOS -------------------------------------------------
create type friendship_status as enum ('pending','accepted');
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- CONFIÁVEL / LEGAL / SEXY (0 a 3 por avaliador) ------------------------
create table public.profile_ratings (
  rater_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  trusty smallint not null default 0 check (trusty between 0 and 3),
  cool   smallint not null default 0 check (cool between 0 and 3),
  sexy   smallint not null default 0 check (sexy between 0 and 3),
  primary key (rater_id, target_id),
  check (rater_id <> target_id)
);

-- DEPOIMENTOS ------------------------------------------------------------
create type testimonial_status as enum ('pending','approved');
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,  -- dono do mural
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  status testimonial_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (profile_id <> author_id)
);

-- VISITANTES ---------------------------------------------------------------
create table public.profile_visits (
  id bigserial primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_id uuid not null references public.profiles(id) on delete cascade,
  visited_at timestamptz not null default now()
);
create index on public.profile_visits (profile_id, visited_at desc);

-- FEED -----------------------------------------------------------------------
create type post_visibility as enum ('public','friends');
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text default '',
  media_url text,
  media_type text check (media_type in ('image','video')),
  visibility post_visibility not null default 'public',
  created_at timestamptz not null default now()
);
create index on public.posts (created_at desc);
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- CHAT NORMAL (o Modo Efêmero NUNCA grava aqui) -----------------------------
create type message_type as enum ('text','image','video','audio');
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  type message_type not null default 'text',
  content text,
  media_url text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz
);
create index on public.messages (sender_id, receiver_id, created_at desc);
create index on public.messages (receiver_id, sender_id, created_at desc);

-- FUNÇÕES AUXILIARES -----------------------------------------------------------
create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a)));
$$;

create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

-- Perfil automático ao criar conta (Google)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name',''), nullif(split_part(coalesce(new.email,''),'@',1),''), 'Novo usuário'),
          new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Depoimento já nasce aprovado se o dono não exigir aprovação
create or replace function public.set_testimonial_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not (select testimonials_need_approval from profiles where id = new.profile_id) then
    new.status := 'approved';
  else
    new.status := 'pending';
  end if;
  return new;
end $$;
create trigger testimonial_status before insert on public.testimonials
  for each row execute function public.set_testimonial_status();

-- VIEWS ------------------------------------------------------------------------
create or replace view public.profile_stats with (security_invoker = true) as
select p.id as profile_id,
  (select count(*) from friendships f where f.status = 'accepted'
     and (f.requester_id = p.id or f.addressee_id = p.id)) as friends_count,
  coalesce((select round(avg(trusty) / 3.0 * 100) from profile_ratings r where r.target_id = p.id), 0) as trusty_pct,
  coalesce((select round(avg(cool)   / 3.0 * 100) from profile_ratings r where r.target_id = p.id), 0) as cool_pct,
  coalesce((select round(avg(sexy)   / 3.0 * 100) from profile_ratings r where r.target_id = p.id), 0) as sexy_pct
from profiles p;

-- RLS ------------------------------------------------------------------------------
alter table profiles        enable row level security;
alter table friendships     enable row level security;
alter table blocks          enable row level security;
alter table profile_ratings enable row level security;
alter table testimonials    enable row level security;
alter table profile_visits  enable row level security;
alter table posts           enable row level security;
alter table post_likes      enable row level security;
alter table comments        enable row level security;
alter table messages        enable row level security;

create policy "perfis visíveis" on profiles for select to authenticated using (not is_blocked(auth.uid(), id));
create policy "editar próprio perfil" on profiles for update to authenticated using (id = auth.uid());

create policy "ver minhas amizades" on friendships for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));
create policy "pedir amizade" on friendships for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending' and not is_blocked(requester_id, addressee_id));
create policy "aceitar amizade" on friendships for update to authenticated using (addressee_id = auth.uid());
create policy "desfazer amizade" on friendships for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

create policy "meus bloqueios" on blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy "ver avaliações" on profile_ratings for select to authenticated using (true);
create policy "avaliar amigo" on profile_ratings for insert to authenticated
  with check (rater_id = auth.uid() and are_friends(rater_id, target_id));
create policy "alterar minha avaliação" on profile_ratings for update to authenticated using (rater_id = auth.uid());

create policy "ver depoimentos" on testimonials for select to authenticated
  using (status = 'approved' or author_id = auth.uid() or profile_id = auth.uid());
create policy "escrever depoimento" on testimonials for insert to authenticated
  with check (author_id = auth.uid() and are_friends(author_id, profile_id));
create policy "dono aprova" on testimonials for update to authenticated using (profile_id = auth.uid());
create policy "apagar depoimento" on testimonials for delete to authenticated
  using (author_id = auth.uid() or profile_id = auth.uid());

create policy "registrar visita" on profile_visits for insert to authenticated
  with check (visitor_id = auth.uid() and profile_id <> auth.uid());
create policy "dono vê visitantes" on profile_visits for select to authenticated using (profile_id = auth.uid());

create policy "ver posts" on posts for select to authenticated
  using (not is_blocked(auth.uid(), author_id)
         and (author_id = auth.uid() or visibility = 'public' or are_friends(auth.uid(), author_id)));
create policy "criar post" on posts for insert to authenticated with check (author_id = auth.uid());
create policy "editar post" on posts for update to authenticated using (author_id = auth.uid());
create policy "apagar post" on posts for delete to authenticated using (author_id = auth.uid());

create policy "ver curtidas" on post_likes for select to authenticated using (true);
create policy "curtir" on post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "descurtir" on post_likes for delete to authenticated using (user_id = auth.uid());

create policy "ver comentários" on comments for select to authenticated using (true);
create policy "comentar" on comments for insert to authenticated with check (author_id = auth.uid());
create policy "apagar comentário" on comments for delete to authenticated using (author_id = auth.uid());

create policy "ver minhas mensagens" on messages for select to authenticated
  using (auth.uid() in (sender_id, receiver_id));
create policy "enviar mensagem" on messages for insert to authenticated
  with check (sender_id = auth.uid() and not is_blocked(sender_id, receiver_id));
create policy "marcar entrega/leitura" on messages for update to authenticated using (receiver_id = auth.uid());

-- REALTIME (Etapa 3 usa para ticks de leitura) -------------------------------------
alter publication supabase_realtime add table public.messages;

-- STORAGE ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('avatars','avatars',true), ('posts','posts',true), ('chat-media','chat-media',false)
on conflict do nothing;

-- Convenção de caminho: <bucket>/<user_id>/<arquivo>
create policy "ler avatars e posts" on storage.objects for select to authenticated
  using (bucket_id in ('avatars','posts'));
create policy "enviar na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','posts','chat-media') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "apagar da própria pasta" on storage.objects for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
create policy "ler mídia do chat (participantes)" on storage.objects for select to authenticated
  using (bucket_id = 'chat-media' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from messages m where m.media_url like '%' || storage.objects.name
               and m.receiver_id = auth.uid())));
