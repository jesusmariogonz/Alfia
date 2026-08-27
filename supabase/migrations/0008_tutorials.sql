-- Tutoriales de Aprende, ahora en base de datos (antes hardcodeados en el
-- repo) para que /api/cron/tutorials pueda publicar una nota nueva cada 2
-- días sin necesitar un deploy. Sembramos los 4 tutoriales existentes con
-- published_at escalonado cada 2 días para no romper el orden actual.
create table if not exists tutorials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  minutes integer not null,
  content text[] not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists tutorials_published_at_idx on tutorials (published_at desc);

alter table tutorials enable row level security;

create policy "tutorials_select_all" on tutorials
  for select
  using (true);

insert into tutorials (slug, title, summary, minutes, content, published_at) values
(
  'que-es-la-volatilidad',
  'Qué es la volatilidad y por qué importa',
  'Entiende qué mide la volatilidad y cómo usarla para dimensionar el riesgo de una inversión.',
  4,
  ARRAY[
    'La volatilidad mide qué tanto se mueve el precio de un activo respecto a su promedio. No indica si un activo va a subir o bajar — solo qué tan grandes pueden ser sus movimientos.',
    'Un activo con volatilidad anualizada de 15% se mueve, en un año típico, dentro de un rango relativamente angosto alrededor de su tendencia. Uno con 60% puede tener oscilaciones mucho más bruscas en cualquier dirección.',
    'En Alfia verás la volatilidad anualizada en la ficha de cada activo y en el screener. Es útil para comparar el ''nivel de montaña rusa'' de dos inversiones antes de decidir cuánto capital destinarles.',
    'Una volatilidad alta no es necesariamente mala: activos más volátiles suelen (aunque no siempre) ofrecer mayor retorno potencial a cambio de mayor incertidumbre en el camino.'
  ],
  now() - interval '8 days'
),
(
  'leer-una-simulacion-de-montecarlo',
  'Cómo leer una simulación de Montecarlo',
  'El simulador te da percentiles, no una predicción única. Aquí te explicamos cómo interpretarlos.',
  5,
  ARRAY[
    'Una simulación de Montecarlo corre miles de escenarios posibles para tu inversión, cada uno con una combinación distinta (pero plausible) de rendimientos diarios.',
    'El resultado se resume en percentiles: el percentil 50 (mediana) es el escenario ''del medio'' — la mitad de las simulaciones terminaron mejor y la mitad peor. El percentil 5 muestra un escenario pesimista, y el 95 uno optimista.',
    'La ''probabilidad de pérdida'' te dice en qué porcentaje de los escenarios simulados terminaste con menos dinero del que empezaste. No es una certeza sobre el futuro — es una forma de dimensionar qué tan amplio es el rango de resultados posibles.',
    'Úsalo para calibrar expectativas, no para predecir un número exacto: ninguna simulación sabe qué va a pasar mañana, pero te ayuda a entender el abanico razonable de desenlaces dado el comportamiento histórico del activo.'
  ],
  now() - interval '6 days'
),
(
  'backtesting-para-principiantes',
  'Backtesting para principiantes',
  'Qué es probar una estrategia contra el pasado, y sus límites más importantes.',
  4,
  ARRAY[
    'Backtesting significa aplicar las reglas de una estrategia (por ejemplo, ''comprar cuando el precio cruza arriba de su media móvil de 50 días'') sobre datos históricos, para ver qué resultado hubiera dado.',
    'Es útil para descartar rápidamente ideas que claramente no funcionan, y para entender cómo se hubiera comportado una estrategia en distintos periodos de mercado.',
    'Su limitación más importante: el hecho de que algo haya funcionado en el pasado no garantiza que funcione en el futuro. Además, un backtest simple no incluye comisiones, impuestos ni la dificultad real de ejecutar cada operación en el momento exacto.',
    'En Alfia, el número de ''operaciones'' que arroja un backtest es una pista clave: entre más operaciones genera una estrategia, más sensible es a esos costos que el backtest no está midiendo.'
  ],
  now() - interval '4 days'
),
(
  'diversificacion-basica',
  'Diversificación: no pongas todo en un solo activo',
  'La idea más simple y más repetida en inversión, explicada sin rodeos.',
  3,
  ARRAY[
    'Diversificar significa repartir tu dinero entre distintos activos para que el mal desempeño de uno no arrastre todo tu portafolio.',
    'Funciona mejor cuando combinas activos que no se mueven exactamente igual (baja correlación): si uno cae, otro puede mantenerse estable o subir, amortiguando el golpe.',
    'No elimina el riesgo por completo — si todo el mercado cae, la mayoría de los activos caen juntos — pero sí reduce el riesgo específico de que una sola mala decisión defina tu resultado.',
    'El chat de inversión de Alfia (Pro) puede comparar, lado a lado, qué tan distinto se comportan dos inversiones que estás considerando combinar.'
  ],
  now() - interval '2 days'
)
on conflict (slug) do nothing;
