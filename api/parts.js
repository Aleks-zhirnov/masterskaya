import { sql } from '@vercel/postgres';

// Простая валидация строки
const sanitize = (str, maxLen = 255) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
};

export default async function handler(req, res) {
  // Заголовки безопасности
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT 
          id, 
          name, 
          type, 
          subtype, 
          quantity, 
          instock as "inStock" 
        FROM parts
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || !body.id || !body.name) {
        return res.status(400).json({ error: 'Обязательные поля: id, name' });
      }

      const id = sanitize(body.id, 255);
      const name = sanitize(body.name, 255);
      const type = sanitize(body.type || '', 50);
      const subtype = sanitize(body.subtype || '', 255);
      const quantity = Math.max(0, parseInt(body.quantity) || 0);
      const inStock = !!body.inStock;

      await sql`
        INSERT INTO parts (id, name, type, subtype, quantity, inStock)
        VALUES (${id}, ${name}, ${type}, ${subtype}, ${quantity}, ${inStock})
        ON CONFLICT (id) DO UPDATE SET 
          name = ${name},
          type = ${type},
          subtype = ${subtype},
          quantity = ${quantity},
          inStock = ${inStock};
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const id = sanitize(req.query?.id || '', 255);
      if (!id) {
        return res.status(400).json({ error: 'Отсутствует ID' });
      }
      await sql`DELETE FROM parts WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}