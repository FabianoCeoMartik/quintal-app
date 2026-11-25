# Quintal — Super App Social

Perfil estilo Orkut + feed estilo Instagram/Facebook + chat dual (normal e Modo Efêmero em RAM).

## Estrutura
```
quintal/
├─ supabase/schema.sql        # tabelas, RLS, triggers, buckets
├─ server/                    # Node + Express + Socket.io
│  └─ src/{index.js, lib/supabase.js}
└─ client/                    # React (Vite) + Tailwind + Lucide
   └─ src/{lib, context, components, pages}
```

## Como rodar (Windows / PowerShell)
1. **Supabase**: crie um projeto → SQL Editor → cole e execute `supabase/schema.sql`.
2. **Login Google**: Authentication → Providers → Google (Client ID/Secret do Google Cloud). Em *URL Configuration* adicione `http://localhost:5173`.
3. **Variáveis**:
   ```
   copy server\.env.example server\.env
   copy client\.env.example client\.env
   ```
   Preencha com URL e chaves do projeto (Settings → API).
4. **Backend**: `cd server; npm install; npm run dev` (porta 3001)
5. **Frontend**: `cd client; npm install; npm run dev` (porta 5173)

## Login (Etapa 1)
- **E-mail + senha**: Supabase → Authentication → Providers → Email (confirmação de e-mail ligada).
- **Google**: Providers → Google.
- **Celular + SMS**: Providers → Phone, escolha um provedor de SMS (Twilio, MessageBird, Vonage...). Provedor de SMS é serviço pago.
- **URL Configuration → Redirect URLs**: adicione `com.quintal.app://login-callback` e `http://localhost:5173`.
- **Esqueci a senha**: por e-mail (link) ou por celular (código SMS → tela de nova senha).
- Se já rodou o `schema.sql` antes, rode também `supabase/patch-auth.sql`.

## Gerar o APK (Windows)
Requer Android Studio (já traz JDK 17+ e SDK).
```
cd client
npm install
npm run android:setup     # só na primeira vez: cria a pasta android/ e registra o link de retorno
npm run android:open      # abre no Android Studio → Build > Build APK(s)
```
Depois de mudar o código: `npm run android:sync`. O servidor Node precisa estar acessível pelo celular (veja `client/.env.example`).

## Etapas
- [x] 1. Arquitetura, schema, navegação e auth
- [ ] 2. Perfil Orkut + Feed
- [ ] 3. Chat normal
- [ ] 4. Modo Efêmero (RAM)
