import React, { useState, useEffect } from 'react';

/**
 * AreaChart — gráfico de área suave (Bezier) animado e interativo.
 *
 * Props:
 *  - data: Array<{ name: string, [key]: number }>
 *  - keys: Array<string>  — chaves a plotar (ex: ['Compra','Venda','Liquido'])
 *  - colors: Object       — { [key]: string } cor de cada chave
 *  - height?: number      — altura do SVG em px (default 160)
 *  - autoScale?: boolean  — escala Y baseada em min/max reais (default false → base 0)
 */
export default function AreaChart({ data, keys, colors, height = 160, autoScale = false }) {
  const [animate, setAnimate] = useState(false);
  const [hover, setHover] = useState(null); // índice do ponto sob o cursor/toque

  useEffect(() => {
    setAnimate(false);
    setHover(null);
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', padding: '2rem' }}>
        Nenhum dado disponível
      </div>
    );
  }

  const svgWidth  = 1200;
  const PAD_TOP = 15;
  const PAD_BOTTOM = 15;

  // Escala do eixo Y.
  //  - padrão (autoScale=false): base em zero, como antes (compatível com os usos atuais).
  //  - autoScale=true: usa min/max reais + folga de 15%, deixando visíveis variações
  //    pequenas em relação ao valor absoluto (ex.: patrimônio ~R$ 23 mil).
  const allValues = data.flatMap(item => keys.map(k => Number(item[k]) || 0));
  const rawMax = Math.max(...allValues);
  const rawMin = Math.min(...allValues);

  let minValue = 0;
  let maxValue = rawMax || 1;
  if (autoScale) {
    const span = rawMax - rawMin;
    const folga = span > 0 ? span * 0.15 : Math.abs(rawMax) * 0.05 || 1;
    minValue = rawMin - folga;
    maxValue = rawMax + folga;
    if (maxValue === minValue) maxValue = minValue + 1;
  }

  const getX = (i) =>
    data.length === 1
      ? svgWidth / 2
      : (i * (svgWidth / data.length)) + (svgWidth / data.length / 2);
  const getY = (val) => {
    const v = Number(val) || 0;
    const ratio = (v - minValue) / (maxValue - minValue);
    return height - ratio * (height - PAD_TOP - PAD_BOTTOM) - PAD_BOTTOM;
  };

  // Posições em % (para camadas HTML sobre o SVG — que usa preserveAspectRatio="none").
  const xPct = (i) => (getX(i) / svgWidth) * 100;
  const yPct = (val) => (getY(val) / height) * 100;

  const makePath = (key) => {
    let path = `M ${getX(0)},${getY(data[0][key] || 0)}`;
    for (let i = 1; i < data.length; i++) {
      const x0 = getX(i - 1);
      const y0 = getY(data[i - 1][key] || 0);
      const x1 = getX(i);
      const y1 = getY(data[i][key] || 0);
      const cx = (x0 + x1) / 2;
      path += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    return path;
  };

  const fmtBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Chave "principal" para o tooltip quando houver só uma série.
  const chaveTooltip = keys[0];
  const ativo = hover != null ? data[hover] : null;

  // Alinhamento horizontal do tooltip para não vazar nas bordas do gráfico.
  const tooltipAlinhaX = (i) => {
    const p = xPct(i);
    if (p < 12) return '0%';        // perto da borda esquerda: alinha à esquerda
    if (p > 88) return '-100%';     // perto da borda direita: alinha à direita
    return '-50%';                  // centralizado
  };

  return (
    <div style={{ position: 'relative', width: '100%', padding: '15px 5px 35px 5px', overflowX: 'auto' }}>
      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            {keys.map(key => (
              <linearGradient key={`grad-${key}`} id={`gradArea-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={colors[key]} stopOpacity="0.4" />
                <stop offset="100%" stopColor={colors[key]} stopOpacity="0.0" />
              </linearGradient>
            ))}
            <clipPath id="wipe-clip-area-chart">
              <rect
                x="0" y="-20" height={height + 40}
                width={animate ? '100%' : '0%'}
                style={{ transition: 'width 1.2s cubic-bezier(0.25, 1, 0.5, 1)' }}
              />
            </clipPath>
          </defs>

          <g clipPath="url(#wipe-clip-area-chart)">
            {keys.map(key => (
              <path
                key={`area-${key}`}
                d={`${makePath(key)} L ${getX(data.length - 1)},${height} L ${getX(0)},${height} Z`}
                fill={`url(#gradArea-${key})`}
              />
            ))}
            {keys.map(key => (
              <path
                key={`line-${key}`}
                d={makePath(key)}
                fill="none"
                stroke={colors[key]}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Linha-guia vertical no ponto ativo */}
            {hover != null && (
              <line
                x1={getX(hover)} y1="0" x2={getX(hover)} y2={height}
                stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Pontos — o ponto ativo cresce e ganha halo */}
            {data.map((d, i) =>
              keys.map(key => {
                const ativoPonto = hover === i;
                return (
                  <g key={`pt-${key}-${i}`}>
                    {ativoPonto && (
                      <circle
                        cx={getX(i)} cy={getY(d[key] || 0)}
                        r="9" fill={colors[key]} fillOpacity="0.18"
                        style={{ transition: 'r 0.15s ease' }}
                      />
                    )}
                    <circle
                      cx={getX(i)} cy={getY(d[key] || 0)}
                      r={ativoPonto ? 6 : 4}
                      fill={ativoPonto ? colors[key] : '#0f172a'}
                      stroke={colors[key]} strokeWidth="2.5"
                      style={{ transition: 'r 0.15s ease, fill 0.15s ease' }}
                    />
                  </g>
                );
              })
            )}
          </g>
        </svg>

        {/* Camada de captura (hitboxes por coluna) — melhora o hover no desktop e o toque no mobile */}
        <div
          style={{ position: 'absolute', inset: 0, display: 'flex' }}
          onMouseLeave={() => setHover(null)}
        >
          {data.map((_, i) => (
            <div
              key={`hit-${i}`}
              style={{ flex: '1 1 0', cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </div>

        {/* Tooltip flutuante sobre o ponto ativo */}
        {ativo && (
          <div
            style={{
              position: 'absolute',
              left: `${xPct(hover)}%`,
              top: `${yPct(ativo[chaveTooltip] || 0)}%`,
              transform: `translate(${tooltipAlinhaX(hover)}, calc(-100% - 14px))`,
              background: '#0b1120', border: '1px solid #334155', borderRadius: '10px',
              padding: '7px 11px', pointerEvents: 'none', whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)', zIndex: 5,
              transition: 'left 0.12s ease, top 0.12s ease',
            }}
          >
            <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{ativo.name}</p>
            {keys.map((key) => (
              <p key={`tt-${key}`} className="vp" style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, color: colors[key], display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[key], display: 'inline-block' }} />
                {fmtBRL(ativo[key])}
              </p>
            ))}
          </div>
        )}

        {/* Labels do eixo X na base (nome completo, sem cortar) */}
        <div style={{ display: 'flex', position: 'absolute', bottom: '-30px', left: 0, width: '100%', borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
          {data.map((item, idx) => (
            <div key={idx} style={{ flex: '1 1 0', textAlign: 'center', minWidth: 0 }}>
              <p style={{
                fontSize: '11px', fontWeight: hover === idx ? 700 : 600,
                color: hover === idx ? '#cbd5e1' : '#64748b',
                margin: 0, whiteSpace: 'nowrap', transition: 'color 0.15s ease',
              }}>
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
