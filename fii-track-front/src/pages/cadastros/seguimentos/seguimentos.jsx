import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GridDados } from '../../../components/GridDados';
import { useSeguimentos } from '../../../hooks/cadastros/useSeguimentos';
import ModalConfirmacao from '../../../components/ModalDeConfirmacao/ModalConfirmacao';
import SkeletonTable from '../../../components/SkeletonTable/SkeletonTable';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const MOBILE_BP = 768;

const colunasSeguimentos = [
  { titulo: 'Seguimento', acesso: 'nome', width: '100', align: 'center' }
];

function PaginaSeguimentos() {
  const {
    seguimentos, onEdit, formData, showModal, itemSelected, modalAction,
    showFormModal, setFormData, setShowModal, dashboard, loading,
    getSeguimentos, getDashboard, handleAddSeguimento, handleUpdateSeguimento,
    handleOpenCreate, handleEdit, handleOpenModal, executeConfirmedAction, closeFormModal
  } = useSeguimentos();

  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    getSeguimentos();
    getDashboard();
  }, [getSeguimentos, getDashboard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) { alert('Por favor, preencha todos os campos!'); return; }
    if (onEdit) await handleUpdateSeguimento({ nome: formData.nome });
    else await handleAddSeguimento(formData);
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
            <h1 style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 700, marginBottom: '0.25rem', color: '#f8fafc' }}>Seguimentos</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Gerencie os seguimentos dos fundos</p>
          </div>
          <button onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.65rem 1.1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', fontSize: '13px' }}>
            <FiPlus size={15} /> {isMobile ? 'Novo' : 'Novo Seguimento'}
          </button>
        </header>

        {/* Card métrica */}
        <section style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'inline-block', background: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b', padding: '1rem 1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Total de Seguimentos</p>
            <h2 style={{ margin: '0.4rem 0', fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{dashboard.total}</h2>
          </div>
        </section>

        {/* Lista mobile ou tabela desktop */}
        {isMobile ? (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Carregando...</div>
            ) : seguimentos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b' }}>
                Nenhum seguimento encontrado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {seguimentos.map((seg, i) => (
                  <div key={seg.id ?? i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '3px solid #10b981' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>{seg.nome}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(seg)} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: '#60a5fa', display: 'flex', alignItems: 'center' }}>
                        <FiEdit2 size={14} />
                      </button>
                      <button onClick={() => handleOpenModal(seg, 'delete')} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <section style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', padding: '1rem' }}>
            {loading ? <SkeletonTable rows={5} cols={2} /> : (
              <GridDados
                coluna={colunasSeguimentos} data={seguimentos} itemsPerPage={10}
                labelpesquisa="Buscar seguimentos..." usaVisualizar={false}
                usaEditar acaoEditar={handleEdit} usaExcluir acaoExcluir={(item) => handleOpenModal(item, 'delete')}
                usaResetarSenha={false} usaInativar={false} usaReativar={false}
                paddingHead="14px 12px" paddingBody="13px 12px"
                tamanhoFontBody="14px" tamanhoFontHead="14px"
              />
            )}
          </section>
        )}

        {/* Modal formulário */}
        {showFormModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', width: '100%', maxWidth: '400px', position: 'relative' }}>
              <button onClick={closeFormModal} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', cursor: 'pointer', padding: '5px 8px' }}>✖</button>
              <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>
                {onEdit ? 'Editar Seguimento' : 'Novo Seguimento'}
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" placeholder="Nome do Seguimento" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  style={inputStyle} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#334155'} autoFocus />
                <button type="submit" style={{ padding: '0.875rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                  {onEdit ? 'Salvar' : 'Cadastrar'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showModal && <ModalConfirmacao onClose={() => setShowModal(false)} onConfirm={executeConfirmedAction} action={modalAction} userName={itemSelected?.nome} />}
      </main>
      <ToastContainer autoClose={3000} position="top-right" />
    </div>
  );
}

export default PaginaSeguimentos;
