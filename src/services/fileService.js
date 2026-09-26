// File Service Helper for File Sharing & Media Preview

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileTypeCategory(fileType, fileName = '') {
  if (!fileType && fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'txt', 'md'].includes(ext)) return 'document';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
    if (['zip', 'rar', '7z', 'tar'].includes(ext)) return 'archive';
    if (['js', 'ts', 'vue', 'py', 'json', 'html', 'css'].includes(ext)) return 'code';
  }

  if (fileType.startsWith('image/')) return 'image';
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType.includes('word') || fileType.includes('text') || fileType.includes('json')) return 'document';
  return 'file';
}

export function processUploadedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');
    
    reader.onload = (e) => {
      const category = getFileTypeCategory(file.type, file.name);
      const attachment = {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
        category: category,
        url: e.target.result,
        uploadedAt: new Date().toISOString()
      };
      resolve(attachment);
    };

    reader.onerror = (err) => reject(err);

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      // For non-images, we can also store data URL or generate mock download blob
      reader.readAsDataURL(file);
    }
  });
}
