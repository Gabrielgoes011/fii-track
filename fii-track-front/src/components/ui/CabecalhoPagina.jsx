import './ui.css';

/**
 * CabecalhoPagina — título da página, subtítulo e a ação principal à direita.
 * O tamanho do título se ajusta sozinho ao celular (CSS), não precisa de isMobile.
 *
 * Props:
 *  titulo     string
 *  subtitulo  string?
 *  acao       ReactNode? (normalmente um <Botao>)
 */
export default function CabecalhoPagina({ titulo, subtitulo, acao }) {
  return (
    <header className="ui-pagina-cab">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {acao}
    </header>
  );
}
