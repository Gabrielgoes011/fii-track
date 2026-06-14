import { useState, useCallback } from 'react';
import { toastSuccess, toastInfo, handleError } from '../../utils/responseUtils';
import { seguimentosService } from '../../services/cadastros/seguimentosService';

export const useSeguimentos = () => {
  const [seguimentos, setSeguimentos] = useState([]);
  const [dashboard, setDashboard]     = useState({ total: 0 });
  const [loading, setLoading]         = useState(false);

  const [onEdit, setOnEdit]             = useState(null);
  const [formData, setFormData]         = useState({ nome: '' });
  const [showFormModal, setShowFormModal] = useState(false);

  const [showModal, setShowModal]       = useState(false);
  const [itemSelected, setItemSelected] = useState(null);
  const [modalAction, setModalAction]   = useState('');

  const getSeguimentos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await seguimentosService.listarTodos();
      setSeguimentos(data || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDashboard = useCallback(async () => {
    try {
      const data = await seguimentosService.contar();
      const totalCount = Array.isArray(data) ? data.length : (Number(data.total) || Number(data.ativos) || 0);
      setDashboard({ total: totalCount });
    } catch (error) {
      handleError(error);
    }
  }, []);

  const handleAddSeguimento = async (data) => {
    try {
      await seguimentosService.criar(data);
      toastSuccess('Seguimento cadastrado com sucesso!');
      closeFormModal();
      getSeguimentos();
      getDashboard();
    } catch (error) {
      handleError(error);
    }
  };

  const handleUpdateSeguimento = async (data) => {
    toastInfo('⚙️ Funcionalidade em desenvolvimento...');
    return;
    // try {
    //   await seguimentosService.atualizar(onEdit.id, data);
    //   toastSuccess('Seguimento atualizado com sucesso!');
    //   closeFormModal();
    //   getSeguimentos();
    //   getDashboard();
    // } catch (error) {
    //   handleError(error);
    // }
  };

  const executeConfirmedAction = async () => {
    if (!itemSelected) return;

    try {
      if (modalAction === 'delete') {
        await seguimentosService.excluir(itemSelected.id);
        toastSuccess('Seguimento excluído com sucesso!');
      }
      getSeguimentos();
      getDashboard();
    } catch (error) {
      handleError(error);
    }

    setShowModal(false);
    setItemSelected(null);
    setModalAction('');
  };

  const handleOpenCreate = () => {
    setOnEdit(null);
    setFormData({ nome: '' });
    setShowFormModal(true);
  };

  const handleEdit = (item) => {
    toastInfo('⚙️ Funcionalidade em desenvolvimento...');
    return;
    // setOnEdit(item);
    // setFormData({ nome: item.nome });
    // setShowFormModal(true);
  };

  const handleOpenModal = (item, action) => {
    setItemSelected(item);
    setModalAction(action);
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setOnEdit(null);
    setFormData({ nome: '' });
  };

  return {
    seguimentos, onEdit, formData, showModal, itemSelected, modalAction, showFormModal,
    setFormData, setShowModal, dashboard, loading, getSeguimentos, getDashboard,
    handleAddSeguimento, handleUpdateSeguimento, handleOpenCreate, handleEdit,
    handleOpenModal, executeConfirmedAction, closeFormModal
  };
};
