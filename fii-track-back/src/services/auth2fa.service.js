import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { encryptText, decryptText } from '../utils/crypto.js';
import { findCredentialsByUserId, updateCredentials2fa } from '../repositories/auth2fa.repository.js';

const APP_NAME = process.env.APP_NAME || 'FII-TRACK';

export async function iniciar2faService(usuarioId) {
  const credenciais = await findCredentialsByUserId(usuarioId);
  if (!credenciais) {
    throw new Error('Credenciais do usuário não encontradas.');
  }

  if (credenciais.auth2faTotp) {
    throw new Error('2FA já está ativado para este usuário.');
  }

  const secret = speakeasy.generateSecret({
    name: `${APP_NAME}:${credenciais.email}`,
    issuer: APP_NAME,
    length: 20,
  });

  const encryptedSecret = encryptText(secret.base32);
  const otpAuthUrl = secret.otpauth_url;
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

  await updateCredentials2fa(usuarioId, {
    secretAuth2fa: encryptedSecret,
    auth2faTotp: false,
    auth2faHabilitado: false,
  });

  return {
    qrCodeDataUrl,
    secretBase32: secret.base32,
  };
}

export async function confirmar2faService(usuarioId, codigo) {
  const credenciais = await findCredentialsByUserId(usuarioId);
  if (!credenciais) {
    throw new Error('Credenciais do usuário não encontradas.');
  }

  const secret = decryptText(credenciais.secretAuth2fa);
  if (!secret) {
    throw new Error('Segredo de 2FA não encontrado. Ative antes de confirmar.');
  }

  const valid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: codigo,
    window: 1,
  });

  if (!valid) {
    throw new Error('Código inválido. Verifique o app do autenticador.');
  }

  await updateCredentials2fa(usuarioId, {
    auth2faTotp: true,
    auth2faHabilitado: true,
  });

  return { auth2faTotp: true };
}

export async function desativar2faService(usuarioId) {
  const credenciais = await findCredentialsByUserId(usuarioId);
  if (!credenciais) {
    throw new Error('Credenciais do usuário não encontradas.');
  }

  await updateCredentials2fa(usuarioId, {
    secretAuth2fa: null,
    auth2faTotp: false,
    auth2faHabilitado: false,
  });

  return { auth2faTotp: false };
}

export async function validarCodigo2faService(usuarioId, codigo) {
  const credenciais = await findCredentialsByUserId(usuarioId);
  if (!credenciais || !credenciais.auth2faTotp) {
    throw new Error('2FA não está ativado para este usuário.');
  }

  const secret = decryptText(credenciais.secretAuth2fa);
  if (!secret) {
    throw new Error('Segredo de 2FA inválido.');
  }

  const valid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: codigo,
    window: 1,
  });

  if (!valid) {
    throw new Error('Código inválido. Verifique o app do autenticador.');
  }

  return { valid: true };
}
