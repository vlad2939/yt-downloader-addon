import express from 'express';
import { join } from 'node:path';
import youtubedl from 'youtube-dl-exec';
import cors from 'cors';
import https from 'https';

const app = express();
app.use(cors());

// Add JSON parsing middleware
app.use(express.json());

app.get('/api/info', async (req, res) => {
  const url = req.query['url'] as string;
  if (!url) {
    res.status(400).json({ error: 'Invalid or missing YouTube URL' });
    return;
  }
  
  try {
    const info: any = await youtubedl(url, { dumpJson: true, noWarnings: true });
    
    // YouTube formats
    const formats = info.formats
      .filter((f: any) => f.vcodec !== 'none' || f.acodec !== 'none') // Filter out weird formats
      .map((f: any) => ({
        itag: f.format_id,
        qualityLabel: f.format_note || f.resolution || (f.acodec !== 'none' ? 'Audio' : 'Unknown'),
        container: f.ext,
        hasAudio: f.acodec !== 'none',
        hasVideo: f.vcodec !== 'none',
        url: f.url
      }));

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      formats: formats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/download', async (req, res) => {
  const url = req.query['url'] as string;
  const itag = req.query['itag'] as string;
  
  if (!url) {
    res.status(400).send('Invalid or missing YouTube URL');
    return;
  }
  
  try {
    const info: any = await youtubedl(url, { dumpJson: true, noWarnings: true });
    const format = info.formats?.find((f: any) => f.format_id === itag);
    
    if (!format || !format.url) {
      res.status(404).send('Format not found or missing URL');
      return;
    }

    const title = info.title.replace(/[^\w\s-]/gi, '') || 'video';
    
    res.header('Content-Disposition', `attachment; filename="${title}.${format.ext}"`);
    
    if (format.filesize) {
      res.header('Content-Length', format.filesize.toString());
    }
    
    const options = {
      headers: format.http_headers || {}
    };

    https.get(format.url, options, (stream) => {
      // Pipe the video stream into the response
      stream.pipe(res);
    }).on('error', (err) => {
      console.error(err);
      if (!res.headersSent) res.status(500).send('Download stream failed');
    });
    
  } catch (error: any) {
    res.status(500).send(error.message);
  }
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
