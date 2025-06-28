export const config = {
  api: {
    bodyParser: false,
  },
};

import Busboy from 'busboy';
import FormData from 'form-data';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ hỗ trợ POST' });
  }

  const busboy = Busboy({ headers: req.headers });
  let fileBuffer = null;
  let fileName = '';

  busboy.on('file', (fieldname, file, filename) => {
    fileName = filename;
    const chunks = [];
    file.on('data', (data) => chunks.push(data));
    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  busboy.on('finish', async () => {
    try {
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', fileBuffer, { filename: fileName });

      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });

      const text = await response.text();
      res.status(200).json({ url: text });
    } catch (e) {
      res.status(500).json({ error: 'Lỗi upload: ' + e.message });
    }
  });

  req.pipe(busboy);
}
