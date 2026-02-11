import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Создаём первого администратора
  const adminEmail = 'admin@nasledniki-pobedy.ru';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Администратор Системы',
        role: Role.admin,
        school: 'Администрация',
        grade: '-',
        privacyAccepted: true,
      },
    });

    console.log('✅ Admin user created:', admin.email);
  } else {
    console.log('ℹ️ Admin user already exists:', adminEmail);
  }

  // Создаём настройки по умолчанию
  const deadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 дней
  const defaultSettings = [
    { key: 'submission_deadline', value: deadline.toISOString() },
    { key: 'rating_scale', value: { min: 1, max: 10 } },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ Default settings created');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('📧 Admin credentials:');
  console.log(`   Email: ${adminEmail}`);
  console.log('   Password: admin123');
  console.log('');
  console.log('⚠️  Please change the admin password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
