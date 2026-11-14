import{o as e,r as t,t as n}from"./jsx-runtime-BRIasfsz.js";import{B as r,F as i,P as a,S as o,U as s,V as c,X as l,_ as u,g as d,m as f,n as p,pt as m,v as h}from"./index-DAWIsfs8.js";var g=e(t()),_=n();function v({onLogin:e}){let t=m(),[n,v]=(0,g.useState)(``),[y,b]=(0,g.useState)(``),[x,S]=(0,g.useState)(!1),[C,w]=(0,g.useState)(!1),[T,E]=(0,g.useState)(null),[D,O]=(0,g.useState)(!1),[k,A]=(0,g.useState)(``),[j,M]=(0,g.useState)(!1),[N,P]=(0,g.useState)({x:0,y:0}),F=(0,g.useRef)(null);return(0,g.useEffect)(()=>{let e=setTimeout(()=>M(!0),50);return()=>clearTimeout(e)},[]),(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(`style`,{children:`
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

        /* piso com perspectiva 3D, tipo terminal de trading */
        @keyframes floorScroll {
          from { background-position: 0 0, 0 0; }
          to   { background-position: 0 56px, 56px 0; }
        }

        /* partículas subindo, como um ticker de dados */
        @keyframes particleRise {
          0%   { transform: translateY(0) translateX(0);     opacity:0; }
          10%  { opacity:.8; }
          90%  { opacity:.4; }
          100% { transform: translateY(-380px) translateX(var(--drift,12px)); opacity:0; }
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
          position: relative;
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
          perspective: 1200px;
        }
        .lp-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(16,185,129,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }
        /* piso 3D animado ao fundo, evocando um terminal de investimentos */
        .lp-floor {
          position:absolute; left:-60%; right:-60%; bottom:-15%; height:65%;
          background-image:
            linear-gradient(rgba(16,185,129,.16) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,.16) 1px, transparent 1px);
          background-size: 56px 56px;
          transform: rotateX(62deg);
          transform-origin: bottom;
          animation: floorScroll 5s linear infinite;
          -webkit-mask-image: linear-gradient(to top, black 15%, transparent 85%);
          mask-image: linear-gradient(to top, black 15%, transparent 85%);
          pointer-events:none;
        }
        .lp-orb1 {
          position:absolute; width:380px; height:380px; border-radius:50%;
          background:radial-gradient(circle,rgba(16,185,129,.18) 0%,transparent 70%);
          top:-80px; left:-80px; pointer-events:none;
          animation: blobMove1 9s ease-in-out infinite;
        }
        .lp-orb2 {
          position:absolute; width:300px; height:300px; border-radius:50%;
          background:radial-gradient(circle,rgba(6,182,212,.12) 0%,transparent 70%);
          bottom:-60px; right:-60px; pointer-events:none;
          animation: blobMove2 11s ease-in-out infinite;
        }
        .lp-orb3 {
          position:absolute; width:200px; height:200px; border-radius:50%;
          background:radial-gradient(circle,rgba(139,92,246,.1) 0%,transparent 70%);
          top:50%; right:10%; transform:translateY(-50%); pointer-events:none;
          animation: blobMove3 13s ease-in-out infinite;
        }
        /* partículas subindo suavemente, como dados de mercado (desktop + mobile) */
        .rise-particles { position:absolute; top:0; bottom:0; left:0; width:55%; overflow:hidden; pointer-events:none; z-index:0; }
        .rise-particle {
          position:absolute; bottom:6%; width:4px; height:4px; border-radius:50%;
          background:#10b981; box-shadow:0 0 6px 1px rgba(16,185,129,.6);
          animation-name: particleRise;
          animation-timing-function: ease-in;
          animation-iteration-count: infinite;
        }
        .lp-content {
          position:relative; z-index:1; text-align:center;
        }
        .lp-tilt {
          transition: transform .15s ease-out;
          transform-style: preserve-3d;
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

        /* piso 3D no mobile, escondido por padrão (só aparece <=768px) */
        .mobile-floor { display:none; }

        /* ── MOBILE: glassmorphism iOS ── */
        @media (max-width: 768px) {
          .lp, .vdivider { display:none !important; }

          .login-wrapper {
            background: #0a0f1e;
            position: relative;
            justify-content: center;
            align-items: center;
          }

          .rise-particles { width:100%; }

          .mobile-floor {
            display:block; position:absolute; left:-60%; right:-60%; bottom:-10%; height:55%;
            background-image:
              linear-gradient(rgba(16,185,129,.18) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16,185,129,.18) 1px, transparent 1px);
            background-size: 44px 44px;
            transform: rotateX(64deg);
            transform-origin: bottom;
            animation: floorScroll 5s linear infinite;
            -webkit-mask-image: linear-gradient(to top, black 10%, transparent 80%);
            mask-image: linear-gradient(to top, black 10%, transparent 80%);
            pointer-events:none;
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
      `}),(0,_.jsxs)(`div`,{className:`login-wrapper`,children:[(0,_.jsx)(`div`,{className:`rise-particles`,children:[{left:`8%`,duration:7,delay:0,drift:`10px`},{left:`22%`,duration:9,delay:1.5,drift:`-14px`},{left:`38%`,duration:6.5,delay:3,drift:`8px`},{left:`55%`,duration:8,delay:.8,drift:`-10px`},{left:`70%`,duration:10,delay:2.2,drift:`12px`},{left:`85%`,duration:7.5,delay:4,drift:`-8px`}].map((e,t)=>(0,_.jsx)(`span`,{className:`rise-particle`,style:{left:e.left,"--drift":e.drift,animationDuration:`${e.duration}s`,animationDelay:`${e.delay}s`}},t))}),(0,_.jsx)(`div`,{className:`mobile-floor`}),(0,_.jsxs)(`div`,{className:`lp`,ref:F,onMouseMove:e=>{let t=F.current.getBoundingClientRect(),n=(e.clientX-t.left)/t.width-.5,r=(e.clientY-t.top)/t.height-.5;P({x:n*6,y:r*-6})},onMouseLeave:()=>P({x:0,y:0}),children:[(0,_.jsx)(`div`,{className:`lp-grid`}),(0,_.jsx)(`div`,{className:`lp-floor`}),(0,_.jsx)(`div`,{className:`lp-orb1`}),(0,_.jsx)(`div`,{className:`lp-orb2`}),(0,_.jsx)(`div`,{className:`lp-orb3`}),(0,_.jsx)(`div`,{className:`lp-content`,style:{opacity:+!!j,transform:j?`translateY(0)`:`translateY(30px)`,transition:`opacity .7s ease, transform .7s ease`},children:(0,_.jsxs)(`div`,{className:`lp-tilt`,style:{transform:`perspective(1000px) rotateX(${N.y}deg) rotateY(${N.x}deg)`},children:[(0,_.jsx)(`div`,{className:`lp-logo`,children:(0,_.jsx)(l,{size:36,color:`#fff`})}),(0,_.jsxs)(`h1`,{className:`lp-title`,children:[`FII`,(0,_.jsx)(`span`,{children:`Track`})]}),(0,_.jsxs)(`p`,{className:`lp-sub`,children:[`Gerencie seus fundos imobiliários com`,(0,_.jsx)(`br`,{}),`inteligência e precisão.`]}),(0,_.jsxs)(`div`,{className:`stats-row`,children:[(0,_.jsxs)(`div`,{className:`stat-card`,children:[(0,_.jsx)(`div`,{className:`stat-icon`,style:{background:`rgba(16,185,129,.15)`},children:(0,_.jsx)(l,{size:18,color:`#10b981`})}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(`div`,{className:`stat-lbl`,children:`Rendimento`}),(0,_.jsx)(`div`,{className:`stat-val`,style:{color:`#10b981`},children:`+12,4%`})]})]}),(0,_.jsxs)(`div`,{className:`stat-card`,children:[(0,_.jsx)(`div`,{className:`stat-icon`,style:{background:`rgba(6,182,212,.15)`},children:(0,_.jsx)(o,{size:18,color:`#06b6d4`})}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(`div`,{className:`stat-lbl`,children:`Operações`}),(0,_.jsx)(`div`,{className:`stat-val`,style:{color:`#06b6d4`},children:`248`})]})]}),(0,_.jsxs)(`div`,{className:`stat-card`,children:[(0,_.jsx)(`div`,{className:`stat-icon`,style:{background:`rgba(139,92,246,.15)`},children:(0,_.jsx)(s,{size:18,color:`#8b5cf6`})}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(`div`,{className:`stat-lbl`,children:`Fundos`}),(0,_.jsx)(`div`,{className:`stat-val`,style:{color:`#8b5cf6`},children:`32`})]})]})]})]})})]}),(0,_.jsx)(`div`,{className:`vdivider`}),(0,_.jsxs)(`div`,{className:`rp`,children:[(0,_.jsx)(`div`,{className:`rp-glow`}),(0,_.jsxs)(`div`,{className:`form-wrap`,style:{opacity:+!!j,transform:j?`translateX(0)`:`translateX(28px)`,transition:`opacity .7s ease .2s, transform .7s ease .2s`},children:[(0,_.jsxs)(`div`,{className:`form-header`,children:[(0,_.jsx)(`div`,{className:`mobile-logo`,children:(0,_.jsx)(l,{size:28,color:`#fff`})}),(0,_.jsx)(`span`,{className:`form-tag`,children:`Acesso seguro`}),(0,_.jsx)(`h2`,{className:`form-title`,children:`Bem-vindo de volta`}),(0,_.jsx)(`p`,{className:`form-desc`,children:`Entre com suas credenciais para continuar`})]}),(0,_.jsxs)(`form`,{onSubmit:async r=>{r.preventDefault(),S(!0);try{let r;if(r=D?await p.login2fa({email:n,password:y,codigo:k}):await p.login({email:n,password:y}),r.requires2fa){O(!0),d(`Senha correta. Agora digite o código de 6 dígitos do seu app autenticador.`);return}let{usuario:i}=r;i.defaultPassword?h(`Você está usando a senha padrão. Considere alterá-la.`):u(`Login bem-sucedido!`),localStorage.setItem(`token`,r.token),e(!0,i),setTimeout(()=>t(`/`),800)}catch(e){let t=e.response?.status;D&&t===401&&A(``),!e.response&&e.code!==`ECONNABORTED`?f(e,`Não foi possível conectar ao servidor. Verifique sua internet ou se o servidor está ligado.`):t===404?f(e,`O serviço de login não foi encontrado no servidor. Confira o endereço da API.`):f(e)}finally{S(!1)}},autoComplete:`off`,children:[(0,_.jsxs)(`div`,{className:`field-group`,children:[(0,_.jsx)(`label`,{htmlFor:`email`,className:`field-label`,children:`E-MAIL`}),(0,_.jsxs)(`div`,{className:`field-box${T===`email`?` focused`:``}`,style:{border:`1px solid ${T===`email`?`#10b981`:`#334155`}`},children:[(0,_.jsx)(`span`,{className:`field-ico`,style:{color:T===`email`?`#10b981`:`#475569`},children:(0,_.jsx)(c,{size:16})}),(0,_.jsx)(`input`,{id:`email`,type:`text`,className:`field-input`,value:n,onChange:e=>v(e.target.value),onFocus:()=>E(`email`),onBlur:()=>E(null),placeholder:`seu@email.com`,required:!0})]})]}),(0,_.jsxs)(`div`,{className:`field-group`,children:[(0,_.jsx)(`label`,{htmlFor:`password`,className:`field-label`,children:`SENHA`}),(0,_.jsxs)(`div`,{className:`field-box${T===`password`?` focused`:``}`,style:{border:`1px solid ${T===`password`?`#10b981`:`#334155`}`},children:[(0,_.jsx)(`span`,{className:`field-ico`,style:{color:T===`password`?`#10b981`:`#475569`},children:(0,_.jsx)(r,{size:16})}),(0,_.jsx)(`input`,{id:`password`,type:C?`text`:`password`,className:`field-input`,value:y,onChange:e=>b(e.target.value),onFocus:()=>E(`password`),onBlur:()=>E(null),placeholder:`••••••••`,required:!0,style:{paddingRight:`2.75rem`}}),(0,_.jsx)(`button`,{type:`button`,className:`eye-btn`,onClick:()=>w(e=>!e),tabIndex:-1,"aria-label":C?`Ocultar senha`:`Mostrar senha`,children:C?(0,_.jsx)(i,{size:16}):(0,_.jsx)(a,{size:16})})]})]}),D&&(0,_.jsxs)(`div`,{className:`field-group`,children:[(0,_.jsx)(`label`,{htmlFor:`codigo2fa`,className:`field-label`,children:`CÓDIGO 2FA`}),(0,_.jsxs)(`div`,{className:`field-box${T===`codigo2fa`?` focused`:``}`,style:{border:`1px solid ${T===`codigo2fa`?`#10b981`:`#334155`}`},children:[(0,_.jsx)(`span`,{className:`field-ico`,style:{color:T===`codigo2fa`?`#10b981`:`#475569`},children:(0,_.jsx)(r,{size:16})}),(0,_.jsx)(`input`,{id:`codigo2fa`,type:`text`,inputMode:`numeric`,autoComplete:`one-time-code`,className:`field-input`,value:k,onChange:e=>A(e.target.value.replace(/\D/g,``)),onFocus:()=>E(`codigo2fa`),onBlur:()=>E(null),placeholder:`123456`,required:!0,maxLength:6})]}),(0,_.jsx)(`div`,{style:{marginTop:`0.5rem`,color:`#94a3b8`,fontSize:`0.82rem`},children:`Digite o código temporário do seu app de autenticação.`})]}),(0,_.jsx)(`button`,{type:`submit`,disabled:x,className:`submit-btn`,children:x?(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(`span`,{className:`spinner`}),` Entrando...`]}):D?`Validar código 2FA`:`Entrar na plataforma`})]}),(0,_.jsxs)(`div`,{className:`form-footer`,children:[`© `,new Date().getFullYear(),` FIITrack · v`,`1.2.17`,` · Todos os direitos reservados`]})]})]})]})]})}export{v as default};