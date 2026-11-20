import { query, isPostgresConnected, inMemoryStore } from '../config/db.js';

// GET /api/alerts
export async function getAlerts(req, res) {
  try {
    const { status } = req.query;
    if (isPostgresConnected) {
      let q = 'SELECT * FROM alerts';
      const params = [];
      if (status) {
        q += ' WHERE status = $1';
        params.push(status.toUpperCase());
      }
      q += ' ORDER BY created_at DESC LIMIT 50';
      const result = await query(q, params);
      return res.json({ success: true, data: result.rows });
    }

    let alerts = [...inMemoryStore.alerts];
    if (status) {
      alerts = alerts.filter(a => a.status === status.toUpperCase());
    }
    return res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/alerts/:id/resolve
export async function resolveAlert(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isPostgresConnected) {
      const result = await query(
        "UPDATE alerts SET status = 'RESOLVED' WHERE id = $1 RETURNING *",
        [id]
      );
      return res.json({ success: true, data: result.rows[0] });
    }

    const alert = inMemoryStore.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'RESOLVED';
    }
    return res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
