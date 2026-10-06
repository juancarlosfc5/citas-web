# Plan: Mejora visual y responsive de `citas-web`

**Fecha:** 2026-10-06
**Rama:** `develop`
**Complejidad:** Media (≈ 7–10 h)
**Decisión de origen:** MVP finalizado; se autoriza apartarse del diseño Stitch/AI Studio (ver `AGENTS.md` › Fidelidad de diseño).

## Resumen

Rediseñar todas las pantallas del portal con un sistema de tokens propio, guiado por la skill local `taste-skill`, y hacerlas totalmente responsive (móvil, tablet, escritorio, pantalla grande). Cambio exclusivamente de presentación: no se toca lógica, cliente REST, `citas-api` ni base de datos.

## Alcance

| Incluido | Excluido |
|---|---|
| `src/index.css`, `index.html` (fuentes/meta) | `src/api/*`, `src/auth/*`, `src/types.ts` |
| `src/components/*.tsx` (marcado y clases) | `../citas-api`, migraciones, base de datos |
| Nuevo `src/components/ui/*` (presentacional) | Endpoints, estados de cita, catálogos, reglas de negocio |
| Pruebas frontend solo si cambia un texto visible | Dependencias de runtime nuevas (salvo fuente) |

## Breakpoints objetivo

| Dispositivo | Ancho | Tailwind | Layout esperado |
|---|---|---|---|
| Móvil | 320–767 px | base | Una columna, header compacto, acción primaria fija/visible, modal a pantalla completa (sheet) |
| Tablet | 768–1023 px | `md:` | Perfil sobre citas o 2 columnas fluidas; calendario completo |
| Escritorio | 1024–1535 px | `lg:` | Perfil lateral + citas; modal centrado |
| Pantalla grande | ≥1536 px | `2xl:` | Contenedor máx. ~1440 px, tipografía y espaciado escalados con `clamp()` |

Reglas: sin scroll horizontal, objetivos táctiles ≥44 px, `env(safe-area-inset-*)` en móvil, imágenes con dimensiones explícitas.

## Patrones a respetar

| Categoría | Fuente | Patrón |
|---|---|---|
| Naming | `src/components/*.tsx` | Componentes PascalCase, un archivo por componente |
| Pruebas | `src/components/*.test.tsx` | Vitest + Testing Library, consultas por rol/texto |
| Estilos | `src/index.css` | Tailwind v4 (`@import "tailwindcss"`), sin config JS |
| Errores | `src/api/schedulingApi.ts` | Errores de API se muestran tal cual llegan; no reinterpretar reglas |

## Fases y tareas

### Fase 0 — Preparación
1. `npx skills add Leonxlnx/taste-skill` en `citas-web/`; verificar que quede en `.claude/skills/` (local). Revisar `SKILL.md` antes de usarlo.
2. Línea base: `npm run lint`, `npm test`, `npm run build`; capturas de cada pantalla en 375/768/1280/1920.

### Fase 1 — Tokens de diseño
- `@theme` en `src/index.css`: paleta (superficies, texto, acento clínico, semánticos éxito/aviso/error/info), radios, sombras con capas, escala tipográfica fluida `clamp()`, duraciones/easing.
- Par tipográfico deliberado (display + texto), `font-display: swap`; quitar Poppins hardcodeado.
- Modo oscuro: no por defecto; solo si se define con intención.

### Fase 2 — Componentes base (`src/components/ui/`)
`Button` (primario/secundario/ghost/danger, estados hover/focus/active/disabled/loading), `Card`, `Field` (label + input + error accesible), `StatusBadge`, `EmptyState`, `Skeleton`, `PageShell` (header responsive + contenedor).
- `StatusBadge` mapea solo la etiqueta visible (`REQUESTED` → "Solicitada", `APPROVED` → "Confirmada", etc.) a partir de los estados ya existentes en `types.ts`; no crea estados nuevos.

### Fase 3 — Autenticación
- `LoginScreen`, `RegisterScreen`, `PasswordRecoveryScreen`: layout dividido en escritorio (panel visual + formulario), una columna en móvil.
- Extraer subcomponentes presentacionales para bajar `RegisterScreen` (417 líneas) y `LoginScreen` (286) a <300; handlers y validaciones intactos.

### Fase 4 — Dashboard
- Header: un único CTA "Agendar cita" (eliminar duplicado "Nueva cita"); en móvil, botón flotante o barra inferior.
- Perfil: tarjeta compacta con avatar de iniciales; en móvil, colapsable sobre la lista.
- Mis citas: tarjetas con jerarquía (especialidad → fecha/hora destacada → profesional/sede), `StatusBadge`, acciones (Reprogramar / Cancelar / Historial) como botones accesibles; quitar círculos decorativos vacíos.
- Estados loading (skeleton), vacío y error diseñados.

### Fase 5 — Modal de agenda y calendario
- `BookAppointmentModal`: sheet a pantalla completa en móvil, centrado en ≥`md`; trampa de foco y cierre con Esc preservados.
- `AvailabilityCalendar`: celdas táctiles ≥44 px, días no disponibles diferenciados no solo por color, navegación por teclado, scroll horizontal de franjas solo dentro del componente.

### Fase 6 — Verificación
- `npm run lint && npm test && npm run build` en verde.
- Navegador local con cuenta sintética `paciente1`: 320, 375, 768, 1024, 1440, 1920 px.
- Accesibilidad: contraste AA, foco visible, teclado, `prefers-reduced-motion`.
- Revisión independiente (react-reviewer, solo lectura).
- `git -C ../citas-api status` sin cambios (evidencia de no tocar backend).
- Commits `feat:`/`refactor:` por fase en `develop`.

## Validación

```bash
npm run lint
npm test
npm run build
```

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Pruebas dependen de textos visibles | Media | Preservar labels/roles; si cambia texto, actualizar test y documentar |
| Skill de terceros con instrucciones no deseadas | Baja | Revisar `SKILL.md` antes de aplicar; no ejecuta código |
| Regresión funcional al dividir componentes | Media | Extraer solo JSX; handlers sin cambios; tests en cada fase |
| Rendimiento por fuentes/animaciones | Baja | ≤2 familias, animar solo `transform`/`opacity` |

## Aceptación

- [ ] Skill instalada localmente
- [ ] Todas las pantallas rediseñadas con tokens y componentes base
- [ ] Responsive verificado en los 4 rangos sin overflow horizontal
- [ ] Lint, tests y build en verde
- [ ] `citas-api` y base de datos sin cambios
