import { sql } from '@vercel/postgres';

// Простая валидация строки (обрезает и ограничивает длину)
const sanitize = (str, maxLen = 500) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
};

const sanitizeNum = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? null : Math.max(0, n);
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
          clientname as "clientName",
          clientphone as "clientPhone",
          devicemodel as "deviceModel",
          issuedescription as "issueDescription",
          datereceived as "dateReceived",
          status,
          urgency,
          estimatedcost as "estimatedCost",
          partscost as "partsCost",
          statuschangedat as "statusChangedAt",
          isplanned as "isPlanned",
          isarchived as "isArchived",
          iswarranty as "isWarranty",
          notes
        FROM devices
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || !body.id || !body.clientName || !body.deviceModel) {
        return res.status(400).json({ error: 'Обязательные поля: id, clientName, deviceModel' });
      }

      const id = sanitize(body.id, 255);
      const clientName = sanitize(body.clientName, 255);
      const clientPhone = sanitize(body.clientPhone || '', 50);
      const deviceModel = sanitize(body.deviceModel, 255);
      const issueDescription = sanitize(body.issueDescription || '', 2000);
      const dateReceived = sanitize(body.dateReceived || '', 255);
      const status = sanitize(body.status || '', 50);
      const safeUrgency = sanitize(body.urgency || 'normal', 50);
      const estimatedCost = sanitizeNum(body.estimatedCost);
      const partsCost = sanitizeNum(body.partsCost);
      const notes = sanitize(body.notes || '', 2000);
      const statusChangedAt = sanitize(body.statusChangedAt || '', 255);
      const isPlanned = !!body.isPlanned;
      const isArchived = !!body.isArchived;
      const isWarranty = !!body.isWarranty;

      await sql`
        INSERT INTO devices (id, clientName, clientPhone, deviceModel, issueDescription, dateReceived, status, urgency, estimatedCost, partsCost, notes, statusChangedAt, isPlanned, isArchived, isWarranty)
        VALUES (${id}, ${clientName}, ${clientPhone}, ${deviceModel}, ${issueDescription}, ${dateReceived}, ${status}, ${safeUrgency}, ${estimatedCost}, ${partsCost}, ${notes}, ${statusChangedAt || null}, ${isPlanned}, ${isArchived}, ${isWarranty})
        ON CONFLICT (id) DO UPDATE SET
          clientName = ${clientName},
          clientPhone = ${clientPhone},
          deviceModel = ${deviceModel},
          issueDescription = ${issueDescription},
          dateReceived = ${dateReceived},
          status = ${status},
          urgency = ${safeUrgency},
          estimatedCost = ${estimatedCost},
          partsCost = ${partsCost},
          statusChangedAt = ${statusChangedAt || null},
          isPlanned = ${isPlanned},
          isArchived = ${isArchived},
          isWarranty = ${isWarranty},
          notes = ${notes};
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const id = sanitize(req.query?.id || '', 255);
      if (!id) {
        return res.status(400).json({ error: 'Отсутствует ID' });
      }
      await sql`DELETE FROM devices WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Database Error:", error);
    // Не отдаём внутренние ошибки клиенту
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
