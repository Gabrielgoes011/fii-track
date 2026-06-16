import React, { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { rendimentosService } from '../../../services/rendimentos/rendimentosService';

// ─── Estilos estáticos ────────────────────────────────────────────────────────
const S = {
  overlay: {
    position:        'fixed',
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter:  'blur(4px)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          999,
  },

  modal: {
    backgroundColor: '#1e293b',
    border:          '1px solid #334155',
    borderRadius:    '16px',
    width:           '100%',
    maxWidth:        '420px',
    boxShadow:       '0 24px 60px rgba(0,0,0,0.6)',
    overflow:        'hidden',
  },

  header: {
    padding:        '1rem 1.5rem',
    borderBottom:   '1px solid #334155',
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    background:     'rgba(255,255,255,0.02)',
  },

  headerTitulo: {
    margin:     0,
    fontSize:   '16px',
    fontWeight: 700,
    color:      '#f8fafc',
  },

  btnFechar: {
    background:   'rgba(255,255,255,0.05)',
    border:       '1px solid #334155',
    borderRadius: '8px',
    cursor:       'pointer',
    color:        '#64748b',
    display:      'flex',
    alignItems:   'center',
    padding:      '5px',
    transition:   'all 0.15s',
  },

  form: {
    padding: '1.5rem',
  },

  gridDataAtivo: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '1rem',
    marginBottom:        '1rem',
  },

  label: {
    display:      'block',
    fontSize:     '12px',
    fontWeight:   600,
    color:        '#94a3b8',
    marginBottom: '4px',
  },

  input: {
    width:           '100%',
    padding:         '0.5rem 0.75rem',
    borderRadius:    '8px',
    border:          '1px solid #334155',
    background:      '#0f172a',
    boxSizing:       'border-box',
    fontSize:        '14px',
    color:           '#f8fafc',
    outline:         'none',
    transition:      'border-color 0.2s',
  },

  wrapSegmento: {
    marginBottom: '1rem',
  },

  segmentoValor: {
    padding:         '0.5rem 0.75rem',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border:          '1px solid #334155',
    borderRadius:    '8px',
    fontSize:        '14px',
    color:           '#94a3b8',
    fontWeight:      500,
  },

  wrapValor: {
    marginBottom: '1.5rem',
  },

  previewValor: {
    marginBottom:   '1.5rem',
    padding:        '0.75rem 1rem',
    background:     'rgba(16,185,129,0.1)',
    borderRadius:   '8px',
    border:         '1px solid rgba(16,185,129,0.2)',
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
  },

  previewLabel: {
    fontSize:   '13px',
    fontWeight: 600,
    color:      '#94a3b8',
  },

  previewNumero: {
    fontSize:   '1.2rem',
    fontWeight: 700,
    color:      '#34d399',
  },

  rodapeBotoes: {
    display:        'flex',
    justifyContent: 'flex-end',
    gap:            '0.5rem',
  },

  btnCancelar: {
    padding:      '0.5rem 1rem',
    background:   'transparent',
    border:       '1px solid #334155',
    color:        '#94a3b8',
    borderRadius: '8px',
    fontWeight:   600,
    transition:   'all 0.15s',
  },

  btnSalvar: {
    padding:      '0.5rem 1rem',
    background:   'linear-gradient(135deg, #10b981, #059669)',
    border:       'none',
    color:        '#ffffff',
    borderRadius: '8px',
    fontWeight:   600,
    boxShadow:    '0 4px 16px rgba(16,185,129,0.3)',
    transition:   'all 0.15s',
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────
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

  const desabilitado = salvando || carregando;

  // Estilos com estado dinâmico
  const estiloBtnFechar = (hovered) => ({
    ...S.btnFechar,
    color:      hovered ? '#f8fafc'                 : '#64748b',
    background: hovered ? 'rgba(255,255,255,0.1)'   : 'rgba(255,255,255,0.05)',
  });

  const estiloSelect = {
    ...S.input,
    cursor: carregando ? 'wait' : 'pointer',
  };

  const estiloBtnCancelar = (hovered) => ({
    ...S.btnCancelar,
    cursor:      salvando ? 'not-allowed' : 'pointer',
    opacity:     salvando ? 0.6           : 1,
    borderColor: hovered  ? '#475569'     : '#334155',
    color:       hovered  ? '#f8fafc'     : '#94a3b8',
  });

  const estiloBtnSalvar = (hovered) => ({
    ...S.btnSalvar,
    cursor:    desabilitado ? 'not-allowed'                    : 'pointer',
    opacity:   desabilitado ? 0.6                              : 1,
    transform: hovered && !desabilitado ? 'translateY(-1px)'  : 'translateY(0)',
    boxShadow: hovered && !desabilitado
      ? '0 6px 24px rgba(16,185,129,0.45)'
      : '0 4px 16px rgba(16,185,129,0.3)',
  });

  // Componentes auxiliares locais para evitar repetição de hover
  function BtnFechar() {
    const [hovered, setHovered] = useState(false);
    return (
      <button
        onClick={onClose}
        style={estiloBtnFechar(hovered)}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        title="Fechar"
      >
        <AiOutlineClose size={18} />
      </button>
    );
  }

  function BtnCancelar() {
    const [hovered, setHovered] = useState(false);
    return (
      <button
        type="button"
        onClick={onClose}
        disabled={salvando}
        style={estiloBtnCancelar(hovered)}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
      >
        Cancelar
      </button>
    );
  }

  function BtnSalvar() {
    const [hovered, setHovered] = useState(false);
    return (
      <button
        type="submit"
        disabled={desabilitado}
        style={estiloBtnSalvar(hovered)}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
      >
        {salvando ? 'Salvando...' : 'Lançar Rendimento'}
      </button>
    );
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>

        {/* ── Cabeçalho ── */}
        <div style={S.header}>
          <h3 style={S.headerTitulo}>Novo Rendimento</h3>
          <BtnFechar />
        </div>

        {/* ── Formulário ── */}
        <form onSubmit={handleSubmit} style={S.form}>

          {/* Data + Ativo */}
          <div style={S.gridDataAtivo}>
            <div>
              <label style={S.label}>Data do Recebimento</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                required
                style={S.input}
                onFocus={e  => (e.target.style.borderColor = '#10b981')}
                onBlur={e   => (e.target.style.borderColor = '#334155')}
              />
            </div>
            <div>
              <label style={S.label}>Ativo</label>
              <select
                value={ativoId}
                onChange={e => setAtivoId(e.target.value)}
                required
                disabled={carregando}
                style={estiloSelect}
              >
                {carregando
                  ? <option>Carregando...</option>
                  : ativos.map(a => (
                      <option key={a.idAtivo} value={a.idAtivo}>{a.ticker}</option>
                    ))
                }
              </select>
            </div>
          </div>

          {/* Segmento (somente leitura) */}
          {ativoSelecionado && (
            <div style={S.wrapSegmento}>
              <label style={S.label}>Segmento</label>
              <div style={S.segmentoValor}>{ativoSelecionado.nomeSeguimento}</div>
            </div>
          )}

          {/* Valor */}
          <div style={S.wrapValor}>
            <label style={S.label}>Valor Recebido (R$)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={e => setValor(e.target.value)}
              required
              placeholder="Ex: 52.40"
              style={S.input}
              onFocus={e => (e.target.style.borderColor = '#10b981')}
              onBlur={e  => (e.target.style.borderColor = '#334155')}
            />
          </div>

          {/* Preview do valor */}
          {Number(valor) > 0 && (
            <div style={S.previewValor}>
              <span style={S.previewLabel}>Valor a lançar:</span>
              <span style={S.previewNumero}>
                + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))}
              </span>
            </div>
          )}

          {/* Botões */}
          <div style={S.rodapeBotoes}>
            <BtnCancelar />
            <BtnSalvar />
          </div>
        </form>
      </div>
    </div>
  );
}
