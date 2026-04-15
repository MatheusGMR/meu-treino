import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jmpLogo from "@/assets/landing/jmp-logo.webp";
import mtLogo from "@/assets/landing/meutreino-logo.webp";
import vsLogo from "@/assets/landing/vsgold-logo.webp";
import screen1 from "@/assets/landing/mt-screen-1.webp";
import screen2 from "@/assets/landing/mt-screen-2.webp";
import screen3 from "@/assets/landing/mt-screen-3.webp";

/* ───────── tiny reveal hook ───────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("lp-in"); io.unobserve(el); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

const Reveal = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useReveal();
  return <div ref={ref} className={`lp-reveal ${className}`}>{children}</div>;
};

/* ───────── Phone carousel ───────── */
const screens = [
  { img: screen1, label: "Plano Semanal" },
  { img: screen2, label: "Treino do Dia" },
  { img: screen3, label: "Sessão Guiada" },
];

function PhoneCarousel() {
  const [idx, setIdx] = useState(0);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = phoneRef.current;
    if (!el) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !interval) {
        interval = setInterval(() => setIdx(p => (p + 1) % screens.length), 4000);
      } else if (!e.isIntersecting && interval) {
        clearInterval(interval);
        interval = null;
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); if (interval) clearInterval(interval); };
  }, []);

  return (
    <div className="lp-demo-phone-wrap">
      <div className="lp-screen-labels">
        {screens.map((s, i) => (
          <span key={i} className={`lp-screen-label ${i === idx ? "active" : ""}`}>{s.label}</span>
        ))}
      </div>
      <div className="lp-demo-phone" ref={phoneRef}>
        <div className="lp-demo-screen">
          <div className="lp-demo-notch" />
          <div className="lp-screen-stack">
            {screens.map((s, i) => (
              <div key={i} className={`lp-screen-slide ${i === idx ? "active" : ""}`}>
                <img src={s.img} alt={s.label} />
              </div>
            ))}
          </div>
          <div className="lp-slide-indicator">
            {screens.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`lp-slide-dot ${i === idx ? "active" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="lp-phone-caption">
        <span style={{ color: "var(--lp-crimson)" }}>●</span> Telas reais do aplicativo
      </div>
    </div>
  );
}

/* ───────── Pillar data ───────── */
const pillarsHero = [
  { brand: "vsgold", logo: vsLogo, name: "VS Gold", title: "Espaço referência em saúde física", text: "Acesso ao espaço referência em saúde física em Londrina e região — todas as unidades VS Gold incluídas.", logoBg: "#0d0b08" },
  { brand: "jmp", logo: jmpLogo, name: "JMP Treinamentos", title: "Acompanhamento personalizado por especialistas", text: "Métodos validados e profissionais que conhecem seu nome e seu protocolo. Seu treino tem rosto, voz e plano.", logoBg: "#0d0b08" },
  { brand: "meutreino", logo: mtLogo, name: "Meu Treino", title: "Plataforma com IA que adapta e acompanha", text: "A IA do app personaliza cada sessão, acompanha seu progresso e conversa em tempo real com a JMP.", logoBg: "#f4f0e8" },
];

const consequences = [
  { num: "01", title: "Autonomia", text: "Fazer o que você já faz — com mais facilidade, menos dor e mais energia.", icon: "M3 12h4l3-9 4 18 3-9h4" },
  { num: "02", title: "Confiança", text: "Entender o que está fazendo. Dentro e fora da academia.", icon: "circle" },
  { num: "03", title: "Longevidade", text: "Qualidade de vida real nos próximos 10, 20, 30 anos.", icon: "M12 2v6l4 2" },
  { num: "04", title: "Prevenção", text: "Articulações protegidas, postura funcional, menos risco no dia a dia.", icon: "shield" },
];

const journeySteps = [
  { num: "01", label: "Início da Jornada", title: "Você verifica sua elegibilidade", text: "Três perguntas. Sem tecnicismo. Confirmamos que esse é o caminho certo para o seu momento.", tag: "3 perguntas · 60 segundos" },
  { num: "02", label: "Seu Perfil", title: "Você responde sua anamnese", text: "Dores, limitações, como se sente. Sem julgamento — isso personaliza cada sessão da sua jornada.", tag: "Triagem inteligente" },
  { num: "03", label: "Seu Protocolo", title: "O app monta sua jornada", text: "A metodologia JMP define o que você vai fazer, na ordem certa, no tempo que você tem.", tag: "Metodologia JMP · Protocolo personalizado" },
  { num: "04", label: "Na Academia", title: "Você é acompanhado pelo time JMP", text: "Seu treino guiado também estará no app e te ajudará a conduzir exercício por exercício, reajustando seu treino conforme sua disposição.", tag: "Todas as unidades VS Gold" },
  { num: "05", label: "Evolução Contínua", title: "Sua jornada se adapta com você", text: "Cada sessão informa a próxima. Em até 12 semanas, você passa de iniciante a alguém que entende o próprio treino.", tag: "Adaptação contínua · 12 semanas" },
];

const mtFeatures = [
  { title: "Inteligência Adaptativa", text: "Seu treino só começa depois que nossa IA entende como você está hoje. Disposição, sono, tempo disponível, dor residual — tudo é considerado para adaptar a sessão antes do primeiro exercício.", tag: "IA · Adaptação por sessão" },
  { title: "Integração JMP em Tempo Real", text: "Os profissionais da JMP acompanham sua execução, evolução de cargas e frequência ao vivo. Ajustes acontecem entre sessões, sem você precisar pedir.", tag: "JMP · Acompanhamento contínuo" },
  { title: "Sessão Guiada do Início ao Fim", text: "Aquecimento, séries, descanso e progressão — tudo cronometrado. Você não precisa decidir nada durante o treino. O app conduz, você executa.", tag: "Zero fricção · Foco no movimento" },
  { title: "Histórico Visual de Progresso", text: "Cargas, frequência, consistência — sua evolução semana a semana em formato visual. A JMP usa esses dados para refinar seu protocolo.", tag: "Dados que conduzem decisões" },
];

const integrationCards = [
  { brand: "vsgold", logo: vsLogo, role: "Pilar 01 · Espaço", name: "VS Gold", desc: "A maior rede de academias de Londrina. Onde você treina, com quem você treina e em que condições.", bullets: ["Acesso a todas as unidades", "Equipamentos de referência", "Horários estendidos", "Ambiente acolhedor para iniciantes"], logoBg: "#0d0b08" },
  { brand: "jmp", logo: jmpLogo, role: "Pilar 02 · Método", name: "JMP Treinamentos", desc: "A inteligência humana por trás de cada protocolo. Profissionais especializados que constroem, acompanham e ajustam sua jornada.", bullets: ["Metodologia JMP de iniciação", "Acompanhamento contínuo", "Ajustes técnicos por especialistas", "12 semanas de jornada estruturada"], logoBg: "#0d0b08" },
  { brand: "meutreino", logo: mtLogo, role: "Pilar 03 · Tecnologia", name: "Meu Treino", desc: "A inteligência adaptativa que conecta tudo. O app entende seu dia, conduz sua sessão e mantém a JMP atualizada.", bullets: ["IA que adapta antes de começar", "Sessão guiada exercício por exercício", "Conexão em tempo real com a JMP", "Histórico visual de evolução"], logoBg: "#f4f0e8" },
];

/* ───────── Timeline with scroll progress ───────── */
function Timeline() {
  const tlRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeSteps, setActiveSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    function update() {
      const tl = tlRef.current;
      const prog = progressRef.current;
      if (!tl || !prog) return;
      const r = tl.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrolled = Math.max(0, Math.min(r.height, vh * 0.6 - r.top));
      prog.style.height = `${Math.min(100, Math.max(0, (scrolled / r.height) * 100))}%`;

      const newActive = new Set<number>();
      tl.querySelectorAll<HTMLElement>("[data-step]").forEach((step) => {
        const sr = step.getBoundingClientRect();
        const center = sr.top + sr.height / 2;
        if (center < vh * 0.7 && center > 0) newActive.add(Number(step.dataset.step));
      });
      setActiveSteps(newActive);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="lp-timeline" ref={tlRef}>
      <div className="lp-timeline-progress" ref={progressRef} />
      {journeySteps.map((s, i) => (
        <div key={i} className={`lp-step ${activeSteps.has(i + 1) ? "active" : ""}`} data-step={i + 1}>
          <div className="lp-step-num">{s.num}</div>
          <div className="lp-step-label">{s.label}</div>
          <div className="lp-step-title">{s.title}</div>
          <div className="lp-step-text">{s.text}</div>
          <div className="lp-step-tag"><span className="lp-dot" />{s.tag}</div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Smooth scroll helper ───────── */
function scrollTo(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
}

/* ═══════════ MAIN PAGE ═══════════ */
export default function ProtocoloDestravamento() {
  const navigate = useNavigate();
  const [navScrolled, setNavScrolled] = useState(false);

  const goToAnamnesis = useCallback(() => {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity .45s cubic-bezier(.4,0,.2,1)";
    setTimeout(() => {
      navigate("/auth/register");
      requestAnimationFrame(() => {
        document.body.style.opacity = "1";
      });
    }, 450);
  }, [navigate]);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="lp-root">
      {/* NAV */}
      <nav className={`lp-nav ${navScrolled ? "scrolled" : ""}`}>
        <div className="lp-nav-left">
          <span className="lp-nav-dot" />
          <span>Protocolo Destravamento · Londrina</span>
        </div>
        <button onClick={goToAnamnesis} className="lp-nav-cta">Já Quero →</button>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-grid" />

        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow lp-anim-fade" style={{ animationDelay: ".35s" }}>
            Protocolo Destravamento · VS Gold × JMP × Meu Treino
          </div>

          <h1 className="lp-hero-title">
            {["Existe", "uma", "academia", "que", "foi", "pensada"].map((w, i) => (
              <span key={i} className="lp-word" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>{w} </span>
            ))}
            <span className="lp-word lp-accent" style={{ animationDelay: "1.15s" }}>para </span>
            <span className="lp-word lp-accent" style={{ animationDelay: "1.25s" }}>você.</span>
          </h1>

          <p className="lp-hero-sub lp-anim-fade" style={{ animationDelay: "1.4s" }}>
            Três pilares trabalhando juntos: a maior rede de academias da região, acompanhamento JMP especializado e uma plataforma com IA que adapta tudo ao seu momento.
          </p>

          <div className="lp-hero-ctas lp-anim-fade" style={{ animationDelay: "1.6s" }}>
            <button onClick={goToAnamnesis} className="lp-btn lp-btn-primary">
              <span>Já Quero Começar</span><span className="lp-arrow">→</span>
            </button>
            <a href="#reconhecimento" onClick={scrollTo("reconhecimento")} className="lp-btn lp-btn-ghost">
              Conhecer<span className="lp-arrow">→</span>
            </a>
          </div>

          {/* 3 PILLARS */}
          <div className="lp-pillars-hero lp-anim-fade" style={{ animationDelay: "1.9s" }}>
            {pillarsHero.map((p) => (
              <div key={p.brand} className="lp-pillar-hero" data-brand={p.brand}>
                <div className="lp-ph-logo" style={{ background: p.logoBg }}>
                  <img src={p.logo} alt={p.name} />
                </div>
                <div className="lp-ph-brand">{p.name}</div>
                <div className="lp-ph-title">{p.title}</div>
                <div className="lp-ph-text">{p.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-scroll-cue lp-anim-fade" style={{ animationDelay: "2.4s" }}>
          Role para descobrir
        </div>
      </section>

      {/* ═══ RECONHECIMENTO + VIDEO ═══ */}
      <section className="lp-recognition" id="reconhecimento">
        <div className="lp-container">
          <div className="lp-recognition-grid">
            <Reveal>
              <div className="lp-quote-large">
                A academia parece um lugar para quem <em>já treina</em>.
              </div>
              <div className="lp-quote-attr">— O que ouvimos. Toda semana.</div>
            </Reveal>
            <Reveal>
              <div className="lp-section-eyebrow">Reconhecimento</div>
              <p className="lp-rec-text"><strong>E é mesmo.</strong></p>
              <p className="lp-rec-text">O mercado fitness foi construído para quem já está dentro. Os treinos, a comunicação, os ambientes — tudo foi pensado para quem já tem repertório.</p>
              <p className="lp-rec-text"><strong>Ninguém pensou em você.</strong></p>
              <div className="lp-recognition-callout">
                Mas nós pensamos. Esse programa foi construído do zero para quem está chegando agora — sem experiência, sem certezas, sem precisar fingir que sabe.
              </div>
            </Reveal>
          </div>

          {/* VIDEO */}
          <Reveal className="lp-video-block">
            <div className="lp-video-frame">
              <div className="lp-video-corner tl" />
              <div className="lp-video-corner tr" />
              <div className="lp-video-corner bl" />
              <div className="lp-video-corner br" />
              <div className="lp-video-meta">
                <div className="lp-video-meta-left">
                  <span className="lp-rec-dot" />
                  <span>Protocolo · Vídeo apresentação</span>
                </div>
                <span><b>VS Gold</b> · Londrina — PR</span>
              </div>
              <video controls preload="metadata" playsInline className="lp-video">
                <source src="/assets/protocolo.mov" type="video/mp4" />
                Seu navegador não suporta vídeo HTML5.
              </video>
            </div>
            <p className="lp-video-caption">
              "Veja como o protocolo funciona na prática — desde o primeiro contato até a sua primeira sessão guiada."
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ CONSEQUENCES ═══ */}
      <section className="lp-consequences" id="consequencias">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-eyebrow">Consequências Reais</div>
            <h2 className="lp-section-title">Isso não é sobre <em>como você vai ficar.</em><br />É sobre como você vai <em>viver.</em></h2>
          </Reveal>

          <div className="lp-conseq-pillars">
            {consequences.map((c) => (
              <Reveal key={c.num} className="lp-pillar">
                <div className="lp-pillar-num">{c.num}</div>
                <div className="lp-pillar-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    {c.icon === "circle" ? <><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></> :
                      c.icon === "shield" ? <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" /> :
                        c.icon.startsWith("M12 2v6") ? <><path d="M12 2v6l4 2" /><circle cx="12" cy="14" r="8" /></> :
                          <path d={c.icon} />}
                  </svg>
                </div>
                <div className="lp-pillar-title">{c.title}</div>
                <div className="lp-pillar-text">{c.text}</div>
              </Reveal>
            ))}
          </div>

          <Reveal className="lp-aesthetics-note">
            <p>E sim — <strong>estética também é uma consequência real.</strong> Não é o foco principal, mas vivemos num mundo de aparência e seria desonesto ignorar isso. Quando você treina com consistência, seu corpo muda. É ciência, não promessa.</p>
          </Reveal>

          <Reveal className="lp-inline-cta-wrap">
            <a href="#jornada" onClick={scrollTo("jornada")} className="lp-inline-cta">
              <span>Entender Mais</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ═══ JOURNEY TIMELINE ═══ */}
      <section className="lp-journey" id="jornada">
        <div className="lp-journey-bg-art" />
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-eyebrow">A Jornada</div>
            <h2 className="lp-section-title">Cada etapa <em>conduz</em><br />à próxima.</h2>
            <p className="lp-sub-text">Cada etapa foi pensada para que você chegue na próxima com mais confiança do que na anterior.</p>
          </Reveal>

          <Timeline />

          <Reveal className="lp-inline-cta-wrap">
            <button onClick={goToAnamnesis} className="lp-inline-cta">
              <span>Verificar Elegibilidade</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
            </button>
          </Reveal>
        </div>
      </section>

      {/* ═══ MEU TREINO APP SHOWCASE ═══ */}
      <section className="lp-meutreino-section" id="app">
        <div className="lp-container">
          <Reveal className="lp-mt-header">
            <div className="lp-section-eyebrow lp-crimson-eyebrow">App Meu Treino · Inteligência adaptativa</div>
            <h2 className="lp-section-title">Sua sessão, <em className="lp-crimson-em">adaptada</em><br />antes de começar.</h2>
            <p className="lp-sub-text">Treino que entende seu dia. Conexão direta com a JMP. Plano semanal que se ajusta enquanto você evolui.</p>
          </Reveal>

          <div className="lp-mt-showcase">
            <Reveal>
              <PhoneCarousel />
            </Reveal>
            <div className="lp-mt-features">
              {mtFeatures.map((f, i) => (
                <Reveal key={i} className="lp-mt-feature">
                  <div className="lp-mt-feature-head">
                    <div className="lp-mt-feature-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {i === 0 ? <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" fill="currentColor" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></> :
                          i === 1 ? <><circle cx="9" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M14 15h4a4 4 0 014 4v2" /></> :
                            i === 2 ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> :
                              <><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-7" /></>}
                      </svg>
                    </div>
                    <div className="lp-mt-feature-title">{f.title}</div>
                  </div>
                  <div className="lp-mt-feature-text">{f.text}</div>
                  <div className="lp-mt-feature-tag">{f.tag}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INTEGRATION ═══ */}
      <section className="lp-integration" id="integracao">
        <div className="lp-integration-bg" />
        <div className="lp-container" style={{ position: "relative" }}>
          <Reveal className="lp-int-header">
            <div className="lp-section-eyebrow">Os 3 Pilares · Integrados</div>
            <h2 className="lp-section-title">Três marcas, <em>uma só</em><br />experiência sua.</h2>
            <p className="lp-int-sub">A força do Protocolo Destravamento não está em nenhum dos pilares isoladamente — está na integração entre eles.</p>
          </Reveal>

          <div className="lp-orbit-grid">
            {integrationCards.map((c) => (
              <Reveal key={c.brand} className="lp-pillar-card" data-brand={c.brand}>
                <div className="lp-pc-logo" style={{ background: c.logoBg }}>
                  <img src={c.logo} alt={c.name} />
                </div>
                <div className="lp-pc-role">{c.role}</div>
                <h3 className="lp-pc-name">{c.name}</h3>
                <p className="lp-pc-desc">{c.desc}</p>
                <ul className="lp-pc-bullets">
                  {c.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>

          <Reveal className="lp-integration-conclusion">
            <div className="lp-section-eyebrow" style={{ justifyContent: "center" }}>A integração</div>
            <p className="lp-ic-text">
              A <strong>VS Gold</strong> entrega o espaço. A <strong className="lp-jmp">JMP</strong> entrega o método. O <strong className="lp-mt">Meu Treino</strong> entrega a inteligência. Você entrega só a presença — e os três pilares cuidam do resto.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ WHY THIS MATTERS ═══ */}
      <section className="lp-matters" id="importa">
        <div className="lp-matters-content">
          <Reveal>
            <div className="lp-matters-eyebrow">Por que isso importa</div>
            <h2 className="lp-matters-headline">Saúde não é mais um<br /><em>projeto adiável.</em></h2>
          </Reveal>

          <Reveal>
            <p className="lp-matters-quote">
              Cada ano que você adia o início é um ano a menos de capacidade física, energia e autonomia no futuro. A boa notícia: o oposto também é verdade — começar agora, com a estrutura certa, muda o resto da sua vida.
            </p>
          </Reveal>

          <Reveal>
            <div className="lp-matters-stats">
              <div className="lp-stat">
                <div className="lp-stat-num">30%</div>
                <div className="lp-stat-label">Massa muscular perdida<br />entre 30 e 80 anos</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-num">12</div>
                <div className="lp-stat-label">Semanas para fixar<br />o hábito do treino</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-num">+10</div>
                <div className="lp-stat-label">Anos de qualidade de vida<br />com força funcional</div>
              </div>
            </div>
          </Reveal>

          <Reveal className="lp-matters-attitude">
            <div className="lp-matters-attitude-eyebrow">Uma decisão</div>
            <h4>Assumir uma <em>nova atitude</em><br />diante da própria saúde.</h4>
            <p>Sair da posição de espectador. Parar de esperar a próxima segunda-feira, o próximo ano, o próximo motivo externo. <strong>Treinar deixa de ser obrigação cosmética e vira o ato concreto de cuidar de quem você vai ser daqui a 20 anos.</strong></p>
            <p>Essa atitude não exige que você já esteja em forma. Exige uma única coisa: <span className="lp-highlight">começar com a estrutura certa por trás de você</span>.</p>
          </Reveal>
        </div>
      </section>

      {/* ═══ CHECKOUT ═══ */}
      <section className="lp-checkout" id="checkout">
        <div className="lp-checkout-container">
          <Reveal className="lp-checkout-header">
            <div className="lp-section-eyebrow" style={{ justifyContent: "center" }}>Pronto para começar</div>
            <h2 className="lp-section-title" style={{ textAlign: "center" }}>Você está pronto<br />para <em>começar.</em></h2>
            <p className="lp-sub-text" style={{ textAlign: "center", maxWidth: 620, margin: "12px auto 0" }}>
              Uma única mensalidade que reúne os três pilares do Protocolo Destravamento. Sem fidelidade, sem custo adicional pelo app ou pelo acompanhamento.
            </p>
            <p className="lp-urgency-note" style={{ textAlign: "center", maxWidth: 520, margin: "20px auto 0", fontSize: 14, color: "var(--lp-gold)", fontFamily: "var(--lp-mono)", letterSpacing: ".04em", opacity: .85 }}>
              ⚡ Vagas limitadas por turma — acompanhamento personalizado exige controle de capacidade.
            </p>
          </Reveal>

          <Reveal className="lp-price-card">
            <div className="lp-price-top">
              <div className="lp-price-eyebrow">
                Mensalidade · Academia VS Gold
                <span className="lp-plus"> + </span>
                Acompanhamento JMP
                <span className="lp-plus"> + </span>
                App Meu Treino
              </div>
              <div className="lp-price-display">
                <span className="lp-price-currency">R$</span>
                <span className="lp-price-amount">219</span>
                <span className="lp-price-cents">,90</span>
              </div>
              <div className="lp-price-period">por mês · <span>sem fidelidade</span></div>
              <div className="lp-price-includes">Os três pilares, uma única assinatura</div>
            </div>

            <div className="lp-price-features">
              {[
                { title: "VS Gold · Espaço", text: "Acesso ao que há de melhor em academias na região de Londrina — todas as unidades VS Gold incluídas." },
                { title: "JMP · Método", text: "Metodologia JMP — até 12 semanas de iniciação segura e guiada por especialistas." },
                { title: "Meu Treino · Tecnologia", text: "App Meu Treino com protocolo personalizado por perfil, IA adaptativa e integração em tempo real com a JMP." },
              ].map((f, i) => (
                <div key={i} className="lp-price-feature">
                  <div className="lp-price-feature-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg>
                  </div>
                  <div>
                    <div className="lp-price-feature-title">{f.title}</div>
                    <div className="lp-price-feature-text">{f.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-price-cta-wrap">
              <button onClick={goToAnamnesis} className="lp-price-cta">
                <span>Eu Quero — R$ 219,90/mês</span>
                <span className="lp-arrow">→</span>
              </button>
            </div>

            <div className="lp-price-foot">
              <div>Mensalidade Academia VS Gold + Acompanhamento JMP + App Meu Treino</div>
              <div style={{ marginTop: 8 }}>Inclusos sem custo adicional · Londrina — PR · 2026</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-row">
          <span>VS GOLD</span>
          <span>×</span>
          <span>JMP TREINAMENTOS</span>
          <span>×</span>
          <span>MEU TREINO</span>
        </div>
        <div>Protocolo Destravamento © 2026 · Londrina, PR</div>
      </footer>
    </div>
  );
}
