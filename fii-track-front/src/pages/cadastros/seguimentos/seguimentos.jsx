import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GridDados } from '../../../components/GridDados';
import { useSeguimentos } from '../../../hooks/cadastros/useSeguimentos';
import ModalConfirmacao from '../../../components/ModalDeConfirmacao/ModalConfirmacao';
import SkeletonTable from '../../../components/SkeletonTable/SkeletonTable';

// Definição das colunas da tabela
const colunasSeguimentos = [
  { titulo: 'Seguimento', acesso: 'nome', width: '100', align: 'center' }
];

function PaginaSeguimentos() {
  const {
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
    getSeguimentos,
    getDashboard,
    handleAddSeguimento,
    handleUpdateSeguimento,
    handleOpenCreate,
    handleEdit,
    handleOpenModal,
    executeConfirmedAction,
    closeFormModal
  } = useSeguimentos();

  // Carregar segmentos na primeira montagem
  useEffect(() => {
    getSeguimentos();
    getDashboard();
  }, [getSeguimentos, getDashboard]);

  // Handler para o submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.nome) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    // Submeter
    if (onEdit) {
      await handleUpdateSeguimento({
        nome: formData.nome
      });
    } else {
      await handleAddSeguimento(formData);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '2rem 1rem' }}>
      <main style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem', color: '#f8fafc' }}>Cadastro de Seguimentos</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Gerencie seguimentos com ações rápidas e filtros</p>
          </div>
          <button
            onClick={handleOpenCreate}
            style={{
              padding: '0.65rem 1.1rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
          >
            + Cadastrar Novo Seguimento
          </button>
        </header>

        {/* Cards de métricas */}
        <section style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ minWidth: '250px', background: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b', padding: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Total de Seguimentos</p>
            <h2 style={{ margin: '0.4rem 0', fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{dashboard.total}</h2>
          </div>
        </section>

        {/* Tabela de segmentos */}
        <section style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', padding: '1rem' }}>
          {loading ? (
            <SkeletonTable rows={5} cols={2} />
          ) : seguimentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              Nenhum seguimento encontrado.
            </div>
          ) : (
            <GridDados
              coluna={colunasSeguimentos}
              data={seguimentos}
              itemsPerPage={10}
              labelpesquisa="Buscar seguimentos..."
              usaVisualizar={false}
              usaEditar={true}
              acaoEditar={handleEdit}
              usaExcluir={true}
              acaoExcluir={(item) => handleOpenModal(item, 'delete')}
              usaResetarSenha={false}
              usaInativar={false}
              acaoInativar={(item) => handleOpenModal(item, 'inactivate')}
              usaReativar={false}
              acaoReativar={(item) => handleOpenModal(item, 'reactivate')}
              paddingHead="14px 12px"
              paddingBody="13px 12px"
              tamanhoIcones="fs-5"
              tamanhoFontBody="14px"
              tamanhoFontHead="14px"
            />
          )}
        </section>

        {/* Modais */}
        {showFormModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', width: '90%', maxWidth: '400px', position: 'relative' }}>
              <button onClick={closeFormModal} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px', transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >✖</button>

              <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>
                {onEdit ? "Editar Seguimento" : "Cadastrar Seguimento"}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Nome do Seguimento"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  style={{ padding: '0.75rem 1rem', fontSize: '14px', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                  autoFocus
                />

                <button type="submit" style={{ padding: '0.875rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, marginTop: '0.5rem', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(16,185,129,0.45)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)'; }}
                >
                  {onEdit ? "Salvar Alterações" : "Cadastrar"}
                </button>
              </form>
            </div>
          </div>
        )}

        {showModal && (
          <ModalConfirmacao
            onClose={() => setShowModal(false)}
            onConfirm={executeConfirmedAction}
            action={modalAction}
            userName={itemSelected?.nome}
          />
        )}

      </main>

      <ToastContainer autoClose={3000} position="top-right" />
    </div>
  );
}

export default PaginaSeguimentos;
