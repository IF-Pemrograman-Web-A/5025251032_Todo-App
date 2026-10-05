let todos = [];
let editingId = null;

let db;
let cameraStream = null;
let capturedImage = null;

const todoForm = document.getElementById('todo-form');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const notificationTimeInput = document.getElementById('notification-time');

const todoContainer = document.getElementById('todo-container');
const themeButton = document.getElementById('theme-btn');

const addSection = document.getElementById('add-section');
const editSection = document.getElementById('edit-section');

const editForm = document.getElementById('edit-form');
const editTitle = document.getElementById('edit-title');
const editDescription = document.getElementById('edit-description');
const editNotificationTime = document.getElementById('edit-notification-time');
const cancelEdit = document.getElementById('cancel-edit');

const statusMessage = document.getElementById('status-message');

const startCamera = document.getElementById('start-camera');
const captureImage = document.getElementById('capture-image');
const stopCamera = document.getElementById('stop-camera');
const camera = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const imagePreview = document.getElementById('image-preview');
const removeImage = document.getElementById('remove-image');
const cameraStatus = document.getElementById('camera-status');

const databaseRequest = indexedDB.open('TodoDatabase', 1);

databaseRequest.onupgradeneeded = function(event) {
    db = event.target.result;

    if (!db.objectStoreNames.contains('todos')) {
        db.createObjectStore('todos', {
            keyPath: 'id'
        });
    }
};

databaseRequest.onsuccess = function(event) {
    db = event.target.result;
    loadTodos();
};

databaseRequest.onerror = function() {
    console.error('Failed to open IndexedDB.');
};

function loadTodos() {
    const transaction = db.transaction(['todos'], 'readonly');
    const store = transaction.objectStore('todos');
    const request = store.getAll();

    request.onsuccess = function() {
        todos = request.result;
        renderTodos();
        scheduleExistingNotifications();
    };
}

function saveTodo(todo) {
    return new Promise(function(resolve, reject) {
        const transaction = db.transaction(['todos'], 'readwrite');
        const store = transaction.objectStore('todos');
        const request = store.put(todo);

        request.onsuccess = function() {
            resolve();
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function deleteTodoFromDB(id) {
    const transaction = db.transaction(['todos'], 'readwrite');
    const store = transaction.objectStore('todos');

    store.delete(id);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeButton.textContent = 'Light Mode';

        themeButton.setAttribute(
            'aria-label',
            'Switch to light mode'
        );
    }
}

loadTheme();

themeButton.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');

    const darkMode =
        document.body.classList.contains('dark-mode');

    if (darkMode) {
        localStorage.setItem('theme', 'dark');

        themeButton.textContent = 'Light Mode';

        themeButton.setAttribute(
            'aria-label',
            'Switch to light mode'
        );
    } else {
        localStorage.setItem('theme', 'light');

        themeButton.textContent = 'Dark Mode';

        themeButton.setAttribute(
            'aria-label',
            'Switch to dark mode'
        );
    }
});

startCamera.addEventListener('click', async function() {
    try {
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {
            cameraStatus.textContent =
                'Camera is not supported by this browser.';

            return;
        }

        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });

        camera.srcObject = cameraStream;

        captureImage.disabled = false;
        stopCamera.disabled = false;
        startCamera.disabled = true;

        cameraStatus.textContent =
            'Camera is ready. You can capture an image.';
    } catch (error) {
        console.error(error);

        cameraStatus.textContent =
            'Unable to access camera. Please allow camera permission.';
    }
});

captureImage.addEventListener('click', function() {
    if (!cameraStream) {
        return;
    }

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;

    const context = canvas.getContext('2d');

    context.drawImage(
        camera,
        0,
        0,
        canvas.width,
        canvas.height
    );

    capturedImage =
        canvas.toDataURL('image/jpeg');

    imagePreview.src = capturedImage;
    imagePreview.hidden = false;
    removeImage.hidden = false;

    cameraStatus.textContent =
        'Image captured successfully.';
});

stopCamera.addEventListener('click', function() {
    stopCameraStream();

    cameraStatus.textContent =
        'Camera closed.';
});

function stopCameraStream() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(function(track) {
            track.stop();
        });

        cameraStream = null;
    }

    camera.srcObject = null;

    captureImage.disabled = true;
    stopCamera.disabled = true;
    startCamera.disabled = false;
}

removeImage.addEventListener('click', function() {
    capturedImage = null;

    imagePreview.src = '';
    imagePreview.hidden = true;
    removeImage.hidden = true;

    cameraStatus.textContent =
        'Captured image removed.';
});

todoForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const notificationTime = notificationTimeInput.value;

    if (!title) {
        titleInput.focus();
        return;
    }

    const todo = {
        id: Date.now(),
        title: title,
        description: description,
        completed: false,
        image: capturedImage,
        notificationTime: notificationTime || null,
        notificationSent: false
    };

    todos.push(todo);

    await saveTodo(todo);

    renderTodos();

    scheduleNotification(todo);

    todoForm.reset();

    capturedImage = null;

    imagePreview.src = '';
    imagePreview.hidden = true;
    removeImage.hidden = true;

    stopCameraStream();

    if (statusMessage) {
        statusMessage.textContent =
            'Todo added successfully.';
    }

    titleInput.focus();
});

function renderTodos() {
    todoContainer.innerHTML = '';

    if (todos.length === 0) {
        const emptyMessage =
            document.createElement('p');

        emptyMessage.textContent =
            'No todos yet. Add a new todo above.';

        todoContainer.appendChild(emptyMessage);

        return;
    }

    todos.forEach(function(todo) {
        const todoItem =
            document.createElement('article');

        todoItem.className = 'todo-item';

        todoItem.setAttribute(
            'aria-label',
            'Todo: ' + todo.title
        );

        const todoContent =
            document.createElement('div');

        todoContent.className = 'todo-content';

        const checkbox =
            document.createElement('input');

        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.dataset.id = todo.id;
        checkbox.checked = todo.completed;
        checkbox.id = 'todo-' + todo.id;

        const label =
            document.createElement('label');

        label.htmlFor = 'todo-' + todo.id;
        label.textContent = todo.title;

        const buttons =
            document.createElement('div');

        buttons.className = 'todo-buttons';

        const editButton =
            document.createElement('button');

        editButton.type = 'button';
        editButton.className = 'edit-button';
        editButton.dataset.id = todo.id;
        editButton.textContent = 'Edit';

        editButton.setAttribute(
            'aria-label',
            'Edit ' + todo.title
        );

        const deleteButton =
            document.createElement('button');

        deleteButton.type = 'button';
        deleteButton.className = 'delete-button';
        deleteButton.dataset.id = todo.id;
        deleteButton.textContent = 'Delete';

        deleteButton.setAttribute(
            'aria-label',
            'Delete ' + todo.title
        );

        buttons.appendChild(editButton);
        buttons.appendChild(deleteButton);

        todoContent.appendChild(checkbox);
        todoContent.appendChild(label);
        todoContent.appendChild(buttons);

        todoItem.appendChild(todoContent);

        if (todo.description) {
            const description =
                document.createElement('p');

            description.className =
                'todo-description';

            description.textContent =
                todo.description;

            todoItem.appendChild(description);
        }

        if (todo.notificationTime) {
            const notification =
                document.createElement('p');

            notification.className =
                'todo-notification';

            const date =
                new Date(todo.notificationTime);

            notification.textContent =
                'Reminder: ' +
                date.toLocaleString();

            todoItem.appendChild(notification);
        }

        if (todo.image) {
            const image =
                document.createElement('img');

            image.className = 'todo-image';
            image.src = todo.image;

            image.alt =
                'Image for todo: ' +
                todo.title;

            todoItem.appendChild(image);
        }

        todoContainer.appendChild(todoItem);
    });
}

todoContainer.addEventListener('change', async function(event) {
    if (
        event.target.classList.contains(
            'todo-checkbox'
        )
    ) {
        const id =
            Number(event.target.dataset.id);

        const todo =
            todos.find(function(item) {
                return item.id === id;
            });

        if (todo) {
            todo.completed =
                event.target.checked;

            await saveTodo(todo);

            if (statusMessage) {
                statusMessage.textContent =
                    todo.completed
                        ? 'Todo marked as completed.'
                        : 'Todo marked as incomplete.';
            }
        }
    }
});

todoContainer.addEventListener('click', function(event) {
    const id =
        Number(event.target.dataset.id);

    if (
        event.target.classList.contains(
            'edit-button'
        )
    ) {
        const todo =
            todos.find(function(item) {
                return item.id === id;
            });

        if (!todo) {
            return;
        }

        editingId = id;

        editTitle.value = todo.title;
        editDescription.value = todo.description;
        editNotificationTime.value =
            todo.notificationTime || '';

        addSection.hidden = true;
        editSection.hidden = false;

        editTitle.focus();
    }

    if (
        event.target.classList.contains(
            'delete-button'
        )
    ) {
        const todo =
            todos.find(function(item) {
                return item.id === id;
            });

        if (!todo) {
            return;
        }

        const confirmed =
            confirm(
                'Are you sure you want to delete "' +
                todo.title +
                '"?'
            );

        if (!confirmed) {
            return;
        }

        todos =
            todos.filter(function(item) {
                return item.id !== id;
            });

        deleteTodoFromDB(id);

        renderTodos();

        if (statusMessage) {
            statusMessage.textContent =
                'Todo deleted successfully.';
        }
    }
});

editForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const todo =
        todos.find(function(item) {
            return item.id === editingId;
        });

    if (!todo) {
        return;
    }

    todo.title =
        editTitle.value.trim();

    todo.description =
        editDescription.value.trim();

    todo.notificationTime =
        editNotificationTime.value || null;

    todo.notificationSent = false;

    await saveTodo(todo);

    renderTodos();

    scheduleNotification(todo);

    editForm.reset();

    addSection.hidden = false;
    editSection.hidden = true;

    editingId = null;

    if (statusMessage) {
        statusMessage.textContent =
            'Todo updated successfully.';
    }

    titleInput.focus();
});

cancelEdit.addEventListener('click', function() {
    editForm.reset();

    addSection.hidden = false;
    editSection.hidden = true;

    editingId = null;

    titleInput.focus();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker
            .register('service-worker.js')
            .then(function() {
                console.log(
                    'Service Worker registered successfully.'
                );
            })
            .catch(function(error) {
                console.error(
                    'Service Worker registration failed:',
                    error
                );
            });
    });
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return false;
    }

    if (
        Notification.permission ===
        'granted'
    ) {
        return true;
    }

    if (
        Notification.permission ===
        'denied'
    ) {
        return false;
    }

    const permission =
        await Notification.requestPermission();

    return permission === 'granted';
}

async function scheduleNotification(todo) {
    if (!todo.notificationTime) {
        return;
    }

    const notificationDate =
        new Date(todo.notificationTime);

    const currentTime =
        new Date();

    const delay =
        notificationDate.getTime() -
        currentTime.getTime();

    if (delay <= 0) {
        return;
    }

    const permission =
        await requestNotificationPermission();

    if (!permission) {
        return;
    }

    setTimeout(function() {
        if (todo.completed) {
            return;
        }

        if (
            navigator.serviceWorker &&
            navigator.serviceWorker.controller
        ) {
            navigator.serviceWorker.controller
                .postMessage({
                    type: 'TODO_NOTIFICATION',
                    title: todo.title,
                    description: todo.description
                });
        } else {
            new Notification(
                'Todo Reminder: ' +
                todo.title,
                {
                    body:
                        todo.description ||
                        'You have a todo reminder.'
                }
            );
        }
    }, delay);
}

function scheduleExistingNotifications() {
    todos.forEach(function(todo) {
        if (
            todo.notificationTime &&
            !todo.completed
        ) {
            scheduleNotification(todo);
        }
    });
}