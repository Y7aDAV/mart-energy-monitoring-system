import { query, isPostgresConnected, inMemoryStore } from '../config/db.js';

// GET /api/devices
export async function getDevices(req, res) {
  try {
    if (isPostgresConnected) {
      const result = await query('SELECT * FROM devices ORDER BY id ASC');
      return res.json({ success: true, source: 'postgresql', data: result.rows });
    }
    return res.json({ success: true, source: 'in_memory', data: inMemoryStore.devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/devices
export async function createDevice(req, res) {
  try {
    const { name, device_type, location, rated_power_w } = req.body;
    if (!name || !device_type) {
      return res.status(400).json({ success: false, message: 'Name and device_type are required' });
    }

    if (isPostgresConnected) {
      const result = await query(
        `INSERT INTO devices (name, device_type, location, rated_power_w) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, device_type, location || 'Main Floor', rated_power_w || 1000]
      );
      return res.status(201).json({ success: true, data: result.rows[0] });
    }

    const newDevice = {
      id: inMemoryStore.devices.length + 1,
      name,
      device_type,
      location: location || 'Main Floor',
      status: 'ONLINE',
      rated_power_w: Number(rated_power_w) || 1000,
      created_at: new Date()
    };
    inMemoryStore.devices.push(newDevice);
    return res.status(201).json({ success: true, data: newDevice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// DELETE /api/devices/:id
export async function deleteDevice(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isPostgresConnected) {
      await query('DELETE FROM devices WHERE id = $1', [id]);
      return res.json({ success: true, message: `Device ${id} deleted` });
    }
    const idx = inMemoryStore.devices.findIndex(d => d.id === id);
    if (idx !== -1) {
      inMemoryStore.devices.splice(idx, 1);
    }
    return res.json({ success: true, message: `Device ${id} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
