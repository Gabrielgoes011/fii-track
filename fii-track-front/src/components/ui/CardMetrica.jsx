import './ui.css';

/**
 * CardMetrica — número de destaque com rótulo (ex.: "Total de Seguimentos").
 *
 * Props:
 *  rotulo  string
 *  valor   string | number | ReactNode
 *  tom     'accent' (verde, padrão) | 'texto' | 'aviso' | 'perigo'
 *  privado boolean (esconde com blur quando o modo privacidade está ligado: classe .vp do global.css)
 */
export default function CardMetrica({ rotulo, valor, tom = 'accent', privado = false }) {
  const tomClasse = tom === 'accent' ? '' : ` ui-metrica__valor--${tom}`;

  return (
    <div className="ui-metrica">
      <p className="ui-metrica__rotulo">{rotulo}</p>
      <p className={`ui-metrica__valor${tomClasse}${privado ? ' vp' : ''}`}>{valor}</p>
    </div>
  );
}
