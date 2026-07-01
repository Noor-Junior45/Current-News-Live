import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send('google.com, pub-5865716270182311, DIRECT, f08c47fec0942fa0');
}
