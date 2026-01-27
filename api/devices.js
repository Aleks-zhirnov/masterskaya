import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM devices`;
      return res.status(200).json(rows);
    } 
    
    if (req.method === 'POST') {
      const { id, clientName, deviceModel, issueDescription, dateReceived, status, notes } = req.body;
      await sql`
        INSERT INTO devices (id, clientName, deviceModel, issueDescription, dateReceived, status, notes)
        VALUES (${id}, ${clientName}, ${deviceModel}, ${issueDescription}, ${dateReceived}, ${status}, ${notes || ''})
        ON CONFLICT (id) DO UPDATE SET 
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
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}