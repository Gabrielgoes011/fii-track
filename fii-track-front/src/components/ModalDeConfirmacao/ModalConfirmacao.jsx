import React from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import SlideModal from '../SlideModal/SlideModal';
import { Botao } from '../ui';

/**
 * ModalConfirmacao — confirmação de ação (excluir, inativar, reativar, resetar senha, reinvestir).
 *
 * Props:
 *  action    'delete' | 'inactivate' | 'reactivate' | 'reset' | 'reinvestir'
 *  userName  nome do item mostrado na mensagem
 *  entidade  o que está sendo afetado, em minúsculas (padrão 'usuário'; ex.: 'seguimento', 'fundo')
 */
function ModalConfirmacao({ isOpen = true, onClose, onConfirm, action, userName, entidade = 'usuário' }) {
  const isDestructive = action === 'delete' || action === 'inactivate';

  const nome = <strong style={{ color: 'var(--texto)' }}>{userName}</strong>;

  const getMessageText = () => {
    switch (action) {
      case 'delete':
        return <>Você tem certeza que quer <strong style={{ color: 'var(--perigo)' }}>excluir</strong> o {entidade} {nome}? Esta ação não pode ser desfeita.</>;
      case 'reset':
        return <>Deseja resetar a senha do usuário {nome} para o padrão?<br /><br />
          <span style={{ display: 'inline-block', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 14px', borderRadius: '8px', color: 'var(--accent-claro)', fontFamily: 'monospace', fontSize: '13px', letterSpacing: '1px' }}>Track@123</span>
        </>;
      case 'inactivate':
        return <>Deseja <strong style={{ color: 'var(--aviso)' }}>inativar</strong> o {entidade} {nome}?</>;
      case 'reactivate':
        return <>Deseja <strong style={{ color: 'var(--sucesso)' }}>reativar</strong> o {entidade} {nome}?</>;
      case 'reinvestir':
        return <>Deseja marcar o rendimento do ativo {nome} como <strong style={{ color: 'var(--accent)' }}>reinvestido</strong>? Esta alteração será aplicada à visualização.</>;
      default:
        return '';
    }
  };

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
          background: isDestructive ? 'rgba(248,113,113,0.12)' : 'rgba(16,185,129,0.12)',
          border: `1px solid ${isDestructive ? 'rgba(248,113,113,0.3)' : 'rgba(16,185,129,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isDestructive
            ? <FiAlertTriangle size={22} color="var(--perigo)" />
            : <FiCheckCircle size={22} color="var(--accent)" />
          }
        </div>

        {/* Mensagem */}
        <p style={{ fontSize: '13px', color: 'var(--texto-suave)', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          {getMessageText()}
        </p>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', paddingTop: '4px' }}>
          <Botao variante="secundario" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Botao>
          <Botao variante={isDestructive ? 'perigo' : 'primario'} onClick={onConfirm} style={{ flex: 1 }}>
            Confirmar
          </Botao>
        </div>
      </div>
    </SlideModal>
  );
}

export default ModalConfirmacao;
