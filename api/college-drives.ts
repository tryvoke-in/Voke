// Vercel Serverless Function to persist and synchronize college drives across all devices
let cachedDrives: any[] = [];

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const drives = req.body;
    if (Array.isArray(drives)) {
      const map = new Map<string, any>();
      // Preserve existing
      cachedDrives.forEach((d: any) => {
        if (d && d.id) map.set(d.id, d);
      });
      // Merge new
      drives.forEach((d: any) => {
        if (d && d.id) map.set(d.id, d);
      });
      cachedDrives = Array.from(map.values());
    }
    return res.status(200).json({ success: true, count: cachedDrives.length, drives: cachedDrives });
  }

  if (req.method === 'GET') {
    return res.status(200).json(cachedDrives);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
