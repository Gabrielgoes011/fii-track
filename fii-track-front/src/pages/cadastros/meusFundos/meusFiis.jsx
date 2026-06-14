import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GridDados } from '../../../components/GridDados';
import { useMeusFiis } from '../../../hooks/cadastros/useMeusFiis';
import ModalConfirmacao from '../../../components/ModalDeConfirmacao/ModalConfirmacao';
import SkeletonTable from '../../../components/SkeletonTable/SkeletonTable';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const MOBILE_BP = 768;

const colunasFiis = [
  { titulo: 'Ticker',       acesso: 'ticker',         width: '10%', align: 'center' },
  { titulo: 'Nome do Fundo',acesso: 'nomeFundo',       width: '45%', align: 'left'   },
  { titulo: 'CNPJ',         acesso: 'cnpj',            width: '18%', align: 'center' },
  { titulo: 'Seguimento',   acesso: 'nomeSeguimento',  width: '20%', align: 'center' },
];

function PaginaMeusFiis() {
  const {
    fiis, seguimentos, onEdit, formData, showModal, itemSelected, modalAction,
    showFormModal, setFormData, setShowModal, dashboard, loading,
    getFiis, getDashboard, getSeguimentos, handleAddFii, handleUpdateFii,
    handleOpenCreate, handleEdit, handleOpenModal, executeConfirmedAction, closeFormModal
  } = useMeusFiis();

  const [isMobile,       setIsMobile]       = useState(window.innerWidth < MOBILE_BP);
  const [isSelectOpen,   setIsSelectOpen]   = useState(false);
  const [segmentoSearch, setSegmentoSearch] = useState('');

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    getFiis();
    getDashboard();
    if (getSeguimentos) getSeguimentos();
  }, [getFiis, getDashboard, getSeguimentos]);

  const filteredSegmentos = seguimentos?.filter(seg => {
    const nome = (seg.nome || seg.nomeSeguimento || '').toLowerCase();
    return nome.includes(segmentoSearch.toLowerCase());
  }) || [];

  const selectedSeguimento = seguimentos?.find(s => String(s.id) === String(formData.idSeguimento));
  const nomeSeguimentoSelecionado = selectedSeguimento
    ? (selectedSeguimento.nome || selectedSeguimento.nomeSeguimento)
    : 'Selecione o Seguimento...';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onEdit) {
      if (!formData.nomeFundo) { alert('Por favor, informe o nome do fundo.'); return; }
      await handleUpdateFii(formData);
    } else {
      if (!formData.ticker || !formData.nomeFundo || !formData.cnpj || !formData.idSeguimento) {
        alert('Por favor, preencha todos os campos obrigatórios!'); return;
      }
      await handleAddFii(formData);
    }
  };

  const inputStyle = {
    padding: '0.75rem 1rem', fontSize: '14px', width: '100%', boxSizing: 'border-box',
    borderRadius: '8px', border: '1px solid #334155', background: '#0f172a',
    color: '#f8fafc', outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: isMobile ? '1rem 0.75rem' : '2rem 1rem' }}>
      <main style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 700, marginBottom: '0.25rem', color: '#f8fafc' }}>Meus FIIs</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Gerencie seus Fundos Imobiliários</p>
          </div>
          <button onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.65rem 1.1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', fontSize: '13px' }}>
            <FiPlus size={15} /> {isMobile ? 'Novo' : 'Cadastrar Novo Fundo'}
          </button>
        </header>

        {/* Card métrica */}
        <section style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'inline-block', background: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b', padding: '1rem 1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Total de FIIs Cadastrados</p>
            <h2 style={{ margin: '0.4rem 0', fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{dashboard?.total || 0}</h2>
          </div>
        </section>

        {/* Lista mobile ou tabela desktop */}
        {isMobile ? (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Carregando...</div>
            ) : !fiis || fiis.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b' }}>
                Nenhum fundo encontrado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {fiis.map((fii, i) => (
                  <div key={fii.id ?? i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 16px', borderLeft: '3px solid #10b981' }}>
                    {/* linha 1: ticker + seguimento + ações */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>{fii.ticker}</span>
                        <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 10px', borderRadius: '9999px', backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>
                          {fii.nomeSeguimento}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(fii)} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: '#60a5fa', display: 'flex', alignItems: 'center' }}>
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => handleOpenModal(fii, 'delete')} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}>
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {/* linha 2: nome + cnpj */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{fii.nomeFundo}</span>
                      <span style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>{fii.cnpj}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <section style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', padding: '1rem' }}>
            {loading ? <SkeletonTable rows={5} cols={5} /> : (
              <GridDados
                coluna={colunasFiis} data={fiis || []} itemsPerPage={10}
                labelpesquisa="Buscar FIIs..." usaEditar acaoEditar={handleEdit}
                usaExcluir acaoExcluir={(item) => handleOpenModal(item, 'delete')}
              />
            )}
          </section>
        )}

        {/* Modal formulário */}
        {showFormModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', width: '100%', maxWidth: '500px', position: 'relative' }}>
              <button onClick={closeFormModal} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', cursor: 'pointer', padding: '5px 8px' }}>✖</button>

              <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>
                {onEdit ? 'Editar Fundo' : 'Cadastrar Fundo'}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!onEdit && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input type="text" placeholder="Ticker (ex: MXRF11)" value={formData.ticker || ''}
                        onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                        style={inputStyle} autoFocus
                        onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#334155'} />
                      <input type="text" placeholder="CNPJ (só números)" value={formData.cnpj || ''} maxLength={14}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value.replace(/\D/g, '').substring(0, 14) })}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#334155'} />
                    </div>

                    {/* Select com pesquisa */}
                    <div tabIndex={0} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setIsSelectOpen(false); setSegmentoSearch(''); } }} style={{ position: 'relative', outline: 'none' }}>
                      <input type="text"
                        placeholder="Selecione ou pesquise o segmento..."
                        value={isSelectOpen ? segmentoSearch : nomeSeguimentoSelecionado}
                        onChange={(e) => { setSegmentoSearch(e.target.value); setIsSelectOpen(true); setFormData({ ...formData, idSeguimento: null }); }}
                        onClick={() => setIsSelectOpen(true)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#334155'} />
                      <span style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.8rem', color: '#64748b' }}>▼</span>
                      {isSelectOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', marginTop: '4px', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredSegmentos.length > 0 ? filteredSegmentos.map(seg => (
                              <div key={seg.id} onClick={() => { setFormData({ ...formData, idSeguimento: seg.id }); setIsSelectOpen(false); setSegmentoSearch(''); }}
                                style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.95rem', color: '#f1f5f9', backgroundColor: String(formData.idSeguimento) === String(seg.id) ? 'rgba(16,185,129,0.15)' : 'transparent' }}
                                onMouseEnter={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.target.style.backgroundColor = String(formData.idSeguimento) === String(seg.id) ? 'rgba(16,185,129,0.15)' : 'transparent'}>
                                {seg.nome || seg.nomeSeguimento}
                              </div>
                            )) : (
                              <div style={{ padding: '0.75rem', color: '#64748b', textAlign: 'center' }}>Nenhum segmento encontrado.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <input type="text" placeholder="Nome do Fundo" value={formData.nomeFundo || ''}
                  onChange={(e) => setFormData({ ...formData, nomeFundo: e.target.value.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase()) })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#334155'} />

                <button type="submit" style={{ padding: '0.875rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                  {onEdit ? 'Salvar Alterações' : 'Cadastrar Fundo'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showModal && <ModalConfirmacao onClose={() => setShowModal(false)} onConfirm={executeConfirmedAction} action={modalAction} userName={itemSelected?.ticker} />}
      </main>
      <ToastContainer autoClose={3000} position="top-right" />
    </div>
  );
}

export default PaginaMeusFiis;
