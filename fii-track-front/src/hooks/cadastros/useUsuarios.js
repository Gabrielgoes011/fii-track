import { useState, useCallback } from 'react';
import { toastSuccess, handleError } from '../../utils/responseUtils';
import { formatarDataBR } from '../../utils/dateUtils';
import { usuariosService } from '../../services/cadastros/usuariosService';

export const useUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [onEdit, setOnEdit] = useState(null);
  const [activeTab, setActiveTab] = useState('ativos');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    email: '',
    cpf: '',
    foto: null
  });

  const [dashboard, setDashboard] = useState({
    ativos: 0,
    inativos: 0,
    total: 0
  });

  const [showModal, setShowModal] = useState(false);
  const [userSelected, setUserSelected] = useState(null);
  const [modalAction, setModalAction] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);

  const getUsers = useCallback(async () => {
    setLoading(true);
    try {
      const status = activeTab === 'ativos' ? 'on' : 'off';
      const allUsers = await usuariosService.listarTodos(status);

      const processedUsers = allUsers.map(user => ({
        ...user,
        status: user.ativo ? 'on' : 'off'
      })).sort((a, b) => (a.nome > b.nome ? 1 : -1));

      setUsers(processedUsers);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const getDashboard = useCallback(async () => {
    try {
      const result = await usuariosService.contar();
      setDashboard({
        ativos: result.ativos ?? 0,
        inativos: result.inativos ?? 0,
        total: result.total ?? 0
      });
    } catch (error) {
      handleError(error);
    }
  }, []);

  const handleAddUser = async (novoUsuario) => {
    try {
      await usuariosService.criar(novoUsuario);
      toastSuccess('Usuário cadastrado com sucesso!');
      getUsers();
      resetForm();
      setShowFormModal(false);
    } catch (error) {
      handleError(error);
    }
  };

  const handleUpdateUser = async (usuarioAtualizado) => {
    try {
      await usuariosService.atualizar(onEdit.id, usuarioAtualizado);
      toastSuccess('Usuário atualizado com sucesso!');
      getUsers();
      resetForm();
      setShowFormModal(false);
      setOnEdit(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleResetPassword = async (user) => {
    try {
      await usuariosService.resetarSenha(user.id);
      toastSuccess('Senha resetada para o padrão com sucesso!');
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await usuariosService.deletar(userId);
      toastSuccess('Usuário deletado com sucesso!');
      getUsers();
    } catch (error) {
      handleError(error);
    }
  };

  const handleInactivateUser = async (user) => {
    try {
      await usuariosService.inativarReativar(user.id);
      toastSuccess('Usuário inativado com sucesso!');
      await getUsers();
      await getDashboard();
    } catch (error) {
      handleError(error);
    }
  };

  const handleReactivateUser = async (user) => {
    try {
      await usuariosService.inativarReativar(user.id);
      toastSuccess('Usuário reativado com sucesso!');
      await getUsers();
      await getDashboard();
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpenCreate = () => {
    setOnEdit(null);
    resetForm();
    setShowFormModal(true);
  };

  const handleEdit = (user) => {
    setOnEdit(user);
    setFormData({
      nome: user.nome || '',
      dataNascimento: formatarDataBR(user.dataNascimento),
      email: user.email || '',
      cpf: user.cpf || '',
      foto: null
    });
    setShowFormModal(true);
  };

  const handleOpenModal = (user, action) => {
    setUserSelected(user);
    setModalAction(action);
    setShowModal(true);
  };

  const executeConfirmedAction = async () => {
    if (!userSelected) return;

    switch (modalAction) {
      case 'delete':
        await handleDeleteUser(userSelected.id);
        break;
      case 'inactivate':
        await handleInactivateUser(userSelected);
        break;
      case 'reactivate':
        await handleReactivateUser(userSelected);
        break;
      case 'reset':
        await handleResetPassword(userSelected);
        break;
      default:
        break;
    }

    setShowModal(false);
    setUserSelected(null);
    setModalAction('');
  };

  const resetForm = () => {
    setFormData({ nome: '', dataNascimento: '', email: '', cpf: '', foto: null });
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetForm();
    setOnEdit(null);
  };

  return {
    users, onEdit, activeTab, loading, formData, showModal, userSelected,
    modalAction, showFormModal, setFormData, setActiveTab, setShowModal,
    setShowFormModal, dashboard, getUsers, getDashboard, handleAddUser,
    handleUpdateUser, handleDeleteUser, handleInactivateUser, handleReactivateUser, handleResetPassword,
    handleOpenCreate, handleEdit, handleOpenModal, executeConfirmedAction,
    closeFormModal, resetForm
  };
};
