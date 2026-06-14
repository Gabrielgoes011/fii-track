import React from 'react';

/**
 * SkeletonTable — linhas animadas para exibir enquanto a tabela carrega.
 * Props:
 *  - rows?: number  — quantidade de linhas (default 5)
 *  - cols?: number  — quantidade de colunas (default 4)
 */
export default function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
      <div style={{
        borderRadius: '12px',
        border: '1px solid #1e293b',
        overflow: 'hidden',
        background: '#0f172a',
      }}>
        {/* Header fake */}
        <div style={{
          background: 'rgba(16,185,129,0.06)',
          borderBottom: '1px solid rgba(16,185,129,0.15)',
          display: 'flex', gap: '1rem', padding: '0.75rem 1rem',
        }}>
          {[...Array(cols)].map((_, i) => (
            <div key={i} style={{
              height: '10px',
              width: i === 0 ? '15%' : i === cols - 1 ? '10%' : '20%',
              background: '#1e293b',
              borderRadius: '4px',
              animation: 'skeletonPulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[...Array(rows)].map((_, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid #1e293b' }}>
                {[...Array(cols)].map((_, ci) => (
                  <td key={ci} style={{ padding: '0.875rem 1rem' }}>
                    <div style={{
                      height: '13px',
                      width: ci === 0 ? '55%' : ci === cols - 1 ? '35%' : '75%',
                      background: '#1e293b',
                      borderRadius: '4px',
                      animation: 'skeletonPulse 1.5s ease-in-out infinite',
                      animationDelay: `${ri * 0.07}s`,
                    }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
