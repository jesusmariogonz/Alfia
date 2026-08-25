export type GlossaryTerm = {
  term: string;
  definition: string;
};

export const GLOSSARY: GlossaryTerm[] = [
  { term: "Acción", definition: "Un título que representa una parte de la propiedad de una empresa. Al comprarla, te vuelves accionista y participas de sus ganancias o pérdidas." },
  { term: "ETF", definition: "Fondo cotizado en bolsa que agrupa muchos activos (acciones, bonos, etc.) en un solo instrumento que se compra y vende como una acción." },
  { term: "Volatilidad", definition: "Qué tanto varía el precio de un activo en el tiempo. Mayor volatilidad implica movimientos de precio más grandes, hacia arriba o hacia abajo." },
  { term: "Sharpe ratio", definition: "Mide el retorno de una inversión ajustado por el riesgo que tomaste para conseguirlo. Un Sharpe más alto significa mejor retorno por unidad de riesgo." },
  { term: "Drawdown", definition: "La caída porcentual desde el punto más alto que alcanzó un activo hasta su punto más bajo posterior. Mide cuánto se pudo haber perdido en el peor momento." },
  { term: "Value at Risk (VaR)", definition: "Una estimación de la pérdida máxima esperada en un periodo, con cierto nivel de confianza. Un VaR del 3% al 95% significa que en el 95% de los días la pérdida no superó el 3%." },
  { term: "Diversificación", definition: "Repartir una inversión entre distintos activos para reducir el impacto de que uno solo tenga un mal desempeño." },
  { term: "Media móvil", definition: "El promedio del precio de un activo durante un número fijo de días, usado para suavizar el ruido y detectar tendencias." },
  { term: "RSI (Índice de Fuerza Relativa)", definition: "Un indicador entre 0 y 100 que mide si un activo está sobrecomprado (valores altos) o sobrevendido (valores bajos) en el corto plazo." },
  { term: "Simulación de Montecarlo", definition: "Una técnica que corre miles de escenarios posibles al azar, respetando el comportamiento histórico de un activo, para estimar un rango de resultados futuros." },
  { term: "Backtesting", definition: "Probar una estrategia de inversión sobre datos históricos para ver cómo se hubiera comportado, antes de aplicarla con dinero real." },
  { term: "Renta fija", definition: "Instrumentos de deuda (como bonos) que pagan un interés pactado de antemano, generalmente con menor riesgo que las acciones." },
  { term: "Capitalización de mercado", definition: "El valor total de una empresa en bolsa: su precio por acción multiplicado por el número de acciones en circulación." },
  { term: "Dividendo", definition: "Una parte de las ganancias de una empresa que se reparte periódicamente entre sus accionistas." },
  { term: "Correlación", definition: "Qué tanto se mueven dos activos juntos. Una correlación alta significa que suben y bajan al mismo tiempo; una baja o negativa ayuda a diversificar." },
];
