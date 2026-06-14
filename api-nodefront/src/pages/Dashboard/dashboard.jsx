import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiBarChart2, FiPieChart, FiArrowUpRight } from 'react-icons/fi';
import { FaWallet, FaExchangeAlt, FaChartLine } from 'react-icons/fa';
import { useHomeCards } from '../../hooks/home/useHomeCards';

const cardsTemplate = [
  {
    icon: FaWallet,
    iconColor: '#10b981',
    iconBg: 'rgba(16,185,129,0.12)',
    title: 'Carteira de FIIs',
    desc: 'Acompanhe seus fundos imobiliários e a evolução do seu patrimônio.',
    tag: 'Ativos',
    tagColor: '#10b981',
    tagBg: 'rgba(16,185,129,0.1)',
    route: '/controle-ativos',
    dataKey: 'fundos',
  },
  {
    icon: FaChartLine,
    iconColor: '#06b6d4',
    iconBg: 'rgba(6,182,212,0.12)',
    title: 'Rendimentos',
    desc: 'Controle os dividendos e proventos recebidos mensalmente.',
    tag: 'Mensal',
    tagColor: '#06b6d4',
    tagBg: 'rgba(6,182,212,0.1)',
    route: '/rendimentos',
  },
  {
    icon: FaExchangeAlt,
    iconColor: '#8b5cf6',
    iconBg: 'rgba(139,92,246,0.12)',
    title: 'Compras e Vendas',
    desc: 'Registre e consulte o histórico de ordens executadas.',
    tag: 'Histórico',
    tagColor: '#8b5cf6',
    tagBg: 'rgba(139,92,246,0.1)',
    route: '/operacoes',
    dataKey: 'operacoes',
  },
];

const statsTemplate = [
  { icon: FiTrendingUp, label: 'Rendimento Médio', value: '+12,4%', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { icon: FiBarChart2,  label: 'Operações',         color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', dataKey: 'operacoes' },
  { icon: FiPieChart,   label: 'Fundos na Carteira', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', dataKey: 'fundos' },
];

function PaginaDashboard() {
  const navigate = useNavigate();
  const { cards, loading, error } = useHomeCards();

  // Atualizar os stats com os dados reais da API
  const stats = statsTemplate.map(stat => {
    if (stat.dataKey && cards) {
      return {
        ...stat,
        value: cards[stat.dataKey]?.toString() || '0'
      };
    }
    return stat;
  });

  // Função para obter o subtítulo com contagem
  const getSubtitleWithCount = (card) => {
    if (card.dataKey && cards) {
      const count = cards[card.dataKey] || 0;
      return `${card.desc} (${count} item${count !== 1 ? 's' : ''})`;
    }
    return card.desc;
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16,185,129,0.3)',
          }}>
            <FiTrendingUp size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Dashboard
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Visão geral da sua carteira de FIIs
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '2rem',
      }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = s.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1e293b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={20} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>
                  {loading ? '...' : (s.value || '0')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mensagem de erro (se houver) ── */}
      {error && (
        <div style={{
          background: '#7f1d1d',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '2rem',
          color: '#fca5a5',
          fontSize: '14px',
        }}>
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* ── Cards de navegação ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
      }}>
        {cardsTemplate.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              onClick={() => c.route && navigate(c.route)}
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = c.iconColor;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1e293b';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Glow de fundo */}
              <div style={{
                position: 'absolute', top: '-30px', right: '-30px',
                width: '100px', height: '100px', borderRadius: '50%',
                background: `radial-gradient(circle, ${c.iconBg} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: c.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={c.iconColor} />
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: c.tagColor,
                  background: c.tagBg, padding: '3px 10px',
                  borderRadius: '20px', letterSpacing: '0.3px',
                }}>
                  {c.tag}
                </span>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
                {c.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {loading ? 'Carregando...' : getSubtitleWithCount(c)}
              </p>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                marginTop: '1rem', fontSize: '12px', color: c.iconColor, fontWeight: 600,
              }}>
                Acessar <FiArrowUpRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PaginaDashboard;
