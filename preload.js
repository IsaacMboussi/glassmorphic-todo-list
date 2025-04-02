const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api',
    {
        getTodos: (filter, category) => ipcRenderer.invoke('get-todos', filter, category),
        addTodo: (todoData) => ipcRenderer.invoke('add-todo', todoData),
        toggleTodo: (id, completed) => ipcRenderer.invoke('toggle-todo', id, completed),
        deleteTodo: (id) => ipcRenderer.invoke('delete-todo', id),
        updateTodo: (id, updates) => ipcRenderer.invoke('update-todo', id, updates)
    }
); 