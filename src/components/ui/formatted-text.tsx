/**
 * Renderiza texto generado por IA con un formato ligero tipo markdown:
 * **negritas**, líneas que empiezan con "- " como viñetas, y párrafos
 * separados por saltos de línea. No es un parser de markdown completo
 * a propósito — la IA solo necesita estas tres cosas para estructurar
 * una respuesta legible (encabezados cortos en negrita + viñetas).
 */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export function FormattedText({ text, className }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n{2,}/);

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((l) => l.trim());
        const isList = lines.length > 0 && lines.every((l) => /^[-•]\s/.test(l.trim()));

        if (isList) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-5">
              {lines.map((line, i) => (
                <li key={i} className="text-sm leading-relaxed text-text">
                  {renderInline(line.trim().replace(/^[-•]\s/, ""), `${blockIndex}-${i}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className="text-sm leading-relaxed text-text">
            {lines.map((line, i) => (
              <span key={i}>
                {renderInline(line, `${blockIndex}-${i}`)}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
