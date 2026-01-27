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

    return response.status(200).json({ message: 'Database tables created successfully' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}