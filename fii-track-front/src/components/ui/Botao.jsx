import './ui.css';

/**
 * Botao — botão padrão do app.
 *
 * Props:
 *  variante  'primario' (verde, padrão) | 'secundario' | 'perigo' | 'fantasma'
 *  tamanho   'md' (padrão) | 'sm'
 *  icone     ReactNode? (ex.: <FiPlus size={15} />), aparece antes do texto
 *  bloco     boolean (ocupa a largura toda)
 *  — o resto (onClick, type, disabled, title...) vai direto para o <button>
 */
export default function Botao({
  variante = 'primario', tamanho = 'md', icone, bloco = false,
  type = 'button', className = '', children, ...resto
}) {
  const classes = [
    'ui-btn',
    `ui-btn--${variante}`,
    tamanho === 'sm' ? 'ui-btn--sm' : '',
    bloco ? 'ui-btn--bloco' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} {...resto}>
      {icone}
      {children}
    </button>
  );
}
