# NewsInsular

Aplicación de noticias multiplataforma con Next.js, Expo y Supabase.

## Stack Tecnológico

- **Web**: Next.js 14+ App Router, Tailwind CSS
- **Móvil**: Expo React Native
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Despliegue web**: Vercel

## Estructura del Proyecto

```
NewsInsular/
├── apps/
│   ├── web/          → Next.js (web pública + admin)
│   └── mobile/       → Expo React Native
├── packages/
│   ├── ui/           → Componentes compartidos
│   ├── types/        → Tipos TypeScript
│   └── utils/        → Funciones utilitarias
├── supabase/
│   ├── migrations/   → Migraciones SQL
│   └── functions/    → Edge Functions
└── package.json      → Workspace raíz (pnpm)
```

## Requisitos Previos

- Node.js 18+
- pnpm 8+
- Cuenta de Supabase
- Cuenta de Vercel (para despliegue web)
- Expo CLI (para desarrollo móvil)

## Instalación

```bash
# Clonar repositorio
cd NewsInsular

# Instalar dependencias
pnpm install

# Crear archivo .env.local en apps/web
cp apps/web/.env.example apps/web/.env.local
# Editar con tus credenciales de Supabase
```

## Configuración de Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar migraciones:
   ```bash
   npx supabase db push
   ```
3. Crear bucket `news-images` en Storage (público)
4. Configurar autenticación por email/password
5. Crear 4 usuarios admin manualmente en Supabase Auth

## Desarrollo

```bash
# Web (Next.js)
pnpm dev:web

# Móvil (Expo)
pnpm dev:mobile
```

## Variables de Entorno

### apps/web/.env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### apps/mobile/.env

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Despliegue

### Web (Vercel)

```bash
cd apps/web
vercel deploy
```

### Móvil (EAS)

```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
```

## Funcionalidades

- Feed de noticias con carrusel de imágenes
- Filtro por categorías
- Registro de personas con validación de documento venezolano
- Panel de administración (CRUD noticias, categorías, personas)
- Exportación a Excel y PDF
- Notificaciones push (móvil)

## Licencia

MIT