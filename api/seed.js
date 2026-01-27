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

    // Миграция: Добавляем колонку subtype, если её нет (безопасный ALTER)
    // Vercel Postgres/Neon поддерживает IF NOT EXISTS для колонок в новых версиях, 
    // но стандартный SQL - нет. Используем блок catch для игнорирования ошибки "duplicate column" или простой ALTER
    try {
        await sql`ALTER TABLE parts ADD COLUMN IF NOT EXISTS subtype varchar(255)`;
    } catch (e) {
        // Колонка скорее всего уже есть или БД не поддерживает IF NOT EXISTS в ALTER
        console.log("Column migration note:", e.message);
    }

    return response.status(200).json({ message: 'Database tables created/updated successfully' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}