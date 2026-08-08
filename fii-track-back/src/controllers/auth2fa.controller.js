import apiResponse from '../utils/httpResponse.js';
import {
  iniciar2faService,
  confirmar2faService,
  desativar2faService,
  validarCodigo2faService,
} from '../services/auth2fa.service.js';

export async function iniciar2faController(req, res) {
  try {
    const usuarioId = req.user.id;
    const resultado = await iniciar2faService(usuarioId);
    return apiResponse.success(res, 'QR code gerado com sucesso.', resultado, 200);
  } catch (error) {
    return apiResponse.error(res, error.message, 500);
  }
}

export async function confirmar2faController(req, res) {
  try {
    const usuarioId = req.user.id;
    const { codigo } = req.body;

    if (!codigo) {
      return apiResponse.validationError(res, 'O código 2FA é obrigatório.');
    }

    const resultado = await confirmar2faService(usuarioId, codigo);
    return apiResponse.success(res, '2FA ativado com sucesso.', resultado, 200);
  } catch (error) {
    return apiResponse.error(res, error.message, 400);
  }
}

export async function desativar2faController(req, res) {
  try {
    const usuarioId = req.user.id;
    const resultado = await desativar2faService(usuarioId);
    return apiResponse.success(res, '2FA desativado com sucesso.', resultado, 200);
  } catch (error) {
    return apiResponse.error(res, error.message, 500);
  }
}

export async function validarCodigo2faController(req, res) {
  try {
    const usuarioId = req.user.id;
    const { codigo } = req.body;

    if (!codigo) {
      return apiResponse.validationError(res, 'O código 2FA é obrigatório.');
    }

    const resultado = await validarCodigo2faService(usuarioId, codigo);
    return apiResponse.success(res, 'Código 2FA validado.', resultado, 200);
  } catch (error) {
    return apiResponse.error(res, error.message, 400);
  }
}
