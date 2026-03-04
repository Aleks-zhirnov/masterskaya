import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    // Проверяем авторизацию для безопасности (в идеале нужно проверять секретный ключ крона)
    // Vercel Cron передает специальный заголовок, но для простоты оставим как есть или
    // проверим Authorization header, если он передан.
    try {
        const authHeader = request.headers.authorization;
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return response.status(401).json({ error: 'Unauthorized' });
        }

        // Вычисляем дату месяц назад
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const dateLimit = lastMonth.toISOString();

        console.log(`Starting cleanup of archived devices older than ${dateLimit}`);

        // Удаляем из базы все устройства, которые в архиве (isArchived = true) 
        // и были заархивированы (archivedAt) больше 30 дней назад
        const result = await sql`
      DELETE FROM devices 
      WHERE isArchived = true 
      AND (
        (archivedAt IS NOT NULL AND archivedAt < ${dateLimit})
        OR (archivedAt IS NULL AND statusChangedAt IS NOT NULL AND statusChangedAt < ${dateLimit})
      )
    `;

        return response.status(200).json({
            success: true,
            message: `Успешно очищено. Затронуто строк: ${result.rowCount}`
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        return response.status(500).json({ error: error.message });
    }
}
