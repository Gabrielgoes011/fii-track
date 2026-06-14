import React, { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { rendimentosService } from '../../../services/rendimentos/rendimentosService';

export default function NovoRendimentoModal({ isOpen, onClose, onSuccess }) {
  const [data,       setData]       = useState('');
  const [ativoId,    setAtivoId]    = useState('');
  const [valor,      setValor]      = useState('');
  const [salvando,   setSalvando]   = useState(false);
  const [ativos,     setAtivos]     = useState([]);
  const [carregando, setCarregando] = useState(false);

  const ativoSelecionado = ativos.find(a => String(a.idAtivo) === String(ativoId));

  useEffect(() => {
    if (!isOpen) return;
    setData(new Date().toISOString().split('T')[0]);
    setAtivoId('');
    setValor('');

    const buscarAtivos = async () => {
      setCarregando(true);
      try {
        const resultado = await rendimentosService.carregarAtivosModal();
        setAtivos(resultado);
        if (resultado.length > 0) setAtivoId(String(resultado[0].idAtivo));
      } catch (err) {
        console.error('Erro ao carregar ativos:', err);
        setAtivos([]);
      } finally {
        setCarregando(false);
      }
    };
    buscarAtivos();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ativoId || !valor || Number(valor) <= 0) return;
    setSalvando(true);
    try {
      await onSuccess({
        idAtivo:       Number(ativoId),
        ticker:        ativoSelecionado?.ticker,
        segmento:      ativoSelecionado?.nomeSeguimento,
        dtRendimento:  data,
        valorRecebido: Number(valor),
      });
    } finally {
      setSalvando(false);
    }
  };

  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' };
  const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', boxSizing: 'border-box', fontSize: '14px', color: '#f8fafc', outline: 'none', transition: 'border-color 0.2s' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>

        {/* header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>Novo Rendimento</h3>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '5px', transition: 'all 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            title="Fechar">
            <AiOutlineClose size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>

          {/* Data + Ativo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Data do Recebimento</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#334155'} />
            </div>
            <div>
              <label style={labelStyle}>Ativo</label>
              <select value={ativoId} onChange={e => setAtivoId(e.target.value)} required disabled={carregando}
                style={{ ...inputStyle, cursor: carregando ? 'wait' : 'pointer' }}>
                {carregando
                  ? <option>Carregando...</option>
                  : ativos.map(a => <option key={a.idAtivo} value={a.idAtivo}>{a.ticker}</option>)
                }
              </select>
            </div>
          </div>

          {/* Segmento */}
          {ativoSelecionado && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Segmento</label>
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
                {ativoSelecionado.nomeSeguimento}
              </div>
            </div>
          )}

          {/* Valor */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Valor Recebido (R$)</label>
            <input type="number" min="0.01" step="0.01" value={valor} onChange={e => setValor(e.target.value)} required placeholder="Ex: 52.40" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#334155'} />
          </div>

          {/* Preview */}
          {Number(valor) > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Valor a lançar:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))}
              </span>
            </div>
          )}

          {/* Botões */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} disabled={salvando}
              style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.6 : 1, transition: 'all 0.15s' }}
              onMouseOver={e => { if (!salvando) { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#f8fafc'; } }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}>
              Cancelar
            </button>
            <button type="submit" disabled={salvando || carregando}
              style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#ffffff', borderRadius: '8px', fontWeight: 600, cursor: (salvando || carregando) ? 'not-allowed' : 'pointer', opacity: (salvando || carregando) ? 0.6 : 1, boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'all 0.15s' }}
              onMouseOver={e => { if (!(salvando || carregando)) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(16,185,129,0.45)'; } }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)'; }}>
              {salvando ? 'Salvando...' : 'Lançar Rendimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
