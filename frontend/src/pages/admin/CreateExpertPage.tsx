import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

// Проверка авторизации
function useAdminAuth() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      toast.error('Требуется авторизация администратора');
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  return { isAdmin: isAuthenticated && user?.role === 'admin' };
}

const expertSchema = z.object({
  email: z.string().email('Некорректный email'),
  fullName: z.string().min(2, 'Введите ФИО'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type ExpertFormData = z.infer<typeof expertSchema>;

export default function CreateExpertPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { isAdmin } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [createdExpert, setCreatedExpert] = useState<{ email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpertFormData>({
    resolver: zodResolver(expertSchema),
    defaultValues: {
      password: generatePassword(),
    },
  });
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  const onSubmit = async (data: ExpertFormData) => {
    setIsLoading(true);
    try {
      await api.post('/users/experts', data);
      toast.success('Эксперт создан!');
      setCreatedExpert({ email: data.email, password: data.password });
      reset({ password: generatePassword() });
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Email уже используется');
      } else {
        toast.error('Ошибка создания эксперта');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      {/* Header */}
      <header className="bg-primary/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3">
              <img src="/sevastopol.svg" alt="Севастополь" className="h-8" />
              <span className="font-heading text-lg text-white font-bold hidden sm:block">
                Наследники Победы
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="badge-red">Администратор</span>
              <button onClick={() => { logout(); navigate('/'); }} className="text-white/60 hover:text-white text-sm">
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Навигация */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="text-accent-gold hover:underline">← Назад</Link>
          <h1 className="font-heading text-2xl font-bold text-white">Создание эксперта</h1>
        </div>

        <div className="max-w-xl mx-auto">
          {/* Уведомление о созданном эксперте */}
          {createdExpert && (
            <div className="card bg-green-500/10 border-green-500/30 mb-6">
              <h3 className="font-heading text-lg font-bold text-green-400 mb-2">
                ✓ Эксперт создан!
              </h3>
              <p className="text-white/80 mb-2">Передайте эти данные эксперту:</p>
              <div className="bg-black/20 rounded-lg p-4 font-mono text-sm">
                <p className="text-white">Email: <span className="text-accent-gold">{createdExpert.email}</span></p>
                <p className="text-white">Пароль: <span className="text-accent-gold">{createdExpert.password}</span></p>
              </div>
              <button
                onClick={() => setCreatedExpert(null)}
                className="mt-4 text-sm text-white/60 hover:text-white"
              >
                Закрыть
              </button>
            </div>
          )}

          {/* Форма */}
          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* ФИО */}
              <div>
                <label className="input-label">ФИО эксперта *</label>
                <input
                  {...register('fullName')}
                  type="text"
                  className="input-field"
                  placeholder="Иванов Иван Иванович"
                />
                {errors.fullName && (
                  <p className="input-error">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="input-label">Email *</label>
                <input
                  {...register('email')}
                  type="email"
                  className="input-field"
                  placeholder="expert@example.com"
                />
                {errors.email && (
                  <p className="input-error">{errors.email.message}</p>
                )}
              </div>

              {/* Телефон */}
              <div>
                <label className="input-label">Телефон</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input-field"
                  placeholder="+7 978 123 45 67"
                />
              </div>

              {/* Пароль */}
              <div>
                <label className="input-label">Пароль *</label>
                <input
                  {...register('password')}
                  type="text"
                  className="input-field font-mono"
                />
                {errors.password && (
                  <p className="input-error">{errors.password.message}</p>
                )}
                <p className="text-white/40 text-sm mt-1">
                  Пароль сгенерирован автоматически. Можете изменить вручную.
                </p>
              </div>

              {/* Кнопка */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner w-5 h-5" />
                    Создание...
                  </span>
                ) : (
                  'Создать эксперта'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
