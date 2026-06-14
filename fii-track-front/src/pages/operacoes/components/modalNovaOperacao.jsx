import React, { useState, useEffect } from 'react';
import SlideModal from '../../../components/SlideModal/SlideModal';
import API_BASE_URL from '../../../config/api';

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#7a8fa8', marginBottom: '5px',
};
const inputStyle = {
  width: '100%', padding: '8px 12px',
  borderRadius: '8px', border: '1px solid #243040',
  background: '#0d1520', boxSizing: 'border-box',
  fontSize: '13px', color: '#cdd8e8', outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
const focusIn  = (e) => { e.target.style.borderColor = '#0972d3'; e.target.style.boxShadow = '0 0 0 2px rgba(9,114,211,0.15)'; };
const focusOut = (e) => { e.target.style.borderColor = '#243040'; e.target.style.boxShadow = 'none'; };

export default function NovaOperacaoModal({ isOpen, onClose, onSuccess }) {
  const [data,          setData]          = useState('');
  const [operacao,      setOperacao]      = useState('Compra');
  const [ativo,         setAtivo]         = useState('');
  const [qtde,          setQtde]          = useState('');
  const [valorUnidade,  setValorUnidade]  = useState('');
  const [ativosDisponiveis, setAtivosDisponiveis] = useState([]);
  const [carregando,    setCarregando]    = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCarregando(true);
    setData(new Date().toISOString().split('T')[0]);
    setOperacao('Compra');
    setAtivo('');
    setQtde('');
    setValorUnidade('');

    fetch(`${API_BASE_URL}/ativosDropList`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setAtivosDisponiveis(d))
      .catch(() => setAtivosDisponiveis([]))
      .finally(() => setCarregando(false));
  }, [isOpen]);

  const valorTotal = (Number(qtde) || 0) * (Number(valorUnidade) || 0);
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const isCompra = operacao === 'Compra';

  const handleCadastrar = async (e) => {
    e.preventDefault();
    const ativoSelecionado = ativosDisponiveis.find(a => a.ticker === ativo);
    if (!ativoSelecionado) return;

    const payload = {
      idAtivo: ativoSelecionado.id,
      dataOperacao: data,
      tipo: operacao,
      quantidade: Number(qtde),
      preco: Number(valorUnidade),
    };

    try {
      setCarregando(true);
      const res = await fetch(`${API_BASE_URL}/lancarOperacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onClose();
        if (onSuccess) onSuccess(payload);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SlideModal isOpen={isOpen} onClose={onClose} title="Nova Operação" width="460px">
      <form onSubmit={handleCadastrar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Data + Tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Data da Operação</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} required
              style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            {/* Toggle Compra / Venda */}
            <div style={{ display: 'flex', background: '#0d1520', border: '1px solid #243040', borderRadius: '8px', padding: '3px', gap: '3px' }}>
              {['Compra', 'Venda'].map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setOperacao(tipo)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: '6px', border: 'none',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    transition: 'all 0.15s',
                    background: operacao === tipo
                      ? (tipo === 'Compra' ? 'rgba(46,204,113,0.18)' : 'rgba(231,76,60,0.18)')
                      : 'transparent',
                    color: operacao === tipo
                      ? (tipo === 'Compra' ? '#2ecc71' : '#e74c3c')
                      : '#4e6480',
                    boxShadow: operacao === tipo ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ativo */}
        <div>
          <label style={labelStyle}>Ativo</label>
          <select
            value={ativo}
            onChange={e => setAtivo(e.target.value)}
            required
            disabled={ativosDisponiveis.length === 0}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={focusIn} onBlur={focusOut}
          >
            <option value="" disabled>
              {carregando ? 'Carregando ativos...' : 'Selecione um ativo...'}
            </option>
            {ativosDisponiveis.map(a => (
              <option key={a.id} value={a.ticker}>{a.ticker}</option>
            ))}
          </select>
        </div>

        {/* Qtde + Preço */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Quantidade</label>
            <input type="number" min="1" step="1" value={qtde}
              onChange={e => setQtde(Number(e.target.value) || '')}
              required style={inputStyle} placeholder="Ex: 10"
              onFocus={focusIn} onBlur={focusOut} />
          </div>
          <div>
            <label style={labelStyle}>Valor Unitário (R$)</label>
            <input type="number" min="0.01" step="0.01" value={valorUnidade}
              onChange={e => setValorUnidade(Number(e.target.value) || '')}
              required style={inputStyle} placeholder="Ex: 10.50"
              onFocus={focusIn} onBlur={focusOut} />
          </div>
        </div>

        {/* Total */}
        <div style={{
          padding: '12px 16px',
          background: '#0d1520',
          border: `1px solid ${isCompra ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}`,
          borderRadius: '10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4e6480' }}>Valor Total</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: isCompra ? '#2ecc71' : '#e74c3c' }}>
            {isCompra ? '+ ' : '− '}{fmt(valorTotal)}
          </span>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
          <button
            type="button" onClick={onClose} disabled={carregando}
            style={{
              flex: 1, padding: '9px', background: 'transparent',
              border: '1px solid #243040', color: '#7a8fa8',
              borderRadius: '8px', fontWeight: 600, fontSize: '13px',
              cursor: carregando ? 'not-allowed' : 'pointer',
              opacity: carregando ? 0.5 : 1, transition: 'all 0.15s',
            }}
            onMouseOver={e => { if (!carregando) { e.currentTarget.style.borderColor = '#334d66'; e.currentTarget.style.color = '#cdd8e8'; } }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#243040'; e.currentTarget.style.color = '#7a8fa8'; }}
          >
            Cancelar
          </button>
          <button
            type="submit" disabled={carregando}
            style={{
              flex: 2, padding: '9px',
              background: '#0972d3',
              border: '1px solid #0972d3',
              color: '#fff', borderRadius: '8px',
              fontWeight: 600, fontSize: '13px',
              cursor: carregando ? 'not-allowed' : 'pointer',
              opacity: carregando ? 0.6 : 1,
              boxShadow: '0 2px 8px rgba(9,114,211,0.3)',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { if (!carregando) { e.currentTarget.style.background = '#1a84e8'; e.currentTarget.style.borderColor = '#1a84e8'; } }}
            onMouseOut={e => { e.currentTarget.style.background = '#0972d3'; e.currentTarget.style.borderColor = '#0972d3'; }}
          >
            {carregando ? 'Cadastrando...' : 'Cadastrar Operação'}
          </button>
        </div>
      </form>
    </SlideModal>
  );
}
