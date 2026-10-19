<aside class="sidebar">
    <h2>My Workspace</h2>

    <nav aria-label="Todo menu">
        <a
            href="index.php?menu=personal&amp;user_id=<?= $userId ?>"
            class="<?= $menu === 'personal' ? 'active' : '' ?>"
        >
            Personal
        </a>

        <a
            href="index.php?menu=shared&amp;user_id=<?= $userId ?>"
            class="<?= $menu === 'shared' ? 'active' : '' ?>"
        >
            Shared
        </a>
    </nav>

    <label for="user-select">Demo user</label>

    <select id="user-select">
        <?php foreach ($users as $user): ?>
            <option
                value="<?= (int) $user['id'] ?>"
                <?= (int) $user['id'] === $userId ? 'selected' : '' ?>
            >
                <?= e($user['name']) ?>
            </option>
        <?php endforeach; ?>
    </select>

    <p class="sidebar-note">
        Select a demo user to view their personal tasks.
    </p>
</aside>