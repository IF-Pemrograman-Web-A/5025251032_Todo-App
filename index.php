<?php
require_once 'config.php';

$users = $pdo->query("SELECT * FROM users ORDER BY id")->fetchAll();

if (count($users) === 0) {
    exit('No demo users found. Import data.sql first.');
}

$userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : (int) $users[0]['id'];
$menu = $_GET['menu'] ?? 'personal';

if (!in_array($menu, ['personal', 'shared'])) {
    $menu = 'personal';
}

$userIds = array_map('intval', array_column($users, 'id'));

if (!in_array($userId, $userIds)) {
    $userId = (int) $users[0]['id'];
}

$currentUser = $users[0];

foreach ($users as $user) {
    if ((int) $user['id'] === $userId) {
        $currentUser = $user;
        break;
    }
}

if ($menu === 'shared') {
    $statement = $pdo->query(
        "SELECT todos.*, users.name AS owner_name
        FROM todos
        JOIN users ON todos.user_id = users.id
        WHERE todos.visibility = 'shared'
        ORDER BY todos.created_at DESC"
    );
} else {
    $statement = $pdo->prepare(
        "SELECT todos.*, users.name AS owner_name
        FROM todos
        JOIN users ON todos.user_id = users.id
        WHERE todos.visibility = 'personal'
        AND todos.user_id = ?
        ORDER BY todos.created_at DESC"
    );
    $statement->execute([$userId]);
}

$todos = $statement->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>To do App</h1>
        <p>Manage your daily tasks</p>
        <button type="button" id="theme-btn" aria-label="Switch to dark mode">
            Dark Mode
        </button>
    </header>

    <div class="app-layout">
        <?php require 'menubar.php'; ?>

        <main>
            <?php require 'content.php'; ?>
        </main>
    </div>

    <footer>
        <p>&copy; My Task Manager App</p>
    </footer>

    <script src="script.js"></script>
</body>
</html>