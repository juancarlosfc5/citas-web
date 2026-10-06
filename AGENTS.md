# `citas-web` — instrucciones del agente frontend

## Estado comprobado del repositorio

Al 2026-09-22 este repositorio contiene React 19 + TypeScript + Vite importado en `develop`, componentes del prototipo y trabajo local de integración de autenticación con pruebas. Ese trabajo debe verificarse antes de declararlo completado; la evidencia de aprobación visual sigue siendo necesaria.

El framework detectado es React. Antes de proponer cambios, inspeccionar `package.json`, configuración, `src`, estilos/tokens, scripts, pruebas y documentación/artefactos del diseño aprobado.

## Responsabilidad exclusiva

Este repositorio contiene únicamente la interfaz TypeScript: pantallas, componentes, formularios, estado de UI, accesibilidad, autorización de rutas, cliente REST, manejo de errores y pruebas/build del stack importado. No editar `../citas-api`.

La UI consume `citas-api` directamente por REST. No añadir Express, BFF ni lógica de negocio que sustituya la autoridad del backend.

## Fidelidad de diseño

- **DECISIÓN (2026-10-06):** con el MVP finalizado, el proyecto entra en fase de mejora. El diseño Stitch/AI Studio deja de ser fuente de verdad visual obligatoria; se autoriza su evolución según `mejora_frontend.md`.
- La fuente de verdad visual pasa a ser el sistema de tokens de `src/index.css` (`@theme`) y los componentes base de `src/components/ui/`.
- La skill local `taste-skill` (`.claude/skills/`) guía las decisiones estéticas; no sustituye requisitos, HU ni contratos REST.
- Toda pantalla debe ser responsive y verificarse en móvil (≥320 px), tablet (≥768 px), escritorio (≥1024 px) y pantalla grande (≥1536 px), sin scroll horizontal.
- Los cambios visuales no alteran lógica, handlers, cliente REST (`src/api`, `src/auth`), `types.ts`, `citas-api` ni la base de datos.
- Preservar textos accesibles, labels y roles usados por las pruebas; si un texto cambia, actualizar la prueba y documentarlo.

## Flujo por historia de usuario

1. Localizar la HU aprobada, criterios de aceptación y DoD. Si no existen, detener la implementación y solicitar o seguir el flujo autorizado de especificación.
2. Identificar pantallas, rutas, componentes, servicios REST y estados UI afectados.
3. Mapear explícitamente loading, empty, error, success y disabled, además de estados de acceso no autorizado cuando correspondan.
4. Implementar el cambio mínimo sin alterar el diseño aprobado ni trasladar reglas de negocio al cliente.
5. Ejecutar los scripts reales de build, typecheck y pruebas disponibles en el proyecto importado.
6. Verificar comportamiento contra criterios de aceptación y resumir evidencia y aspectos no verificados.

## API, seguridad y coordinación

- La URL de API debe obtenerse de la configuración de environment propia del stack detectado; no hardcodearla.
- No hardcodear tokens, secretos ni credenciales; no registrarlos en consola.
- Tratar validaciones, disponibilidad, transiciones de cita, autorización y ownership como decisiones finales del backend. El cliente puede mejorar la experiencia, pero no sustituye la validación server-side.
- Si falta o cambia un contrato REST, reportarlo al orquestador con el endpoint, payload, respuesta/error esperado, pantallas afectadas y evidencia requerida. No editar `../citas-api`.
- No mantener una LLM Wiki propia; la memoria global está en `citas-api/docs/FCV Dev/llm-wiki/` bajo responsabilidad del orquestador.

## Git

`main` es estable y `develop` es la rama de trabajo definida por el workspace. Preservar cambios no relacionados y no reescribir historial.
