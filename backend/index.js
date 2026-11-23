import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

await connectDB();

try {
  const User = (await import('./models/User.js')).default;
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('[Init] Database is empty. Auto-seeding initial demo data and accounts...');
    const { seedDatabase } = await import('./scripts/seed.js');
    await seedDatabase({ keepOpen: true });
  }
} catch (err) {
  console.warn('[Init Warning] Could not auto-seed database:', err.message);
}

app.listen(PORT, () => {
  console.log(`[Server] Smart University Appointment API running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Timezone configured: ${process.env.TIMEZONE || 'Asia/Colombo'}`);
});