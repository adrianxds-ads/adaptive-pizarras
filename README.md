# Pizarras 2.0

Aplicación de estudio adaptativo construida a partir de las pizarras y materiales reales de las clases de inglés de Adrián.

## Concepto 2.0

La unidad principal ya no es un nivel fijo de 15 preguntas. El modo principal es una CLASE ADAPTATIVA temporizada: la app recomienda la duración, normalmente entre 6 y 15 minutos, y sigue lanzando recuperaciones hasta que termina el tiempo de clase.

El banco canónico de Sara se mantiene como ancla curricular. Encima de ese banco, el motor puede usar reconocimiento, recall y memory recall, repetición espaciada, relearning de fallos dentro de la misma sesión y planes JSON generados desde ChatGPT.

El progreso anterior se conserva porque se mantienen los IDs de preguntas y la misma clave de almacenamiento.

## Modos

- CLASE ADAPTATIVA: sesión continua determinada por tiempo, no por número de preguntas.
- QUIZ RÁPIDO: conserva el formato clásico de 15 preguntas.
- LEER PRIMERO: activado por defecto; el reloj de respuesta empieza cuando aparecen las opciones.
- PLAN / JSON: exporta PIZARRAS_STUDY_STATE_V2 y acepta PIZARRAS_SESSION_PLAN_V2 o PIZARRAS_PACK_V2.

## Scheduler

La duración y el contenido tienen en cuenta revisiones vencidas, leeches, precisión reciente, tiempo desde la última clase, debilidad por concepto y etapa de recall. Los errores reaparecen más tarde dentro de la misma clase y reducen el intervalo de revisión.

Fuente documental: Pizarras + Sarah Classes (Anki) + Plaud B2. El contenido generado adicional debe seguir anclado a este material.

## v2.0.1 · Coach gate

Tras cada clase adaptativa, la siguiente queda bloqueada hasta aplicar un nuevo `PIZARRAS_SESSION_PLAN_V2` generado a partir del JSON de progreso. El Quiz rápido permanece independiente y no abre ni consume clases adaptativas.


## 24/10/2026 · Reparación local del vencimiento en quiz y clase

**Base:** `92cc8ec` (`main`). En la rama aislada `repair/classroom-deadline-20261024` se reprodujo un acierto después de superar el tiempo de respuesta cuando el callback del reloj iba retrasado (250 ms). En `app.js`, `answer()` comprueba `Date.now() >= deadline` y transforma la entrada tardía en `timeout`, sin modificar la duración contractual de las clases, los bancos, el historial ni la recuperación de errores.

**Prueba:** `python test-classroom-deadline-browser.py`: FAIL sobre base, PASS después en Edge aislado 360×740 y 412×915; valida quiz rápido, acierto dentro de plazo, registro único, y sesión de estudio con vencimiento de pregunta (error marcado como TIME) pero contrato de clase intacto y sesión abierta. 0 errores JS; también `node --check app.js` y `git diff --check`. **Estado:** commit local aislado, sin fusión, publicación, consumo de Argon ni acceso al progreso auténtico; Pixel pendiente.


### 24/10/2026 · Cierre de integración aislada y preparación PWA

- Recorrido de navegador: partida completa de 15 preguntas mediante botones (8/15; aciertos y errores); pantalla final, sesión y nivel recuperados tras recarga, sin errores JavaScript. Nivel simulado: 1 → 1 (quiz rápido). Perfiles Edge separados, sin datos personales. Test común: `C:\Users\adria\AppData\Local\Temp\hub-four-quizzes-fullround-20261024.py` (ejecutado para cuatro ramas; PASS).
- Prelectura: cuatro tarjetas ocultas antes de revelar, temporizador de respuesta activado después, único registro y modo `READ_FIRST` comprobados (PASS). Test común: `C:\Users\adria\AppData\Local\Temp\hub-four-quizzes-readfirst-20261024.py`.
- Versión candidata: `3.0.17`; el HTML actualiza rutas `app.js` y `service-worker.js`, se fuerza revisión del service worker y `build-assets.js` incorpora las huellas SHA-256 actualizadas. Cache build candidato: `bdf7b9eab47b32c0`. Verificado que los hashes corresponden a los archivos locales, sin tocar claves de almacenamiento, contenido pedagógico, Hub o Core.
- Reejecutadas tras preparar caché: pruebas de deadline, `node --check` en JS y `git diff --check` (PASS). En Cloze también batería oficial de 900 preguntas y temporizador adaptativo (PASS).
- Estado: cambios locales listos para revisión de integración, pero sin fusión ni despliegue. No se ha probado funcionamiento offline real con service worker ni en Pixel 10. Hasta publicación autorizada, Hub `versions.json` y versiones públicas siguen iguales.
