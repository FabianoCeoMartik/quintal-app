-- Rode SOMENTE se você já executou o schema.sql da primeira versão.
-- Corrige o trigger para contas criadas por celular (sem e-mail).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name',''), nullif(split_part(coalesce(new.email,''),'@',1),''), 'Novo usuário'),
          new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
