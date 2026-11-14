import { useEffect, useState } from 'react';
import { GridDados } from '../../../components/GridDados';
import { useUsuarios } from '../../../hooks/cadastros/useUsuarios';
import ModalFormulario from '../../../components/ModalFormulario/ModalFormulario';
import ModalConfirmacao from '../../../components/ModalDeConfirmacao/ModalConfirmacao';
import SkeletonTable from '../../../components/SkeletonTable/SkeletonTable';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiUserX, FiUserCheck, FiKey } from 'react-icons/fi';

const colunasUsuarios = [
  { titulo: 'Nome',  acesso: 'nome',  width: '25%', align: 'left'   },
  { titulo: 'Email', acesso: 'email', width: '30%', align: 'left'   },
  { titulo: 'Idade', acesso: 'idade', width: '10%', align: 'center' },
  { titulo: 'CPF',   acesso: 'cpf',   width: '20%', align: 'center' },
];

function PaginaUsuarios() {
  const {
    users, onEdit, activeTab, loading, formData, showModal, userSelected,
    modalAction, showFormModal, setFormData, setActiveTab, setShowModal,
    dashboard, getUsers, getDashboard, handleAddUser, handleUpdateUser,
    handleOpenCreate, handleEdit, handleOpenModal, executeConfirmedAction, closeFormModal
  } = useUsuarios();

  const isMobile = useIsMobile();
  useEffect(() => {
    getUsers();
    getDashboard();
  }, [getUsers, getDashboard]);

  const handleSetFormDataMask = (updater) => {
    setFormData((prev) => {
      const newData = typeof updater === 'function' ? updater(prev) : { ...updater };
      if (newData.dataNascimento !== undefined) {
        let v = newData.dataNascimento.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        if (v.length > 4) newData.dataNascimento = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        else if (v.length > 2) newData.dataNascimento = `${v.slice(0, 2)}/${v.slice(2)}`;
        else newData.dataNascimento = v;
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.dataNascimento || !formData.cpf) {
      alert('Por favor, preencha todos os campos!'); return;
    }
    const dataRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dataRegex.test(formData.dataNascimento)) {
      alert('Data de nascimento deve estar no formato DD/MM/AAAA'); return;
    }
    if (onEdit) {
      await handleUpdateUser({ nome: formData.nome, dataNascimento: formData.dataNascimento, email: formData.email, cpf: formData.cpf, status: onEdit.status || 'on' });
    } else {
      await handleAddUser(formData);
    }
  };

  return (
    <div style={{ minHeight: 'var(--altura-util, 100vh)', backgroundColor: 'var(--bg-pagina)', color: 'var(--texto)', fontFamily: 'Inter, sans-serif', padding: isMobile ? '1rem 0.75rem' : '2rem 1rem' }}>
      <main style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--texto)' }}>Usuários</h1>
            <p style={{ color: 'var(--texto-mudo)', margin: 0, fontSize: '13px' }}>Gerencie usuários ativos e inativos</p>
          </div>
          <button onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.65rem 1.1rem', background: 'var(--accent-gradiente)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', fontSize: '13px' }}>
            <FiPlus size={15} /> {isMobile ? 'Novo' : 'Novo Usuário'}
          </button>
        </header>

        {/* Cards métricas */}
        <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, minmax(0,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--borda)', padding: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--texto-mudo)' }}>Ativos</p>
            <h2 style={{ margin: '0.4rem 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>{dashboard.ativos}</h2>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--borda)', padding: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--texto-mudo)' }}>Inativos</p>
            <h2 style={{ margin: '0.4rem 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--perigo)' }}>{dashboard.inativos}</h2>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--borda)', padding: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--texto-mudo)' }}>Total</p>
            <h2 style={{ margin: '0.4rem 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--info)' }}>{dashboard.total}</h2>
          </div>
        </section>

        {/* Abas */}
        <nav style={{ display: 'flex', backgroundColor: 'var(--surface)', border: '1px solid var(--borda)', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' }}>
          {['ativos', 'inativos'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: activeTab === tab ? 'rgba(16,185,129,0.1)' : 'transparent', color: activeTab === tab ? 'var(--accent)' : 'var(--texto-mudo)', border: 'none', borderBottom: activeTab === tab ? '3px solid var(--accent)' : '3px solid transparent', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}>
              {tab === 'ativos' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </nav>

        {/* Lista mobile ou tabela desktop */}
        {isMobile ? (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--texto-mudo)' }}>Carregando...</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--texto-mudo)', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--borda)' }}>
                Nenhum usuário encontrado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {users.map((user, i) => (
                  <div key={user.id ?? i} style={{ background: 'var(--surface)', border: '1px solid var(--borda)', borderRadius: '12px', padding: '14px 16px', borderLeft: `3px solid ${activeTab === 'ativos' ? '#10b981' : '#f87171'}` }}>
                    {/* linha 1: nome + ações */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--texto)' }}>{user.nome}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {activeTab === 'ativos' && <>
                          <button onClick={() => handleEdit(user)} title="Editar" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: 'var(--info)', display: 'flex', alignItems: 'center' }}><FiEdit2 size={13} /></button>
                          <button onClick={() => handleOpenModal(user, 'reset')} title="Resetar senha" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: 'var(--aviso)', display: 'flex', alignItems: 'center' }}><FiKey size={13} /></button>
                          <button onClick={() => handleOpenModal(user, 'inactivate')} title="Inativar" style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: 'var(--texto-suave)', display: 'flex', alignItems: 'center' }}><FiUserX size={13} /></button>
                        </>}
                        {activeTab === 'inativos' &&
                          <button onClick={() => handleOpenModal(user, 'reactivate')} title="Reativar" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center' }}><FiUserCheck size={13} /></button>
                        }
                        <button onClick={() => handleOpenModal(user, 'delete')} title="Excluir" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: 'var(--perigo)', display: 'flex', alignItems: 'center' }}><FiTrash2 size={13} /></button>
                      </div>
                    </div>
                    {/* linha 2: email + cpf */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--texto-mudo)' }}>{user.email}</span>
                      <span style={{ fontSize: '12px', color: 'var(--texto-apagado)' }}>CPF: {user.cpf}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <section style={{ backgroundColor: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--borda)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', padding: '1rem' }}>
            {loading ? <SkeletonTable rows={5} cols={5} /> : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--texto-mudo)' }}>Nenhum usuário encontrado.</div>
            ) : (
              <GridDados
                coluna={colunasUsuarios} data={users} itemsPerPage={10}
                labelpesquisa="Buscar usuários..." usaVisualizar={false}
                usaEditar={activeTab === 'ativos'} acaoEditar={handleEdit}
                usaExcluir acaoExcluir={(user) => handleOpenModal(user, 'delete')}
                usaResetarSenha={activeTab === 'ativos'} acaoResetarSenha={(user) => handleOpenModal(user, 'reset')}
                usaInativar={activeTab === 'ativos'} acaoInativar={(user) => handleOpenModal(user, 'inactivate')}
                usaReativar={activeTab === 'inativos'} acaoReativar={(user) => handleOpenModal(user, 'reactivate')}
              />
            )}
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--texto-apagado)' }}>
              Exibindo usuários {activeTab === 'ativos' ? 'ativos' : 'inativos'}.
            </div>
          </section>
        )}

        {showFormModal && (
          <ModalFormulario onClose={closeFormModal} onSubmit={handleSubmit} isEditing={!!onEdit} formData={formData} setFormData={handleSetFormDataMask} />
        )}

        {showModal && (
          <ModalConfirmacao onClose={() => setShowModal(false)} onConfirm={executeConfirmedAction} action={modalAction} userName={userSelected?.nome} />
        )}

      </main>
    </div>
  );
}

export default PaginaUsuarios;
