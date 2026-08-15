# Distrito Cosmético Frontend

Cliente Vue 3, Vite, Vue Router y Pinia para el API de Distrito Cosmético.

## Desarrollo aislado

```bash
npm ci
npm run dev
```

Vite redirige `/api` a `http://localhost:3000`. Puede definir `VITE_API_BASE_URL` para utilizar otra URL. En producción se recomienda conservar `/api` para que frontend y backend compartan origen.

## Verificación

```bash
npm run lint
npm run build
```

El flujo normal de producción se ejecuta desde `distrito-cosmetico-backend` con `npm run build`; ese comando instala y construye este proyecto automáticamente.

La sesión JWT, la preferencia de moneda y el carrito de invitado utilizan claves propias de `localStorage`. Los datos locales de versiones anteriores no se leen ni se eliminan.
