import { Request, Response, NextFunction } from 'express';

export const apiLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, url, ip } = req;

    // After response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const key = req.headers['x-api-key'] || 'internal';

    });

    next();
};
