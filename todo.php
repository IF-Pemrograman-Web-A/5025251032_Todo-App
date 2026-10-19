<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

$action = $_POST['action'] ?? '';
$userId = (int) ($_POST['user_id'] ?? 1);
$menu = $_POST['menu'] ?? 'personal';

if (!in_array($menu, ['personal', 'shared'])) {
    $menu = 'personal';
}

function goBack($menu, $userId, $message)
{
    header(
        'Location: index.php?menu=' . urlencode($menu) .
        '&user_id=' . (int) $userId .
        '&message=' . urlencode($message)
    );
    exit;
}

function storeImage($file, $capturedImage)
{
    $directory = __DIR__ . '/uploads/';

    if (!is_dir($directory)) {
        mkdir($directory, 0755, true);
    }

    if ($capturedImage !== '') {
        if (!preg_match('/^data:image\/(jpeg|png);base64,/', $capturedImage, $matches)) {
            throw new RuntimeException('Invalid captured image.');
        }

        $data = base64_decode(substr($capturedImage, strpos($capturedImage, ',') + 1), true);

        if ($data === false || strlen($data) > 5 * 1024 * 1024) {
            throw new RuntimeException('Image must be smaller than 5 MB.');
        }

        $info = @getimagesizefromstring($data);

        if (!$info || !in_array($info['mime'], ['image/jpeg', 'image/png'])) {
            throw new RuntimeException('Invalid image format.');
        }

        $extension = $info['mime'] === 'image/png' ? 'png' : 'jpg';
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;

        if (file_put_contents($directory . $filename, $data) === false) {
            throw new RuntimeException('Could not save image.');
        }

        return 'uploads/' . $filename;
    }

    if (!$file || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > 5 * 1024 * 1024) {
        throw new RuntimeException('Upload failed or image exceeds 5 MB.');
    }

    $info = @getimagesize($file['tmp_name']);
    $mime = $info['mime'] ?? '';

    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ];

    if (!$info || !isset($extensions[$mime])) {
        throw new RuntimeException('Only JPG, PNG, and WEBP images are allowed.');
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];

    if (!move_uploaded_file($file['tmp_name'], $directory . $filename)) {
        throw new RuntimeException('Could not save uploaded image.');
    }

    return 'uploads/' . $filename;
}

try {
    $userCheck = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $userCheck->execute([$userId]);

    if (!$userCheck->fetch()) {
        goBack($menu, 1, 'Invalid demo user.');
    }

    if (in_array($action, ['add', 'edit'])) {
        $title = trim($_POST['title'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $visibility = $_POST['visibility'] ?? 'personal';
        $notificationTime = trim($_POST['notification_time'] ?? '');

        if ($title === '' || strlen($title) > 200) {
            goBack($menu, $userId, 'Please enter a valid todo title.');
        }

        if (!in_array($visibility, ['personal', 'shared'])) {
            $visibility = 'personal';
        }

        if ($notificationTime !== '') {
            $date = DateTime::createFromFormat('Y-m-d\TH:i', $notificationTime);

            if (!$date || $date->format('Y-m-d\TH:i') !== $notificationTime) {
                goBack($menu, $userId, 'Invalid reminder time.');
            }

            $notificationTime = $date->format('Y-m-d H:i:s');
        } else {
            $notificationTime = null;
        }

        $imagePath = storeImage(
            $_FILES['image'] ?? null,
            $_POST['captured_image'] ?? ''
        );

        if ($action === 'add') {
            $statement = $pdo->prepare(
                "INSERT INTO todos
                (user_id, title, description, visibility, notification_time, image_path)
                VALUES (?, ?, ?, ?, ?, ?)"
            );

            $statement->execute([
                $userId,
                $title,
                $description,
                $visibility,
                $notificationTime,
                $imagePath
            ]);

            goBack($menu, $userId, 'Todo added successfully.');
        }

        $todoId = (int) ($_POST['id'] ?? 0);
        $oldImage = $_POST['old_image'] ?? '';

        $check = $pdo->prepare(
            "SELECT * FROM todos
             WHERE id = ? AND (user_id = ? OR visibility = 'shared')"
        );
        $check->execute([$todoId, $userId]);
        $existing = $check->fetch();

        if (!$existing) {
            goBack($menu, $userId, 'Todo not found.');
        }

        if ($imagePath === null) {
            $imagePath = $existing['image_path'];
        }

        $statement = $pdo->prepare(
            "UPDATE todos
             SET title = ?, description = ?, visibility = ?,
                 notification_time = ?, image_path = ?
             WHERE id = ? AND (user_id = ? OR visibility = 'shared')"
        );

        $statement->execute([
            $title,
            $description,
            $visibility,
            $notificationTime,
            $imagePath,
            $todoId,
            $userId
        ]);

        if ($imagePath !== $existing['image_path'] && !empty($existing['image_path'])) {
            $oldFile = __DIR__ . '/' . $existing['image_path'];

            if (is_file($oldFile)) {
                unlink($oldFile);
            }
        }

        goBack($menu, $userId, 'Todo updated successfully.');
    }

    if ($action === 'delete') {
        $todoId = (int) ($_POST['id'] ?? 0);

        $statement = $pdo->prepare(
            "SELECT image_path FROM todos
             WHERE id = ? AND (user_id = ? OR visibility = 'shared')"
        );
        $statement->execute([$todoId, $userId]);
        $todo = $statement->fetch();

        if ($todo) {
            $delete = $pdo->prepare(
                "DELETE FROM todos
                 WHERE id = ? AND (user_id = ? OR visibility = 'shared')"
            );
            $delete->execute([$todoId, $userId]);

            if (!empty($todo['image_path'])) {
                $path = __DIR__ . '/' . $todo['image_path'];

                if (is_file($path)) {
                    unlink($path);
                }
            }
        }

        goBack($menu, $userId, 'Todo deleted successfully.');
    }

    if ($action === 'toggle') {
        $todoId = (int) ($_POST['id'] ?? 0);
        $completed = (int) ($_POST['completed'] ?? 0);

        $statement = $pdo->prepare(
            "UPDATE todos SET completed = ?
             WHERE id = ? AND (user_id = ? OR visibility = 'shared')"
        );

        $statement->execute([
            $completed ? 1 : 0,
            $todoId,
            $userId
        ]);

        goBack($menu, $userId, 'Todo status updated.');
    }

    goBack($menu, $userId, 'Unknown action.');
} catch (Throwable $error) {
    goBack($menu, $userId, 'Could not save the todo. Check the input and database.');
}
?>