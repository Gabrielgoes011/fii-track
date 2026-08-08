import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaShieldAlt, FaLock, FaArrowLeft, FaCamera, FaSave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { authService } from '../../services/auth/authService';
import { toastSuccess, toastWarn, handleError } from '../../utils/responseUtils';

function PaginaPerfil({ usuario }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [twoFaAtivo, setTwoFaAtivo] = useState(usuario?.auth2faTotp || false);
  const [twoFaMode, setTwoFaMode] = useState('view');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState(usuario?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [senha, setSenha] = useState('********');
  const [foto, setFoto] = useState(null);

  const hasChanges = editMode && (
    nome !== (usuario?.nome || '') ||
    email !== (usuario?.email || '') ||
    senha !== '********' ||
    foto !== null
  );

  const handleStartTwoFa = async () => {
    setTwoFaLoading(true);
    try {
      const resultado = await authService.iniciar2fa();
      setQrCodeDataUrl(resultado.qrCodeDataUrl);
      setManualSecret(resultado.secretBase32);
      setTwoFaMode('confirm');
      toastSuccess('Leia o QR code com o app e confirme o código.');
    } catch (error) {
      handleError(error);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleConfirmTwoFa = async () => {
    if (!verificationCode) {
      toastWarn('Informe o código 2FA antes de confirmar.');
      return;
    }
    setTwoFaLoading(true);
    try {
      await authService.confirmar2fa(verificationCode);
      setTwoFaAtivo(true);
      setTwoFaMode('view');
      setVerificationCode('');
      setQrCodeDataUrl('');
      setManualSecret('');
      toastSuccess('2FA ativado com sucesso.');
    } catch (error) {
      handleError(error);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisableTwoFa = async () => {
    setTwoFaLoading(true);
    try {
      await authService.desativar2fa();
      setTwoFaAtivo(false);
      setTwoFaMode('view');
      setVerificationCode('');
      setQrCodeDataUrl('');
      setManualSecret('');
      toastSuccess('2FA desativado.');
    } catch (error) {
      handleError(error);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleFileChange = event => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFoto(selectedFile.name);
    }
  };

  const handleSave = () => {
    if (!hasChanges) return;
    setEditMode(false);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#f8fafc' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          background: 'transparent', border: '1px solid #334155',
          borderRadius: '10px', color: '#94a3b8', padding: '10px 14px',
          cursor: 'pointer', width: 'fit-content', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#f8fafc'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
      >
        <FaArrowLeft size={12} /> Voltar
      </button>

      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>Meu Perfil</h1>
              <span style={{ padding: '6px 12px', borderRadius: '999px', background: '#334155', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Em desenvolvimento
              </span>
            </div>
            <p style={{ margin: '10px 0 0', color: '#94a3b8', maxWidth: '680px', lineHeight: 1.7 }}>
              Aqui você vê as informações do seu perfil e só entra em edição quando tocar no botão.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {!editMode && (
              <button
                type="button"
                onClick={handleEdit}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  borderRadius: '14px', border: '1px solid #334155',
                  background: '#0f172a', color: '#f8fafc', padding: '12px 18px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Editar perfil
              </button>
            )}
            {editMode && (
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  borderRadius: '14px', border: '1px solid transparent',
                  background: hasChanges ? '#10b981' : '#1f2937',
                  color: hasChanges ? '#0f172a' : '#64748b', padding: '12px 18px',
                  cursor: hasChanges ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                }}
              >
                <FaSave size={14} /> Salvar alterações
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '360px 1fr', gap: '18px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '24px', background: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '84px', height: '84px', borderRadius: '24px', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
                    <FaUserCircle size={44} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Foto do perfil</div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Formato JPG ou PNG. Apenas visual.</div>
                  </div>
                </div>
                <label
                  htmlFor="photo-upload"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '999px', border: '1px solid #334155', padding: '10px 14px', color: '#f8fafc', background: '#111827' }}
                >
                  <FaCamera size={14} />
                  Alterar foto
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <span style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
                  {foto ? `Arquivo selecionado: ${foto}` : 'Nenhuma imagem selecionada.'}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nome</span>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    disabled={!editMode}
                    style={{ width: '100%', borderRadius: '16px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '14px 16px' }}
                  />
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={!editMode}
                    style={{ width: '100%', borderRadius: '16px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '14px 16px' }}
                  />
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Senha</span>
                  <input
                    type="password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    disabled={!editMode}
                    style={{ width: '100%', borderRadius: '16px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '14px 16px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '18px' }}>
              <div style={{ padding: '24px', borderRadius: '24px', background: '#0f172a', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Segurança</div>
                    <div style={{ color: '#94a3b8', marginTop: '6px' }}>Controle de login e autenticação da conta.</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
                        <FaShieldAlt size={18} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>2FA</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{twoFaAtivo ? 'Ativado' : 'Desativado'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {!twoFaAtivo && twoFaMode === 'view' && (
                        <button
                          type="button"
                          onClick={handleStartTwoFa}
                          disabled={twoFaLoading}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: '#10b981',
                            color: '#0f172a',
                            border: '1px solid transparent',
                            borderRadius: '999px',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <FaLock size={16} />
                          Ativar 2FA
                        </button>
                      )}
                      {twoFaAtivo && (
                        <button
                          type="button"
                          onClick={handleDisableTwoFa}
                          disabled={twoFaLoading}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: '#111827',
                            color: '#f97316',
                            border: '1px solid #f97316',
                            borderRadius: '999px',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <FaLock size={16} />
                          Desativar 2FA
                        </button>
                      )}
                    </div>
                  </div>
                  {twoFaMode === 'confirm' && (
                    <div style={{ display: 'grid', gap: '16px', padding: '18px', borderRadius: '18px', background: '#111827', border: '1px solid #334155' }}>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>1. Escaneie o QR code com o app do autenticador.</span>
                        {qrCodeDataUrl && (
                          <img src={qrCodeDataUrl} alt="QR code 2FA" style={{ width: '160px', height: '160px', borderRadius: '18px', background: '#0f172a', padding: '16px', border: '1px solid #334155' }} />
                        )}
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Ou use este segredo manualmente:</span>
                        <div style={{ padding: '12px 14px', background: '#0f172a', borderRadius: '16px', border: '1px solid #334155', color: '#f8fafc', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {manualSecret || 'Gerando...'}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <label htmlFor="confirmacao2fa" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>2. Digite o código do app</label>
                        <input
                          id="confirmacao2fa"
                          type="text"
                          value={verificationCode}
                          onChange={e => setVerificationCode(e.target.value)}
                          placeholder="123456"
                          style={{ width: '100%', borderRadius: '16px', border: '1px solid #334155', background: '#111827', color: '#f8fafc', padding: '14px 16px' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleConfirmTwoFa}
                        disabled={twoFaLoading || !verificationCode}
                        style={{
                          width: '100%', padding: '12px 16px', borderRadius: '14px', border: 'none',
                          background: '#10b981', color: '#0f172a', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {twoFaLoading ? 'Confirmando...' : 'Confirmar 2FA'}
                      </button>
                    </div>
                  )}
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Ativar 2FA aumenta a segurança da sua conta. Você poderá usar o app do Google Authenticator para gerar códigos de acesso.
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px', borderRadius: '24px', background: '#0f172a', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>Resumo</div>
                <div style={{ color: '#94a3b8', lineHeight: 1.7 }}>
                  Quando você tocar em editar, os campos serão liberados para alteração. Por enquanto, os dados estão em modo de visualização.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaginaPerfil;
