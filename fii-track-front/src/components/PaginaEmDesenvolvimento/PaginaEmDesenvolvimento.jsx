import React from 'react';

/**
 * PaginaEmDesenvolvimento — componente reutilizável para páginas ainda não implementadas.
 *
 * Props:
 *  - titulo: string         — título da página (ex: "Configurações")
 *  - descricao: string      — descrição abaixo do título
 *  - icon: React.ComponentType — ícone a ser exibido (ex: FiSettings)
 *  - cor: string             — cor do gradiente/ícone (ex: "#64748b")
 */
export default function PaginaEmDesenvolvimento({ titulo, descricao, icon: Icon, cor = '#64748b' }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: `linear-gradient(135deg, ${cor}, ${cor}dd)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${cor}4d`,
        }}>
          <Icon size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{titulo}</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{descricao}</p>
        </div>
      </div>

      <div style={{
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px',
        padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: `${cor}1a`, border: `1px solid ${cor}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          <Icon size={28} color={cor} />
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>Em desenvolvimento</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Esta seção estará disponível em breve!</p>
      </div>
    </div>
  );
}
