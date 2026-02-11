import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-patriot">
      {/* Header */}
      <header className="py-6 border-b border-white/10">
        <div className="container mx-auto px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/sevastopol.svg" alt="Севастополь" className="h-10" />
            <img src="/bb.png" alt="Боевое Братство" className="h-10" />
            <span className="font-heading text-xl text-white font-bold ml-2">
              Наследники Победы
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-8">
              Политика конфиденциальности
            </h1>

            <div className="card prose prose-invert max-w-none">
              <div className="text-white/80 space-y-6">
                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    1. Общие положения
                  </h2>
                  <p>
                    Настоящая Политика конфиденциальности определяет порядок обработки и защиты
                    персональных данных участников регионального конкурса творческих работ
                    «Наследники Победы» (далее — Конкурс).
                  </p>
                  <p>
                    Регистрируясь на сайте и подавая работу на Конкурс, Вы даёте согласие на
                    обработку персональных данных в соответствии с Федеральным законом № 152-ФЗ
                    «О персональных данных».
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    2. Собираемые данные
                  </h2>
                  <p>Для участия в Конкурсе мы собираем следующие персональные данные:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Фамилия, имя, отчество участника</li>
                    <li>Адрес электронной почты</li>
                    <li>Номер телефона (при наличии)</li>
                    <li>Наименование образовательного учреждения</li>
                    <li>Класс обучения</li>
                    <li>Творческие работы, загруженные на Конкурс</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    3. Цели обработки данных
                  </h2>
                  <p>Персональные данные обрабатываются для:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Регистрации и идентификации участников</li>
                    <li>Приёма и оценки конкурсных работ</li>
                    <li>Связи с участниками по вопросам Конкурса</li>
                    <li>Публикации результатов (ФИО, школа, место)</li>
                    <li>Награждения победителей</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    4. Хранение и защита данных
                  </h2>
                  <p>
                    Персональные данные хранятся на защищённых серверах и не передаются третьим
                    лицам, за исключением случаев, предусмотренных законодательством Российской
                    Федерации.
                  </p>
                  <p>
                    Мы применяем организационные и технические меры для защиты данных от
                    несанкционированного доступа, изменения, раскрытия или уничтожения.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    5. Срок хранения
                  </h2>
                  <p>
                    Персональные данные хранятся в течение срока проведения Конкурса и 3 (трёх)
                    лет после его завершения, либо до момента отзыва согласия участником.
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    6. Права участника
                  </h2>
                  <p>Вы имеете право:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Получать информацию об обработке своих персональных данных</li>
                    <li>Требовать уточнения, блокирования или уничтожения данных</li>
                    <li>Отозвать согласие на обработку персональных данных</li>
                    <li>Обжаловать действия оператора в уполномоченный орган</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    7. Контактная информация
                  </h2>
                  <p>
                    По вопросам обработки персональных данных обращайтесь по электронной почте:
                    <a href="mailto:info@nasledniki-pobedy.ru" className="text-accent-gold hover:underline ml-1">
                      info@nasledniki-pobedy.ru
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="font-heading text-xl font-bold text-white mb-4">
                    8. Изменения политики
                  </h2>
                  <p>
                    Организатор Конкурса оставляет за собой право вносить изменения в настоящую
                    Политику. Актуальная версия всегда доступна на данной странице.
                  </p>
                </section>

                <div className="pt-6 border-t border-white/10 text-white/50 text-sm">
                  <p>Дата последнего обновления: {new Date().toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link to="/" className="btn-secondary">
                ← На главную
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
