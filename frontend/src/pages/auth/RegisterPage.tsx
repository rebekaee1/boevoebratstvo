import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Введите ФИО'),
  phone: z.string().optional(),
  school: z.string().min(1, 'Укажите школу'),
  grade: z.string().regex(/^(1[0-1]|[1-9])([А-Яа-яA-Za-z])?$/, 'Укажите класс (1-11)'),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: 'Необходимо согласие на обработку данных',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      privacyAccepted: false as any,
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...submitData } = data;
      const response = await api.post('/auth/register', submitData);
      const { accessToken, refreshToken, user } = response.data;

      setAuth(user, accessToken, refreshToken);
      toast.success('Регистрация успешна! Добро пожаловать!');
      navigate('/student');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка регистрации';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-patriot p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="card p-8">
          {/* Logo */}
          <div className="flex justify-center gap-4 mb-6">
            <img src="/sevastopol.svg" alt="Севастополь" className="h-12" />
            <img src="/bb.png" alt="Боевое Братство" className="h-12" />
          </div>

          <h1 className="font-heading text-2xl font-bold text-white text-center mb-2">
            Регистрация участника
          </h1>
          <p className="text-white/60 text-center mb-8">
            Наследники Победы
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* ФИО */}
            <div>
              <label className="block text-white/80 text-sm mb-2">ФИО *</label>
              <input
                type="text"
                {...register('fullName')}
                className="input-field"
                placeholder="Иванов Иван Иванович"
              />
              {errors.fullName && (
                <p className="input-error">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Email *</label>
              <input
                type="email"
                {...register('email')}
                className="input-field"
                placeholder="your@email.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="input-error">{errors.email.message}</p>
              )}
            </div>

            {/* Телефон */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Телефон</label>
              <input
                type="tel"
                {...register('phone')}
                className="input-field"
                placeholder="+7 978 123 45 67"
              />
              {errors.phone && (
                <p className="input-error">{errors.phone.message}</p>
              )}
            </div>

            {/* Школа и Класс */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-white/80 text-sm mb-2">Школа *</label>
                <input
                  type="text"
                  {...register('school')}
                  className="input-field"
                  placeholder="СОШ №1"
                />
                {errors.school && (
                  <p className="input-error">{errors.school.message}</p>
                )}
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-2">Класс *</label>
                <input
                  type="text"
                  {...register('grade')}
                  className="input-field"
                  placeholder="9А"
                />
                {errors.grade && (
                  <p className="input-error">{errors.grade.message}</p>
                )}
              </div>
            </div>

            {/* Пароль */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Пароль *</label>
                <input
                  type="password"
                  {...register('password')}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="input-error">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-2">Подтверждение *</label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="input-error">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Согласие */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('privacyAccepted')}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent-gold focus:ring-accent-gold"
                />
                <span className="text-white/70 text-sm">
                  Я согласен(а) на{' '}
                  <Link to="/privacy" className="text-accent-gold hover:underline">
                    обработку персональных данных
                  </Link>
                </span>
              </label>
              {errors.privacyAccepted && (
                <p className="input-error mt-1">{errors.privacyAccepted.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? <span className="spinner" /> : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-white/60">Уже есть аккаунт?</span>{' '}
            <Link to="/login" className="text-accent-gold hover:underline">
              Войти
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-white/40 hover:text-white text-sm transition-colors">
              ← На главную
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
