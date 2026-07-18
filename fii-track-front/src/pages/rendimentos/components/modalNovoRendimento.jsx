import React, { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { rendimentosService } from '../../../services/rendimentos/rendimentosService';

function formatarDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// ─── Estilos estáticos ────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  modal: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    width: 'calc(100% - 24px)',
    maxWidth: '420px',
    maxHeight: 'calc(100dvh - 24px)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  },

  header: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
  },

  headerTitulo: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#f8fafc',
  },

  btnFechar: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #334155',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    padding: '5px',
    transition: 'all 0.15s',
  },

  form: {
    padding: '1.5rem',
    overflowY: 'auto',
  },

  gridDataAtivo: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    marginBottom: '1rem',
  },

  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '4px',
  },

  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
    boxSizing: 'border-box',
    fontSize: '14px',
    color: '#f8fafc',
    outline: 'none',
    transition: 'border-color 0.2s',
  },

  wrapSegmento: {
    marginBottom: '1rem',
  },

  segmentoValor: {
    padding: '0.5rem 0.75rem',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: 500,
  },

  wrapValor: {
    marginBottom: '1rem',
  },

  previewValor: {
    marginBottom: '1.5rem',
    padding: '0.75rem 1rem',
    background: 'rgba(16,185,129,0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(16,185,129,0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  previewLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
  },

  previewNumero: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#34d399',
  },

  rodapeBotoes: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },

  btnCancelar: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: '1px solid #334155',
    color: '#94a3b8',
    borderRadius: '8px',
    fontWeight: 600,
    transition: 'all 0.15s',
  },

  btnSalvar: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
    transition: 'all 0.15s',
  },

  ativoOpcao: {
    width: '100%',
    padding: '0.65rem 0.75rem',
    textAlign: 'left',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#f8fafc',
    cursor: 'pointer',
    fontWeight: 600,
  },

  toggle: {
    width: '44px',
    height: '24px',
    borderRadius: '999px',
    border: 'none',
    padding: '3px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function NovoRendimentoModal({ isOpen, onClose, onSuccess }) {
  const [data, setData] = useState('');
  const [ativoId, setAtivoId] = useState('');
  const [valor, setValor] = useState('');
  const [buscaAtivo, setBuscaAtivo] = useState('');
  const [reinvestido, setReinvestido] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [ativos, setAtivos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const ativoSelecionado = ativos.find(a => String(a.idAtivo) === String(ativoId));
  const ativosFiltrados = ativos.filter(a =>
    a.ticker.toLowerCase().includes(buscaAtivo.toLowerCase()) ||
    a.nomeSeguimento.toLowerCase().includes(buscaAtivo.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) return;
    setData(formatarDataLocal(new Date()));
    setAtivoId('');
    setValor('');
    setBuscaAtivo('');
    setReinvestido(false);

    const buscarAtivos = async () => {
      setCarregando(true);
      try {
        const resultado = await rendimentosService.carregarAtivosModal();
        setAtivos(resultado);
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
        idAtivo: Number(ativoId),
        ticker: ativoSelecionado?.ticker,
        segmento: ativoSelecionado?.nomeSeguimento,
        dtRendimento: data,
        valorRecebido: Number(valor),
        reinvestido,
      });
    } catch (err) {
      // O erro já deve ser tratado e exibido como um toast pelo hook/página pai.
      // Este catch previne que uma exceção não tratada quebre a aplicação.
    } finally {
      setSalvando(false);
    }
  };

  const desabilitado = salvando || carregando;

  // Estilos com estado dinâmico
  const estiloBtnFechar = (hovered) => ({
    ...S.btnFechar,
    color: hovered ? '#f8fafc' : '#64748b',
    background: hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
  });

  const estiloSelect = {
    ...S.input,
    cursor: carregando ? 'wait' : 'pointer',
  };

  const estiloBtnCancelar = (hovered) => ({
    ...S.btnCancelar,
    cursor: salvando ? 'not-allowed' : 'pointer',
    opacity: salvando ? 0.6 : 1,
    borderColor: hovered ? '#475569' : '#334155',
    color: hovered ? '#f8fafc' : '#94a3b8',
  });

  const estiloBtnSalvar = (hovered) => ({
    ...S.btnSalvar,
    cursor: desabilitado ? 'not-allowed' : 'pointer',
    opacity: desabilitado ? 0.6 : 1,
    transform: hovered && !desabilitado ? 'translateY(-1px)' : 'translateY(0)',
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
      <style>{`
        @keyframes abrirOpcaoAtivo {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ ...S.label, marginBottom: 0 }}>Data do Recebimento</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setData(formatarDataLocal(new Date()))}
                    style={{ background: 'transparent', border: 'none', color: '#34d399', padding: 0, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ontem = new Date();
                      ontem.setDate(ontem.getDate() - 1);
                      setData(formatarDataLocal(ontem));
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: 0, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Ontem
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                required
                style={S.input}
                onFocus={e => (e.target.style.borderColor = '#10b981')}
                onBlur={e => (e.target.style.borderColor = '#334155')}
              />
            </div>
            <div>
              <label style={S.label}>Buscar ativo</label>
              <input
                type="search"
                value={buscaAtivo}
                onChange={e => {
                  setBuscaAtivo(e.target.value);
                  setAtivoId('');
                }}
                disabled={carregando}
                placeholder={carregando ? 'Carregando ativos...' : 'Digite o ticker ou segmento'}
                style={S.input}
              />
              {buscaAtivo && !carregando && (
                <div style={{ display: 'grid', gap: '6px', marginTop: '8px', maxHeight: '136px', overflowY: 'auto' }}>
                  {ativosFiltrados.length > 0 ? ativosFiltrados.map((a, index) => (
                    <button
                      key={a.idAtivo}
                      type="button"
                      onClick={() => {
                        setAtivoId(String(a.idAtivo));
                        setBuscaAtivo(a.ticker);
                      }}
                      style={{
                        ...S.ativoOpcao,
                        borderColor: String(a.idAtivo) === String(ativoId) ? '#10b981' : '#334155',
                        animation: 'abrirOpcaoAtivo 180ms ease-out both',
                        animationDelay: `${Math.min(index * 35, 210)}ms`,
                      }}
                    >
                      {a.ticker} <span style={{ color: '#94a3b8', fontWeight: 400 }}>— {a.nomeSeguimento}</span>
                    </button>
                  )) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', padding: '4px 0' }}>Nenhum ativo encontrado.</span>
                  )}
                </div>
              )}
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
              onBlur={e => (e.target.style.borderColor = '#334155')}
            />
          </div>

          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            border: '1px solid #334155',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>Reinvestido</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>Este provento foi usado para comprar ativos.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reinvestido}
              aria-label="Provento reinvestido"
              onClick={() => setReinvestido(atual => !atual)}
              style={{
                ...S.toggle,
                background: reinvestido ? '#10b981' : '#475569',
                flexShrink: 0,
              }}
            >
              <span style={{
                display: 'block',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ffffff',
                transform: reinvestido ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.2s',
              }} />
            </button>
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
