const themeButton = document.getElementById('theme-btn');
const userSelect = document.getElementById('user-select');

const addSection = document.getElementById('add-section');
const editSection = document.getElementById('edit-section');
const todoForm = document.getElementById('todo-form');
const editForm = document.getElementById('edit-form');
const todoContainer = document.getElementById('todo-container');
const statusMessage = document.getElementById('status-message');

const titleInput = document.getElementById('title');
const editTitle = document.getElementById('edit-title');
const editDescription = document.getElementById('edit-description');
const editNotificationTime = document.getElementById('edit-notification-time');
const editId = document.getElementById('edit-id');
const editVisibility = document.getElementById('edit-visibility');
const editOldImage = document.getElementById('edit-old-image');
const editCapturedImage = document.getElementById('edit-captured-image');
const editImageUpload = document.getElementById('edit-image-upload');
const editImagePreview = document.getElementById('edit-image-preview');
const cancelEdit = document.getElementById('cancel-edit');

const startCamera = document.getElementById('start-camera');
const captureImage = document.getElementById('capture-image');
const stopCamera = document.getElementById('stop-camera');
const camera = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const imagePreview = document.getElementById('image-preview');
const removeImage = document.getElementById('remove-image');
const cameraStatus = document.getElementById('camera-status');
const capturedImageInput = document.getElementById('captured-image');
const imageUpload = document.getElementById('image-upload');

let cameraStream = null;
let capturedImage = null;

function showStatus(message) {
    if (statusMessage) {
        statusMessage.textContent = message;
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const darkMode = savedTheme === 'dark';

    document.body.classList.toggle('dark-mode', darkMode);
    themeButton.textContent = darkMode ? 'Light Mode' : 'Dark Mode';

    themeButton.setAttribute(
        'aria-label',
        darkMode ? 'Switch to light mode' : 'Switch to dark mode'
    );
}

loadTheme();

themeButton.addEventListener('click', function() {
    const darkMode = document.body.classList.toggle('dark-mode');

    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    themeButton.textContent = darkMode ? 'Light Mode' : 'Dark Mode';

    themeButton.setAttribute(
        'aria-label',
        darkMode ? 'Switch to light mode' : 'Switch to dark mode'
    );
});

if (userSelect) {
    userSelect.addEventListener('change', function() {
        const params = new URLSearchParams(window.location.search);
        params.set('user_id', userSelect.value);

        window.location.href = 'index.php?' + params.toString();
    });
}

todoForm.addEventListener('submit', function(event) {
    if (!titleInput.value.trim()) {
        event.preventDefault();
        titleInput.focus();
        return;
    }

    capturedImageInput.value = capturedImage || '';
});

editForm.addEventListener('submit', function(event) {
    if (!editTitle.value.trim()) {
        event.preventDefault();
        editTitle.focus();
        return;
    }

    editCapturedImage.value = editCapturedImage.value || '';
});

function stopCameraStream() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(function(track) {
            track.stop();
        });

        cameraStream = null;
    }

    camera.srcObject = null;
    camera.hidden = true;
    captureImage.disabled = true;
    stopCamera.disabled = true;
    startCamera.disabled = false;
}

startCamera.addEventListener('click', async function() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            cameraStatus.textContent = 'Camera is not supported by this browser.';
            return;
        }

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        camera.srcObject = cameraStream;
        camera.hidden = false;
        captureImage.disabled = false;
        stopCamera.disabled = false;
        startCamera.disabled = true;

        cameraStatus.textContent = 'Camera is ready. You can capture an image.';
    } catch (error) {
        cameraStatus.textContent =
            'Unable to access camera. Please allow camera permission.';
    }
});

captureImage.addEventListener('click', function() {
    if (!cameraStream || !camera.videoWidth) {
        return;
    }

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(camera, 0, 0, canvas.width, canvas.height);

    capturedImage = canvas.toDataURL('image/jpeg', 0.8);
    capturedImageInput.value = capturedImage;
    imageUpload.value = '';

    imagePreview.src = capturedImage;
    imagePreview.hidden = false;
    removeImage.hidden = false;

    cameraStatus.textContent = 'Image captured successfully.';
});

stopCamera.addEventListener('click', function() {
    stopCameraStream();
    cameraStatus.textContent = 'Camera closed.';
});

removeImage.addEventListener('click', function() {
    capturedImage = null;
    capturedImageInput.value = '';
    imageUpload.value = '';

    imagePreview.src = '';
    imagePreview.hidden = true;
    removeImage.hidden = true;

    cameraStatus.textContent = 'Image removed.';
});

imageUpload.addEventListener('change', function() {
    capturedImage = null;
    capturedImageInput.value = '';

    if (imageUpload.files && imageUpload.files[0]) {
        imagePreview.src = URL.createObjectURL(imageUpload.files[0]);
        imagePreview.hidden = false;
        removeImage.hidden = false;
    }
});

document.querySelectorAll('.edit-button').forEach(function(button) {
    button.addEventListener('click', function() {
        editId.value = button.dataset.id;
        editTitle.value = button.dataset.title;
        editDescription.value = button.dataset.description;
        editNotificationTime.value = button.dataset.notification;
        editVisibility.value = button.dataset.visibility;
        editOldImage.value = button.dataset.image;
        editCapturedImage.value = '';
        editImageUpload.value = '';

        if (button.dataset.image) {
            editImagePreview.src = button.dataset.image;
            editImagePreview.hidden = false;
        } else {
            editImagePreview.removeAttribute('src');
            editImagePreview.hidden = true;
        }

        addSection.hidden = true;
        editSection.hidden = false;

        editSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        editTitle.focus();
    });
});

editImageUpload.addEventListener('change', function() {
    if (editImageUpload.files && editImageUpload.files[0]) {
        editImagePreview.src = URL.createObjectURL(editImageUpload.files[0]);
        editImagePreview.hidden = false;
        editCapturedImage.value = '';
    }
});

cancelEdit.addEventListener('click', function() {
    editForm.reset();
    editCapturedImage.value = '';
    editOldImage.value = '';
    editImagePreview.removeAttribute('src');
    editImagePreview.hidden = true;

    editSection.hidden = true;
    addSection.hidden = false;

    titleInput.focus();
});

todoContainer.addEventListener('change', function(event) {
    if (!event.target.classList.contains('todo-checkbox')) {
        return;
    }

    const article = event.target.closest('.todo-item');
    const deleteForm = article.querySelector('form');
    const userId = deleteForm.querySelector('[name="user_id"]').value;
    const menu = deleteForm.querySelector('[name="menu"]').value;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'todo.php';

    const fields = {
        action: 'toggle',
        id: event.target.id.replace('todo-', ''),
        completed: event.target.checked ? '1' : '0',
        user_id: userId,
        menu: menu
    };

    Object.entries(fields).forEach(function(entry) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = entry[0];
        input.value = entry[1];
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
});

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return Promise.resolve(false);
    }

    if (Notification.permission === 'granted') {
        return Promise.resolve(true);
    }

    if (Notification.permission === 'denied') {
        return Promise.resolve(false);
    }

    return Notification.requestPermission().then(function(permission) {
        return permission === 'granted';
    });
}

function scheduleExistingNotifications() {
    const reminders = document.querySelectorAll('.reminder-data');

    reminders.forEach(function(item) {
        if (!item.dataset.time || item.dataset.completed === '1') {
            return;
        }

        const reminderDate = new Date(item.dataset.time.replace(' ', 'T'));
        const delay = reminderDate.getTime() - Date.now();

        if (delay <= 0 || delay > 2147480000) {
            return;
        }

        setTimeout(function() {
            requestNotificationPermission().then(function(permission) {
                if (!permission) {
                    return;
                }

                const title = item.dataset.title || 'Todo Reminder';
                const description = item.dataset.description || 'You have a todo reminder.';

                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(function(registration) {
                        registration.showNotification(title, {
                            body: description
                        });
                    }).catch(function() {
                        new Notification(title, { body: description });
                    });
                } else {
                    new Notification(title, { body: description });
                }
            });
        }, delay);
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('service-worker.js').catch(function() {});
    });
}

scheduleExistingNotifications();

window.addEventListener('beforeunload', stopCameraStream);