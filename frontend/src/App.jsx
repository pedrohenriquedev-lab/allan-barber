import { useEffect, useMemo, useState } from "react";
import "./App.css";

const DEFAULT_SERVICES = [
  { id: 1, name: "Corte tradicional", description: "Corte clássico na tesoura ou máquina.", price: 30, duration: 40, image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700" },
  { id: 2, name: "Corte degradê", description: "Degradê personalizado com acabamento.", price: 35, duration: 45, image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=700" },
  { id: 3, name: "Corte + barba", description: "Corte completo e alinhamento da barba.", price: 50, duration: 60, image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=700" },
  { id: 4, name: "Barba", description: "Modelagem e acabamento profissional.", price: 20, duration: 25, image: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=700" },
];

const times = ["09:00", "09:45", "10:30", "11:15", "13:00", "13:45", "14:30", "15:15", "16:00", "16:45", "17:30", "18:15"];

const money = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("allan-barber-theme") || "dark";
    } catch {
      return "dark";
    }
  });

  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem("allan-barber-services");
      return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  });

  const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: "", description: "", price: "", duration: "", image: "" });
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [booking, setBooking] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [appointments, setAppointments] = useState([
    { id: 1, name: "Carlos Henrique", service: "Corte degradê", time: "09:00", price: 35, status: "Concluído" },
    { id: 2, name: "Lucas Santos", service: "Corte + barba", time: "10:00", price: 50, status: "Confirmado" },
    { id: 3, name: "Rafael Oliveira", service: "Corte tradicional", time: "11:00", price: 30, status: "Confirmado" },
    { id: 4, name: "Matheus Lima", service: "Barba", time: "13:00", price: 20, status: "Pendente" },
    { id: 5, name: "Gabriel Costa", service: "Corte degradê", time: "14:00", price: 35, status: "Confirmado" },
  ]);

  useEffect(() => {
    try {
      localStorage.setItem("allan-barber-theme", theme);
    } catch {
      // O aplicativo continua funcionando mesmo sem armazenamento local.
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("allan-barber-services", JSON.stringify(services));
    } catch {
      // O catálogo continua disponível durante esta sessão.
    }
  }, [services]);

  const dates = useMemo(() => {
    const result = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      result.push({
        day: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        number: date.getDate(),
        month: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        full: date.toLocaleDateString("pt-BR"),
      });
    }

    return result;
  }, []);

  const completed = appointments.filter(a => a.status === "Concluído");
  const revenue = completed.reduce((sum, a) => sum + a.price, 0);

  function submitBooking(e) {
    e.preventDefault();

    if (!selectedService || !selectedTime || !customer.name.trim() || !customer.phone.trim()) return;

    const newBooking = {
      id: Date.now(),
      name: customer.name,
      service: selectedService.name,
      price: selectedService.price,
      time: selectedTime,
      date: dates[selectedDate].full,
      status: "Confirmado",
    };

    setAppointments(prev => [...prev, newBooking]);
    setBooking(newBooking);
  }

  function closeBooking() {
    setBooking(null);
    setSelectedService(null);
    setSelectedTime("");
    setCustomer({ name: "", phone: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function login(e) {
    e.preventDefault();

    if (email.trim() && password.trim()) {
      setLoggedIn(true);
    }
  }

  function openNewService() {
    setEditingServiceId(null);
    setServiceForm({
      name: "",
      description: "",
      price: "",
      duration: "",
      image: "",
    });
    setServiceEditorOpen(true);
  }

  function openEditService(service) {
    setEditingServiceId(service.id);

    setServiceForm({
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      duration: String(service.duration),
      image: service.image || "",
    });

    setServiceEditorOpen(true);
  }

  function saveService(e) {
    e.preventDefault();

    const name = serviceForm.name.trim();
    const price = Number(serviceForm.price);
    const duration = Number(serviceForm.duration);

    if (
      !name ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      return;
    }

    if (editingServiceId !== null) {
      const updated = {
        ...services.find(s => s.id === editingServiceId),
        ...serviceForm,
        name,
        price,
        duration,
        image: serviceForm.image.trim() || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700",
      };

      setServices(prev =>
        prev.map(s => s.id === editingServiceId ? updated : s)
      );

      setSelectedService(prev =>
        prev?.id === editingServiceId ? updated : prev
      );
    } else {
      const created = {
        id: Date.now(),
        name,
        description: serviceForm.description.trim() || "Serviço profissional da barbearia.",
        price,
        duration,
        image: serviceForm.image.trim() || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700",
      };

      setServices(prev => [...prev, created]);
    }

    setServiceEditorOpen(false);
    setEditingServiceId(null);
  }

  function deleteService(id) {
    const service = services.find(s => s.id === id);

    if (!service || !window.confirm('Deseja excluir o serviço "' + service.name + '"?')) {
      return;
    }

    setServices(prev => prev.filter(s => s.id !== id));

    setSelectedService(prev =>
      prev?.id === id ? null : prev
    );
  }

  function updateStatus(id, status) {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status } : a)
    );
  }

  const whatsappMessage = booking
    ? encodeURIComponent(`Olá! Meu agendamento no Allan Barber foi realizado.
Serviço: ${booking.service}
Data: ${booking.date}
Horário: ${booking.time}
Valor: ${money(booking.price)}`)
    : "";

  if (adminOpen) {
    return (
      <div className="admin-shell" data-theme={theme}>
        {!loggedIn ? (
          <div className="login-screen">
            <button className="back-link" onClick={() => setAdminOpen(false)}>
              ← Voltar ao site
            </button>

            <ThemeToggle theme={theme} setTheme={setTheme} />

            <div className="login-card">
              <div className="brand-mark">AB<span>.</span></div>
              <p className="eyebrow">ÁREA RESTRITA</p>
              <h1>Acesso profissional</h1>
              <p className="muted">Entre para gerenciar sua barbearia.</p>

              <form onSubmit={login}>
                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />

                <label>Senha</label>
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />

                <button className="primary-button full-button">
                  Entrar no painel <span>→</span>
                </button>
              </form>

              <small>
                Versão demonstrativa: qualquer e-mail e senha permitem visualizar o painel.
              </small>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <aside className="sidebar">
              <div className="brand-mark">AB<span>.</span></div>
              <p className="sidebar-label">MENU PRINCIPAL</p>

              {[
                ["overview", "▦", "Visão geral"],
                ["appointments", "▤", "Agendamentos"],
                ["services", "✂", "Serviços"],
                ["finance", "◈", "Financeiro"],
              ].map(([id, icon, label]) => (
                <button
                  key={id}
                  className={`side-link ${activeTab === id ? "active" : ""}`}
                  onClick={() => setActiveTab(id)}
                >
                  <span>{icon}</span>{label}
                </button>
              ))}

              <button
                className="side-link logout"
                onClick={() => {
                  setLoggedIn(false);
                  setAdminOpen(false);
                }}
              >
                ↪ Sair do painel
              </button>

              <div className="sidebar-footer">
                <span className="online-dot" /> Allan Barber<br />
                <small>Administrador</small>
              </div>
            </aside>

            <main className="dashboard-main">
              <header className="dashboard-header">
                <div>
                  <p className="eyebrow">ALLAN BARBER / PAINEL</p>
                  <h1>
                    {activeTab === "overview"
                      ? "Visão geral"
                      : activeTab === "appointments"
                      ? "Agendamentos"
                      : activeTab === "services"
                      ? "Serviços"
                      : "Financeiro"}
                  </h1>
                </div>

                <div className="header-actions">
                  <ThemeToggle theme={theme} setTheme={setTheme} />
                  <button className="outline-button" onClick={() => setAdminOpen(false)}>
                    Ver site ↗
                  </button>
                </div>
              </header>

              {activeTab === "overview" && (
                <>
                  <p className="muted">Acompanhe o movimento da sua barbearia.</p>

                  <div className="stats-grid">
                    <Stat title="Agendamentos hoje" value={appointments.length} icon="▤" />
                    <Stat title="Concluídos" value={completed.length} icon="✓" />
                    <Stat title="Próximos clientes" value={appointments.filter(a => a.status === "Confirmado").length} icon="◷" />
                    <Stat title="Faturamento registrado" value={money(revenue)} icon="R$" />
                  </div>

                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Agenda do dia</h2>
                        <p>Resumo dos atendimentos</p>
                      </div>
                      <button className="text-button" onClick={() => setActiveTab("appointments")}>
                        Ver todos →
                      </button>
                    </div>

                    <AppointmentTable
                      appointments={appointments.slice(0, 5)}
                      updateStatus={updateStatus}
                    />
                  </section>
                </>
              )}

              {activeTab === "appointments" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Todos os agendamentos</h2>
                      <p>Gerencie seus atendimentos</p>
                    </div>
                    <span className="count-pill">{appointments.length} registros</span>
                  </div>

                  <AppointmentTable
                    appointments={appointments}
                    updateStatus={updateStatus}
                  />
                </section>
              )}

              {activeTab === "services" && (
                <section className="panel">
                  <div className="panel-heading services-admin-heading">
                    <div>
                      <h2>Catálogo de serviços</h2>
                      <p>Edite preços, atualize cortes ou cadastre novos serviços.</p>
                    </div>

                    <button
                      type="button"
                      className="primary-button add-service-button"
                      onClick={openNewService}
                    >
                      + Adicionar corte
                    </button>
                  </div>

                  {serviceEditorOpen && (
                    <form className="service-editor" onSubmit={saveService}>
                      <div className="service-editor-heading">
                        <div>
                          <h3>{editingServiceId !== null ? "Editar serviço" : "Novo serviço"}</h3>
                          <p>As alterações serão publicadas no catálogo do cliente após salvar.</p>
                        </div>

                        <button
                          type="button"
                          className="editor-close"
                          onClick={() => setServiceEditorOpen(false)}
                          aria-label="Fechar"
                        >
                          ×
                        </button>
                      </div>

                      <div className="service-editor-grid">
                        <label>
                          Nome do corte/serviço
                          <input
                            value={serviceForm.name}
                            onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                            placeholder="Ex.: Corte infantil"
                            required
                          />
                        </label>

                        <label>
                          Preço (R$)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={serviceForm.price}
                            onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
                            placeholder="Ex.: 35,00"
                            required
                          />
                        </label>

                        <label>
                          Duração (minutos)
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={serviceForm.duration}
                            onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })}
                            placeholder="Ex.: 40"
                            required
                          />
                        </label>

                        <label className="service-description-field">
                          Descrição
                          <input
                            value={serviceForm.description}
                            onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                            placeholder="Descreva brevemente o serviço"
                          />
                        </label>

                        <label className="service-image-field">
                          URL da imagem (opcional)
                          <input
                            type="url"
                            value={serviceForm.image}
                            onChange={e => setServiceForm({ ...serviceForm, image: e.target.value })}
                            placeholder="https://..."
                          />
                        </label>
                      </div>

                      <div className="service-editor-actions">
                        <button
                          type="button"
                          className="outline-button"
                          onClick={() => setServiceEditorOpen(false)}
                        >
                          Cancelar
                        </button>

                        <button type="submit" className="primary-button">
                          {editingServiceId !== null ? "Salvar alterações" : "Cadastrar serviço"} →
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="admin-services">
                    {services.map(s => (
                      <div className="admin-service admin-service-manage" key={s.id}>
                        <div className="admin-service-main">
                          <strong>{s.name}</strong>
                          <p>{s.duration} minutos · {s.description}</p>
                        </div>

                        <strong className="admin-service-price">{money(s.price)}</strong>

                        <div className="admin-service-actions">
                          <button
                            type="button"
                            className="outline-button"
                            onClick={() => openEditService(s)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="delete-service-button"
                            onClick={() => deleteService(s.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {services.length === 0 && (
                    <p className="empty-services">
                      Nenhum serviço cadastrado. Use “Adicionar corte” para criar o primeiro.
                    </p>
                  )}

                  <p className="demo-note">
                    Ao salvar, o catálogo público é atualizado imediatamente neste navegador.
                    Os dados ficam salvos localmente nesta demonstração.
                  </p>
                </section>
              )}

              {activeTab === "finance" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Resumo financeiro</h2>
                      <p>Valores dos atendimentos concluídos nesta demonstração</p>
                    </div>
                  </div>

                  <div className="finance-total">
                    <span>Faturamento registrado</span>
                    <strong>{money(revenue)}</strong>
                  </div>

                  <div className="finance-row">
                    <span>Atendimentos concluídos</span>
                    <strong>{completed.length}</strong>
                  </div>

                  <div className="finance-row">
                    <span>Ticket médio</span>
                    <strong>{money(completed.length ? revenue / completed.length : 0)}</strong>
                  </div>

                  <p className="demo-note">
                    Na versão final, os valores serão calculados a partir dos atendimentos reais.
                  </p>
                </section>
              )}
            </main>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="site" data-theme={theme}>
      <div className="top-strip">
        <span>✦</span> ATENDIMENTO COM HORA MARCADA
        <span className="top-divider">|</span> AREIAS · RECIFE - PE
      </div>

      <header className="site-header">
        <a href="#inicio" className="site-brand">
          <span className="brand-icon">AB</span>
          <span>ALLAN <b>BARBER</b><small>BARBEARIA & ESTILO</small></span>
        </a>

        <nav>
          <a href="#inicio">Início</a>
          <a href="#servicos">Serviços</a>
          <a href="#agendar">Agendamento</a>
        </nav>

        <div className="header-actions">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button className="header-admin" onClick={() => setAdminOpen(true)}>
            Área do profissional ↗
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-content">
            <p className="eyebrow">
              <span className="red-line" /> BARBEARIA ALLAN BARBER · RECIFE
            </p>

            <h1>SEU ESTILO.<br /><span>NOSSO</span> TRABALHO.</h1>

            <p className="hero-description">
              Mais que um corte, uma experiência. Escolha seu serviço e reserve seu horário com praticidade.
            </p>

            <a href="#agendar" className="primary-button">
              AGENDAR MEU HORÁRIO <span>→</span>
            </a>

            <div className="hero-details">
              <div><strong>TER–SÁB</strong><span>09h às 19h30</span></div>
              <div><strong>DOMINGO</strong><span>09h às 13h30</span></div>
            </div>
          </div>

          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1100"
              alt="Corte masculino profissional"
            />
            <div className="hero-image-label">
              <span>01</span>
              <div>
                <strong>PRECISÃO EM CADA DETALHE</strong>
                <small>ESTILO QUE REPRESENTA VOCÊ</small>
              </div>
            </div>
            <div className="hero-red-block" />
          </div>

          <div className="hero-watermark">AB</div>
        </section>

        <section className="trust-bar">
          <div><span>✂</span><strong>ATENDIMENTO PERSONALIZADO</strong></div>
          <div><span>◷</span><strong>HORÁRIO RESERVADO</strong></div>
          <div><span>✦</span><strong>QUALIDADE EM CADA CORTE</strong></div>
        </section>

        <section className="services-section" id="servicos">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ESCOLHA SEU ESTILO</p>
              <h2>NOSSOS <span>SERVIÇOS</span></h2>
            </div>
            <p>Confira as opções disponíveis<br />e escolha o que combina com você.</p>
          </div>

          <div className="services-grid">
            {services.map(service => (
              <article
                className={`service-card ${selectedService?.id === service.id ? "selected" : ""}`}
                key={service.id}
              >
                <div className="service-image">
                  <img src={service.image} alt={service.name} />
                  <span className="service-number">0{service.id}</span>
                </div>

                <div className="service-info">
                  <div>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                  </div>

                  <div className="service-bottom">
                    <strong>{money(service.price)}</strong>
                    <span>{service.duration} min</span>
                  </div>

                  <button
                    className="service-select"
                    onClick={() => {
                      setSelectedService(service);
                      document.getElementById("agendar")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    ESCOLHER SERVIÇO <span>→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="booking-section" id="agendar">
          <div className="booking-intro">
            <p className="eyebrow">RESERVE SEU MOMENTO</p>
            <h2>SEU PRÓXIMO<br /><span>CORTE COMEÇA AQUI.</span></h2>
            <p>
              Agende em poucos passos. Escolha o serviço, selecione o melhor horário e deixe o resto com a gente.
            </p>
            <div className="booking-contact">
              <span>⌖</span>
              <div>
                <strong>Rua Olímpio Costa, 87</strong>
                <small>Areias, Recife - PE</small>
              </div>
            </div>
          </div>

          <form className="booking-form" onSubmit={submitBooking}>
            <div className="form-title">
              <span>01</span>
              <div>
                <h3>Escolha seu serviço</h3>
                <p>Selecione uma opção do catálogo.</p>
              </div>
            </div>

            <div className="mini-services">
              {services.map(s => (
                <button
                  type="button"
                  key={s.id}
                  className={selectedService?.id === s.id ? "chosen" : ""}
                  onClick={() => setSelectedService(s)}
                >
                  <span>{s.name}</span>
                  <strong>{money(s.price)}</strong>
                </button>
              ))}
            </div>

            <div className="form-title">
              <span>02</span>
              <div>
                <h3>Escolha data e horário</h3>
                <p>Selecione quando deseja ser atendido.</p>
              </div>
            </div>

            <div className="date-list">
              {dates.map((d, i) => (
                <button
                  type="button"
                  key={i}
                  className={selectedDate === i ? "chosen" : ""}
                  onClick={() => {
                    setSelectedDate(i);
                    setSelectedTime("");
                  }}
                >
                  <small>{d.day}</small>
                  <strong>{d.number}</strong>
                  <small>{d.month}</small>
                </button>
              ))}
            </div>

            <div className="time-list">
              {times.map((t, i) => (
                <button
                  type="button"
                  key={t}
                  disabled={i === 2 || i === 7}
                  className={selectedTime === t ? "chosen" : ""}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="form-title">
              <span>03</span>
              <div>
                <h3>Seus dados</h3>
                <p>Para identificarmos seu agendamento.</p>
              </div>
            </div>

            <div className="customer-fields">
              <input
                placeholder="Seu nome completo"
                value={customer.name}
                onChange={e => setCustomer({ ...customer, name: e.target.value })}
                required
              />

              <input
                placeholder="WhatsApp / telefone"
                value={customer.phone}
                onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                required
              />
            </div>

            {selectedService && (
              <div className="booking-summary">
                <span>{selectedService.name}</span>
                <strong>{money(selectedService.price)}</strong>
              </div>
            )}

            <button
              className="primary-button full-button"
              type="submit"
              disabled={!selectedService || !selectedTime}
            >
              CONFIRMAR AGENDAMENTO <span>→</span>
            </button>

            <small className="form-disclaimer">
              Ao confirmar, você estará solicitando a reserva do horário selecionado.
            </small>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <a href="#inicio" className="site-brand">
          <span className="brand-icon">AB</span>
          <span>ALLAN <b>BARBER</b><small>BARBEARIA & ESTILO</small></span>
        </a>

        <p>Rua Olímpio Costa, 87 · Areias · Recife - PE</p>
        <span>© 2026 ALLAN BARBER · TODOS OS DIREITOS RESERVADOS</span>
      </footer>

      {booking && (
        <div className="modal-backdrop">
          <div className="confirmation-modal">
            <div className="success-icon">✓</div>
            <p className="eyebrow">RESERVA REALIZADA</p>
            <h2>HORÁRIO SOLICITADO!</h2>
            <p>Obrigado, {booking.name}. Confira os detalhes do seu agendamento.</p>

            <div className="confirmation-details">
              <div><span>Serviço</span><strong>{booking.service}</strong></div>
              <div><span>Data</span><strong>{booking.date}</strong></div>
              <div><span>Horário</span><strong>{booking.time}</strong></div>
              <div><span>Valor</span><strong>{money(booking.price)}</strong></div>
            </div>

            <a
              className="primary-button full-button"
              href={`https://wa.me/?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
            >
              ENVIAR PELO WHATSAPP ↗
            </a>

            <button className="text-button close-modal" onClick={closeBooking}>
              Voltar ao início
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
      <span>{isDark ? "Tema claro" : "Tema escuro"}</span>
    </button>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <p>{title}</p>
      <strong>{value}</strong>
      <small>Dados demonstrativos</small>
    </div>
  );
}

function AppointmentTable({ appointments, updateStatus }) {
  return (
    <div className="table-scroll">
      <table className="appointments-table">
        <thead>
          <tr>
            <th>CLIENTE</th>
            <th>SERVIÇO</th>
            <th>HORÁRIO</th>
            <th>VALOR</th>
            <th>STATUS</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map(a => (
            <tr key={a.id}>
              <td><strong>{a.name}</strong></td>
              <td>{a.service}</td>
              <td>{a.time}</td>
              <td>{money(a.price)}</td>
              <td>
                <select
                  value={a.status}
                  onChange={e => updateStatus(a.id, e.target.value)}
                >
                  <option>Confirmado</option>
                  <option>Concluído</option>
                  <option>Pendente</option>
                  <option>Cancelado</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;