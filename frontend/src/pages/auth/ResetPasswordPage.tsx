import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../../api/client';

const resetSchema = z.object({
  password: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      toast.error('Недействительная ссылка');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      toast.success('Пароль успешно изменён!');
      navigate('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка сброса пароля';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-patriot p-4">
        <div className="card p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-accent-red/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-heading text-white mb-2">
            Недействительная ссылка
          </h2>
          <p className="text-white/60 mb-6">
            Ссылка для сброса пароля недействительна или устарела.
          </p>
          <Link to="/forgot-password" className="btn-primary">
            Запросить новую ссылку
          </Link>
        </div>
      </div>
    );
  }

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
            Новый пароль
          </h1>
          <p className="text-white/60 text-center mb-8">
            Введите новый пароль для вашего аккаунта
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm mb-2">Новый пароль</label>
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
              <label className="block text-white/80 text-sm mb-2">Подтверждение пароля</label>
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

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? <span className="spinner" /> : 'Сохранить пароль'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-white/40 hover:text-white text-sm transition-colors">
              ← Вернуться ко входу
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
