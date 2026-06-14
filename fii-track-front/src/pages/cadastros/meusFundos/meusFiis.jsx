import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GridDados } from '../../../components/GridDados';
import { useMeusFiis } from '../../../hooks/cadastros/useMeusFiis';
import ModalConfirmacao from '../../../components/ModalDeConfirmacao/ModalConfirmacao';
import SkeletonTable from '../../../components/SkeletonTable/SkeletonTable';

// Definição das colunas da tabela
const colunasFiis = [
  { titulo: 'Ticker', acesso: 'ticker', width: '10%', align: 'center' },
  { titulo: 'Nome do Fundo', acesso: 'nomeFundo', width: '45%', align: 'left' },
  { titulo: 'CNPJ', acesso: 'cnpj', width: '18%', align: 'center' },
  { titulo: 'Seguimento', acesso: 'nomeSeguimento', width: '20%', align: 'center' }
];

function PaginaMeusFiis() {
  const {
    fiis,
    seguimentos,
    onEdit,
    formData,
    showModal,
    itemSelected,
    modalAction,
    showFormModal,
    setFormData,
    setShowModal,
    dashboard,
    loading,
    getFiis,
    getDashboard,
    getSeguimentos, // Função para buscar os seguimentos do select
    handleAddFii,
    handleUpdateFii,
    handleOpenCreate,
    handleEdit,
    handleOpenModal,
    executeConfirmedAction,
    closeFormModal
  } = useMeusFiis();

  // Estados para o Select Customizado
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [segmentoSearch, setSegmentoSearch] = useState('');

  const filteredSegmentos = seguimentos?.filter(seg => {
    const nome = (seg.nome || seg.nomeSeguimento || '').toLowerCase();
    return nome.includes(segmentoSearch.toLowerCase());
  }) || [];

  // Carregar os dados na montagem do componente
  useEffect(() => {
    getFiis();
    getDashboard();
    if (getSeguimentos) getSeguimentos();
  }, [getFiis, getDashboard, getSeguimentos]);

  // Handler para o submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (onEdit) {
      if (!formData.nomeFundo) {
        alert('Por favor, informe o nome do fundo.');
        return;
      }
    } else {
      if (!formData.ticker || !formData.nomeFundo || !formData.cnpj || !formData.idSeguimento) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
      }
    }

    // Submeter
    if (onEdit) {
      await handleUpdateFii(formData);
    } else {
      await handleAddFii(formData);
    }
  };

  const selectedSeguimento = seguimentos?.find(s => String(s.id) === String(formData.idSeguimento));
  const nomeSeguimentoSelecionado = selectedSeguimento ? (selectedSeguimento.nome || selectedSeguimento.nomeSeguimento) : "Selecione o Seguimento...";

  const inputStyle = { padding: '0.75rem 1rem', fontSize: '14px', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none', transition: 'border-color 0.2s' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '2rem 1rem' }}>
      <main style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem', color: '#f8fafc' }}>Meus FIIs</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Gerencie seus Fundos Imobiliários e categorias</p>
          </div>
          <button
            onClick={handleOpenCreate}
            style={{ padding: '0.65rem 1.1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
          >
            + Cadastrar Novo Fundo
          </button>
        </header>

        {/* Cards de métricas */}
        <section style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ minWidth: '250px', background: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b', padding: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Total de FIIs Cadastrados</p>
            <h2 style={{ margin: '0.4rem 0', fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{dashboard?.total || 0}</h2>
          </div>
        </section>

        {/* Tabela de FIIs */}
        <section style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', padding: '1rem' }}>
          {loading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : fiis && fiis.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              Nenhum fundo encontrado.
            </div>
          ) : (
            <GridDados
              coluna={colunasFiis}
              data={fiis || []}
              itemsPerPage={10}
              labelpesquisa="Buscar FIIs..."
              usaEditar={true}
              acaoEditar={handleEdit}
              usaExcluir={true}
              acaoExcluir={(item) => handleOpenModal(item, 'delete')}
            />
          )}
        </section>

        {/* Modal de Formulário */}
        {showFormModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', width: '90%', maxWidth: '500px', position: 'relative' }}>
              <button onClick={closeFormModal} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px', transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >✖</button>

              <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>
                {onEdit ? "Editar Fundo" : "Cadastrar Fundo"}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!onEdit && (
                  <>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input type="text" placeholder="Ticker (ex: MXRF11)" value={formData.ticker || ''} onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })} style={inputStyle} autoFocus />
                      <input
                        type="text"
                        placeholder="CNPJ (apenas números)"
                        value={formData.cnpj || ''}
                        maxLength={14}
                        onChange={(e) => {
                          const onlyNums = e.target.value.replace(/\D/g, '').substring(0, 14);
                          setFormData({ ...formData, cnpj: onlyNums });
                        }}
                        style={inputStyle}
                      />
                    </div>

                    {/* Select Customizado com Pesquisa */}
                    <div
                      tabIndex={0}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setIsSelectOpen(false);
                          setSegmentoSearch('');
                        }
                      }}
                      style={{ position: 'relative', width: '100%', outline: 'none' }}
                    >
                      <input
                        type="text"
                        placeholder="Selecione ou pesquise o segmento..."
                        value={isSelectOpen ? segmentoSearch : nomeSeguimentoSelecionado}
                        onChange={(e) => {
                          setSegmentoSearch(e.target.value);
                          setIsSelectOpen(true);
                          setFormData({ ...formData, idSeguimento: null });
                        }}
                        onClick={() => setIsSelectOpen(true)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      />
                      <span style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.8rem', color: '#64748b' }}>▼</span>

                      {isSelectOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', marginTop: '4px', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredSegmentos.length > 0 ? (
                              filteredSegmentos.map(seg => (
                                <div key={seg.id} onClick={() => {
                                  setFormData({ ...formData, idSeguimento: seg.id });
                                  setIsSelectOpen(false);
                                  setSegmentoSearch('');
                                }} style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.95rem', color: '#f1f5f9', backgroundColor: String(formData.idSeguimento) === String(seg.id) ? 'rgba(16,185,129,0.15)' : 'transparent' }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = String(formData.idSeguimento) === String(seg.id) ? 'rgba(16,185,129,0.15)' : 'transparent'}>
                                  {seg.nome || seg.nomeSeguimento}
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: '0.75rem', color: '#64748b', textAlign: 'center', fontSize: '0.95rem' }}>Nenhum segmento encontrado.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <input
                  type="text"
                  placeholder="Nome do Fundo"
                  value={formData.nomeFundo || ''}
                  onChange={(e) => {
                    const properCaseName = e.target.value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
                    setFormData({ ...formData, nomeFundo: properCaseName });
                  }}
                  style={inputStyle}
                />

                <button type="submit" style={{ padding: '0.875rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, marginTop: '0.5rem', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(16,185,129,0.45)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)'; }}
                >
                  {onEdit ? "Salvar Alterações" : "Cadastrar Fundo"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Exclusão */}
        {showModal && <ModalConfirmacao onClose={() => setShowModal(false)} onConfirm={executeConfirmedAction} action={modalAction} userName={itemSelected?.ticker} />}

      </main>
      <ToastContainer autoClose={3000} position="top-right" />
    </div>
  );
}

export default PaginaMeusFiis;
