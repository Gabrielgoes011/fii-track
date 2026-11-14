import { useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { GridDados } from '../../../components/GridDados';
import { useSeguimentos } from '../../../hooks/cadastros/useSeguimentos';
import ModalConfirmacao from '../../../components/ModalDeConfirmacao/ModalConfirmacao';
import SkeletonTable from '../../../components/SkeletonTable/SkeletonTable';
import SlideModal from '../../../components/SlideModal/SlideModal';
import { Botao, BotaoIcone, Card, CardMetrica, CabecalhoPagina, Campo, EstadoVazio } from '../../../components/ui';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { toastError } from '../../../utils/responseUtils';

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

  const isMobile = useIsMobile();

  useEffect(() => {
    getSeguimentos();
    getDashboard();
  }, [getSeguimentos, getDashboard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) { toastError('Informe o nome do seguimento.'); return; }
    if (onEdit) await handleUpdateSeguimento({ nome: formData.nome });
    else await handleAddSeguimento(formData);
  };

  return (
    <div style={{ minHeight: 'var(--altura-util, 100vh)', backgroundColor: 'var(--bg-pagina)', color: 'var(--texto)', fontFamily: 'Inter, sans-serif', padding: isMobile ? '1rem 0.75rem' : '2rem 1rem' }}>
      <main style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <CabecalhoPagina
          titulo="Seguimentos"
          subtitulo="Gerencie os seguimentos dos fundos"
          acao={
            <Botao icone={<FiPlus size={15} />} onClick={handleOpenCreate}>
              {isMobile ? 'Novo' : 'Novo Seguimento'}
            </Botao>
          }
        />

        <section style={{ marginBottom: '1.25rem' }}>
          <CardMetrica rotulo="Total de Seguimentos" valor={dashboard.total} />
        </section>

        {/* Lista mobile ou tabela desktop */}
        {isMobile ? (
          loading ? (
            <EstadoVazio>Carregando...</EstadoVazio>
          ) : seguimentos.length === 0 ? (
            <EstadoVazio>Nenhum seguimento encontrado.</EstadoVazio>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {seguimentos.map((seg, i) => (
                <Card key={seg.id ?? i} destaque compacto>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--texto)' }}>{seg.nome}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <BotaoIcone rotulo={`Editar ${seg.nome}`} icone={<FiEdit2 size={14} />} onClick={() => handleEdit(seg)} />
                      <BotaoIcone rotulo={`Excluir ${seg.nome}`} tom="perigo" icone={<FiTrash2 size={14} />} onClick={() => handleOpenModal(seg, 'delete')} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card>
            {loading ? <SkeletonTable rows={5} cols={2} /> : (
              <GridDados
                coluna={colunasSeguimentos} data={seguimentos} itemsPerPage={10}
                labelpesquisa="Buscar seguimentos..." usaVisualizar={false}
                usaEditar acaoEditar={handleEdit} usaExcluir acaoExcluir={(item) => handleOpenModal(item, 'delete')}
              />
            )}
          </Card>
        )}

        {/* Modal formulário */}
        <SlideModal
          isOpen={showFormModal}
          onClose={closeFormModal}
          title={onEdit ? 'Editar Seguimento' : 'Novo Seguimento'}
          width="400px"
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Campo
              rotulo="Nome do seguimento"
              placeholder="Ex.: Logística"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              autoFocus
            />
            <Botao type="submit" bloco>{onEdit ? 'Salvar' : 'Cadastrar'}</Botao>
          </form>
        </SlideModal>

        {showModal && (
          <ModalConfirmacao
            onClose={() => setShowModal(false)}
            onConfirm={executeConfirmedAction}
            action={modalAction}
            userName={itemSelected?.nome}
            entidade="seguimento"
          />
        )}
      </main>
    </div>
  );
}

export default PaginaSeguimentos;
