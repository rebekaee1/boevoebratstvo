import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

// Цвета для графиков
const COLORS = {
  gold: '#d4a017',
  red: '#c62828',
  blue: '#1e3a5f',
  green: '#2e7d32',
  orange: '#ff6b00',
  gray: '#6b7280',
};

interface Statistics {
  users: { students: number; experts: number };
  works: {
    total: number;
    unassigned: number;
    byStatus: Record<string, number>;
    byNomination: Record<string, number>;
    bySchool: Array<{ school: string; count: number }>;
  };
  ratings: { total: number; averageScore: number | null };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/statistics');
      setStats(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки статистики');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExport = async (type: 'works' | 'results') => {
    try {
      const response = await api.get(`/admin/export/${type}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Файл скачан!');
    } catch (error) {
      toast.error('Ошибка экспорта');
    }
  };

  const statusLabels: Record<string, string> = {
    moderation: 'На модерации',
    review: 'На проверке',
    rated: 'Оценено',
  };

  const nominationLabels: Record<string, string> = {
    vov: 'ВОВ',
    svo: 'СВО',
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
              <span className="badge-red">Администратор</span>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              Панель управления
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('works')}
                className="btn-secondary text-sm"
              >
                📊 Экспорт работ
              </button>
              <button
                onClick={() => handleExport('results')}
                className="btn-primary text-sm"
              >
                🏆 Экспорт результатов
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="card flex items-center justify-center py-12">
              <span className="spinner" />
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-4 text-center">
                  <div className="text-3xl font-heading font-bold text-accent-gold">
                    {stats.users.students}
                  </div>
                  <div className="text-white/60 text-sm">Участников</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-3xl font-heading font-bold text-white">
                    {stats.users.experts}
                  </div>
                  <div className="text-white/60 text-sm">Экспертов</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-3xl font-heading font-bold text-accent-gold">
                    {stats.works.total}
                  </div>
                  <div className="text-white/60 text-sm">Работ</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-3xl font-heading font-bold text-accent-green">
                    {stats.ratings.averageScore?.toFixed(1) || '-'}
                  </div>
                  <div className="text-white/60 text-sm">Средний балл</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Works by Nomination - Pie Chart */}
                <div className="card">
                  <h3 className="font-heading text-lg font-bold text-white mb-4">
                    Работы по номинациям
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(stats.works.byNomination).map(
                            ([nom, count]) => ({
                              name: nominationLabels[nom] || nom,
                              value: count,
                            })
                          )}
                          cx="50%"
                          cy="50%"
                          labelLine={{ stroke: '#e5e7eb' }}
                          label={({ name, percent }: { name: string; percent?: number }) =>
                            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill={COLORS.gold} />
                          <Cell fill={COLORS.red} />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a2a3a',
                            border: '1px solid #d4a017',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                          itemStyle={{ color: '#d4a017' }}
                          labelStyle={{ color: '#fff', fontWeight: 600 }}
                        />
                        <Legend
                          wrapperStyle={{ color: '#fff', paddingTop: '10px' }}
                          formatter={(value) => (
                            <span style={{ color: '#fff', fontWeight: 500 }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Works by Status - Bar Chart */}
                <div className="card">
                  <h3 className="font-heading text-lg font-bold text-white mb-4">
                    Работы по статусам
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(stats.works.byStatus).map(
                          ([status, count]) => ({
                            name: statusLabels[status] || status,
                            Количество: count,
                          })
                        )}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
                          axisLine={{ stroke: '#4b5563' }}
                          tickLine={{ stroke: '#4b5563' }}
                        />
                        <YAxis
                          tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
                          axisLine={{ stroke: '#4b5563' }}
                          tickLine={{ stroke: '#4b5563' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a2a3a',
                            border: '1px solid #d4a017',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                          itemStyle={{ color: '#d4a017' }}
                          labelStyle={{ color: '#fff', fontWeight: 600 }}
                        />
                        <Bar dataKey="Количество" radius={[4, 4, 0, 0]}>
                          {Object.keys(stats.works.byStatus).map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? COLORS.orange
                                  : index === 1
                                    ? COLORS.blue
                                    : COLORS.green
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Schools Chart */}
              {stats.works.bySchool && stats.works.bySchool.length > 0 && (
                <div className="card">
                  <h3 className="font-heading text-lg font-bold text-white mb-4">
                    Топ школ по количеству работ
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.works.bySchool}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis
                          type="number"
                          tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
                          axisLine={{ stroke: '#4b5563' }}
                          tickLine={{ stroke: '#4b5563' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="school"
                          tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
                          axisLine={{ stroke: '#4b5563' }}
                          tickLine={{ stroke: '#4b5563' }}
                          width={150}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a2a3a',
                            border: '1px solid #d4a017',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                          itemStyle={{ color: '#d4a017' }}
                          labelStyle={{ color: '#fff', fontWeight: 600 }}
                          formatter={(value: number) => [`${value} работ`, 'Количество'] as [string, string]}
                        />
                        <Bar dataKey="count" fill={COLORS.gold} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="card">
                <h3 className="font-heading text-lg font-bold text-white mb-4">
                  Быстрые действия
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link
                    to="/admin/users"
                    className="card p-4 text-center hover:border-accent-gold transition-colors"
                  >
                    <span className="text-2xl block mb-2">👥</span>
                    <span className="text-white text-sm">Пользователи</span>
                  </Link>
                  <Link
                    to="/admin/works"
                    className="card p-4 text-center hover:border-accent-gold transition-colors"
                  >
                    <span className="text-2xl block mb-2">📄</span>
                    <span className="text-white text-sm">Работы</span>
                  </Link>
                  <Link
                    to="/admin/experts"
                    className="card p-4 text-center hover:border-accent-gold transition-colors"
                  >
                    <span className="text-2xl block mb-2">👨‍🏫</span>
                    <span className="text-white text-sm">Создать эксперта</span>
                  </Link>
                  <Link
                    to="/admin/settings"
                    className="card p-4 text-center hover:border-accent-gold transition-colors"
                  >
                    <span className="text-2xl block mb-2">⚙️</span>
                    <span className="text-white text-sm">Настройки</span>
                  </Link>
                </div>
              </div>

              {/* Unassigned Alert */}
              {stats.works.unassigned > 0 && (
                <div className="card border-accent-red/50 bg-accent-red/10">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">⚠️</span>
                    <div>
                      <h4 className="font-heading text-lg font-bold text-white">
                        {stats.works.unassigned} работ без эксперта
                      </h4>
                      <p className="text-white/60 text-sm">
                        Назначьте экспертов для проверки работ
                      </p>
                    </div>
                    <Link to="/admin/works" className="btn-primary ml-auto">
                      Распределить
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-white/60">Не удалось загрузить статистику</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
