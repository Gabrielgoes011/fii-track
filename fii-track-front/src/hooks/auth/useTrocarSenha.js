import { useState } from 'react';
import { authService } from '../../services/auth/authService';
import { toastSuccess, handleError } from '../../utils/responseUtils';

const FORM_INICIAL = { senhaAtual: '', novaSenha: '', confirmarSenha: '' };

export const useTrocarSenha = (userId) => {
  const [showTrocarSenhaModal, setShowTrocarSenhaModal] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [loading, setLoading] = useState(false);

  const abrirTrocarSenha = () => {
    setFormData(FORM_INICIAL);
    setShowTrocarSenhaModal(true);
  };

  const fecharTrocarSenha = () => {
    setShowTrocarSenhaModal(false);
    setFormData(FORM_INICIAL);
  };

  const handleTrocarSenha = async (e) => {
    e.preventDefault();

    const { senhaAtual, novaSenha, confirmarSenha } = formData;

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      handleError({ response: { status: 400, data: { message: 'Preencha todos os campos.' } } });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      handleError({ response: { status: 400, data: { message: 'A confirmação não confere com a nova senha.' } } });
      return;
    }

    setLoading(true);
    try {
      await authService.trocarSenha({ userId, senhaAtual, novaSenha });
      toastSuccess('Senha alterada com sucesso!');
      fecharTrocarSenha();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    showTrocarSenhaModal, formData, loading,
    setFormData, abrirTrocarSenha, fecharTrocarSenha, handleTrocarSenha,
  };
};
