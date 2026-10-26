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
- **Progreso conservado:** la recarga resolvió el bloqueo de un script de Core con controlador antiguo; ClassroomBootComplete=true y guardado confirmado por IndexedDB. El registro v3 coincide con el legado v2 en todos los contadores y el historial.
- **Prueba offline física:** se simuló la pérdida de conexión solo en la pestaña mediante Chrome DevTools (sin apagar Wi‑Fi ni datos móviles). Recarga sin red correcta, interfaz cargada, service worker activo y mismos contadores antes/después. Después se restauró la red de la pestaña y se verificó el arranque online (**PASS**).
- **Protección:** antes de la primera recarga se verificó una copia de seguridad local del almacenamiento. La posterior compresión GZIP de las claves de estudio se decodificó y comparó con los contadores e historiales originales; Classroom también se comprobó con registro IndexedDB respaldado y SHA-256 válido. Estas copias permanecen solo en el ordenador autorizado, fuera de Git; no se han publicado los contenidos de las copias locales.
- **Resultado:** versión publicada y funcionamiento **comprobados en el dispositivo objetivo**. Se devolvió ChatGPT al primer plano del Pixel y se retiró el túnel temporal de depuración. Sin bloqueos técnicos pendientes de esta reparación.


### 26/10/2026 · Cloze Arena v2 · adaptación Mobile First (rama no publicada)

- **Referencia:** Cloze Arena & Mission Deck v2 publicada (GitHub b2-multiple-choice-cloze, main 25fdd85); diseño aprobado, sin modificar la referencia.
- **Integración:** hub-arena-mobile-v2.css y hub-arena-mobile-v2.js idénticos en Grammar/Phrasal/Classroom. Portada OLED/teal, estadísticas breves, HUD único, 15 segmentos, temporizador visual y opciones táctiles 2×2; resultados con detalles secundarios plegables.
- **Contratos conservados:** los motores originales, puntuación, bancos de preguntas, almacenamiento, sincronización y reglas de tiempo (15 segundos habitualmente y excepciones propias) no se modificaron. El nuevo HUD refleja los valores de los temporizadores existentes; no crea otro cronómetro.
- **PWA:** index.html y service-worker.js incorporan los nuevos recursos y build-assets.js incluye huellas SHA-256 y nueva identidad de caché.
- **QA verificadas en Edge temporal:** nueve de nueve combinaciones de 360x800, 390x844 y 412x915 para las tres apps; sesiones de 15 respuestas completas en las tres; pausa Grammar validada. Evidencias locales en la carpeta QA del espacio de revisión.
- **Pendiente:** el arranque de partida offline no superó la prueba consistente en el perfil aislado. Sí se comprobó la caché y carga de la portada sin red. Resolver antes de publicar y comprobar en Pixel 10 la experiencia PWA real.
- **Estado:** exclusivamente rama local feature/cloze-arena-mobile-20261026, sin push, merge ni publicación.


### 26/10/2026 · Auditoría de equivalencia Cloze Arena v2 cerrada

- Rama: feature/cloze-arena-mobile-20261026; sin merge, push ni publicación. Corrige la candidata anterior, cuya nota sobre offline queda superada.
- Reparación: las tarjetas correctas/incorrectas ahora tienen fondo verde/rojo íntegro y feedback coherente; el HUD muestra lectura previa, urgencia y respuesta registrada. En Grammar/Phrasal la respuesta correcta visible se usa para el feedback sintético; los motores de corrección son originales.
- Classroom: HUD del contrato de clase muestra tiempo y pregunta real sin límite falso de quince; 15 segmentos representan avance proporcional al mínimo de la sesión. Modo quiz rápido conserva sus 15 preguntas; no cambian sus reglas ni planificación.
- Pruebas de entorno aislado: 9/9 pantallas móvil de tres apps en 360×800, 390×844 y 412×915; partida de 15 respuestas en cada juego; test específico de contrato Classroom 21 preguntas y 70 minutos restantes; arranque PWA offline y cuatro respuestas activas en los tres juegos. Manifiesto SHA-256 de CSS/JS verificado.
- Intactos: bancos, contenidos, IDs, localStorage, IndexedDB, motores JS y referencias publicadas; Cloze estable no modificada.
- Pendiente externo: aprobación visual en Pixel 10 físico; no se ha probado actualización de las instalaciones del dispositivo ni autorizado publicación.


### 26/10/2026 · Cloze Arena v2 · publicación móvil verificada

- **Resultado:** publicado en main por fast-forward; commit visual anterior, más corrección SHA-256/service worker v2.0.1. Estado verificado: 11928fd.
- **QA pública:** GitHub Pages devuelve 5/5 archivos clave con SHA-256 exacto. Prueba real de página pública en navegador aislado: controlador PWA 2.0.1 activo, recursos del rediseño cargados, pantalla de partida con cuatro respuestas 2×2 y arranque offline superado sin errores JavaScript.
- **Protección:** sin cambios en motores de preguntas, progreso, claves de localStorage/IndexedDB ni ámbito de la PWA. No se ha limpiado caché ni desinstalado la aplicación.
- **Pendientes reales:** confirmar actualización y ergonomía en Pixel 10 físico. El icono aislado de cuatro colores mostrado por el usuario no coincide con los archivos icon.svg actuales ni se identificó en el DOM de los tres juegos; no se ha eliminado ni deben confundirse con la cuadrícula de respuestas.
- **Restauración:** etiqueta local stable-before-hub-arena-v2-20261026 apunta a la versión anterior a la publicación.


### 26/10/2026 · Corrección del desbordamiento móvil · Mission Deck

- Incidencia reproducida en Pixel 10 (captura del usuario): la portada de Grammar Quest tenía el panel de 540 px dentro de un viewport de 390 px, aunque html aplicaba overflow-x: clip. En navegador se midió #startScreen>.panel a x=12..552 px.
- Reparación en la capa compartida existente, sin apilar hojas CSS: width: 100%, max-width: min(540px,100%), min-width: 0, contención de flex/grid y texto de portada. En móviles estrechos, métricas 2+1 para respetar el ajuste accesible de 16 px que la aplicación aplica a algunas etiquetas. En pantallas anchas conserva tres columnas.
- No se aplicó literalmente el parche hipotético de Gemini para data-nucleo-game: estos juegos usan data-arena-mobile-v2. No se modifica Cloze, que sigue estable.
- CSS compartido aplicado en Grammar, Phrasal y Classroom. Se renueva la hoja ?v=2.0.2, el service worker ?v=2.0.2, la precaché y el manifiesto SHA-256.
- Validación aislada en Edge/Chromium con 360x800, 390x844, 412x915: 9/9 portadas geométricamente correctas incluso haciendo overflow-x: visible temporalmente; 9/9 partidas con preguntas y opciones 2x2; 3/3 PWA offline con cuatro respuestas activas; pruebas sin errores JavaScript.
- Protección: bancos, progreso, temporizadores, estadística, motores originales e instalaciones publicadas no modificados. Confirmación en Pixel físico y publicación quedan pendientes y precisan autorización separada.
- Estado de entrega: rama local fix/arena-mobile-panel-20261026 (sin push ni merge).


### 26/10/2026 · Cierre publicado · Portada Mobile First sin desbordamiento

- Resultado: corrección geométrica de la portada integrada en main y publicada en GitHub Pages (commit de aplicación 2078504c6, CSS y service worker 2.0.2). Cloze se mantiene como referencia estable sin cambios.
- Pruebas: 9/9 tamaños móviles (360×800, 390×844 y 412×915), con overflow-x: visible temporal para evitar falsos negativos por recorte; 15/15 archivos públicos coincidentes con SHA-256 local; 3/3 navegadores públicos abren una partida offline y registran una respuesta.
- Protección: sin cambios en motor, banco, almacenamiento, claves de progreso ni identidad/scope de la PWA; no se borró caché ni se reinstaló la aplicación.
- Resta verificación física de la PWA instalada en Pixel 10; las pruebas aquí son de navegador aislado. La corrección previa sigue en la etiqueta local safe-before-arena-mobile-overflow-20261026.
