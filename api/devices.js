import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Postgres возвращает имена колонок в нижнем регистре. 
      // Мы используем AS "camelCase", чтобы React получил правильные ключи.
      const { rows } = await sql`
        SELECT 
          id, 
          clientname as "clientName", 
          devicemodel as "deviceModel", 
          issuedescription as "issueDescription", 
          datereceived as "dateReceived", 
          status, 
          notes 
        FROM devices
      `;
      return res.status(200).json(rows);
    } 
    
    if (req.method === 'POST') {
      const { id, clientName, deviceModel, issueDescription, dateReceived, status, notes } = req.body;
      
      // Обновляем ON CONFLICT, чтобы обновлялись все поля (если вы исправили опечатку в имени клиента, это сохранится)
      await sql`
        INSERT INTO devices (id, clientName, deviceModel, issueDescription, dateReceived, status, notes)
        VALUES (${id}, ${clientName}, ${deviceModel}, ${issueDescription}, ${dateReceived}, ${status}, ${notes || ''})
        ON CONFLICT (id) DO UPDATE SET 
          clientName = ${clientName},
          deviceModel = ${deviceModel},
          issueDescription = ${issueDescription},
          dateReceived = ${dateReceived},
          status = ${status}, 
          notes = ${notes || ''};
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM devices WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: error.message });
  }
}