import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';

const secret = '96c7e335a622d0d220bd15251d993a3ca7441355f6aa28efc86fbdbd2e9748fe914908d3eecb69a4e5858de3928ad95f72592a5a56c8c6350b83c958cc39d26c';

const db = new sqlite3.Database('database.sqlite');

db.get('SELECT id FROM user LIMIT 1', (err, user: any) => {
    if (err) return console.error(err);
    if (!user) return console.error("No user");
    
    db.get('SELECT id FROM file WHERE ownerId = ? ORDER BY createdAt DESC LIMIT 1', [user.id], async (err, file: any) => {
        if (err) return console.error(err);
        if (!file) return console.error("No file");
        
        const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });
        
        console.log(`Fetching /api/files/${file.id}/analyze with user ${user.id}`);
        try {
            const res = await fetch(`http://localhost:3000/api/files/${file.id}/analyze`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(res.status, await res.text());
        } catch (e: any) {
            console.error(e.message);
        }
    });
});
