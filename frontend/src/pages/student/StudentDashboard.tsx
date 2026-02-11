import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
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
  rating?: {
    score: number;
    comment?: string;
  };
}

const nominationLabels: Record<string, string> = {
  vov: 'Великая Отечественная война',
  svo: 'Специальная военная операция',
};

const workTypeLabels: Record<string, string> = {
  essay: 'Сочинение',
  drawing: 'Рисунок',
};

const statusLabels: Record<string, { label: string; class: string }> = {
  moderation: { label: 'На модерации', class: 'badge-gold' },
  review: { label: 'На проверке', class: 'badge-gold' },
  rated: { label: 'Оценено', class: 'badge-green' },
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Состояния для редактирования названия
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Состояния для замены файла
  const [replacingWork, setReplacingWork] = useState<Work | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadWorks();
  }, []);

  const loadWorks = async () => {
    try {
      const response = await api.get('/works/my');
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  // ============================================
  // Скачивание файла
  // ============================================
  const handleDownload = async (workId: string) => {
    try {
      const response = await api.get(`/works/${workId}/download`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      toast.error('Ошибка скачивания файла');
    }
  };

  // ============================================
  // Удаление работы
  // ============================================
  const handleDelete = async (workId: string) => {
    if (!confirm('Вы уверены, что хотите удалить работу? Это действие нельзя отменить.')) {
      return;
    }
    try {
      await api.delete(`/works/${workId}`);
      toast.success('Работа удалена');
      loadWorks();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка удаления';
      toast.error(message);
    }
  };

  // ============================================
  // Редактирование названия
  // ============================================
  const openEditModal = (work: Work) => {
    setEditingWork(work);
    setNewTitle(work.title);
  };

  const handleUpdateTitle = async () => {
    if (!editingWork || !newTitle.trim()) return;
    setIsSaving(true);
    try {
      await api.patch(`/works/${editingWork.id}`, { title: newTitle.trim() });
      toast.success('Название обновлено');
      setEditingWork(null);
      setNewTitle('');
      loadWorks();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка обновления';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // Замена файла
  // ============================================
  const openReplaceModal = (work: Work) => {
    setReplacingWork(work);
    setNewFile(null);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setNewFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024, // 15 MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
    },
  });

  const handleReplaceFile = async () => {
    if (!replacingWork || !newFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', newFile);
      await api.post(`/works/${replacingWork.id}/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Файл заменён');
      setReplacingWork(null);
      setNewFile(null);
      loadWorks();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка замены файла';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

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
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
              Личный кабинет
            </h1>
            <p className="text-white/60">
              {user?.school}, {user?.grade} класс
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Link to="/student/submit" className="btn-primary">
              📤 Подать работу
            </Link>
          </div>

          {/* Works */}
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-white">
              Мои работы
            </h2>

            {isLoading ? (
              <div className="card flex items-center justify-center py-12">
                <span className="spinner" />
              </div>
            ) : works.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/60 mb-4">
                  Вы ещё не подали ни одной работы
                </p>
                <Link to="/student/submit" className="btn-primary">
                  Подать первую работу
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {works.map((work) => (
                  <motion.div
                    key={work.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">
                            {work.workType === 'essay' ? '📝' : '🎨'}
                          </span>
                          <div>
                            <h3 className="font-heading text-lg font-bold text-white mb-1">
                              {work.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-sm text-white/60">
                              <span>{nominationLabels[work.nomination]}</span>
                              <span>•</span>
                              <span>{workTypeLabels[work.workType]}</span>
                              <span>•</span>
                              <span>{work.fileName}</span>
                              <span>•</span>
                              <span>{formatFileSize(work.fileSize)}</span>
                            </div>
                            <p className="text-white/40 text-sm mt-1">
                              Подано: {new Date(work.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Status */}
                        <span className={statusLabels[work.status]?.class || 'badge-gold'}>
                          {statusLabels[work.status]?.label || work.status}
                        </span>

                        {/* Rating */}
                        {work.rating && (
                          <div className="text-center">
                            <div className="text-2xl font-heading font-bold text-accent-gold">
                              {work.rating.score}
                            </div>
                            <div className="text-xs text-white/40">баллов</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    {work.rating?.comment && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-white/60 text-sm">
                          <span className="text-white/40">Комментарий эксперта:</span>{' '}
                          {work.rating.comment}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
                      {/* Скачать — всегда доступно */}
                      <button
                        onClick={() => handleDownload(work.id)}
                        className="px-3 py-1.5 text-sm font-medium text-white/80 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        ⬇️ Скачать
                      </button>

                      {/* Только для moderation */}
                      {work.status === 'moderation' && (
                        <>
                          <button
                            onClick={() => openEditModal(work)}
                            className="px-3 py-1.5 text-sm font-medium text-white/80 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            ✏️ Редактировать
                          </button>
                          <button
                            onClick={() => openReplaceModal(work)}
                            className="px-3 py-1.5 text-sm font-medium text-white/80 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            🔄 Заменить файл
                          </button>
                          <button
                            onClick={() => handleDelete(work.id)}
                            className="px-3 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                          >
                            🗑️ Удалить
                          </button>
                        </>
                      )}

                      {/* Подсказка для работ не на модерации */}
                      {work.status !== 'moderation' && (
                        <span className="text-white/40 text-xs ml-2">
                          Редактирование недоступно — работа уже на проверке
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* ============================================
          Модалка: Редактирование названия
      ============================================ */}
      <AnimatePresence>
        {editingWork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingWork(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading text-xl font-bold text-white mb-4">
                Редактирование названия
              </h3>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Введите новое название"
                className="input-field w-full mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingWork(null)}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpdateTitle}
                  disabled={isSaving || !newTitle.trim()}
                  className="btn-primary"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================
          Модалка: Замена файла
      ============================================ */}
      <AnimatePresence>
        {replacingWork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setReplacingWork(null); setNewFile(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading text-xl font-bold text-white mb-2">
                Замена файла
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Текущий файл: <span className="text-white">{replacingWork.fileName}</span>
              </p>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-accent-gold bg-accent-gold/10'
                    : newFile
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <input {...getInputProps()} />
                {newFile ? (
                  <div>
                    <p className="text-green-400 font-medium">✓ {newFile.name}</p>
                    <p className="text-white/40 text-sm mt-1">
                      {formatFileSize(newFile.size)}
                    </p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-accent-gold">Отпустите файл здесь...</p>
                ) : (
                  <div>
                    <p className="text-white/60 mb-1">
                      Перетащите файл сюда или нажмите для выбора
                    </p>
                    <p className="text-white/40 text-sm">
                      PDF, DOC, DOCX, JPG, PNG, GIF (до 15 МБ)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setReplacingWork(null); setNewFile(null); }}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleReplaceFile}
                  disabled={isUploading || !newFile}
                  className="btn-primary"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner w-4 h-4" />
                      Загрузка...
                    </span>
                  ) : (
                    'Заменить файл'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
