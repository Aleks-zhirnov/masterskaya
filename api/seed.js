import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    // Создаем таблицу устройств
    await sql`
      CREATE TABLE IF NOT EXISTS devices (
        id varchar(255) PRIMARY KEY,
        clientName varchar(255),
        deviceModel varchar(255),
        issueDescription text,
        dateReceived varchar(255),
        status varchar(50),
        notes text
      );
    `;

    // Создаем таблицу запчастей
    await sql`
      CREATE TABLE IF NOT EXISTS parts (
        id varchar(255) PRIMARY KEY,
        name varchar(255),
        type varchar(50),
        quantity int,
        inStock boolean
      );
    `;

    // Миграции (безопасное добавление колонок)
    try {
        await sql`ALTER TABLE parts ADD COLUMN IF NOT EXISTS subtype varchar(255)`;
    } catch (e) {
        console.log("Column 'subtype' migration note:", e.message);
    }

    try {
        await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS urgency varchar(50) DEFAULT 'normal'`;
    } catch (e) {
        console.log("Column 'urgency' migration note:", e.message);
    }

    return response.status(200).json({ message: 'Database tables created/updated successfully' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}