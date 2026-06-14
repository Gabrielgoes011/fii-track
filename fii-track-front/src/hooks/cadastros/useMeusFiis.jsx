import { useState, useCallback } from 'react';
import { toastWarn, toastSuccess, handleError } from '../../utils/responseUtils';
import { meusFiisService } from '../../services/cadastros/meusFiisService';
import { seguimentosService } from '../../services/cadastros/seguimentosService';

export const useMeusFiis = () => {
  const [fiis, setFiis]           = useState([]);
  const [seguimentos, setSeguimentos] = useState([]);
  const [dashboard, setDashboard] = useState({ total: 0 });
  const [loading, setLoading]     = useState(false);

  const [onEdit, setOnEdit]             = useState(null);
  const [formData, setFormData]         = useState({ ticker: '', nomeFundo: '', cnpj: '', idSeguimento: '' });
  const [showFormModal, setShowFormModal] = useState(false);

  const [showModal, setShowModal]       = useState(false);
  const [itemSelected, setItemSelected] = useState(null);
  const [modalAction, setModalAction]   = useState('');

  const getFiis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await meusFiisService.listarTodos();
      setFiis(data || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSeguimentos = useCallback(async () => {
    try {
      const data = await seguimentosService.listarTodos();
      setSeguimentos(data || []);
    } catch (error) {
      handleError(error);
    }
  }, []);

  const getDashboard = useCallback(async () => {
    try {
      const data = await meusFiisService.contar();
      // O backend retorna apenas o número total (string do PostgreSQL)
      const totalCount = Number(data) || 0;
      setDashboard({ total: totalCount });
    } catch (error) {
      handleError(error);
    }
  }, []);

  const handleAddFii = async (data) => {
    try {
      const payload = { ...data };

      if (payload.idSegmento) {
        payload.idSeguimento = payload.idSegmento;
        delete payload.idSegmento;
      }

      if (!payload.idSeguimento || payload.idSeguimento === '') {
        toastWarn('Por favor, selecione um Seguimento para o fundo!');
        return;
      }

      await meusFiisService.criar(payload);
      toastSuccess('Fundo cadastrado com sucesso!');
      closeFormModal();
      getFiis();
      getDashboard();
    } catch (error) {
      handleError(error);
    }
  };

  const handleUpdateFii = async (data) => {
    try {
      const payload = { nomeFundo: data.nomeFundo };
      await meusFiisService.atualizar(onEdit.id, payload);
      toastSuccess('Fundo atualizado com sucesso!');
      closeFormModal();
      getFiis();
      getDashboard();
    } catch (error) {
      handleError(error);
    }
  };

  const executeConfirmedAction = async () => {
    if (!itemSelected || !itemSelected.id) {
      toastWarn('Erro ao identificar o fundo. Por favor tente novamente.');
      return;
    }

    try {
      if (modalAction === 'delete') {
        await meusFiisService.excluir(itemSelected.id);
        toastSuccess('Fundo excluído com sucesso!');
      }
      getFiis();
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
    setFormData({ ticker: '', nomeFundo: '', cnpj: '', idSeguimento: '' });
    setShowFormModal(true);
  };

  const handleEdit = (item) => {
    setOnEdit(item);
    setFormData({
      ticker: item.ticker,
      nomeFundo: item.nomeFundo,
      cnpj: item.cnpj,
      idSeguimento: item.idSeguimento || ''
    });
    setShowFormModal(true);
  };

  const handleOpenModal = (item, action) => {
    console.log('🔍 Item selecionado para ação:', item); // DEBUG
    console.log('Tem ID?', item?.id); // DEBUG
    
    if (!item || !item.id) {
      console.warn('⚠️ Item sem ID:', item);
      toastWarn('Erro ao selecionar fundo. Item inválido.');
      return;
    }
    setItemSelected(item);
    setModalAction(action);
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setOnEdit(null);
    setFormData({ ticker: '', nomeFundo: '', cnpj: '', idSeguimento: '' });
  };

  return {
    fiis, seguimentos, onEdit, formData, showModal, itemSelected, modalAction, showFormModal,
    setFormData, setShowModal, dashboard, loading, getFiis, getDashboard, getSeguimentos,
    handleAddFii, handleUpdateFii, handleOpenCreate, handleEdit, handleOpenModal,
    executeConfirmedAction, closeFormModal
  };
};
