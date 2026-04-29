import express from 'express';
import { join } from 'node:path';
import youtubedl from 'youtube-dl-exec';
import cors from 'cors';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json());

// Setăm un folder temporar pe NUC (un container Docker mapat) pentru preluarea formatelor
const tempDir = join(process.cwd(), 'temp_downloads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Curățare fișiere orfane o dată la 10 minute (ex: dacă procesul se întrerupe sau utilizatorul închide tab-ul)
setInterval(() => {
    fs.readdir(tempDir, (err, files) => {
        if (err) return;
        const now = Date.now();
        files.forEach(f => {
            const filePath = join(tempDir, f);
            fs.stat(filePath, (e, stats) => {
                if (!e && (now - stats.mtimeMs > 3600000)) { // 1 oră
                    fs.unlink(filePath, () => {});
                }
            });
        });
    });
}, 600000);

app.get('/api/info', async (req, res) => {
  const url = req.query['url'] as string;
  if (!url) {
    res.status(400).json({ error: 'Invalid or missing YouTube URL' });
    return;
  }
  
  try {
    const info: any = await youtubedl(url, { dumpJson: true, noWarnings: true });
    
    // Obținem DOAR înălțimile video disponibile pentru selecție clară (ex: 1080, 2160)
    const heights = new Set<number>();
    info.formats?.forEach((f: any) => {
        if (f.height && f.height >= 144) heights.add(f.height);
    });
    // Sortate descrescător
    const resolutions = Array.from(heights).sort((a, b) => b - a);

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      resolutions: resolutions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta nouă care descarcă separat audio și video pe server, le lipește (mux), și creează MP4-ul final
app.get('/api/prepare', async (req, res) => {
  req.setTimeout(0); // Fără timeout pentru operațiuni care pot dura
  const url = req.query['url'] as string;
  const height = req.query['height'] as string || '1080';
  
  if (!url) {
    res.status(400).send({ error: 'Invalid or missing YouTube URL' });
    return;
  }

  try {
    const info: any = await youtubedl(url, { dumpJson: true, noWarnings: true });
    const title = (info.title || 'video').replace(/[^\w\s-]/gi, '_');
    const filename = `${title}_${height}p.mp4`;

    const fileId = randomUUID();
    const filePath = join(tempDir, `${fileId}.mp4`);

    // Instrucțiunea exactă care găsește cel mai bun video de o rezoluție + cel mai bun audio, și le dă mux cu ffmpeg în mp4 direct
    await youtubedl(url, {
        format: `bestvideo[ext=mp4][height<=${height}]+bestaudio[ext=m4a]/best[ext=mp4]/best`,
        mergeOutputFormat: 'mp4',
        output: filePath,
        noWarnings: true
    });

    res.json({ id: fileId, filename });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Procesarea/muxarea pe server a eșuat.' });
  }
});

// Ruta de transmitere a fișierului rezultat
app.get('/api/file', (req, res) => {
    const id = req.query['id'] as string;
    let filename = req.query['filename'] as string || 'video.mp4';
    if (!id) return res.status(400).send('Missing file id');

    // Asigurăm că extensia e bună
    if (!filename.endsWith('.mp4')) filename += '.mp4';

    const filePath = join(tempDir, `${id}.mp4`);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Fișierul nu există sau descărcarea a expirat.');
    }

    res.download(filePath, filename, (err) => {
        // Ștergem fișierul temporar de pe SSD după ce utilizatorul l-a transferat complet (sau dacă se anulează transferul)
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
        }
    });
});

/**
 * Serve static files from /public for the classic HTML structure
 */
const publicFolder = join(process.cwd(), 'public');
app.use(express.static(publicFolder));

/**
 * Start the server
 */
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Node Express server listening on http://0.0.0.0:${port}`);
});
