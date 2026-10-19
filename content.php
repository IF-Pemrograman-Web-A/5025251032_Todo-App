<?php if (isset($_GET['message'])): ?>
    <p class="notice" role="status"><?= e($_GET['message']) ?></p>
<?php endif; ?>

<section class="todo-list">
    <h2><?= $menu === 'personal' ? 'Personal Todo List' : 'Shared Todo List' ?></h2>

    <div id="status-message" class="sr-only" role="status" aria-live="polite"></div>

    <div id="todo-container">
        <?php if (count($todos) === 0): ?>
            <p>No todos yet. Add a new todo above.</p>
        <?php endif; ?>

        <?php foreach ($todos as $todo): ?>
            <article class="todo-item" data-id="<?= (int) $todo['id'] ?>">
                <div class="todo-content">
                    <input
                        type="checkbox"
                        class="todo-checkbox"
                        id="todo-<?= (int) $todo['id'] ?>"
                        <?= $todo['completed'] ? 'checked' : '' ?>
                        aria-label="Mark <?= e($todo['title']) ?> as completed"
                    >

                    <label for="todo-<?= (int) $todo['id'] ?>">
                        <?= e($todo['title']) ?>
                    </label>

                    <div class="todo-buttons">
                        <button
                            type="button"
                            class="edit-button"
                            data-id="<?= (int) $todo['id'] ?>"
                            data-title="<?= e($todo['title']) ?>"
                            data-description="<?= e($todo['description']) ?>"
                            data-notification="<?= e($todo['notification_time'] ? date('Y-m-d\TH:i', strtotime($todo['notification_time'])) : '') ?>"
                            data-image="<?= e($todo['image_path']) ?>"
                            data-visibility="<?= e($todo['visibility']) ?>"
                        >
                            Edit
                        </button>

                        <form action="todo.php" method="POST" onsubmit="return confirm('Are you sure you want to delete this todo?')">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="id" value="<?= (int) $todo['id'] ?>">
                            <input type="hidden" name="menu" value="<?= e($menu) ?>">
                            <input type="hidden" name="user_id" value="<?= $userId ?>">
                            <button type="submit" class="delete-button">Delete</button>
                        </form>
                    </div>
                </div>

                <?php if (!empty($todo['description'])): ?>
                    <p class="todo-description"><?= nl2br(e($todo['description'])) ?></p>
                <?php endif; ?>

                <p class="todo-meta">
                    <?= $todo['visibility'] === 'shared' ? 'Shared' : 'Personal' ?>
                    <?php if ($todo['visibility'] === 'shared'): ?>
                        · By <?= e($todo['owner_name']) ?>
                    <?php endif; ?>
                </p>

                <?php if (!empty($todo['notification_time'])): ?>
                    <p class="todo-notification">
                        Reminder: <?= e(date('d M Y, H:i', strtotime($todo['notification_time']))) ?>
                    </p>
                <?php endif; ?>

                <?php if (!empty($todo['image_path'])): ?>
                    <img
                        class="todo-image"
                        src="<?= e($todo['image_path']) ?>"
                        alt="Image for todo: <?= e($todo['title']) ?>"
                    >
                <?php endif; ?>

                <div class="reminder-data"
                    data-title="<?= e($todo['title']) ?>"
                    data-description="<?= e($todo['description']) ?>"
                    data-time="<?= e($todo['notification_time']) ?>"
                    data-completed="<?= (int) $todo['completed'] ?>"
                    hidden>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
</section>

<section class="todo-detail">
    <div id="add-section">
        <h2>Add new Todo</h2>

        <form id="todo-form" action="todo.php" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="action" value="add">
            <input type="hidden" name="menu" value="<?= e($menu) ?>">
            <input type="hidden" name="user_id" value="<?= $userId ?>">
            <input type="hidden" name="captured_image" id="captured-image">

            <label for="title">Todo Title</label>
            <input type="text" id="title" name="title" maxlength="200" required placeholder="Enter todo title">

            <label for="description">Description</label>
            <textarea id="description" name="description" placeholder="Enter description"></textarea>

            <label for="visibility">Todo Type</label>
            <select id="visibility" name="visibility">
                <option value="personal">Personal</option>
                <option value="shared">Shared</option>
            </select>

            <label for="notification-time">Todo Notification Time</label>
            <input type="datetime-local" id="notification-time" name="notification_time">
            <small id="notification-help">
                Optional. Keep this page open and allow browser notifications.
            </small>

            <fieldset>
                <legend>Todo Image</legend>
                <p>You can capture an image or upload one from your device.</p>

                <label for="image-upload">Upload Image</label>
                <input type="file" id="image-upload" name="image" accept="image/png,image/jpeg,image/webp">

                <div class="camera-controls">
                    <button type="button" id="start-camera">Open Camera</button>
                    <button type="button" id="capture-image" disabled>Capture Image</button>
                    <button type="button" id="stop-camera" disabled>Close Camera</button>
                </div>

                <video id="camera" autoplay playsinline muted></video>
                <canvas id="canvas" hidden></canvas>

                <img id="image-preview" class="image-preview" alt="Preview of todo image" hidden>

                <button type="button" id="remove-image" hidden>Remove Image</button>

                <p id="camera-status" role="status" aria-live="polite"></p>
            </fieldset>

            <button type="submit">Add Todo</button>
        </form>
    </div>

    <div id="edit-section" hidden>
        <h2>Edit Todo</h2>

        <form id="edit-form" action="todo.php" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="action" value="edit">
            <input type="hidden" name="id" id="edit-id">
            <input type="hidden" name="menu" value="<?= e($menu) ?>">
            <input type="hidden" name="user_id" value="<?= $userId ?>">
            <input type="hidden" name="old_image" id="edit-old-image">
            <input type="hidden" name="captured_image" id="edit-captured-image">

            <label for="edit-title">Todo Title</label>
            <input type="text" id="edit-title" name="title" maxlength="200" required>

            <label for="edit-description">Description</label>
            <textarea id="edit-description" name="description"></textarea>

            <label for="edit-visibility">Todo Type</label>
            <select id="edit-visibility" name="visibility">
                <option value="personal">Personal</option>
                <option value="shared">Shared</option>
            </select>

            <label for="edit-notification-time">Todo Notification Time</label>
            <input type="datetime-local" id="edit-notification-time" name="notification_time">

            <label for="edit-image-upload">Replace Image</label>
            <input type="file" id="edit-image-upload" name="image" accept="image/png,image/jpeg,image/webp">

            <img id="edit-image-preview" class="image-preview" alt="Current todo image" hidden>

            <div class="edit-buttons">
                <button type="submit">Save changes</button>
                <button type="button" id="cancel-edit">Cancel</button>
            </div>
        </form>
    </div>
</section>