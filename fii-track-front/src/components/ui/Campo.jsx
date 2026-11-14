import { forwardRef, useId } from 'react';
import './ui.css';

/**
 * Campo — rótulo + campo de texto com foco verde.
 *
 * Props:
 *  rotulo  string?
 *  erro    string? (mensagem de erro; deixa a borda vermelha)
 *  — o resto (value, onChange, placeholder, type, autoFocus...) vai direto para o <input>
 */
const Campo = forwardRef(function Campo({ rotulo, erro, id, className = '', ...resto }, ref) {
  const idGerado = useId();
  const idCampo = id || idGerado;

  return (
    <div className={['ui-campo', erro ? 'ui-campo--erro' : '', className].filter(Boolean).join(' ')}>
      {rotulo && <label htmlFor={idCampo}>{rotulo}</label>}
      <input id={idCampo} ref={ref} {...resto} />
      {erro && <span className="ui-campo__erro">{erro}</span>}
    </div>
  );
});

export default Campo;
