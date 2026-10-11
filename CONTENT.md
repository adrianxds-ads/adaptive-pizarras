# Classroom B2 · currículo v3 (11/10/2026)

El nuevo ciclo empieza en CLASE 1 con una clave de progreso nueva: `classroom_b2_state_v3`. El historial del ciclo anterior permanece guardado localmente bajo `pizarras_state_v1`. El banco anterior completo sigue en `questions.js`.

El contenido combina 12 clases temáticas con 144 preguntas originales para este nuevo ciclo y 269 preguntas seleccionadas del banco previo. Se han reducido los bloques mecánicos de `do vs make`, conservando los temas de Sara/Pizarras. Las clases tienen variedad de gramática, vocabulario, conversación, conectores, formación de palabras y phrasals.

El algoritmo da prioridad a preguntas nuevas y a la diversidad de conceptos y respuestas; evita reponer un acierto dentro de la misma clase y limita a una sola repetición los errores, siempre después de otras doce preguntas como mínimo. Los planes JSON externos son opcionales y actúan como orientación, sin restringir toda la clase a unos pocos IDs.

La escritura queda reservada a respuestas de dos o tres letras que corresponden a partículas de phrasal verbs. Se mantienen la lectura previa, el temporizador de 15 segundos, la exportación JSON, las medallas y el modo de clases temporizadas.

Pruebas: `node tests/curriculum-v3.cjs` y `node tests/session-recovery.cjs`.
