import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/json',
            'application/pdf',
            'text/html',
            'application/xml',
            'text/xml',
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/webp'
        ];

        // Also permit via explicit extensions if mimetypes get obscured by browsers
        const allowedExtensions = ['.csv', '.xlsx', '.json', '.pdf', '.html', '.xml', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const hasValidExt = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

        if (allowedMimes.includes(file.mimetype) || hasValidExt) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV, Excel (XLSX), JSON, XML, PDF, HTML, and Images are allowed.'));
        }
    }
});
