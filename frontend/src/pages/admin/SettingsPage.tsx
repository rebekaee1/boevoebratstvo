import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

interface Settings {
  submissionDeadline: string | null;
  maxScore: number;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { isAdmin } = useAdminAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Форма
  const [deadline, setDeadline] = useState('');
  const [maxScore, setMaxScore] = useState(10);

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const loadSettings = async () => {
    try {
      const response = await api.get<Settings>('/settings');
      setSettings(response.data);
      
      // Заполняем форму
      if (response.data.submissionDeadline) {
        const date = new Date(response.data.submissionDeadline);
        if (!isNaN(date.getTime())) {
          setDeadline(date.toISOString().split('T')[0]);
        }
      }
      setMaxScore(response.data.maxScore || 10);
    } catch (error) {
      toast.error('Ошибка загрузки настроек');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data: { submissionDeadline?: string; maxScore?: number } = {};
      
      if (deadline) {
        data.submissionDeadline = new Date(deadline + 'T23:59:59').toISOString();
      }
      data.maxScore = maxScore;

      await api.patch('/settings', data);
      toast.success('Настройки сохранены!');
      loadSettings();
    } catch (error) {
      toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
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
          <h1 className="font-heading text-2xl font-bold text-white">Настройки</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <div className="card space-y-6">
              {/* Дедлайн */}
              <div>
                <label className="input-label">Дедлайн подачи работ</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input-field"
                />
                <p className="text-white/40 text-sm mt-1">
                  После этой даты участники не смогут подавать работы
                </p>
                {settings?.submissionDeadline && (
                  <p className="text-accent-gold text-sm mt-2">
                    Текущий дедлайн: {new Date(settings.submissionDeadline).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>

              {/* Шкала оценки */}
              <div>
                <label className="input-label">Максимальный балл</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 text-center">
                    <span className="text-3xl font-heading font-bold text-accent-gold">{maxScore}</span>
                  </div>
                </div>
                <p className="text-white/40 text-sm mt-1">
                  Шкала оценки: от 1 до {maxScore} баллов
                </p>
              </div>

              {/* Кнопка сохранения */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary w-full"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner w-5 h-5" />
                    Сохранение...
                  </span>
                ) : (
                  'Сохранить настройки'
                )}
              </button>
            </div>

            {/* Дополнительная информация */}
            <div className="card mt-6 bg-white/5">
              <h3 className="font-heading text-lg font-bold text-white mb-4">Информация</h3>
              <div className="space-y-2 text-white/60">
                <p>• Изменение дедлайна вступает в силу немедленно</p>
                <p>• Шкала оценки применяется ко всем новым оценкам</p>
                <p>• Уже выставленные оценки не изменятся</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
