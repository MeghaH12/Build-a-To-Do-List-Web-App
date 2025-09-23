// script.js
(() => {
  const STORAGE_KEY = 'todo.tasks.v1';
  let tasks = [];
  let filter = 'all';

  // DOM refs
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const filterContainer = document.querySelector('.filters');
  const clearBtn = document.getElementById('clear-completed');
  const itemsLeft = document.getElementById('items-left');

  // localStorage helpers
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
  function load() {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Add a new task (to the front)
  function addTask(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    tasks.unshift({ id: uid(), text: trimmed, completed: false });
    save();
    render();
  }

  // Render visible tasks
  function render() {
    taskList.innerHTML = '';
    const visible = tasks.filter(t => {
      if (filter === 'all') return true;
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
    });

    visible.forEach(t => {
      const li = document.createElement('li');
      li.className = 'task-item';
      if (t.completed) li.classList.add('completed');
      li.dataset.id = t.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = t.completed;
      checkbox.setAttribute('aria-label', 'Toggle completed');

      const label = document.createElement('span');
      label.className = 'task-label';
      label.textContent = t.text;
      label.title = 'Double click to edit';
      label.tabIndex = 0;

      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'edit-btn';
      editBtn.textContent = 'Edit';
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';

      actions.append(editBtn, deleteBtn);
      li.append(checkbox, label, actions);
      taskList.appendChild(li);
    });

    updateItemsLeft();
  }

  function updateItemsLeft() {
    const left = tasks.filter(t => !t.completed).length;
    itemsLeft.textContent = ${left} item${left === 1 ? '' : 's'} left;
  }

  // Event: add task
  taskForm.addEventListener('submit', e => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
    taskInput.focus();
  });

  // Event delegation for clicks (delete/edit) and checkbox changes
  taskList.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    if (e.target.matches('.delete-btn')) {
      tasks = tasks.filter(t => t.id !== id);
      save();
      render();
      return;
    }
    if (e.target.matches('.edit-btn')) {
      startEdit(li, id);
      return;
    }
  });

  taskList.addEventListener('change', e => {
    if (e.target.matches('.task-checkbox')) {
      const li = e.target.closest('li');
      const id = li.dataset.id;
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      task.completed = e.target.checked;
      save();
      render();
    }
  });

  // Double-click label to edit
  taskList.addEventListener('dblclick', e => {
    if (e.target.matches('.task-label')) {
      const li = e.target.closest('li');
      const id = li.dataset.id;
      startEdit(li, id);
    }
  });

  // Start editing a task (inline)
  function startEdit(li, id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const label = li.querySelector('.task-label');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = task.text;

    li.classList.add('editing');
    li.replaceChild(input, label);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    function finish(saveEdit) {
      if (saveEdit) {
        const newText = (input.value || '').trim();
        if (newText) {
          task.text = newText;
        } else {
          // empty = delete
          tasks = tasks.filter(t => t.id !== id);
        }
        save();
      }
      render();
    }

    input.addEventListener('blur', () => finish(true), { once: true });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') input.blur();
      if (ev.key === 'Escape') finish(false);
    });
  }

  // Filters (All / Active / Completed)
  filterContainer.addEventListener('click', e => {
    if (!e.target.matches('.filter')) return;
    document.querySelectorAll('.filter').forEach(b => {
      b.classList.toggle('active', b === e.target);
      b.setAttribute('aria-pressed', String(b === e.target));
    });
    filter = e.target.dataset.filter;
    render();
  });

  // Clear completed
  clearBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    save();
    render();
  });

  // Init
  function init() {
    load();
    render();
    taskInput.focus();
  }

  init();
})();