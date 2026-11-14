import './ui.css';

/**
 * Card — container padrão (superfície escura com borda e sombra).
 *
 * Props:
 *  titulo     string? (mostra o cabeçalho)
 *  subtitulo  string?
 *  acao       ReactNode? (botões à direita do cabeçalho)
 *  destaque   boolean (faixa verde na esquerda, usada nos itens de lista do celular)
 *  compacto   boolean (menos espaço interno, para itens de lista)
 *  semPadding boolean (corpo sem espaço interno, ex.: tabela que ocupa o card todo)
 */
export default function Card({
  titulo, subtitulo, acao, destaque = false, compacto = false, semPadding = false,
  className = '', style, children,
}) {
  const corpoClasse = semPadding
    ? ''
    : `ui-card__corpo${compacto ? ' ui-card__corpo--compacto' : ''}`;

  return (
    <section
      className={['ui-card', destaque ? 'ui-card--destaque' : '', className].filter(Boolean).join(' ')}
      style={style}
    >
      {(titulo || acao) && (
        <header className="ui-card__cab">
          <div>
            {titulo && <h2 className="ui-card__titulo" style={{ display: 'inline' }}>{titulo}</h2>}
            {subtitulo && <span className="ui-card__subtitulo">{subtitulo}</span>}
          </div>
          {acao && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{acao}</div>}
        </header>
      )}
      <div className={corpoClasse}>{children}</div>
    </section>
  );
}
