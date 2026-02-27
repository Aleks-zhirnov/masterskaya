import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT
          id,
          clientname as "clientName",
          clientphone as "clientPhone",
          devicemodel as "deviceModel",
          issuedescription as "issueDescription",
          datereceived as "dateReceived",
          status,
          urgency,
          estimatedcost as "estimatedCost",
          statuschangedat as "statusChangedAt",
          isplanned as "isPlanned",
          isarchived as "isArchived",
          notes
        FROM devices
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { id, clientName, clientPhone, deviceModel, issueDescription, dateReceived, status, urgency, estimatedCost, notes, statusChangedAt, isPlanned, isArchived } = req.body;

      const safeUrgency = urgency || 'normal';

      await sql`
        INSERT INTO devices (id, clientName, clientPhone, deviceModel, issueDescription, dateReceived, status, urgency, estimatedCost, notes, statusChangedAt, isPlanned, isArchived)
        VALUES (${id}, ${clientName}, ${clientPhone || ''}, ${deviceModel}, ${issueDescription}, ${dateReceived}, ${status}, ${safeUrgency}, ${estimatedCost || null}, ${notes || ''}, ${statusChangedAt || null}, ${isPlanned || false}, ${isArchived || false})
        ON CONFLICT (id) DO UPDATE SET
          clientName = ${clientName},
          clientPhone = ${clientPhone || ''},
          deviceModel = ${deviceModel},
          issueDescription = ${issueDescription},
          dateReceived = ${dateReceived},
          status = ${status},
          urgency = ${safeUrgency},
          estimatedCost = ${estimatedCost || null},
          statusChangedAt = ${statusChangedAt || null},
          isPlanned = ${isPlanned || false},
          isArchived = ${isArchived || false},
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
