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


### 24/10/2026 · PWA offline con service worker real (cierre de versión candidata)

La primera prueba con servidor local en `127.0.0.1` identificó una huella desactualizada para `/adrian-core/components/adrian-sync.js` en `build-assets.js`: se esperaba `c675d9b7…`, aunque tanto el Core publicado como el archivo local daban SHA-256 `8372851b…`. Los workers con precarga obligatoria (Grammar y Classroom) no se activaban. Se actualizó **solo** ese hash en el manifiesto de esta rama y se recalculó `AdrianRelease.build` (sin tocar `adrian-core`, sus imports, claves de almacenamiento ni código pedagógico).

Prueba repetida: Edge en contexto nuevo, instalación y activación efectivas del service worker, recarga online, desconexión de red, recarga offline e inicio del quiz con cuatro respuestas. **PASS**; caché `fb7cb78203be4799` con 61 recursos, marcador de datos conservado, cero errores JS. Las otras tres ramas también dieron PASS. Comprobación global: 0 ficheros faltantes y 0 huellas SHA-256 discordantes en los cuatro manifiestos (comparados contra archivos locales, ahora equivalentes al recurso Core publicado).

Evidencia reproducible en el entorno Windows: `C:\Users\adria\AppData\Local\Temp\hub-offline-candidate-server-20261024.py` y `hub-offline-candidates-test-20261024.py`. El servidor de pruebas escucha solo en loopback y se detiene tras las pruebas. **No equivale** a actualización desde una caché real anterior, prueba física Pixel 10 ni despliegue. Sigue pendiente autorización para fusionar/publicar.


### 24/10/2026 · Verificación de actualización desde versión anterior (QA aislado)

- Versiones simuladas: `3.0.16` → `3.0.17`, con fuentes de `main` originales y rama candidata, y el recurso histórico de Core recuperado del commit `550f924` para conservar las huellas antiguas. Una respuesta real de prueba antes del cambio, comprobación de historial/nivel después y partida iniciada offline. **Sin navegador, progreso ni datos del usuario.**
- El service worker histórico se activó correctamente. La prueba detectó una carrera al navegar antes de que `clients.claim()` cediese control: la protección de datos bloqueaba el cargador `app.js` nuevo. Se corrigió la sincronización **del test**, no de la aplicación: esperar a que el controlador viejo sea `redundant` y que el nuevo esté activo. La transición entonces conservó respuesta, caché nueva y arranque offline.
- Prueba compartida reproducible: `_repair_cloze_20261024/test-four-pwa-upgrade.py` (Playwright + Edge en contextos nuevos, servidor HTTP solo en 127.0.0.1; prueba conjunta: **4/4 PASS**). La salida distingue tres cambios completos de service worker y la recuperación de progreso de Grammar con instalación nueva.
- No fusionado, no publicado ni comprobado en Pixel 10. No modifica las claves de progreso ni los bancos de preguntas. La sustitución de la caché antigua ya instalada de Grammar requiere comprobación posterior; ninguna prueba local certifica lo que ocurrirá en un dispositivo real.


### 24/10/2026 · Publicación comprobada (3.0.17)

- Integración en `main` por fast-forward, sin reescribir historial: `7691baa`. Push a `origin/main` aceptado; GitHub Pages sirve desde `main` (raíz).
- Verificación HTTP pública: `app.js`, `index.html`, `service-worker.js` y `build-assets.js` con HTTP 200 y SHA-256 idéntico a los archivos publicados previstos. Build de caché: `fb7cb78203be4799`.
- Verificación de uso: Edge en perfil **temporal y aislado**, navegación a `https://adrianxds-ads.github.io/adaptive-pizarras/`, instalación del service worker actualizado, recarga offline e inicio del quiz con cuatro respuestas (PASS; sin errores JS). La sincronización remota se bloqueó en las pruebas para no crear datos ficticios.
- Transición histórica 3.0.16 → 3.0.17 probada con service worker antiguo activo; el test espera la sustitución del controlador antes de cargar la versión nueva.
- Publicación y funcionamiento en navegador verificados; **no se ha verificado todavía el Pixel 10 ni una actualización física de una instalación previa**. No se alteraron claves ni registros de progreso de usuarios. No se modificaron Hub ni Core.


### 24/10/2026 · Cierre verificado en Pixel 10 real

- **Dispositivo:** Pixel 10, Android 17; WebAPK instalado y abierto de forma normal mediante ADB. Chrome DevTools remoto confirmó `APP_VERSION=3.0.17`, la activación del service worker de la versión publicada y el arranque funcional. Sin reinstalación, borrado de cachés ni respuesta a ejercicios.
- **Progreso conservado:** nivel 20, 19 sesiones y 492 respuestas. La recarga resolvió el bloqueo de carga de un script de Core con controlador antiguo; ClassroomBootComplete=true, sin ClassroomBootError y guardado persistente confirmado por IndexedDB. Registro v3 revisado frente al legado v2; 492 respuestas idénticas.
- **Prueba offline física:** se simuló la pérdida de conexión solo en la pestaña mediante Chrome DevTools (sin apagar Wi‑Fi ni datos móviles). Recarga sin red correcta, interfaz cargada, service worker activo y mismos contadores antes/después. Después se restauró la red de la pestaña y se verificó el arranque online (**PASS**).
- **Protección:** antes de la primera recarga se verificó una copia de seguridad local del almacenamiento. La posterior compresión GZIP de las claves de estudio se decodificó y comparó con los contadores e historiales originales; Classroom también se comprobó con registro IndexedDB respaldado y SHA-256 válido. Estas copias permanecen solo en el ordenador autorizado, fuera de Git; ningún dato personal se ha publicado.
- **Resultado:** versión publicada y funcionamiento **comprobados en el dispositivo objetivo**. Se devolvió ChatGPT al primer plano del Pixel y se retiró el túnel temporal de depuración. Sin bloqueos técnicos pendientes de esta reparación.
