// DOM Elements
const taskInput = document.getElementById('taskInput');
const categoryInput = document.getElementById('categoryInput');
const dueDateInput = document.getElementById('dueDateInput');
const addTaskBtn = document.getElementById('addTask');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn');
const categoryBtns = document.querySelectorAll('.category-btn');

let currentFilter = 'all';
let currentCategory = 'all';

// Load tasks from database
async function loadTasks() {
    try {
        const tasks = await window.api.getTodos(currentFilter, currentCategory);
        displayTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Display tasks in the UI
function displayTasks(tasks) {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''} ${isOverdue(task.due_date) ? 'overdue' : ''}`;
        
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleString() : 'No due date';
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <div class="task-meta">
                    <span class="category-tag">${task.category || 'General'}</span>
                    <span>Due: ${dueDate}</span>
                </div>
            </div>
            <button class="delete-btn">Delete</button>
        `;

        // Add event listeners
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => toggleTask(task.id, checkbox.checked));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        taskList.appendChild(li);
    });
}

// Check if a task is overdue
function isOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}

// Add new task
async function addTask(text, category, dueDate) {
    try {
        await window.api.addTodo({
            text,
            category: category || 'General',
            dueDate,
            priority: 0
        });
        taskInput.value = '';
        categoryInput.value = '';
        dueDateInput.value = '';
        await loadTasks();
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

// Toggle task completion
async function toggleTask(id, completed) {
    try {
        await window.api.toggleTodo(id, completed);
        await loadTasks();
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

// Delete task
async function deleteTask(id) {
    try {
        await window.api.deleteTodo(id);
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Event Listeners
addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    const category = categoryInput.value.trim();
    const dueDate = dueDateInput.value;
    
    if (text) {
        await addTask(text, category, dueDate);
    }
});

taskInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const text = taskInput.value.trim();
        const category = categoryInput.value.trim();
        const dueDate = dueDateInput.value;
        
        if (text) {
            await addTask(text, category, dueDate);
        }
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        await loadTasks();
    });
});

categoryBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        await loadTasks();
    });
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
}); 