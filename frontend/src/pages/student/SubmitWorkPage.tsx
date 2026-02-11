import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../../api/client';

const submitSchema = z.object({
  title: z.string().min(1, 'Введите название работы').max(300),
  nomination: z.enum(['vov', 'svo'], { message: 'Выберите номинацию' }),
  workType: z.enum(['essay', 'drawing'], { message: 'Выберите тип работы' }),
});

type SubmitForm = z.infer<typeof submitSchema>;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

export default function SubmitWorkPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitForm>({
    resolver: zodResolver(submitSchema),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        toast.error('Неподдерживаемый формат файла');
        return;
      }
      if (selectedFile.size > MAX_SIZE) {
        toast.error('Файл слишком большой (максимум 15 МБ)');
        return;
      }
      setFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
  });

  const onSubmit = async (data: SubmitForm) => {
    if (!file) {
      toast.error('Прикрепите файл работы');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('nomination', data.nomination);
      formData.append('workType', data.workType);
      formData.append('file', file);

      await api.post('/works', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Работа успешно подана!');
      navigate('/student');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка подачи работы';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      {/* Header */}
      <header className="bg-primary/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/student" className="text-white/60 hover:text-white transition-colors">
              ← Назад
            </Link>
            <span className="font-heading text-lg text-white font-bold">
              Подача работы
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="card p-8">
            <h1 className="font-heading text-2xl font-bold text-white mb-6">
              Подать работу на конкурс
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Название работы *
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="input-field"
                  placeholder="Например: Письмо прадедушке"
                />
                {errors.title && (
                  <p className="input-error">{errors.title.message}</p>
                )}
              </div>

              {/* Nomination */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Номинация *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('nomination')}
                      value="vov"
                      className="peer hidden"
                    />
                    <div className="card p-4 text-center peer-checked:border-accent-gold peer-checked:bg-accent-gold/10 transition-colors">
                      <span className="text-2xl block mb-2">🎖️</span>
                      <span className="text-white text-sm">ВОВ</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('nomination')}
                      value="svo"
                      className="peer hidden"
                    />
                    <div className="card p-4 text-center peer-checked:border-accent-gold peer-checked:bg-accent-gold/10 transition-colors">
                      <span className="text-2xl block mb-2">⭐</span>
                      <span className="text-white text-sm">СВО</span>
                    </div>
                  </label>
                </div>
                {errors.nomination && (
                  <p className="input-error">{errors.nomination.message}</p>
                )}
              </div>

              {/* Work Type */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Тип работы *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('workType')}
                      value="essay"
                      className="peer hidden"
                    />
                    <div className="card p-4 text-center peer-checked:border-accent-gold peer-checked:bg-accent-gold/10 transition-colors">
                      <span className="text-2xl block mb-2">📝</span>
                      <span className="text-white text-sm">Сочинение</span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('workType')}
                      value="drawing"
                      className="peer hidden"
                    />
                    <div className="card p-4 text-center peer-checked:border-accent-gold peer-checked:bg-accent-gold/10 transition-colors">
                      <span className="text-2xl block mb-2">🎨</span>
                      <span className="text-white text-sm">Рисунок</span>
                    </div>
                  </label>
                </div>
                {errors.workType && (
                  <p className="input-error">{errors.workType.message}</p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Файл работы *
                </label>
                <div
                  {...getRootProps()}
                  className={`card p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-accent-gold bg-accent-gold/10'
                      : 'hover:border-white/30'
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div>
                      <span className="text-3xl block mb-2">📄</span>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-white/40 text-sm">
                        {formatFileSize(file.size)}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-accent-red text-sm mt-2 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl block mb-2">📤</span>
                      <p className="text-white/60">
                        Перетащите файл или нажмите для выбора
                      </p>
                      <p className="text-white/40 text-sm mt-2">
                        PDF, DOC, DOCX, JPEG, PNG, GIF (до 15 МБ)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? <span className="spinner" /> : 'Подать работу'}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
