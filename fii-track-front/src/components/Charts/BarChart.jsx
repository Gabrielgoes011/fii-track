import React, { useState, useEffect } from 'react';

/**
 * BarChart — gráfico de barras verticais animado.
 *
 * Props:
 *  - data: Array<{ name: string, [key]: number }>
 *  - keys: Array<string>   — chaves a plotar (ex: ['Compra','Venda','Liquido'])
 *  - colors: Object        — { [key]: string } cor de cada chave
 *  - height?: number       — altura das barras em px (default 150)
 *  - barMaxWidth?: number  — largura máxima de cada barra em px (default: auto por nº de séries)
 */
export default function BarChart({ data, keys, colors, height = 150, barMaxWidth }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', padding: '2rem' }}>
        Nenhum dado disponível
      </div>
    );
  }

  const maxValue = Math.max(...data.flatMap(item => keys.map(k => item[k] || 0))) || 1;
  // largura máxima: prop explícita > auto (quanto menos séries, mais larga)
  const maxW = barMaxWidth ?? (keys.length === 1 ? 48 : keys.length === 2 ? 24 : 14);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', flex: 1, gap: '4px', overflowX: 'auto', padding: '15px 5px' }}>
      {data.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0', minWidth: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: `${height + 10}px`, width: '100%', justifyContent: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '4px' }}>
            {keys.map((key, ki) => (
              <div
                key={key}
                style={{
                  width: `${Math.floor(80 / keys.length)}%`,
                  maxWidth: `${maxW}px`,
                  height: animate ? `${((item[key] || 0) / maxValue) * height}px` : '0px',
                  background: colors[key] || '#3b82f6',
                  borderRadius: '4px 4px 0 0',
                  transition: `height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.05 + ki * 0.1}s`,
                  minHeight: (item[key] || 0) > 0 ? '3px' : '0px',
                }}
                title={`${key}: ${(item[key] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
              />
            ))}
          </div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '8px 0 0 0' }}>
            {String(item.name).substring(0, 3)}
          </p>
        </div>
      ))}
    </div>
  );
}
