import React from 'react';
import { FiLayers } from 'react-icons/fi';

function PaginaControleAtivos() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
          <FiLayers size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Controle de Ativos</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Gerencie e acompanhe seus ativos</p>
        </div>
      </div>

      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <FiLayers size={28} color="#8b5cf6" />
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>Em desenvolvimento</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Esta seção estará disponível em breve.</p>
      </div>
    </div>
  );
}

export default PaginaControleAtivos;
