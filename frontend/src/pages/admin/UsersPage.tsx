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

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'expert' | 'admin';
  school: string | null;
  grade: string | null;
  isBlocked: boolean;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function UsersPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { isAdmin } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'student' | 'expert' | 'admin'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [filter, isAdmin]);
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (filter !== 'all') params.role = filter;
      if (search) params.search = search;
      
      const response = await api.get<UsersResponse>('/users', { params });
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = async (userId: string, block: boolean) => {
    try {
      await api.post(`/users/${userId}/${block ? 'block' : 'unblock'}`);
      toast.success(block ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      loadUsers();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Сбросить пароль пользователя?')) return;
    try {
      const response = await api.post(`/users/${userId}/reset-password`);
      toast.success(`Новый пароль: ${response.data.newPassword}`);
    } catch (error) {
      toast.error('Ошибка сброса пароля');
    }
  };

  const roleLabels: Record<string, string> = {
    student: 'Участник',
    expert: 'Эксперт',
    admin: 'Админ',
  };

  const roleColors: Record<string, string> = {
    student: 'badge-gold',
    expert: 'badge-green',
    admin: 'badge-red',
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
          <h1 className="font-heading text-2xl font-bold text-white">Пользователи</h1>
        </div>

        {/* Фильтры */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {(['all', 'student', 'expert', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFilter(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === role
                      ? 'bg-accent-gold text-primary-dark'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {role === 'all' ? 'Все' : roleLabels[role]}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              className="input-field flex-1 min-w-[200px]"
            />
            <button onClick={loadUsers} className="btn-primary">
              Найти
            </button>
          </div>
        </div>

        {/* Таблица */}
        <div className="card overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-white/60 py-12">Пользователи не найдены</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Имя</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Роль</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Школа/Класс</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Статус</th>
                  <th className="text-right py-3 px-4 text-white/60 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white">{u.fullName}</td>
                    <td className="py-3 px-4 text-white/80">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={roleColors[u.role]}>{roleLabels[u.role]}</span>
                    </td>
                    <td className="py-3 px-4 text-white/60">
                      {u.school ? `${u.school}, ${u.grade} класс` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {u.isBlocked ? (
                        <span className="badge-red">Заблокирован</span>
                      ) : (
                        <span className="badge-green">Активен</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {u.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleBlock(u.id, !u.isBlocked)}
                              className={`text-sm px-3 py-1 rounded ${
                                u.isBlocked
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              }`}
                            >
                              {u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                            </button>
                            <button
                              onClick={() => handleResetPassword(u.id)}
                              className="text-sm px-3 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20"
                            >
                              Сбросить пароль
                            </button>
                          </>
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
