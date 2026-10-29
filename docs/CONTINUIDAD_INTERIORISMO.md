# Continuidad de Interiorismo — 27 de octubre de 2026

## Punto de partida recuperado

Se revisaron el historial local de Claude de este proyecto (sesión `27704a2a-1ccc-4e12-a624-313df221b44d`), sus memorias del proyecto, el diseño, el plan y los cambios existentes en ambos repositorios. La captura aportada coincide con el último mensaje del historial.

Claude dejó la Fase 8 terminada: Calendario mes/semana/lista y Ejecución dentro de la ficha del proyecto, con tareas, Gantt, hitos, evidencias e incidencias. Indicó verificación completa frontend, 175 tests backend y build, más prueba visual de escritorio/móvil. Esos resultados son antecedentes del historial; la validación nueva se registra en el plan.

## Plan y decisiones vigentes

- Diseño: `superpowers/specs/2026-10-27-interiorismo-reestructuracion-design.md`.
- Plan: `superpowers/plans/2026-10-27-interiorismo-reestructuracion.md`.
- Fases 1–8 marcadas terminadas: base compartida, proyectos, presupuesto tipo hoja, compras/liquidación, clientes, materiales/proveedores, documentos, calendario/ejecución.
- Fase 9 completada por Codex: Reportes y Dashboard. Estado de implementación y verificaciones en el plan.
- Fase 10 pendiente: Configuración con Flujo del negocio y Parametrización.
- Monedas PEN/USD/EUR separadas; las conversiones de cobros siguen las reglas existentes de Liquidación.
- Usar componentes compartidos y patrones TailAdmin, colores Markap, UI en español de Perú.
- No stage, stash, reset, commit, push ni publicación: el usuario gestiona Git. Hay modificaciones staged y unstaged previas; conservarlas.
- Arquitectura queda fuera de esta reestructuración.

## Notas heredadas pendientes

- Claude dejó en desarrollo el hito «Entrega final-Prueba» y el evento «Visita de obra-Prueba». No se han eliminado.
- El patrón de `defineComponentBinds` dentro de objetos planos puede ocultar valores iniciales. Fue corregido en los formularios de Fase 8 usando `reactive`; queda identificado en seis vistas de Arquitectura/Producción, como tarea aparte. La propuesta anterior figuraba descartada; no se amplió el alcance a esos módulos.
- Reportes tenía ese patrón: se sustituyó al rehacer la vista. Configuración se revisará en Fase 10.
- WhatsApp de Alquileres permanece en espera de acceso Meta y tres números; no forma parte de Interiorismo.

## Alcance de los nuevos reportes

Los movimientos del período y los saldos actuales se distinguen explícitamente. El costo real viene de la hoja activa y no suma otra vez costos antiguos de Ejecución ni compras de catálogo. Los cobros se muestran por moneda original; el saldo del proyecto se calcula con su tipo de cambio o el del presupuesto. Los cobros sin conversión aplicable se conservan aparte y se exportan a su propia hoja.

El usuario inició sesión personalmente después de un rechazo automático al uso de la cuenta de desarrollo. Con la sesión abierta se verificaron Dashboard, las cinco pestañas, cobros USD, estado vacío EUR, validación de fechas y descarga Excel. Se inspeccionó el archivo descargado: seis hojas, moneda explícita y montos numéricos. No se alteraron datos de negocio para probar esta fase. La siguiente fase es Configuración (Fase 10).
