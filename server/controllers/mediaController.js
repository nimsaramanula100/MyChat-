import path from 'path';

export async function uploadMedia(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileMeta = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    };

    return res.json({
      success: true,
      mediaUrl: fileUrl,
      mediaMeta: fileMeta
    });
  } catch (err) {
    console.error('uploadMedia error:', err);
    return res.status(500).json({ error: 'Media upload failed' });
  }
}
