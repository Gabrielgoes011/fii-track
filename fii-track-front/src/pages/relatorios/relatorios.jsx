import React from 'react';
import { FiFileText } from 'react-icons/fi';

function PaginaRelatorios() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}>
          <FiFileText size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Relatórios</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Visualize relatórios e análises da sua carteira</p>
        </div>
      </div>

      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <FiFileText size={28} color="#06b6d4" />
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>Em desenvolvimento</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Esta seção estará disponível em breve.</p>
      </div>
    </div>
  );
}

export default PaginaRelatorios;
