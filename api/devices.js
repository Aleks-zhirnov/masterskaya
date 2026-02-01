import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT 
          id, 
          clientname as "clientName", 
          devicemodel as "deviceModel", 
          issuedescription as "issueDescription", 
          datereceived as "dateReceived", 
          status,
          urgency,
          statuschangedat as "statusChangedAt",
          isplanned as "isPlanned",
          notes 
        FROM devices
      `;
      return res.status(200).json(rows);
    } 
    
    if (req.method === 'POST') {
      const { id, clientName, deviceModel, issueDescription, dateReceived, status, urgency, notes, statusChangedAt, isPlanned } = req.body;
      
      const safeUrgency = urgency || 'normal';
      // Convert boolean to string for Postgres if needed or rely on driver, usually bool is fine.
      
      await sql`
        INSERT INTO devices (id, clientName, deviceModel, issueDescription, dateReceived, status, urgency, notes, statusChangedAt, isPlanned)
        VALUES (${id}, ${clientName}, ${deviceModel}, ${issueDescription}, ${dateReceived}, ${status}, ${safeUrgency}, ${notes || ''}, ${statusChangedAt || null}, ${isPlanned || false})
        ON CONFLICT (id) DO UPDATE SET 
          clientName = ${clientName},
          deviceModel = ${deviceModel},
          issueDescription = ${issueDescription},
          dateReceived = ${dateReceived},
          status = ${status}, 
          urgency = ${safeUrgency},
          statusChangedAt = ${statusChangedAt || null},
          isPlanned = ${isPlanned || false},
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