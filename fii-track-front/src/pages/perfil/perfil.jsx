import React, { useState } from 'react';
import { FaUserCircle, FaShieldAlt, FaToggleOn, FaToggleOff, FaArrowLeft, FaCamera, FaSave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';

function PaginaPerfil({ usuario }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [twoFaAtivo, setTwoFaAtivo] = useState(false);
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

  const handleToggleTwoFa = () => {
    setTwoFaAtivo(prev => !prev);
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
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Proteja sua conta com um código extra.</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleTwoFa}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: twoFaAtivo ? '#065f46' : 'transparent',
                        color: twoFaAtivo ? '#d1fae5' : '#94a3b8',
                        border: `1px solid ${twoFaAtivo ? '#064e3b' : '#334155'}`,
                        borderRadius: '999px',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {twoFaAtivo ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                      {twoFaAtivo ? 'Ativado' : 'Desativado'}
                    </button>
                  </div>
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
