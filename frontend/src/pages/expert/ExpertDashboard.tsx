import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

interface Work {
  id: string;
  title: string;
  nomination: string;
  workType: string;
  fileName: string;
  fileSize: number;
  status: string;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    school: string;
    grade: string;
  };
  rating?: {
    id: string;
    score: number;
    comment?: string;
  };
}

const nominationLabels: Record<string, string> = {
  vov: 'ВОВ',
  svo: 'СВО',
};

const workTypeLabels: Record<string, string> = {
  essay: 'Сочинение',
  drawing: 'Рисунок',
};

export default function ExpertDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [ratingForm, setRatingForm] = useState({ score: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadWorks();
  }, []);

  const loadWorks = async () => {
    try {
      const response = await api.get('/works/assigned');
      setWorks(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки работ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDownload = async (work: Work) => {
    try {
      const response = await api.get(`/works/${work.id}/download`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      toast.error('Ошибка получения файла');
    }
  };

  const handleRate = async () => {
    if (!selectedWork) return;

    setIsSubmitting(true);
    try {
      await api.post('/ratings', {
        workId: selectedWork.id,
        score: ratingForm.score,
        comment: ratingForm.comment || undefined,
      });

      toast.success('Оценка сохранена!');
      setSelectedWork(null);
      setRatingForm({ score: 5, comment: '' });
      loadWorks();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка сохранения оценки';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingWorks = works.filter((w) => w.status === 'review');
  const ratedWorks = works.filter((w) => w.status === 'rated');

  return (
    <div className="min-h-screen bg-primary-dark">
      {/* Header */}
      <header className="bg-primary/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/sevastopol.svg" alt="Севастополь" className="h-8" />
              <span className="font-heading text-lg text-white font-bold hidden sm:block">
                Наследники Победы
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="badge-gold">Эксперт</span>
              <span className="text-white/60 text-sm hidden md:block">
                {user?.fullName}
              </span>
              <button
                onClick={handleLogout}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-8">
            Кабинет эксперта
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="card p-4 text-center">
              <div className="text-3xl font-heading font-bold text-accent-gold">
                {works.length}
              </div>
              <div className="text-white/60 text-sm">Назначено</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-heading font-bold text-white">
                {pendingWorks.length}
              </div>
              <div className="text-white/60 text-sm">Ожидают оценки</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-heading font-bold text-accent-green">
                {ratedWorks.length}
              </div>
              <div className="text-white/60 text-sm">Оценено</div>
            </div>
          </div>

          {isLoading ? (
            <div className="card flex items-center justify-center py-12">
              <span className="spinner" />
            </div>
          ) : works.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-white/60">Нет назначенных работ</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending */}
              {pendingWorks.length > 0 && (
                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    Ожидают оценки ({pendingWorks.length})
                  </h2>
                  <div className="grid gap-4">
                    {pendingWorks.map((work) => (
                      <div key={work.id} className="card">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div>
                            <h3 className="font-heading text-lg font-bold text-white mb-1">
                              {work.title}
                            </h3>
                            <p className="text-white/60 text-sm">
                              {work.student.fullName} • {work.student.school}, {work.student.grade} класс
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className="badge-gold text-xs">
                                {nominationLabels[work.nomination]}
                              </span>
                              <span className="badge-gold text-xs">
                                {workTypeLabels[work.workType]}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(work)}
                              className="btn-secondary text-sm px-4 py-2"
                            >
                              📥 Скачать
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWork(work);
                                setRatingForm({
                                  score: work.rating?.score || 5,
                                  comment: work.rating?.comment || '',
                                });
                              }}
                              className="btn-primary text-sm px-4 py-2"
                            >
                              ⭐ Оценить
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Rated */}
              {ratedWorks.length > 0 && (
                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    Оценённые ({ratedWorks.length})
                  </h2>
                  <div className="grid gap-4">
                    {ratedWorks.map((work) => (
                      <div key={work.id} className="card opacity-70">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div>
                            <h3 className="font-heading text-lg font-bold text-white mb-1">
                              {work.title}
                            </h3>
                            <p className="text-white/60 text-sm">
                              {work.student.fullName} • {work.student.school}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-heading font-bold text-accent-gold">
                              {work.rating?.score}
                            </div>
                            <div className="text-xs text-white/40">баллов</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Rating Modal */}
      {selectedWork && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 w-full max-w-md"
          >
            <h3 className="font-heading text-xl font-bold text-white mb-4">
              Оценить работу
            </h3>
            <p className="text-white/60 mb-6">{selectedWork.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Оценка (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={ratingForm.score}
                  onChange={(e) =>
                    setRatingForm({ ...ratingForm, score: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="text-center text-3xl font-heading font-bold text-accent-gold">
                  {ratingForm.score}
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Комментарий (необязательно)
                </label>
                <textarea
                  value={ratingForm.comment}
                  onChange={(e) =>
                    setRatingForm({ ...ratingForm, comment: e.target.value })
                  }
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Напишите отзыв..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setSelectedWork(null)}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button
                onClick={handleRate}
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting ? <span className="spinner" /> : 'Сохранить'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
