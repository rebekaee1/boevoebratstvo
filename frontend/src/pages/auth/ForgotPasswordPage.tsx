import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../../api/client';

const forgotSchema = z.object({
  email: z.string().email('Некорректный email'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setIsSent(true);
      toast.success('Инструкции отправлены на email');
    } catch (error: any) {
      // Всегда показываем успех для безопасности
      setIsSent(true);
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
            Восстановление пароля
          </h1>
          <p className="text-white/60 text-center mb-8">
            Введите email, указанный при регистрации
          </p>

          {isSent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-xl font-heading text-white mb-2">
                Проверьте почту
              </h2>
              <p className="text-white/60 mb-6">
                Если аккаунт с таким email существует, мы отправили инструкции по восстановлению пароля.
              </p>
              <Link to="/login" className="btn-secondary">
                Вернуться ко входу
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? <span className="spinner" /> : 'Отправить инструкции'}
              </button>
            </form>
          )}

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
