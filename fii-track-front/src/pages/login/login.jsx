import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toastSuccess, toastWarn, handleError } from '../../utils/responseUtils';
import api from '../../config/api';
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiTrendingUp, FiBarChart2, FiPieChart,
} from 'react-icons/fi';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // O interceptor do api.js já extrai o "data" do envelope { success, message, data }
      // Então res.data aqui já é direto: { token, usuario }
      const res = await api.post('/auth/login', { email, password });
      const { token, usuario } = res.data;

      localStorage.setItem('token', token);

      if (usuario.defaultPassword) {
        toastWarn('Você está usando a senha padrão. Considere alterá-la.');
      } else {
        toastSuccess('Login bem-sucedido!');
      }

      onLogin(true);
      setTimeout(() => navigate('/'), 800);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ─────────────────────────────────────────
          CSS global + breakpoints
      ───────────────────────────────────────── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeRight { from { opacity:0; transform:translateX(28px); } to { opacity:1; transform:translateX(0); } }

        /* aurora blobs animados (mobile) */
        @keyframes blobMove1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px,-40px) scale(1.1); }
        }
        @keyframes blobMove2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-25px,35px) scale(1.08); }
        }
        @keyframes blobMove3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,20px) scale(1.05); }
        }

        /* autofill fix */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: #f8fafc !important;
          transition: background-color 9999s ease-in-out 0s;
          caret-color: #f8fafc;
        }

        /* ── DESKTOP: split-screen ── */
        .login-wrapper {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #0a0f1e;
        }

        /* painel esquerdo */
        .lp {
          flex: 1 1 55%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem;
          background: linear-gradient(135deg,#0d1b2a 0%,#0a1628 40%,#061020 100%);
          overflow: hidden;
        }
        .lp-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(16,185,129,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }
        .lp-orb1 {
          position:absolute; width:380px; height:380px; border-radius:50%;
          background:radial-gradient(circle,rgba(16,185,129,.18) 0%,transparent 70%);
          top:-80px; left:-80px; pointer-events:none;
        }
        .lp-orb2 {
          position:absolute; width:300px; height:300px; border-radius:50%;
          background:radial-gradient(circle,rgba(6,182,212,.12) 0%,transparent 70%);
          bottom:-60px; right:-60px; pointer-events:none;
        }
        .lp-orb3 {
          position:absolute; width:200px; height:200px; border-radius:50%;
          background:radial-gradient(circle,rgba(139,92,246,.1) 0%,transparent 70%);
          top:50%; right:10%; transform:translateY(-50%); pointer-events:none;
        }
        .lp-content {
          position:relative; z-index:1; text-align:center;
        }
        .lp-logo {
          width:80px; height:80px; border-radius:50%;
          background:linear-gradient(135deg,#10b981,#059669);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 1.5rem;
          box-shadow:0 0 40px rgba(16,185,129,.4);
        }
        .lp-title { font-size:2.4rem; font-weight:800; color:#f8fafc; letter-spacing:-.5px; margin-bottom:.5rem; }
        .lp-title span { color:#10b981; }
        .lp-sub { font-size:1rem; color:#64748b; line-height:1.6; margin-bottom:3rem; }
        .stats-row { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }
        .stat-card {
          background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
          border-radius:12px; padding:1rem 1.4rem;
          display:flex; align-items:center; gap:.75rem;
          backdrop-filter:blur(10px); min-width:140px;
        }
        .stat-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .stat-lbl { font-size:.7rem; color:#64748b; text-transform:uppercase; letter-spacing:.5px; margin-bottom:2px; }
        .stat-val { font-size:1rem; font-weight:700; color:#f8fafc; }

        /* divisória vertical */
        .vdivider {
          width:1px; flex-shrink:0;
          background:linear-gradient(to bottom,transparent,rgba(255,255,255,.08) 30%,rgba(255,255,255,.08) 70%,transparent);
        }

        /* painel direito */
        .rp {
          flex:0 0 420px;
          display:flex; flex-direction:column; justify-content:center;
          padding:3rem 2.5rem;
          background:#0f172a;
          position:relative; overflow:hidden;
        }
        .rp-glow {
          position:absolute; width:300px; height:300px; border-radius:50%;
          background:radial-gradient(circle,rgba(16,185,129,.06) 0%,transparent 70%);
          top:-100px; right:-100px; pointer-events:none;
        }
        .form-wrap {
          position:relative; z-index:1;
        }
        .form-tag {
          display:inline-block; font-size:.7rem; font-weight:700; color:#10b981;
          text-transform:uppercase; letter-spacing:2px; margin-bottom:.75rem;
          padding:4px 10px; background:rgba(16,185,129,.1);
          border-radius:20px; border:1px solid rgba(16,185,129,.2);
        }
        .form-title { font-size:1.8rem; font-weight:800; color:#f8fafc; margin-bottom:.4rem; }
        .form-desc  { font-size:.875rem; color:#64748b; }
        .form-header { margin-bottom:2rem; }

        /* campos desktop */
        .field-group { margin-bottom:1.25rem; }
        .field-label { display:block; font-size:.8rem; font-weight:600; color:#94a3b8; margin-bottom:.5rem; letter-spacing:.3px; }
        .field-box {
          position:relative; display:flex; align-items:center;
          background:#1e293b; border-radius:10px;
          transition:border-color .2s,box-shadow .2s;
        }
        .field-box.focused { box-shadow:0 0 0 3px rgba(16,185,129,.15); }
        .field-ico { position:absolute; left:14px; pointer-events:none; display:flex; align-items:center; transition:color .2s; }
        .field-input {
          width:100%; padding:.85rem .85rem .85rem 2.75rem;
          background:transparent; border:none; outline:none;
          color:#f8fafc; font-size:.95rem;
        }
        .eye-btn {
          position:absolute; right:12px; background:none; border:none;
          cursor:pointer; color:#475569; display:flex; align-items:center;
          padding:4px; border-radius:4px; transition:color .2s;
        }
        .eye-btn:hover { color:#94a3b8; }

        /* botão desktop */
        .submit-btn {
          width:100%; padding:.9rem; border:none; border-radius:10px;
          background:linear-gradient(135deg,#10b981,#059669);
          color:#fff; font-size:1rem; font-weight:700;
          cursor:pointer; margin-top:.5rem;
          display:flex; align-items:center; justify-content:center; gap:.5rem;
          transition:transform .2s,box-shadow .2s;
          box-shadow:0 4px 20px rgba(16,185,129,.3);
          letter-spacing:.3px;
        }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(16,185,129,.45); }
        .submit-btn:active:not(:disabled) { transform:translateY(0); }
        .submit-btn:disabled { opacity:.7; cursor:not-allowed; }

        .spinner {
          width:18px; height:18px;
          border:2px solid rgba(255,255,255,.3); border-top-color:#fff;
          border-radius:50%; animation:spin .7s linear infinite;
        }
        .form-footer { margin-top:2rem; text-align:center; font-size:.78rem; color:#334155; }

        /* ── MOBILE: glassmorphism iOS ── */
        @media (max-width: 768px) {
          .lp, .vdivider { display:none !important; }

          .login-wrapper {
            background: #0a0f1e;
            position: relative;
            justify-content: center;
            align-items: center;
          }

          /* blobs aurora coloridos */
          .login-wrapper::before,
          .login-wrapper::after {
            content:''; position:absolute; border-radius:50%; pointer-events:none;
          }
          .login-wrapper::before {
            width:340px; height:340px;
            background:radial-gradient(circle,rgba(16,185,129,.55) 0%,rgba(6,182,212,.3) 50%,transparent 70%);
            top:-80px; left:-80px;
            animation:blobMove1 8s ease-in-out infinite;
            filter:blur(40px);
          }
          .login-wrapper::after {
            width:280px; height:280px;
            background:radial-gradient(circle,rgba(139,92,246,.5) 0%,rgba(16,185,129,.2) 60%,transparent 70%);
            bottom:-60px; right:-60px;
            animation:blobMove2 10s ease-in-out infinite;
            filter:blur(40px);
          }

          /* blob extra via pseudo no rp */
          .rp::before {
            content:''; position:absolute; border-radius:50%; pointer-events:none;
            width:220px; height:220px;
            background:radial-gradient(circle,rgba(6,182,212,.4) 0%,transparent 70%);
            top:30%; left:50%; transform:translateX(-50%);
            animation:blobMove3 12s ease-in-out infinite;
            filter:blur(35px);
            z-index:0;
          }

          .rp {
            flex: 1 !important;
            padding: 0 !important;
            background: transparent !important;
            justify-content: center;
            align-items: center;
          }
          .rp-glow { display:none; }

          /* card glassmorphism */
          .form-wrap {
            width: calc(100% - 3rem);
            max-width: 360px;
            background: rgba(15,23,42,0.55);
            backdrop-filter: blur(28px) saturate(160%);
            -webkit-backdrop-filter: blur(28px) saturate(160%);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 28px;
            padding: 2.5rem 2rem;
            box-shadow:
              0 8px 32px rgba(0,0,0,0.45),
              inset 0 1px 0 rgba(255,255,255,0.08);
          }

          /* esconde logo mobile no desktop */
          .mobile-logo { display: none; }

          /* header mobile: logo + título centralizados */
          .form-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          .mobile-logo {
            width:60px; height:60px; border-radius:50%;
            background:linear-gradient(135deg,#10b981,#059669);
            display:flex; align-items:center; justify-content:center;
            margin:0 auto 1rem;
            box-shadow:0 0 30px rgba(16,185,129,.5);
          }
          .form-tag { letter-spacing:3px; }
          .form-title { font-size:1.5rem; }

          /* campos estilo iOS: só linha embaixo */
          .field-group { margin-bottom:1.6rem; }
          .field-label { color:rgba(255,255,255,.5); font-size:.72rem; letter-spacing:.8px; }

          .field-box {
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid rgba(255,255,255,.18) !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding-bottom: 2px;
          }
          .field-box.focused {
            border-bottom-color: #10b981 !important;
            box-shadow: none !important;
          }
          .field-box.focused .field-ico { color:#10b981 !important; }

          .field-input {
            padding: .6rem .6rem .6rem 2.2rem !important;
            font-size: 1rem !important;
            letter-spacing: .3px;
          }

          /* autofill mobile */
          input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px rgba(15,23,42,0) inset !important;
          }

          /* botão mobile */
          .submit-btn {
            border-radius: 50px !important;
            padding: 1rem !important;
            font-size: .95rem !important;
            letter-spacing: 1.5px !important;
            text-transform: uppercase !important;
            margin-top: 1.5rem !important;
            box-shadow: 0 6px 24px rgba(16,185,129,.4) !important;
          }

          .form-footer { color:rgba(255,255,255,.2); margin-top:1.5rem; }
        }
      `}</style>

      <div className="login-wrapper">

        {/* ── Painel esquerdo (desktop only) ── */}
        <div className="lp">
          <div className="lp-grid" />
          <div className="lp-orb1" />
          <div className="lp-orb2" />
          <div className="lp-orb3" />

          <div
            className="lp-content"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity .7s ease, transform .7s ease',
            }}
          >
            <div className="lp-logo"><FiTrendingUp size={36} color="#fff" /></div>
            <h1 className="lp-title">FII<span>Track</span></h1>
            <p className="lp-sub">
              Gerencie seus fundos imobiliários com<br />inteligência e precisão.
            </p>

            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon" style={{ background:'rgba(16,185,129,.15)' }}>
                  <FiTrendingUp size={18} color="#10b981" />
                </div>
                <div>
                  <div className="stat-lbl">Rendimento</div>
                  <div className="stat-val" style={{ color:'#10b981' }}>+12,4%</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background:'rgba(6,182,212,.15)' }}>
                  <FiBarChart2 size={18} color="#06b6d4" />
                </div>
                <div>
                  <div className="stat-lbl">Operações</div>
                  <div className="stat-val" style={{ color:'#06b6d4' }}>248</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background:'rgba(139,92,246,.15)' }}>
                  <FiPieChart size={18} color="#8b5cf6" />
                </div>
                <div>
                  <div className="stat-lbl">Fundos</div>
                  <div className="stat-val" style={{ color:'#8b5cf6' }}>32</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* divisória */}
        <div className="vdivider" />

        {/* ── Painel direito ── */}
        <div className="rp">
          <div className="rp-glow" />

          <div
            className="form-wrap"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(28px)',
              transition: 'opacity .7s ease .2s, transform .7s ease .2s',
            }}
          >
            <div className="form-header">
              {/* logo visível só no mobile via CSS */}
              <div className="mobile-logo">
                <FiTrendingUp size={28} color="#fff" />
              </div>

              <span className="form-tag">Acesso seguro</span>
              <h2 className="form-title">Bem-vindo de volta</h2>
              <p className="form-desc">Entre com suas credenciais para continuar</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">

              {/* Email */}
              <div className="field-group">
                <label htmlFor="email" className="field-label">E-MAIL</label>
                <div className={`field-box${focusedField === 'email' ? ' focused' : ''}`}
                  style={{ border:`1px solid ${focusedField==='email' ? '#10b981' : '#334155'}` }}>
                  <span className="field-ico" style={{ color: focusedField==='email' ? '#10b981' : '#475569' }}>
                    <FiMail size={16} />
                  </span>
                  <input
                    id="email"
                    type="text"
                    className="field-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="field-group">
                <label htmlFor="password" className="field-label">SENHA</label>
                <div className={`field-box${focusedField === 'password' ? ' focused' : ''}`}
                  style={{ border:`1px solid ${focusedField==='password' ? '#10b981' : '#334155'}` }}>
                  <span className="field-ico" style={{ color: focusedField==='password' ? '#10b981' : '#475569' }}>
                    <FiLock size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="field-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight:'2.75rem' }}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading
                  ? <><span className="spinner" /> Entrando...</>
                  : 'Entrar na plataforma'
                }
              </button>
            </form>

            <div className="form-footer">
              © {new Date().getFullYear()} FIITrack · Todos os direitos reservados
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default Login;
