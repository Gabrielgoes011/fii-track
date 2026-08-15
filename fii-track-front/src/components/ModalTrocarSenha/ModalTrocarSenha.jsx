import React, { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import SlideModal from '../SlideModal/SlideModal';

const inputWrapperStyle = { position: 'relative' };
const inputStyle = {
  padding: '8px 36px 8px 12px',
  fontSize: '13px',
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: '8px',
  border: '1px solid #243040',
  background: '#0d1520',
  color: '#cdd8e8',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
const focusIn  = (e) => { e.target.style.borderColor = '#0972d3'; e.target.style.boxShadow = '0 0 0 2px rgba(9,114,211,0.15)'; };
const focusOut = (e) => { e.target.style.borderColor = '#243040'; e.target.style.boxShadow = 'none'; };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#7a8fa8', marginBottom: '5px' };
const eyeButtonStyle = {
  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: '#4e6480',
  display: 'flex', alignItems: 'center', padding: 0,
};

function CampoSenha({ label, value, onChange, placeholder }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={inputWrapperStyle}>
        <input
          type={visivel ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={inputStyle}
          onFocus={focusIn}
          onBlur={focusOut}
          autoComplete="new-password"
        />
        <button type="button" style={eyeButtonStyle} onClick={() => setVisivel(v => !v)} tabIndex={-1}>
          {visivel ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
        </button>
      </div>
    </div>
  );
}

function ModalTrocarSenha({ isOpen, onClose, onSubmit, formData, setFormData, loading }) {
  return (
    <SlideModal isOpen={isOpen} onClose={onClose} title="Trocar Senha" width="420px">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Ícone */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(9,114,211,0.12)', border: '2px solid rgba(9,114,211,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FaLock size={20} color="#0972d3" />
          </div>
        </div>

        <CampoSenha
          label="Senha Atual"
          placeholder="Digite sua senha atual"
          value={formData.senhaAtual}
          onChange={e => setFormData({ ...formData, senhaAtual: e.target.value })}
        />

        <CampoSenha
          label="Nova Senha"
          placeholder="Mínimo 8 caracteres"
          value={formData.novaSenha}
          onChange={e => setFormData({ ...formData, novaSenha: e.target.value })}
        />

        <CampoSenha
          label="Confirmar Nova Senha"
          placeholder="Repita a nova senha"
          value={formData.confirmarSenha}
          onChange={e => setFormData({ ...formData, confirmarSenha: e.target.value })}
        />

        <div style={{ fontSize: '11px', color: '#4e6480', lineHeight: 1.5 }}>
          A nova senha deve ter ao menos 8 caracteres, com letra maiúscula, minúscula e número.
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            background: '#0972d3',
            border: '1px solid #0972d3',
            color: '#fff', borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontSize: '13px', fontWeight: 700,
            width: '100%', marginTop: '4px',
            boxShadow: '0 2px 8px rgba(9,114,211,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { if (!loading) { e.currentTarget.style.background = '#1a84e8'; e.currentTarget.style.borderColor = '#1a84e8'; } }}
          onMouseOut={e => { if (!loading) { e.currentTarget.style.background = '#0972d3'; e.currentTarget.style.borderColor = '#0972d3'; } }}
        >
          {loading ? 'Salvando...' : 'Salvar Nova Senha'}
        </button>
      </form>
    </SlideModal>
  );
}

export default ModalTrocarSenha;
