import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

// Анимационные варианты
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } 
  },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

export default function LandingPage() {
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(true);
  const [deadline, setDeadline] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  // URL кабинета в зависимости от роли
  const getDashboardUrl = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'expert': return '/expert';
      default: return '/student';
    }
  };

  useEffect(() => {
    // Загрузка статуса приёма работ
    fetch(`${import.meta.env.VITE_API_URL}/settings/submission-status`)
      .then((res) => res.json())
      .then((data) => {
        setIsSubmissionOpen(data.isOpen);
        setDeadline(data.deadline);
      })
      .catch(() => {
        // Если API недоступен, считаем что приём открыт
      });
  }, []);

  return (
    <div className="min-h-screen bg-bg-dark overflow-x-hidden">
      {/* ============================================
          Header (fixed)
      ============================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6 md:py-4 bg-gradient-to-b from-bg-dark/98 to-bg-dark/85 backdrop-blur-xl border-b border-accent-gold/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Логотипы + название */}
          <div className="flex items-center gap-3 md:gap-4">
            <img 
              src="/sevastopol.svg" 
              alt="Севастополь" 
              className="h-10 md:h-12 w-auto hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate('/')}
            />
            <img 
              src="/bb.png" 
              alt="Боевое Братство" 
              className="h-10 md:h-12 w-auto hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate('/')}
            />
            <span className="hidden sm:block font-heading text-lg md:text-xl font-bold text-accent-gold tracking-wide">
              Наследники Победы
            </span>
          </div>

          {/* Навигация — Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#about" 
              className="text-text-muted hover:text-accent-gold transition-colors font-medium"
            >
              О конкурсе
            </a>
            <a 
              href="#nominations" 
              className="text-text-muted hover:text-accent-gold transition-colors font-medium"
            >
              Номинации
            </a>
            <a 
              href="#steps" 
              className="text-text-muted hover:text-accent-gold transition-colors font-medium"
            >
              Как участвовать
            </a>
          </nav>

          {/* Кнопки входа / Профиль */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <Link
                to={getDashboardUrl()}
                className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base font-semibold text-white border-2 border-accent-gold rounded-lg hover:bg-accent-gold hover:text-primary-dark transition-all group"
              >
                <span className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold group-hover:bg-white/20 group-hover:text-primary-dark transition-colors">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden md:block">Мой кабинет</span>
                <span className="md:hidden">Кабинет</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white border-2 border-white/30 rounded-lg hover:border-accent-gold hover:text-accent-gold transition-all"
                >
                  Личный кабинет
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base font-semibold text-primary-dark bg-accent-gold rounded-lg hover:bg-accent-gold-light transition-all"
                >
                  Войти
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================
          Hero Section
      ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 md:pt-24 pb-16 px-4 overflow-hidden">
        {/* Георгиевская лента */}
        <div className="george-ribbon" />

        {/* Фоновые градиенты */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-transparent" 
               style={{ 
                 background: `
                   radial-gradient(ellipse 80% 50% at 50% 0%, rgba(26, 58, 92, 0.4) 0%, transparent 50%),
                   radial-gradient(ellipse 60% 40% at 80% 80%, rgba(196, 30, 58, 0.15) 0%, transparent 50%),
                   radial-gradient(ellipse 50% 30% at 20% 70%, rgba(212, 160, 23, 0.1) 0%, transparent 50%)
                 `
               }} 
          />
        </div>

        {/* Декоративная звезда */}
        <div className="hero-star">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-accent-red">
            <polygon points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40"/>
          </svg>
        </div>

        {/* Контент Hero */}
        <motion.div 
          className="relative z-10 max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Бейдж */}
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-5 py-2 mb-6 text-sm font-medium text-accent-gold bg-accent-gold/10 border border-accent-gold/30 rounded-full"
          >
            <span className="text-xs">★</span>
            <span>
              {(() => {
                if (!deadline) return 'Региональный конкурс 2026';
                const date = new Date(deadline);
                if (isNaN(date.getTime())) return 'Региональный конкурс 2026';
                return `Приём работ до ${date.toLocaleDateString('ru-RU')}`;
              })()}
            </span>
          </motion.div>

          {/* Заголовок */}
          <motion.h1 
            variants={fadeInUp}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
          >
            <span className="text-white block">Расскажи о героях</span>
            <span className="hero-title-gold block mt-2">Наследники Победы</span>
          </motion.h1>

          {/* Подзаголовок */}
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            Творческий конкурс для школьников Севастополя. 
            Напиши сочинение или нарисуй рисунок о героях Великой Отечественной войны 
            или участниках Специальной военной операции.
          </motion.p>

          {/* CTA */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to={isAuthenticated ? getDashboardUrl() : '/register'}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold text-primary-dark bg-gradient-to-r from-accent-gold to-accent-gold-light rounded-lg shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all"
            >
              {isAuthenticated ? 'Мой кабинет' : 'Принять участие'}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ============================================
          Section: О конкурсе
      ============================================ */}
      <section id="about" className="py-20 md:py-28 px-4 bg-gradient-to-b from-bg-dark to-primary-dark">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок секции */}
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="section-label mb-2">
              О конкурсе
            </motion.p>
            <motion.h2 variants={fadeInUp} className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Храним память о подвигах
            </motion.h2>
          </motion.div>

          {/* Карточки */}
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            {[
              { icon: '🎖️', title: 'Боевое Братство', text: 'Конкурс проводится Севастопольским отделением Всероссийской организации «Боевое Братство» — объединения ветеранов боевых действий.' },
              { icon: '📖', title: 'Преемственность поколений', text: 'Мы сохраняем связь времён — от прадедов, победивших в Великой Отечественной, до современных защитников Родины.' },
              { icon: '✍️', title: 'Творческие работы', text: 'Школьники могут проявить себя в двух форматах: написать сочинение или создать рисунок на тему героизма и патриотизма.' },
              { icon: '🏆', title: 'Экспертная оценка', text: 'Каждую работу оценивают опытные эксперты. Лучшие участники получат дипломы и памятные подарки.' },
            ].map((card) => (
              <motion.div
                key={card.title}
                variants={fadeInUp}
                className="about-card group"
              >
                <div className="about-card-icon">{card.icon}</div>
                <h3 className="about-card-title">{card.title}</h3>
                <p className="about-card-text">{card.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================
          Section: Номинации
      ============================================ */}
      <section id="nominations" className="py-20 md:py-28 px-4 bg-primary-dark">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок секции */}
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="section-label mb-2">
              Номинации
            </motion.p>
            <motion.h2 variants={fadeInUp} className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Два направления — одна память
            </motion.h2>
          </motion.div>

          {/* Карточки номинаций */}
          <motion.div 
            className="grid md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            {/* ВОВ — Красная карточка */}
            <motion.div 
              variants={fadeInUp}
              className="nomination-card nomination-card--vov"
            >
              <div className="relative z-10">
                <span className="nomination-badge">Номинация 1</span>
                <h3 className="nomination-title">Великая Отечественная война</h3>
                <p className="nomination-subtitle">Герои ВОВ — наши прадеды и прабабушки</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <span className="format-tag">📝 Сочинение</span>
                  <span className="format-tag">🎨 Рисунок</span>
                </div>
              </div>
            </motion.div>

            {/* СВО — Синяя карточка */}
            <motion.div 
              variants={fadeInUp}
              className="nomination-card nomination-card--svo"
            >
              <div className="relative z-10">
                <span className="nomination-badge">Номинация 2</span>
                <h3 className="nomination-title">Специальная военная операция</h3>
                <p className="nomination-subtitle">Герои СВО — наши современники</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <span className="format-tag">📝 Сочинение</span>
                  <span className="format-tag">🎨 Рисунок</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          Section: Как участвовать
      ============================================ */}
      <section id="steps" className="py-20 md:py-28 px-4 bg-gradient-to-b from-primary-dark to-bg-dark">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок секции */}
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="section-label mb-2">
              Как участвовать
            </motion.p>
            <motion.h2 variants={fadeInUp} className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Три простых шага
            </motion.h2>
          </motion.div>

          {/* Шаги */}
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            {[
              { num: '1', title: 'Зарегистрируйся', text: 'Создай аккаунт на платформе — это займёт пару минут' },
              { num: '2', title: 'Загрузи работу', text: 'Выбери номинацию и загрузи своё сочинение или рисунок' },
              { num: '3', title: 'Получи оценку', text: 'Эксперты оценят твою работу, и ты увидишь результат' },
            ].map((step) => (
              <motion.div 
                key={step.num}
                variants={fadeInUp}
                className="step-card"
              >
                <div className="step-number">{step.num}</div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-text">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          {isSubmissionOpen && (
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Link
                to={isAuthenticated ? getDashboardUrl() : '/register'}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold text-primary-dark bg-gradient-to-r from-accent-gold to-accent-gold-light rounded-lg shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all"
              >
                {isAuthenticated ? 'Перейти в кабинет' : 'Начать сейчас'}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ============================================
          Footer
      ============================================ */}
      <footer className="py-16 px-4 bg-bg-dark border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Логотипы */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/sevastopol.svg" 
              alt="Севастополь" 
              className="h-14 md:h-16 w-auto"
            />
            <img 
              src="/bb.png" 
              alt="Боевое Братство" 
              className="h-14 md:h-16 w-auto"
            />
          </div>

          {/* Текст */}
          <p className="text-text-muted mb-2">
            Конкурс проводится при поддержке
          </p>
          <p className="font-heading text-lg md:text-xl font-semibold text-accent-gold mb-8">
            Севастопольское отделение «Боевого Братства»
          </p>

          {/* Ссылки */}
          <div className="flex justify-center gap-6 mb-8">
            <Link 
              to="/privacy" 
              className="text-text-muted hover:text-white text-sm transition-colors"
            >
              Политика конфиденциальности
            </Link>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t border-white/5">
            <p className="text-text-muted text-sm opacity-60">
              © {new Date().getFullYear()} Наследники Победы. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
