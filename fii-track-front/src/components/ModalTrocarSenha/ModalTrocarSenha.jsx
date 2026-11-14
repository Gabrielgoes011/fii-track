import React, { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import SlideModal from '../SlideModal/SlideModal';
import { Botao } from '../ui';

const inputWrapperStyle = { position: 'relative' };
const inputStyle = {
  padding: '8px 36px 8px 12px',
  fontSize: '13px',
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: '8px',
  border: '1px solid var(--borda-forte)',
  background: 'var(--surface)',
  color: 'var(--texto)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
const focusIn  = (e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.15)'; };
const focusOut = (e) => { e.target.style.borderColor = 'var(--borda-forte)'; e.target.style.boxShadow = 'none'; };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--texto-suave)', marginBottom: '5px' };
const eyeButtonStyle = {
  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-mudo)',
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
        <button aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'} title={visivel ? 'Ocultar senha' : 'Mostrar senha'} type="button" style={eyeButtonStyle} onClick={() => setVisivel(v => !v)} tabIndex={-1}>
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
            background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FaLock size={20} color="var(--accent)" />
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

        <div style={{ fontSize: '11px', color: 'var(--texto-mudo)', lineHeight: 1.5 }}>
          A nova senha deve ter ao menos 8 caracteres, com letra maiúscula, minúscula e número.
        </div>

        <Botao type="submit" bloco disabled={loading} style={{ marginTop: '4px' }}>
          {loading ? 'Salvando...' : 'Salvar Nova Senha'}
        </Botao>
      </form>
    </SlideModal>
  );
}

export default ModalTrocarSenha;
