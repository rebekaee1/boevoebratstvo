import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken, refreshToken, user } = response.data;

      setAuth(user, accessToken, refreshToken);
      toast.success('Добро пожаловать!');

      // Редирект в зависимости от роли
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'expert') {
        navigate('/expert');
      } else {
        navigate('/student');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка входа';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-patriot p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card p-8">
          {/* Logo */}
          <div className="flex justify-center gap-4 mb-6">
            <img src="/sevastopol.svg" alt="Севастополь" className="h-12" />
            <img src="/bb.png" alt="Боевое Братство" className="h-12" />
          </div>

          <h1 className="font-heading text-2xl font-bold text-white text-center mb-2">
            Вход в систему
          </h1>
          <p className="text-white/60 text-center mb-8">
            Наследники Победы
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm mb-2">Email</label>
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

            <div>
              <label className="block text-white/80 text-sm mb-2">Пароль</label>
              <input
                type="password"
                {...register('password')}
                className="input-field"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="input-error">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-accent-gold hover:underline"
              >
                Забыли пароль?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? <span className="spinner" /> : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-white/60">Нет аккаунта?</span>{' '}
            <Link to="/register" className="text-accent-gold hover:underline">
              Зарегистрироваться
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
