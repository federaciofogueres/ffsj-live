import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import JSZip from 'jszip';
import sharp from 'sharp';
import bootstrap from './src/main.server';

type ImageExportItem = {
  id?: string;
  nombre?: string;
  tipo?: string;
  orden?: string | number;
  bellezaUrl?: string;
  calleUrl?: string;
};

type ImageExportJob = {
  item: ImageExportItem;
  imageUrl?: string;
  variant: 'belleza' | 'calle';
  tipo: string;
  orden: string;
};

const IMAGE_EXPORT_CHUNK_SIZE = 4;

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  server.use(express.json({ limit: '2mb' }));

  server.post('/api/admin/candidatas-images.zip', async (req, res, next) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items as ImageExportItem[] : [];
      if (!items.length) {
        res.status(400).json({ error: 'No hay candidatas para exportar.' });
        return;
      }

      const zip = new JSZip();
      const errors: string[] = [];
      const jobs: ImageExportJob[] = [];

      for (const item of items) {
        const tipo = safePathSegment(item.tipo || 'sin-tipo');
        const orden = safePathSegment(String(item.orden || item.id || 'sin-orden'));

        jobs.push({ item, imageUrl: item.bellezaUrl, variant: 'belleza', tipo, orden });
        jobs.push({ item, imageUrl: item.calleUrl, variant: 'calle', tipo, orden });
      }

      for (let index = 0; index < jobs.length; index += IMAGE_EXPORT_CHUNK_SIZE) {
        const chunk = jobs.slice(index, index + IMAGE_EXPORT_CHUNK_SIZE);
        await Promise.all(chunk.map((job) => addImageVariantsToZip(zip, job, errors)));
      }

      if (errors.length) {
        zip.file('LIVE/CANDIDATAS/errores.txt', errors.join('\n'));
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="ffsj-live-candidatas-${new Date().toISOString().slice(0, 10)}.zip"`);
      res.send(zipBuffer);
    } catch (error) {
      next(error);
    }
  });

  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html: string) => res.send(html))
      .catch((err: unknown) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();

async function addImageVariantsToZip(
  zip: JSZip,
  job: ImageExportJob,
  errors: string[]
): Promise<void> {
  const { imageUrl, item, orden, tipo, variant } = job;

  if (!imageUrl) {
    errors.push(`${item.id || orden} - ${item.nombre || 'Sin nombre'} - ${variant}: URL vacia`);
    return;
  }

  try {
    const sourceBuffer = await downloadImageBuffer(imageUrl);
    const [thumbBuffer, largeBuffer] = await Promise.all([
      resizeToWebp(sourceBuffer, 500),
      resizeToWebp(sourceBuffer, 1200)
    ]);

    zip.file(`LIVE/CANDIDATAS/thumbs/${variant}/${tipo}/${orden}.webp`, thumbBuffer);
    zip.file(`LIVE/CANDIDATAS/large/${variant}/${tipo}/${orden}.webp`, largeBuffer);
  } catch (error) {
    errors.push(`${item.id || orden} - ${item.nombre || 'Sin nombre'} - ${variant}: ${String(error)} - ${imageUrl}`);
  }
}

async function downloadImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`No se pudo descargar imagen (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function resizeToWebp(sourceBuffer: Buffer, width: number): Promise<Buffer> {
  return sharp(sourceBuffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

function safePathSegment(value: string): string {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sin-datos';
}
