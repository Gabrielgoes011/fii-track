import './ui.css';

/**
 * EstadoVazio — mensagem para lista sem itens ou em carregamento.
 * Props: children (o texto, ex.: "Nenhum seguimento encontrado.")
 */
export default function EstadoVazio({ children }) {
  return <div className="ui-vazio">{children}</div>;
}
