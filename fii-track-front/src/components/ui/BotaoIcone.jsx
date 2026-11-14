import './ui.css';

/**
 * BotaoIcone — botão quadrado só com ícone (editar, excluir, visualizar...).
 *
 * Props:
 *  icone   ReactNode (obrigatório)
 *  tom     'info' (azul, padrão) | 'perigo' (vermelho) | 'neutro'
 *  rotulo  string (vira title e aria-label; obrigatório para acessibilidade)
 *  — o resto (onClick, disabled...) vai direto para o <button>
 */
export default function BotaoIcone({ icone, tom = 'info', rotulo, className = '', ...resto }) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      className={['ui-icone', `ui-icone--${tom}`, className].filter(Boolean).join(' ')}
      {...resto}
    >
      {icone}
    </button>
  );
}
