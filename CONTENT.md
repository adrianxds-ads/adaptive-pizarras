# Pizarras 2.0 · Study Engine

Pizarras 2.0 keeps the fixed Sara/Pizarras source bank as the curriculum anchor and changes the primary learning unit from a 15-question level to a timed adaptive study class.

The canonical bank remains 301 questions: 66 Speaking, 22 Connectors, 76 Grammar, 65 Vocabulary, 28 Phrasal verbs, 13 Corrections and 31 Word formation. Existing question IDs and the original storage key are preserved, so previous progress migrates forward.

## Main study mode

The default mode is CLASE ADAPTATIVA. The app recommends the duration itself, normally 6–15 minutes, using due reviews, leeches, recent accuracy and time since the previous study class. An imported ChatGPT plan can set 5–20 minutes.

The class does not end after 15 questions. Questions continue until the class timer expires; the current question is always allowed to finish. The scheduler prioritises due, weak, failed and unseen items, avoids immediate repetition, and deliberately reintroduces failed items later in the same class.

Retrieval progresses through RECOGNITION, RECALL and MEMORY. Speaking items are preferentially moved toward MEMORY once enough evidence exists. READ FIRST remains enabled by default; response-time metrics begin only when answer options appear.

## Spaced learning

Each item now stores last correctness, lapses, recall stage, interval and next due time. Correct retrievals increase the review interval; errors shorten it and trigger relearning inside the current class.

## JSON bridge

PIZARRAS_STUDY_STATE_V2 exports the learning state, weak items, category evidence, due reviews, recent errors and the locally recommended next class.

The app accepts PIZARRAS_SESSION_PLAN_V2 and PIZARRAS_PACK_V2. A plan can set duration, focus categories, exact item IDs and new anchored variations. New items are validated before being stored and coexist with the fixed Sara bank.

The former 15-question game remains available as QUIZ RÁPIDO for medals, short practice and comparison with the older model.