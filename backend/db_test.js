const { DataSource } = require('typeorm');
const myDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'nalyse_admin',
    password: 'supersecretpassword',
    database: 'nalyse_gen2',
});
myDataSource.initialize().then(async db => {
    const files = await db.query('SELECT id, "ownerId" FROM files WHERE "isDeleted" = false LIMIT 5');
    console.log('FILES:', JSON.stringify(files));
    const users = await db.query('SELECT id, email FROM users LIMIT 5');
    console.log('USERS:', JSON.stringify(users));
    process.exit(0);
}).catch(console.error);
