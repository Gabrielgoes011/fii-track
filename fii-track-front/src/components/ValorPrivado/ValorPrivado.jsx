import React from 'react';
import { usePrivacy } from '../../context/PrivacyContext';

/**
 * ValorPrivado — exibe um valor financeiro com suporte a ocultação.
 *
 * Props:
 *  valor      string | number   Valor formatado ou bruto a exibir
 *  className  string?           Classe CSS extra
 *  style      object?           Estilos inline extras
 *
 * Quando `valoresOcultos` estiver ativo no contexto, renderiza "••••••"
 * no lugar do valor real.
 *
 * Exemplo de uso:
 *   <ValorPrivado valor={fmt(totalRecebido)} style={{ color: '#34d399', fontWeight: 700 }} />
 */
export default function ValorPrivado({ valor, style, className }) {
  const { valoresOcultos } = usePrivacy();

  return (
    <span
      className={className}
      style={{
        ...style,
        letterSpacing: valoresOcultos ? '0.12em' : undefined,
        filter: valoresOcultos ? 'blur(6px)' : 'none',
        userSelect: valoresOcultos ? 'none' : undefined,
        transition: 'filter 0.25s ease',
      }}
      aria-hidden={valoresOcultos}
    >
      {valor}
    </span>
  );
}
