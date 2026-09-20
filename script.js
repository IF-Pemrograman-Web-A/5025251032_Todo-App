let todos = [];

const todoForm = document.getElementById('todo-form');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const todoContainer = document.getElementById('todo-container');
const themeButton = document.getElementById('theme-btn');
const addSection = document.getElementById('add-section');
const editSection = document.getElementById('edit-section');
const editForm = document.getElementById('edit-form');
const editTitle = document.getElementById('edit-title');
const editDescription = document.getElementById('edit-description');
const cancelEdit = document.getElementById('cancel-edit');

let editingId = null;

todoForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    const todo = {
        id: Date.now(),
        title: title,
        description: description,
        completed: false
    };

    todos.push(todo);
    renderTodos();
    todoForm.reset();
});

function renderTodos() {
    todoContainer.innerHTML = '';

    todos.forEach(function(todo) {
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';

        todoItem.innerHTML = `
            <div class="todo-content">
                <input type="checkbox" class="todo-checkbox" data-id="${todo.id}" ${todo.completed ? 'checked' : ''}>
                <label>${todo.title}</label>

                <div class="todo-buttons">
                    <button class="edit-button" data-id="${todo.id}">Edit</button>
                    <button class="delete-button" data-id="${todo.id}">Delete</button>
                </div>
            </div>

            <p class="todo-description">${todo.description}</p>
        `;

        todoContainer.appendChild(todoItem);
    });
}

todoContainer.addEventListener("change", function(event) {
    if (event.target.classList.contains("todo-checkbox")) {
        const id = Number(event.target.dataset.id);

        todos.forEach(function(todo) {
            if (todo.id === id) {
                todo.completed = event.target.checked;
            }
        });
    }
});

todoContainer.addEventListener("click", function(event) {
    const id = Number(event.target.dataset.id);

    if (event.target.classList.contains("edit-button")) {
        const todo = todos.find(todo => todo.id === id);
        
        editingId = id;

        editTitle.value = todo.title;
        editDescription.value = todo.description;

        addSection.style.display = 'none';
        editSection.style.display = 'block';
    }

    if (event.target.classList.contains("delete-button")) {
        todos = todos.filter(todo => todo.id !== id);
        renderTodos();
    }
});

editForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const todo = todos.find(todo => todo.id === editingId);
    todo.title = editTitle.value.trim();
    todo.description = editDescription.value.trim();

    renderTodos();

    editForm.reset();

    addSection.style.display = 'block';
    editSection.style.display = 'none';

    editingId = null;
});

cancelEdit.addEventListener('click', function() {
    editForm.reset();

    addSection.style.display = 'block';
    editSection.style.display = 'none';
    editingId = null;
});

themeButton.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        themeButton.textContent = 'Light Mode';
    } else {
        themeButton.textContent = 'Dark Mode';
    }
});