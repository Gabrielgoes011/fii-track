import React from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import SlideModal from '../SlideModal/SlideModal';

function ModalConfirmacao({ isOpen = true, onClose, onConfirm, action, userName }) {
  const isDestructive = action === 'delete' || action === 'inactivate';

  const getMessageText = () => {
    switch (action) {
      case 'delete':
        return <>Você tem certeza que quer <strong style={{ color: '#e74c3c' }}>excluir</strong> o usuário <strong style={{ color: '#dce8f5' }}>{userName}</strong>? Esta ação não pode ser desfeita.</>;
      case 'reset':
        return <>Deseja resetar a senha do usuário <strong style={{ color: '#dce8f5' }}>{userName}</strong> para o padrão?<br /><br />
          <span style={{ display: 'inline-block', background: 'rgba(9,114,211,0.12)', border: '1px solid rgba(9,114,211,0.25)', padding: '5px 14px', borderRadius: '8px', color: '#5dade2', fontFamily: 'monospace', fontSize: '13px', letterSpacing: '1px' }}>Senha@123</span>
        </>;
      case 'inactivate':
        return <>Deseja <strong style={{ color: '#f59e0b' }}>inativar</strong> o usuário <strong style={{ color: '#dce8f5' }}>{userName}</strong>?</>;
      case 'reactivate':
        return <>Deseja <strong style={{ color: '#2ecc71' }}>reativar</strong> o usuário <strong style={{ color: '#dce8f5' }}>{userName}</strong>?</>;
      default:
        return '';
    }
  };

  const confirmBg     = isDestructive ? '#c0392b' : '#0972d3';
  const confirmBgHov  = isDestructive ? '#e74c3c' : '#1a84e8';
  const confirmShadow = isDestructive
    ? '0 2px 8px rgba(192,57,43,0.35)'
    : '0 2px 8px rgba(9,114,211,0.3)';

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmação"
      width="420px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '4px' }}>

        {/* Ícone */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: isDestructive ? 'rgba(192,57,43,0.15)' : 'rgba(9,114,211,0.12)',
          border: `1px solid ${isDestructive ? 'rgba(192,57,43,0.3)' : 'rgba(9,114,211,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isDestructive
            ? <FiAlertTriangle size={22} color="#e74c3c" />
            : <FiCheckCircle   size={22} color="#5dade2" />
          }
        </div>

        {/* Mensagem */}
        <p style={{ fontSize: '13px', color: '#8a9bb5', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          {getMessageText()}
        </p>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', paddingTop: '4px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '9px',
              background: 'transparent',
              border: '1px solid #243040',
              borderRadius: '8px', color: '#7a8fa8',
              cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#334d66'; e.currentTarget.style.color = '#cdd8e8'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#243040'; e.currentTarget.style.color = '#7a8fa8'; }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '9px',
              background: confirmBg,
              border: `1px solid ${confirmBg}`,
              borderRadius: '8px', color: '#fff',
              cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              boxShadow: confirmShadow,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = confirmBgHov; e.currentTarget.style.borderColor = confirmBgHov; }}
            onMouseOut={e => { e.currentTarget.style.background = confirmBg; e.currentTarget.style.borderColor = confirmBg; }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </SlideModal>
  );
}

export default ModalConfirmacao;
