import React, { useState, useEffect } from 'react';

/**
 * AreaChart — gráfico de área suave (Bezier) animado.
 *
 * Props:
 *  - data: Array<{ name: string, [key]: number }>
 *  - keys: Array<string>  — chaves a plotar (ex: ['Compra','Venda','Liquido'])
 *  - colors: Object       — { [key]: string } cor de cada chave
 *  - height?: number      — altura do SVG em px (default 160)
 */
export default function AreaChart({ data, keys, colors, height = 160 }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
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

  const maxValue = Math.max(...data.flatMap(item => keys.map(k => Math.max(0, item[k] || 0)))) || 1;
  const svgWidth  = 1200;

  const getX = (i) => (i * (svgWidth / data.length)) + (svgWidth / data.length / 2);
  const getY = (val) => height - (Math.max(0, val) / maxValue) * (height - 30) - 15;

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

  return (
    <div style={{ position: 'relative', width: '100%', padding: '15px 5px 35px 5px', overflowX: 'auto' }}>
      <div style={{ position: 'relative', width: '100%', minWidth: '600px', height: `${height}px` }}>
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
            {data.map((d, i) =>
              keys.map(key => (
                <circle
                  key={`pt-${key}-${i}`}
                  cx={getX(i)} cy={getY(d[key] || 0)}
                  r="4" fill="#0f172a" stroke={colors[key]} strokeWidth="2.5"
                  style={{ cursor: 'pointer' }}
                >
                  <title>{key}: {(d[key] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</title>
                </circle>
              ))
            )}
          </g>
        </svg>

        {/* Labels dos meses na base */}
        <div style={{ display: 'flex', position: 'absolute', bottom: '-30px', left: 0, width: '100%', borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
          {data.map((item, idx) => (
            <div key={idx} style={{ flex: '1 1 0', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: 0 }}>
                {String(item.name).substring(0, 3)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
