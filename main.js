const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let db;
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

function initializeDatabase() {
    db = new sqlite3.Database('todos.db', (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        
        db.serialize(() => {
            // Create todos table with all necessary fields
            db.run(`
                CREATE TABLE IF NOT EXISTS todos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    text TEXT NOT NULL,
                    completed BOOLEAN DEFAULT 0,
                    category TEXT DEFAULT 'General',
                    due_date TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    priority INTEGER DEFAULT 0
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                }
            });
        });
    });
}

app.whenReady().then(() => {
    initializeDatabase();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Database operations
ipcMain.handle('get-todos', async (event, filter = 'all', category = 'all') => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM todos';
        const conditions = [];
        const params = [];

        if (filter === 'active') {
            conditions.push('completed = 0');
        } else if (filter === 'completed') {
            conditions.push('completed = 1');
        } else if (filter === 'overdue') {
            conditions.push('completed = 0 AND due_date < datetime("now")');
        }

        if (category !== 'all') {
            conditions.push('category = ?');
            params.push(category);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';
        
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Error getting todos:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('add-todo', async (event, todoData) => {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO todos (text, category, due_date, priority) VALUES (?, ?, ?, ?)',
            [todoData.text, todoData.category || 'General', todoData.dueDate, todoData.priority || 0],
            function(err) {
                if (err) {
                    console.error('Error adding todo:', err);
                    reject(err);
                } else {
                    resolve({ 
                        id: this.lastID, 
                        text: todoData.text, 
                        completed: false,
                        category: todoData.category || 'General',
                        due_date: todoData.dueDate,
                        priority: todoData.priority || 0
                    });
                }
            }
        );
    });
});

ipcMain.handle('toggle-todo', async (event, id, completed) => {
    return new Promise((resolve, reject) => {
        db.run('UPDATE todos SET completed = ? WHERE id = ?', [completed ? 1 : 0, id], (err) => {
            if (err) {
                console.error('Error toggling todo:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
});

ipcMain.handle('delete-todo', async (event, id) => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM todos WHERE id = ?', [id], (err) => {
            if (err) {
                console.error('Error deleting todo:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
});

ipcMain.handle('update-todo', async (event, id, updates) => {
    return new Promise((resolve, reject) => {
        const setClause = Object.keys(updates)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = [...Object.values(updates), id];

        db.run(`UPDATE todos SET ${setClause} WHERE id = ?`, values, (err) => {
            if (err) {
                console.error('Error updating todo:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}); 