// api/upload.js
import Busboy from 'busboy';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send("Method not allowed");

  const busboy = Busboy({ headers: req.headers });
  let fileBuffer = null;
  let fileName = '';

  busboy.on('file', (_, file, filename) => {
    fileName = filename;
    const chunks = [];
    file.on('data', (data) => chunks.push(data));
    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  busboy.on('finish', async () => {
    if (!fileBuffer || !fileName) {
      return res.status(400).json({ error: "Không nhận được file" });
    }

    try {
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', fileBuffer, fileName);

      const catbox = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });

      const result = await catbox.text();

      if (result.startsWith("https://")) {
        return res.status(200).json({ url: result });
      } else {
        return res.status(500).json({ error: "Catbox trả về lỗi: " + result });
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  req.pipe(busboy);
}
