import React from 'react';
import { usePrivacy } from '../../context/PrivacyContext';

/**
 * Componente que aplica blur em valores financeiros quando o modo privacidade está ativo.
 * 
 * Uso:
 *   <ValorPrivado>{fmt(valor)}</ValorPrivado>
 *   <ValorPrivado style={{ color: '#34d399' }}>{fmt(valor)}</ValorPrivado>
 */
export default function ValorPrivado({ children, style = {}, as: Tag = 'span' }) {
  const { valoresOcultos } = usePrivacy();

  const estiloBlur = valoresOcultos
    ? { ...style, filter: 'blur(8px)', userSelect: 'none', pointerEvents: 'none' }
    : style;

  return <Tag style={estiloBlur}>{children}</Tag>;
}
