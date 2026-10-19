CREATE DATABASE IF NOT EXISTS todo_app;
USE todo_app;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed TINYINT(1) NOT NULL DEFAULT 0,
    visibility ENUM('personal', 'shared') NOT NULL DEFAULT 'personal',
    image_path VARCHAR(255) DEFAULT NULL,
    notification_time DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO users (id, name) VALUES
(1, 'Alya'),
(2, 'Bima'),
(3, 'Citra')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO todos
(user_id, title, description, completed, visibility)
VALUES
(1, 'Mengerjakan tugas PWEB', 'Menyelesaikan Todo App.', 0, 'personal'),
(2, 'Rapat kelompok', 'Membahas pembagian tugas.', 0, 'shared'),
(3, 'Menyiapkan presentasi', 'Membuat slide presentasi.', 1, 'shared');