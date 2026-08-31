const express = require('express');
const https = require('https');
const router = express.Router();
const prisma = require('../utils/prisma');
const uploadRevisionFile = require('../middleware/uploadRevisionFile');
const { authenticate, requireAdmin } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

// ---------- ADMIN ROUTES ----------

// POST /api/admin/revision-sets — create a new set
router.post('/admin/revision-sets', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const revisionSet = await prisma.revisionSet.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        createdById: req.user.id,
      },
    });

    res.status(201).json(revisionSet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create revision set' });
  }
});

// POST /api/admin/revision-sets/:id/upload — upload a PDF into a set
router.post('/admin/revision-sets/:id/upload', authenticate, requireAdmin, (req, res) => {
  uploadRevisionFile.single('file')(req, res, async (err) => {
    if (err instanceof require('multer').MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File exceeds 10MB limit' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const { id: revisionSetId } = req.params;

      const set = await prisma.revisionSet.findUnique({ where: { id: revisionSetId } });
      if (!set) return res.status(404).json({ message: 'Revision set not found' });

      const revisionFile = await prisma.revisionFile.create({
        data: {
          fileName: req.file.originalname,
          fileUrl: req.file.path,
          fileSize: req.file.size,
          revisionSetId,
        },
      });

      res.status(201).json(revisionFile);
    } catch (dbErr) {
      console.error(dbErr);
      res.status(500).json({ message: 'Failed to save file record' });
    }
  });
});

// GET /api/admin/revision-sets — list all sets with their files
router.get('/admin/revision-sets', authenticate, requireAdmin, async (req, res) => {
  try {
    const sets = await prisma.revisionSet.findMany({
      include: { files: true, createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch revision sets' });
  }
});

// DELETE /api/admin/revision-sets/:id — delete a set and its files
router.delete('/admin/revision-sets/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const set = await prisma.revisionSet.findUnique({ where: { id }, include: { files: true } });
    if (!set) return res.status(404).json({ message: 'Revision set not found' });

    for (const file of set.files) {
      const publicId = extractPublicId(file.fileUrl);
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});
    }

    await prisma.revisionSet.delete({ where: { id } }); // cascades to files

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete revision set' });
  }
});

// DELETE /api/admin/revision-files/:id — delete a single file
router.delete('/admin/revision-files/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.revisionFile.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const publicId = extractPublicId(file.fileUrl);
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});

    await prisma.revisionFile.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// helper: extract Cloudinary public_id from stored URL
function extractPublicId(url) {
  const parts = url.split('/upload/')[1];
  const withoutVersion = parts.split('/').slice(1).join('/');
  return withoutVersion.replace(/\.[^/.]+$/, '');
}

// ---------- STUDENT ROUTES ----------
// (no requireAdmin here — just authenticate, so both ADMIN and STUDENT can browse/download)

// GET /api/revision-sets — list all sets (title, description, file count)
router.get('/revision-sets', authenticate, async (req, res) => {
  try {
    const sets = await prisma.revisionSet.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        _count: { select: { files: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch revision sets' });
  }
});

// GET /api/revision-sets/:id — get one set with its list of files
router.get('/revision-sets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const set = await prisma.revisionSet.findUnique({
      where: { id },
      include: {
        files: {
          select: { id: true, fileName: true, fileSize: true, uploadedAt: true },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!set) return res.status(404).json({ message: 'Revision set not found' });

    res.json(set);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch revision set' });
  }
});

// GET /api/revision-files/:id/download — stream a PDF back with a forced download
router.get('/revision-files/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.revisionFile.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Cloudinary 'raw' URLs don't force a download on their own, so we
    // pipe the bytes through our own server with the right headers.
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);

    https
      .get(file.fileUrl, (cloudinaryRes) => {
        if (cloudinaryRes.statusCode !== 200) {
          return res.status(502).json({ message: 'Failed to fetch file from storage' });
        }
        cloudinaryRes.pipe(res);
      })
      .on('error', (err) => {
        console.error(err);
        res.status(502).json({ message: 'Failed to fetch file from storage' });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to download file' });
  }
});

module.exports = router;