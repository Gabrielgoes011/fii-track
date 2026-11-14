import './ui.css';

/**
 * Selo — etiqueta pequena de status (ex.: "Ativo", "Pendente", "Reinvestido").
 *
 * Props:
 *  tom  'neutro' (padrão) | 'sucesso' | 'aviso' | 'perigo' | 'info'
 */
export default function Selo({ tom = 'neutro', children }) {
  return <span className={`ui-selo ui-selo--${tom}`}>{children}</span>;
}
