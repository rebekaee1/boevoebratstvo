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

interface Work {
  id: string;
  title: string;
  nomination: 'vov' | 'svo';
  workType: 'essay' | 'drawing';
  status: 'moderation' | 'review' | 'rated';
  student: { id: string; fullName: string; school: string; grade: string };
  expert: { id: string; fullName: string } | null;
  rating: { score: number } | null;
  createdAt: string;
}

interface Expert {
  id: string;
  fullName: string;
  email: string;
}

interface WorksResponse {
  data: Work[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function WorksPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { isAdmin } = useAdminAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'review' | 'rated'>('all');
  const [selectedExpert, setSelectedExpert] = useState<string>('');
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [filter, isAdmin]);
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string | boolean> = {};
      if (filter === 'unassigned') params.hasExpert = false;
      if (filter === 'review') params.status = 'review';
      if (filter === 'rated') params.status = 'rated';

      const [worksRes, expertsRes] = await Promise.all([
        api.get<WorksResponse>('/works', { params }),
        api.get<Expert[]>('/users/experts'),
      ]);
      setWorks(worksRes.data.data);
      setExperts(expertsRes.data);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedExpert || selectedWorks.size === 0) {
      toast.error('Выберите эксперта и работы');
      return;
    }
    try {
      await api.post('/admin/assign', {
        expertId: selectedExpert,
        workIds: Array.from(selectedWorks),
      });
      toast.success('Работы назначены эксперту');
      setSelectedWorks(new Set());
      loadData();
    } catch (error) {
      toast.error('Ошибка назначения');
    }
  };

  const handleUnassign = async (workId: string) => {
    try {
      await api.post(`/admin/unassign/${workId}`);
      toast.success('Эксперт снят с работы');
      loadData();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleAutoDistribute = async () => {
    if (!confirm('Автоматически распределить все работы без эксперта между доступными экспертами?')) {
      return;
    }
    try {
      const response = await api.post('/admin/distribute');
      const { totalDistributed, expertsCount } = response.data;
      toast.success(`Распределено ${totalDistributed} работ между ${expertsCount} экспертами`);
      loadData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка автораспределения';
      toast.error(message);
    }
  };

  const handleDownload = async (workId: string) => {
    try {
      const response = await api.get(`/works/${workId}/download`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      toast.error('Ошибка скачивания файла');
    }
  };

  const toggleWork = (workId: string) => {
    const newSet = new Set(selectedWorks);
    if (newSet.has(workId)) {
      newSet.delete(workId);
    } else {
      newSet.add(workId);
    }
    setSelectedWorks(newSet);
  };

  const nominationLabels: Record<string, string> = { vov: 'ВОВ', svo: 'СВО' };
  const workTypeLabels: Record<string, string> = { essay: 'Сочинение', drawing: 'Рисунок' };
  const statusLabels: Record<string, string> = { moderation: 'На модерации', review: 'На проверке', rated: 'Оценено' };
  const statusColors: Record<string, string> = { moderation: 'badge-gold', review: 'badge-red', rated: 'badge-green' };

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
          <h1 className="font-heading text-2xl font-bold text-white">Работы</h1>
        </div>

        {/* Панель назначения */}
        <div className="card mb-6">
          <h3 className="font-heading text-lg font-bold text-white mb-4">Назначение экспертов</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={selectedExpert}
              onChange={(e) => setSelectedExpert(e.target.value)}
              className="input-field w-64"
            >
              <option value="">Выберите эксперта</option>
              {experts.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedExpert || selectedWorks.size === 0}
              className="btn-primary"
            >
              Назначить ({selectedWorks.size})
            </button>
            <div className="border-l border-white/20 h-8 mx-2" />
            <button
              onClick={handleAutoDistribute}
              className="btn-secondary flex items-center gap-2"
              title="Автоматически распределить все работы без эксперта"
            >
              🔀 Автораспределение
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { key: 'all', label: 'Все работы' },
            { key: 'unassigned', label: 'Без эксперта' },
            { key: 'review', label: 'На проверке' },
            { key: 'rated', label: 'Оценено' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-accent-gold text-primary-dark'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Таблица */}
        <div className="card overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : works.length === 0 ? (
            <p className="text-center text-white/60 py-12">Работы не найдены</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWorks(new Set(works.filter(w => !w.expert).map(w => w.id)));
                        } else {
                          setSelectedWorks(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Название</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Участник</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Номинация</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Тип</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Статус</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Эксперт</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Оценка</th>
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {works.map((w) => (
                  <tr key={w.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">
                      {!w.expert && (
                        <input
                          type="checkbox"
                          checked={selectedWorks.has(w.id)}
                          onChange={() => toggleWork(w.id)}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4 text-white max-w-[200px] truncate">{w.title}</td>
                    <td className="py-3 px-4 text-white/80">
                      <div>{w.student.fullName}</div>
                      <div className="text-xs text-white/50">{w.student.school}, {w.student.grade} кл.</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={w.nomination === 'vov' ? 'badge-red' : 'badge-gold'}>
                        {nominationLabels[w.nomination]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60">{workTypeLabels[w.workType]}</td>
                    <td className="py-3 px-4">
                      <span className={statusColors[w.status]}>{statusLabels[w.status]}</span>
                    </td>
                    <td className="py-3 px-4 text-white/60">
                      {w.expert?.fullName || '—'}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {w.rating ? (
                        <span className="text-accent-gold font-bold">{w.rating.score}</span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDownload(w.id)}
                          className="text-sm px-3 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20"
                        >
                          ⬇️
                        </button>
                        {w.expert && w.status !== 'rated' && (
                          <button
                            onClick={() => handleUnassign(w.id)}
                            className="text-sm px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            Снять эксперта
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
