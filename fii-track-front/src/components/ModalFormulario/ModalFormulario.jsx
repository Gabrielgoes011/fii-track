import React, { useState, useRef } from 'react';
import { FaUser, FaCamera } from 'react-icons/fa';
import { toastInfo } from '../../utils/responseUtils';
import SlideModal from '../SlideModal/SlideModal';

const inputStyle = {
  padding: '8px 12px',
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

function ModalFormulario({ isOpen = true, onClose, onSubmit, isEditing, formData, setFormData }) {
  const [fotoPreview] = useState(formData.foto || null);
  const fileInputRef  = useRef(null);

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Usuário' : 'Novo Usuário'}
      width="500px"
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
          <label
            htmlFor="fotoPerfil"
            style={{
              position: 'relative', width: '80px', height: '80px',
              borderRadius: '50%', background: '#0d1520',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: '2px solid #243040', overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#0972d3'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#243040'}
            onClick={e => {
              e.preventDefault();
              toastInfo('Função de upload de foto em desenvolvimento. Em breve disponível!');
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
          >
            {fotoPreview
              ? <img src={fotoPreview} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <FaUser size={30} color="#334d66" />
            }
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(9,114,211,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <FaCamera size={20} color="#fff" />
            </div>
          </label>
          <input type="file" id="fotoPerfil" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} />
        </div>

        {/* Nome */}
        <div>
          <label style={labelStyle}>Nome</label>
          <input type="text" placeholder="Nome completo"
            value={formData.nome}
            onChange={e => setFormData({ ...formData, nome: e.target.value })}
            style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>

        {/* Data + CPF */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Data de Nascimento</label>
            <input type="text" placeholder="DD/MM/AAAA"
              value={formData.dataNascimento}
              onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })}
              style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </div>
          <div>
            <label style={labelStyle}>CPF</label>
            <input type="text" placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={e => setFormData({ ...formData, cpf: e.target.value })}
              style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" placeholder="email@exemplo.com"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>

        {/* Botão */}
        <button
          type="submit"
          style={{
            padding: '10px',
            background: '#0972d3',
            border: '1px solid #0972d3',
            color: '#fff', borderRadius: '8px',
            cursor: 'pointer', fontSize: '13px', fontWeight: 700,
            width: '100%', marginTop: '4px',
            boxShadow: '0 2px 8px rgba(9,114,211,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#1a84e8'; e.currentTarget.style.borderColor = '#1a84e8'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#0972d3'; e.currentTarget.style.borderColor = '#0972d3'; }}
        >
          {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
        </button>
      </form>
    </SlideModal>
  );
}

export default ModalFormulario;
