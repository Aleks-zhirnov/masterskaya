import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Исправляем instock -> inStock для корректной работы фильтров на фронтенде
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
      const { id, name, type, subtype, quantity, inStock } = req.body;
      
      await sql`
        INSERT INTO parts (id, name, type, subtype, quantity, inStock)
        VALUES (${id}, ${name}, ${type}, ${subtype || ''}, ${quantity}, ${inStock})
        ON CONFLICT (id) DO UPDATE SET 
          name = ${name},
          type = ${type},
          subtype = ${subtype || ''},
          quantity = ${quantity},
          inStock = ${inStock};
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM parts WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: error.message });
  }
}