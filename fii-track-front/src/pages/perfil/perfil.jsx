import React, { useState } from 'react';
import { FaShieldAlt, FaLock, FaArrowLeft, FaCamera, FaKey, FaUser, FaEnvelope, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { authService } from '../../services/auth/authService';
import { useTrocarSenha } from '../../hooks/auth/useTrocarSenha';
import ModalTrocarSenha from '../../components/ModalTrocarSenha/ModalTrocarSenha';
import { toastSuccess, toastWarn, handleError } from '../../utils/responseUtils';

// Iniciais do nome (ex: "Gabriel Goes" -> "GG")
function getInitials(nome = '') {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('') || 'U';
}

function PaginaPerfil({ usuario }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // 2FA
  const [twoFaAtivo, setTwoFaAtivo] = useState(usuario?.auth2faTotp || false);
  const [twoFaMode, setTwoFaMode] = useState('view');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  // Foto (apenas visual por enquanto)
  const [foto, setFoto] = useState(null);

  // Troca de senha (reusa o mesmo fluxo do TopBar)
  const {
    showTrocarSenhaModal, formData, loading: senhaLoading,
    setFormData, abrirTrocarSenha, fecharTrocarSenha, handleTrocarSenha,
  } = useTrocarSenha(usuario?.id);

  const nome = usuario?.nome || 'Usuário';
  const email = usuario?.email || '—';

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
    if (selectedFile) setFoto(selectedFile.name);
  };

  // ── estilos reutilizados ──
  const cardStyle = { padding: '24px', borderRadius: '20px', background: '#0f172a', border: '1px solid #1e293b' };
  const labelStyle = { color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 };

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

      {/* ── Header ── */}
      <div>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>Meu Perfil</h1>
        <p style={{ margin: '8px 0 0', color: '#94a3b8', maxWidth: '680px', lineHeight: 1.6 }}>
          Gerencie a foto, os dados e a segurança da sua conta.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: '18px', alignItems: 'start' }}>

        {/* ── Card: Foto + identidade ── */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
          {/* Avatar com iniciais */}
          <div style={{
            width: '96px', height: '96px', borderRadius: '28px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '2rem', letterSpacing: '1px',
            boxShadow: '0 0 24px rgba(16,185,129,0.35)',
          }}>
            {getInitials(nome)}
          </div>

          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>{nome}</div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '2px' }}>{email}</div>
          </div>

          {/* Upload de foto (visual) */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="photo-upload"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                cursor: 'pointer', borderRadius: '12px', border: '1px solid #334155',
                padding: '11px 14px', color: '#f8fafc', background: '#111827', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; }}
            >
              <FaCamera size={14} /> Alterar foto
            </label>
            <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
              {foto ? `Selecionado: ${foto}` : 'JPG ou PNG.'}
            </span>
          </div>
        </div>

        {/* ── Coluna direita ── */}
        <div style={{ display: 'grid', gap: '18px' }}>

          {/* ── Segurança ── */}
          <div style={cardStyle}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Segurança</div>
              <div style={{ color: '#94a3b8', marginTop: '6px', fontSize: '0.9rem' }}>Controle de login e autenticação da conta.</div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {/* 2FA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap', padding: '14px', borderRadius: '14px', background: '#111827', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
                    <FaShieldAlt size={18} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: 600 }}>Verificação em duas etapas (2FA)</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: twoFaAtivo ? '#34d399' : '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
                      {twoFaAtivo ? <FaCheckCircle size={11} /> : <FaTimesCircle size={11} />}
                      {twoFaAtivo ? 'Ativado' : 'Desativado'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'inline-flex', gap: '8px' }}>
                  {!twoFaAtivo && twoFaMode === 'view' && (
                    <button
                      type="button" onClick={handleStartTwoFa} disabled={twoFaLoading}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#0f172a', border: '1px solid transparent', borderRadius: '10px', padding: '10px 14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <FaLock size={14} /> Ativar 2FA
                    </button>
                  )}
                  {twoFaAtivo && (
                    <button
                      type="button" onClick={handleDisableTwoFa} disabled={twoFaLoading}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#111827', color: '#f97316', border: '1px solid #f97316', borderRadius: '10px', padding: '10px 14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <FaLock size={14} /> Desativar 2FA
                    </button>
                  )}
                </div>
              </div>

              {/* Fluxo de confirmação do 2FA */}
              {twoFaMode === 'confirm' && (
                <div style={{ display: 'grid', gap: '16px', padding: '18px', borderRadius: '16px', background: '#111827', border: '1px solid #334155' }}>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>1. Escaneie o QR code com o app do autenticador.</span>
                    {qrCodeDataUrl && (
                      <img src={qrCodeDataUrl} alt="QR code 2FA" style={{ width: '160px', height: '160px', borderRadius: '16px', background: '#0f172a', padding: '16px', border: '1px solid #334155' }} />
                    )}
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Ou use este segredo manualmente:</span>
                    <div style={{ padding: '12px 14px', background: '#0f172a', borderRadius: '14px', border: '1px solid #334155', color: '#f8fafc', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {manualSecret || 'Gerando...'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <label htmlFor="confirmacao2fa" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>2. Digite o código do app</label>
                    <input
                      id="confirmacao2fa" type="text" value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value)} placeholder="123456"
                      style={{ width: '100%', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', padding: '14px 16px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    type="button" onClick={handleConfirmTwoFa} disabled={twoFaLoading || !verificationCode}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {twoFaLoading ? 'Confirmando...' : 'Confirmar 2FA'}
                  </button>
                </div>
              )}

              {/* Senha */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap', padding: '14px', borderRadius: '14px', background: '#111827', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
                    <FaKey size={16} color="#60a5fa" />
                  </div>
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: 600 }}>Senha de acesso</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>Altere sua senha periodicamente.</div>
                  </div>
                </div>
                <button
                  type="button" onClick={abrirTrocarSenha}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0f172a', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '10px', padding: '10px 14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  <FaKey size={13} /> Alterar senha
                </button>
              </div>
            </div>
          </div>

          {/* ── Informações da conta (desktop apenas — no mobile os dados já aparecem no card de foto) ── */}
          {!isMobile && (
            <div style={cardStyle}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>Informações da conta</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '14px', background: '#111827', border: '1px solid #1e293b' }}>
                  <FaUser size={15} color="#64748b" />
                  <div style={{ minWidth: 0 }}>
                    <div style={labelStyle}>Nome</div>
                    <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '14px', background: '#111827', border: '1px solid #1e293b' }}>
                  <FaEnvelope size={15} color="#64748b" />
                  <div style={{ minWidth: 0 }}>
                    <div style={labelStyle}>Email</div>
                    <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de troca de senha */}
      <ModalTrocarSenha
        isOpen={showTrocarSenhaModal}
        onClose={fecharTrocarSenha}
        onSubmit={handleTrocarSenha}
        formData={formData}
        setFormData={setFormData}
        loading={senhaLoading}
      />
    </div>
  );
}

export default PaginaPerfil;
