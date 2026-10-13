(function () {
  'use strict';

  var LISTS_KEY = 'todoBuddy.lists.v1';
  var TODOS_KEY = 'todoBuddy.todos.v1';
  var APP_KEY = 'webapp_todoBuddy';
  var APP_VERSION = '001.001';



  var ICONS = Object.assign({}, Buddy.ICONS, { taskCheck: Buddy.icon('taskCheck') });

  var PRIORITIES = [
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' }
  ];
  var PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

  var SORTS = [
    { id: 'created', label: 'Newest First' },
    { id: 'due', label: 'Due Date' },
    { id: 'priority', label: 'Priority' }
  ];

  var VIEWS = ['list', 'grid', 'waterfall', 'gantt'];

  var dom = {};
  var state = {
    lists: [],
    todos: [],
    activeListId: null,
    statusFilter: 'all',
    priorityFilter: '',
    sort: 'created',
    search: '',
    listSearch: '',
    view: 'list'
  };

  function escapeHtml(str) {
    return Buddy.escapeHtml(str);
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function priorityLabel(p) {
    if (p === 'high') return 'High';
    if (p === 'low') return 'Low';
    return 'Medium';
  }

  function isOverdue(todo) {
    return !todo.done && !!todo.dueDate && todo.dueDate < todayStr();
  }



  function loadLists() {
    try {
      var raw = localStorage.getItem(LISTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLists() {
    try { localStorage.setItem(LISTS_KEY, JSON.stringify(state.lists)); } catch (e) {}
  }

  function loadTodos() {
    try {
      var raw = localStorage.getItem(TODOS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTodos() {
    try { localStorage.setItem(TODOS_KEY, JSON.stringify(state.todos)); } catch (e) {}
  }

  function findTodo(id) {
    return state.todos.find(function (t) { return t.id === id; });
  }

  function findList(id) {
    return state.lists.find(function (l) { return l.id === id; });
  }






  function ensureDefaultListAndMigrate() {
    if (!state.lists.length && state.todos.length) {
      state.lists.push({ id: generateId(), name: 'My Tasks', createdAt: Date.now() });
      saveLists();
    }
    var validIds = {};
    state.lists.forEach(function (l) { validIds[l.id] = true; });
    var fallbackId = null;
    var changed = false;
    state.todos.forEach(function (t) {
      if (!t.listId || !validIds[t.listId]) {
        if (!fallbackId) fallbackId = state.lists[0].id;
        t.listId = fallbackId;
        changed = true;
      }
    });
    if (changed) saveTodos();
  }

  function ensureActiveListId() {
    if (!state.lists.some(function (l) { return l.id === state.activeListId; })) {
      state.activeListId = state.lists[0] ? state.lists[0].id : null;
    }
  }



  function applyTheme(theme) {
    Buddy.theme.applyTheme(APP_KEY, theme);
  }

  function applyAccent(accent) {
    Buddy.theme.applyAccent(APP_KEY, accent);
  }

  function openSettingsModal() {
    Buddy.settings.open(APP_KEY, openModal, closeModal, { appVersion: APP_VERSION });
  }



  function updateActiveListHeader() {
    var list = findList(state.activeListId);
    dom.activeListTitle.textContent = list ? list.name : '';
  }

  function selectList(id) {
    state.activeListId = id;
    state.search = '';
    dom.todoSearch.value = '';
    updateActiveListHeader();
    renderListNav();
    renderStats();
    renderCurrentView();
  }

  function renderListNav() {
    var q = state.listSearch.trim().toLowerCase();
    var filteredLists = state.lists.filter(function (l) { return !q || l.name.toLowerCase().indexOf(q) !== -1; });

    dom.sidebarLoadSampleHint.hidden = state.lists.length !== 0;

    var html;
    if (!filteredLists.length && q) {
      html = '<p class="empty-hint">No lists match your search.</p>';
    } else {
      html = filteredLists.map(function (l) {
        var count = state.todos.filter(function (t) { return t.listId === l.id && !t.done; }).length;
        var active = l.id === state.activeListId ? ' active' : '';
        return '<li class="list-nav-item' + active + '" data-id="' + l.id + '" tabindex="0">' +
          '<span class="list-nav-icon">' + ICONS.list + '</span>' +
          '<span class="list-nav-body">' +
          '<span class="list-nav-name">' + escapeHtml(l.name) + '</span>' +
          '<span class="list-nav-count">' + count + ' open</span>' +
          '</span>' +
          '<span class="list-nav-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm btn-icon list-edit" title="Rename" aria-label="Rename list">' + ICONS.edit + '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm btn-icon list-delete" title="Delete" aria-label="Delete list">' + ICONS.trash + '</button>' +
          '</span>' +
          '</li>';
      }).join('');
    }

    dom.listNav.innerHTML = html;
  }

  function openNewListModal() {
    openNameModal('Create List', '', function (name) {
      var list = { id: generateId(), name: name, createdAt: Date.now() };
      state.lists.push(list);
      saveLists();
      selectList(list.id);
      updateListsVisibility();
    });
  }



  function updateListsVisibility() {
    var hasLists = state.lists.length > 0;
    dom.noListsState.hidden = hasLists;
    dom.mainContent.hidden = !hasLists;
  }

  function renameList(id) {
    var list = findList(id);
    if (!list) return;
    openNameModal('Rename List', list.name, function (name) {
      list.name = name;
      saveLists();
      renderListNav();
      updateActiveListHeader();
    });
  }

  function deleteList(id) {
    var list = findList(id);
    if (!list) return;
    var count = state.todos.filter(function (t) { return t.listId === id; }).length;
    var message = count > 0
      ? 'Delete "' + list.name + '"? This will also delete ' + count + ' todo' + (count === 1 ? '' : 's') + ' in it. This cannot be undone.'
      : 'Delete "' + list.name + '"? This cannot be undone.';

    openConfirmModal('Delete List', message, 'Delete', function () {
      state.lists = state.lists.filter(function (l) { return l.id !== id; });
      state.todos = state.todos.filter(function (t) { return t.listId !== id; });
      saveLists();
      saveTodos();
      if (state.activeListId === id) {
        state.activeListId = state.lists.length ? state.lists[0].id : null;
        updateActiveListHeader();
      }
      renderListNav();
      renderStats();
      renderCurrentView();
      updateListsVisibility();
    }, { danger: true });
  }



  function scopedTodos() {
    var listId = state.activeListId;
    return state.todos.filter(function (t) { return t.listId === listId; });
  }

  function statCard(icon, label, value) {
    return '<div class="stat-card">' +
      '<div class="stat-icon">' + ICONS[icon] + '</div>' +
      '<div class="stat-body">' +
      '<span class="stat-label">' + escapeHtml(label) + '</span>' +
      '<span class="stat-value">' + escapeHtml(value) + '</span>' +
      '</div>' +
      '</div>';
  }

  function renderStats() {
    var scoped = scopedTodos();
    var total = scoped.length;
    var completed = scoped.filter(function (t) { return t.done; }).length;
    var active = total - completed;
    var overdue = scoped.filter(isOverdue).length;
    var rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    dom.todoStats.innerHTML =
      statCard('list', 'Total', String(total)) +
      statCard('target', 'Active', String(active)) +
      statCard('checkCircle', 'Completed', String(completed)) +
      statCard('alertTriangle', 'Overdue', String(overdue)) +
      statCard('trendingUp', 'Completion', rate + '%');
  }



  function compareTodos(a, b) {
    if (state.sort === 'due') {
      var ad = a.dueDate || '9999-99-99';
      var bd = b.dueDate || '9999-99-99';
      if (ad !== bd) return ad < bd ? -1 : 1;
      return b.createdAt - a.createdAt;
    }
    if (state.sort === 'priority') {
      var ap = PRIORITY_RANK[a.priority] != null ? PRIORITY_RANK[a.priority] : 1;
      var bp = PRIORITY_RANK[b.priority] != null ? PRIORITY_RANK[b.priority] : 1;
      if (ap !== bp) return ap - bp;
      return b.createdAt - a.createdAt;
    }
    return b.createdAt - a.createdAt;
  }

  function computeFilteredList() {
    var q = state.search.trim().toLowerCase();
    var listId = state.activeListId;
    return state.todos.filter(function (t) {
      if (t.listId !== listId) return false;
      if (state.statusFilter === 'active' && t.done) return false;
      if (state.statusFilter === 'completed' && !t.done) return false;
      if (state.priorityFilter && t.priority !== state.priorityFilter) return false;
      if (q) {
        var hay = [t.title, t.notes].concat((t.subtasks || []).map(function (s) { return s.text; })).join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      if (!!a.done !== !!b.done) return a.done ? 1 : -1;
      return compareTodos(a, b);
    });
  }

  function renderTodoItemHtml(todo) {
    var overdue = isOverdue(todo);
    var subtasks = todo.subtasks || [];
    var subDone = subtasks.filter(function (s) { return s.done; }).length;
    var subTotal = subtasks.length;

    var dueBadge = todo.dueDate
      ? '<span class="due-badge' + (overdue ? ' overdue' : '') + '">' + ICONS.calendar + Buddy.formatDate(todo.dueDate) + '</span>'
      : '';
    var subtaskProgress = subTotal > 0
      ? '<span class="subtask-progress">' +
        '<span class="subtask-progress-ring" style="--pct:' + Math.round((subDone / subTotal) * 100) + ';"></span>' +
        '<span class="subtask-progress-text">' + subDone + '/' + subTotal + '</span>' +
        '</span>'
      : '';

    return '<div class="todo-item' + (todo.done ? ' done' : '') + (overdue ? ' overdue' : '') + '" data-id="' + todo.id + '">' +
      '<label class="checkbox-custom todo-check-wrap">' +
      '<input type="checkbox" class="todo-check" data-action="toggle"' + (todo.done ? ' checked' : '') +
      ' aria-label="Mark &quot;' + escapeHtml(todo.title || 'Untitled todo') + '&quot; as ' + (todo.done ? 'not done' : 'done') + '">' +
      '<span class="checkbox-box">' + ICONS.check + '</span>' +
      '</label>' +
      '<div class="todo-item-body">' +
      '<p class="todo-item-title">' + escapeHtml(todo.title || 'Untitled todo') + '</p>' +
      '<div class="todo-item-meta">' +
      '<span class="priority-badge priority-' + todo.priority + '">' + escapeHtml(priorityLabel(todo.priority)) + '</span>' +
      dueBadge +
      subtaskProgress +
      '</div>' +
      (todo.notes ? '<p class="todo-item-notes">' + escapeHtml(todo.notes) + '</p>' : '') +
      '</div>' +
      '<div class="todo-item-actions">' +
      '<button type="button" class="todo-action-btn" data-action="edit" title="Edit" aria-label="Edit">' + ICONS.edit + '</button>' +
      '<button type="button" class="todo-action-btn danger" data-action="delete" title="Delete" aria-label="Delete">' + ICONS.trash + '</button>' +
      '</div>' +
      '</div>';
  }

  function renderTodoList() {
    var list = computeFilteredList();
    dom.todoList.innerHTML = list.map(renderTodoItemHtml).join('');

    var totalInScope = scopedTodos().length;

    if (list.length === 0) {
      dom.emptyState.hidden = false;
      if (totalInScope === 0) {
        dom.emptyState.textContent = 'This list is empty. Click "Add Todo" to add one.';
      } else {
        dom.emptyState.textContent = 'No todos match your filters.';
      }
    } else {
      dom.emptyState.hidden = true;
    }
  }

  function renderFilterControls() {
    renderDropdown(dom.priorityFilterContainer, {
      items: [{ value: '', label: 'All priorities' }].concat(PRIORITIES.map(function (p) { return { value: p.id, label: p.label }; })),
      value: state.priorityFilter,
      ariaLabel: 'Filter by priority',
      onChange: function (value) {
        state.priorityFilter = value;
        renderCurrentView();
      }
    });

    renderDropdown(dom.sortContainer, {
      items: SORTS.map(function (s) { return { value: s.id, label: s.label }; }),
      value: state.sort,
      ariaLabel: 'Sort todos',
      onChange: function (value) {
        state.sort = value;
        renderCurrentView();
      }
    });
  }

  function updateStatusToggleVisual() {
    dom.statusToggle.querySelectorAll('.status-toggle-option').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-status-filter') === state.statusFilter);
    });
  }

  function updateViewSwitchVisual() {
    dom.viewSwitch.querySelectorAll('.view-switch-option').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view') === state.view);
    });
  }





  function renderCurrentView() {
    var isGantt = state.view === 'gantt';
    dom.todoList.hidden = isGantt;
    dom.ganttChart.hidden = !isGantt;
    if (isGantt) {
      dom.emptyState.hidden = true;
      renderGanttView();
    } else {
      dom.todoList.className = 'todo-list view-' + state.view;
      renderTodoList();
    }
  }



  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  function formatAxisDate(ms) {
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function renderGanttView() {
    var dated = computeFilteredList().filter(function (t) { return !!t.dueDate; });
    var undatedCount = computeFilteredList().length - dated.length;

    if (dated.length === 0) {
      dom.ganttChart.innerHTML = '<p class="empty-hint list-empty-hint">' +
        (computeFilteredList().length === 0
          ? 'No todos match your filters.'
          : 'None of the matching todos have a due date, so there\'s nothing to plot on the timeline.') +
        '</p>';
      return;
    }



    var bars = dated.map(function (t) {
      var start = startOfDay(new Date(t.createdAt));
      var end = startOfDay(new Date(t.dueDate + 'T00:00:00')) + MS_PER_DAY;
      if (start > end - MS_PER_DAY) start = end - MS_PER_DAY;
      return { todo: t, start: start, end: end };
    });

    var rangeStart = Math.min.apply(null, bars.map(function (b) { return b.start; }));
    var rangeEnd = Math.max.apply(null, bars.map(function (b) { return b.end; }));



    rangeStart -= MS_PER_DAY;
    rangeEnd += MS_PER_DAY;
    var minSpan = 7 * MS_PER_DAY;
    if (rangeEnd - rangeStart < minSpan) {
      var mid = (rangeStart + rangeEnd) / 2;
      rangeStart = mid - minSpan / 2;
      rangeEnd = mid + minSpan / 2;
    }
    var totalRange = rangeEnd - rangeStart;

    bars.sort(function (a, b) { return a.end - b.end || a.start - b.start; });

    var tickCount = 6;
    var ticksHtml = '';
    for (var i = 0; i < tickCount; i++) {
      var frac = i / (tickCount - 1);
      ticksHtml += '<span class="gantt-tick" style="left:' + (frac * 100) + '%;">' + formatAxisDate(rangeStart + frac * totalRange) + '</span>';
    }

    var todayMs = Date.now();
    var todayPct = todayMs >= rangeStart && todayMs <= rangeEnd ? ((todayMs - rangeStart) / totalRange) * 100 : null;
    var todayLineHtml = todayPct != null ? '<span class="gantt-today-line" style="left:' + todayPct + '%;"></span>' : '';

    var rowsHtml = bars.map(function (b) {
      var t = b.todo;
      var leftPct = Math.min(((b.start - rangeStart) / totalRange) * 100, 100);
      var widthPct = Math.min(Math.max(((b.end - b.start) / totalRange) * 100, 1.5), 100 - leftPct);
      var tip = escapeHtml(t.title || 'Untitled todo') + ' · ' + Buddy.formatDate(t.dueDate);

      return '<div class="gantt-row' + (t.done ? ' done' : '') + '" data-id="' + t.id + '">' +
        '<div class="gantt-label-col">' +
        '<span class="priority-badge priority-' + t.priority + '">' + escapeHtml(priorityLabel(t.priority)) + '</span>' +
        '<span class="gantt-row-title" title="' + escapeHtml(t.title || 'Untitled todo') + '">' + escapeHtml(t.title || 'Untitled todo') + '</span>' +
        '</div>' +
        '<div class="gantt-track-col">' +
        '<div class="gantt-track">' +
        todayLineHtml +
        '<div class="gantt-bar' + (t.done ? ' done' : ' priority-' + t.priority) + '" style="left:' + leftPct + '%;width:' + widthPct + '%;" title="' + tip + '"></div>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    dom.ganttChart.innerHTML =
      (undatedCount > 0
        ? '<p class="gantt-hint">' + undatedCount + ' matching todo' + (undatedCount === 1 ? '' : 's') + ' with no due date ' + (undatedCount === 1 ? 'isn’t' : 'aren’t') + ' shown here.</p>'
        : '') +
      '<div class="gantt-header"><div class="gantt-label-col">Todo</div><div class="gantt-track-col"><div class="gantt-ticks">' + ticksHtml + '</div></div></div>' +
      '<div class="gantt-rows" id="ganttRows">' + rowsHtml + '</div>';
  }



  function toggleDone(id, done) {
    var todo = findTodo(id);
    if (!todo) return;
    todo.done = done;
    todo.updatedAt = Date.now();
    saveTodos();
    renderListNav();
    renderStats();
    renderCurrentView();
  }

  function confirmDeleteTodo(id) {
    var todo = findTodo(id);
    if (!todo) return;
    openConfirmModal('Delete Todo', 'Delete "' + (todo.title || 'Untitled todo') + '"? This cannot be undone.', 'Delete', function () {
      state.todos = state.todos.filter(function (t) { return t.id !== id; });
      saveTodos();
      renderListNav();
      renderStats();
      renderCurrentView();
    }, { danger: true });
  }



  function subtaskRowHtml(subtask) {
    return '<div class="subtask-row">' +
      '<label class="checkbox-custom subtask-check-wrap">' +
      '<input type="checkbox"' + (subtask && subtask.done ? ' checked' : '') + ' aria-label="Subtask done">' +
      '<span class="checkbox-box">' + ICONS.check + '</span>' +
      '</label>' +
      '<input type="text" class="form-control" placeholder="Subtask" value="' + (subtask ? escapeHtml(subtask.text) : '') + '">' +
      '<button type="button" class="btn btn-ghost subtask-row-remove" aria-label="Remove subtask">' + ICONS.x + '</button>' +
      '</div>';
  }

  function openNewTodoModal() {
    var defaultListId = state.activeListId || (state.lists[0] ? state.lists[0].id : null);
    renderTodoFormModal('Add Todo', null, defaultListId);
  }

  function openEditTodoModal(todo) {
    if (!todo) return;
    renderTodoFormModal('Edit Todo', todo, todo.listId);
  }

  function renderTodoFormModal(title, todo, defaultListId) {
    var isEdit = !!todo;
    var selectedListId = todo ? todo.listId : defaultListId;
    var selectedPriority = todo ? todo.priority : 'medium';
    var subtasksHtml = todo && todo.subtasks.length > 0 ? todo.subtasks.map(subtaskRowHtml).join('') : '';

    var html =
      '<form id="todoForm">' +
      '<div class="form-group">' +
      '<label for="todoTitle">Title</label>' +
      '<input type="text" id="todoTitle" class="form-control" value="' + (todo ? escapeHtml(todo.title) : '') + '" required>' +
      '<div class="form-error" id="todoTitleError">Title cannot be empty.</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="todoNotes">Notes (optional)</label>' +
      '<textarea id="todoNotes" class="form-control">' + (todo ? escapeHtml(todo.notes || '') : '') + '</textarea>' +
      '</div>' +
      '<div class="form-row">' +
      '<div class="form-group"><label>List</label><div id="todoListDropdown"></div></div>' +
      '<div class="form-group"><label>Priority</label><div id="todoPriorityDropdown"></div></div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="todoDueDate">Due Date (optional)</label>' +
      '<input type="date" id="todoDueDate" class="form-control" value="' + (todo ? (todo.dueDate || '') : '') + '">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Subtasks</label>' +
      '<div class="subtask-rows" id="subtaskRows">' + subtasksHtml + '</div>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnAddSubtask">' + ICONS.plus + 'Add Subtask</button>' +
      '</div>' +
      (isEdit
        ? '<div class="modal-actions-split">' +
          '<button type="button" class="btn btn-danger" id="btnDeleteTodo">Delete Todo</button>' +
          '<div class="modal-actions" style="margin-top:0;">' +
          '<button type="button" class="btn btn-ghost" id="btnCancelTodo">Cancel</button>' +
          '<button type="submit" class="btn btn-primary">Save Changes</button>' +
          '</div></div>'
        : '<div class="modal-actions">' +
          '<button type="button" class="btn btn-ghost" id="btnCancelTodo">Cancel</button>' +
          '<button type="submit" class="btn btn-primary">Add Todo</button>' +
          '</div>') +
      '</form>';

    openModal(title, html, function (body) {
      var listItems = state.lists.map(function (l) { return { value: l.id, label: l.name, icon: ICONS.list }; });
      renderDropdown(body.querySelector('#todoListDropdown'), {
        items: listItems,
        value: selectedListId,
        ariaLabel: 'List',
        onChange: function (value) { selectedListId = value; }
      });

      renderDropdown(body.querySelector('#todoPriorityDropdown'), {
        items: PRIORITIES.map(function (p) { return { value: p.id, label: p.label }; }),
        value: selectedPriority,
        ariaLabel: 'Priority',
        onChange: function (value) { selectedPriority = value; }
      });

      body.querySelectorAll('#subtaskRows .subtask-row-remove').forEach(function (btn) {
        btn.addEventListener('click', function () { btn.closest('.subtask-row').remove(); });
      });

      body.querySelector('#btnAddSubtask').addEventListener('click', function () {
        body.querySelector('#subtaskRows').insertAdjacentHTML('beforeend', subtaskRowHtml(null));
        var rows = body.querySelectorAll('#subtaskRows .subtask-row');
        var lastRow = rows[rows.length - 1];
        lastRow.querySelector('.subtask-row-remove').addEventListener('click', function () { lastRow.remove(); });
        lastRow.querySelector('input[type="text"]').focus();
      });

      body.querySelector('#btnCancelTodo').addEventListener('click', closeModal);

      if (isEdit) {
        body.querySelector('#btnDeleteTodo').addEventListener('click', function () {
          closeModal();
          confirmDeleteTodo(todo.id);
        });
      }

      body.querySelector('#todoTitle').focus();

      body.querySelector('#todoForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var titleInput = body.querySelector('#todoTitle');
        var titleVal = titleInput.value.trim();
        var titleError = body.querySelector('#todoTitleError');
        if (!titleVal) {
          titleError.classList.add('visible');
          return;
        }
        titleError.classList.remove('visible');
        if (!selectedListId) return;

        var notes = body.querySelector('#todoNotes').value.trim();
        var dueDate = body.querySelector('#todoDueDate').value;
        var subtasks = Array.from(body.querySelectorAll('#subtaskRows .subtask-row')).map(function (row) {
          var text = row.querySelector('input[type="text"]').value.trim();
          var done = row.querySelector('input[type="checkbox"]').checked;
          return text ? { id: generateId(), text: text, done: done } : null;
        }).filter(Boolean);

        var doneAlready = isEdit ? !!todo.done : false;
        var allSubtasksDone = subtasks.length > 0 && subtasks.every(function (s) { return s.done; });
        var anySubtaskUndone = subtasks.length > 0 && subtasks.some(function (s) { return !s.done; });

        function finishSave(markDone) {
          if (isEdit) {
            todo.title = titleVal;
            todo.notes = notes;
            todo.listId = selectedListId;
            todo.priority = selectedPriority;
            todo.dueDate = dueDate;
            todo.subtasks = subtasks;
            todo.done = markDone;
            todo.updatedAt = Date.now();
            saveTodos();
          } else {
            var now = Date.now();
            state.todos.unshift({
              id: generateId(),
              listId: selectedListId,
              title: titleVal,
              notes: notes,
              priority: selectedPriority,
              dueDate: dueDate,
              done: markDone,
              subtasks: subtasks,
              createdAt: now,
              updatedAt: now
            });
            saveTodos();
          }

          renderListNav();
          renderStats();
          renderCurrentView();
        }

        if (allSubtasksDone && !doneAlready) {
          closeModal();
          openConfirmModal(
            'Mark Todo Done?',
            'All subtasks are marked done. Mark this todo as done too?',
            'Yes',
            function () { finishSave(true); },
            { cancelLabel: 'No', onCancel: function () { finishSave(false); } }
          );
        } else if (doneAlready && anySubtaskUndone) {
          closeModal();
          openConfirmModal(
            'Mark Todo Not Done?',
            'This will also mark "' + titleVal + '" as not done. Continue?',
            'Yes',
            function () { finishSave(false); },
            { cancelLabel: 'No', onCancel: function () { finishSave(true); } }
          );
        } else {
          finishSave(doneAlready);
          closeModal();
        }
      });
    });
  }



  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportAllData() {
    var payload = { lists: state.lists, todos: state.todos };
    downloadFile('todobuddy-export.json', JSON.stringify(payload, null, 2), 'application/json');
  }

  function showImportError() {
    openInfoModal('Import Failed', 'Could not import that file. Make sure it is a TodoBuddy JSON export.');
  }

  function openImportConflictModal(onReplace, onAppend) {
    var html =
      '<p class="modal-message">You already have lists or todos saved. Append the imported data to what you have, ' +
      'or clean up and replace everything with the imported file?</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="btnImportAppend">Append</button>' +
      '<button class="btn btn-danger" id="btnImportReplace">Cleanup &amp; Replace</button>' +
      '</div>';
    openModal('Import Data', html, function (body) {
      body.querySelector('#btnImportAppend').addEventListener('click', function () {
        closeModal();
        onAppend();
      });
      body.querySelector('#btnImportReplace').addEventListener('click', function () {
        closeModal();
        onReplace();
      });
    }, { autoSize: true });
  }



  function remapPayload(data) {
    var incomingLists = Array.isArray(data.lists) ? data.lists : [];
    var incomingTodos = Array.isArray(data.todos) ? data.todos : (Array.isArray(data) ? data : []);

    var idMap = {};
    var newLists = incomingLists.map(function (l) {
      var nl = { id: generateId(), name: (l.name ? String(l.name).trim() : '') || 'Imported List', createdAt: l.createdAt || Date.now() };
      idMap[l.id] = nl.id;
      return nl;
    });

    var fallbackList = null;
    function resolveListId(oldId) {
      if (oldId && idMap[oldId]) return idMap[oldId];
      if (!fallbackList) {
        fallbackList = { id: generateId(), name: 'Imported', createdAt: Date.now() };
        newLists.push(fallbackList);
      }
      return fallbackList.id;
    }

    var newTodos = incomingTodos.map(function (item) {
      return {
        id: generateId(),
        listId: resolveListId(item.listId),
        title: (item.title ? String(item.title).trim() : '') || 'Untitled todo',
        notes: item.notes ? String(item.notes).trim() : '',
        priority: PRIORITY_RANK[item.priority] != null ? item.priority : 'medium',
        dueDate: item.dueDate ? String(item.dueDate) : '',
        done: !!item.done,
        subtasks: Array.isArray(item.subtasks)
          ? item.subtasks.map(function (s) { return { id: generateId(), text: String(s.text || '').trim(), done: !!s.done }; }).filter(function (s) { return s.text; })
          : [],
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now()
      };
    });

    return { lists: newLists, todos: newTodos };
  }

  function applyImportedData(remapped, replaceExisting) {
    if (replaceExisting) {
      state.lists = remapped.lists;
      state.todos = remapped.todos;
    } else {
      state.lists = state.lists.concat(remapped.lists);
      state.todos = state.todos.concat(remapped.todos);
    }
    ensureDefaultListAndMigrate();
    ensureActiveListId();
    saveLists();
    saveTodos();
    updateActiveListHeader();
    renderListNav();
    renderStats();
    renderCurrentView();
    updateListsVisibility();
  }

  function importDataFromFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try {
        data = JSON.parse(reader.result);
      } catch (e) {
        showImportError();
        return;
      }

      if (!data || (!Array.isArray(data) && !Array.isArray(data.todos))) {
        showImportError();
        return;
      }

      var remapped = remapPayload(data);
      var hasExistingData = state.todos.length > 0 || state.lists.length > 1;
      if (hasExistingData) {
        openImportConflictModal(
          function () { applyImportedData(remapped, true); },
          function () { applyImportedData(remapped, false); }
        );
      } else {
        applyImportedData(remapped, false);
      }
    };
    reader.readAsText(file);
  }

  function handleLoadSample(e) {
    e.preventDefault();
    if (window.location.protocol === 'file:') {
      openInfoModal(
        'Server Required',
        'Loading sample data needs the app to be served from a local or remote server — it can\'t read local files when index.html is opened directly from your file system. Instead, download todoBuddy_sample.json from cdnBuddy/samples and use the Import button (top-left) to load it.'
      );
      return;
    }
    fetch('https://isafuianish-dev.github.io/webapp_cdnBuddy/samples/todoBuddy_sample.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(function (parsed) {
        if (!parsed || !Array.isArray(parsed.todos) || !parsed.todos.length) throw new Error('Invalid data');
        applyImportedData(remapPayload(parsed), false);
      })
      .catch(function () {
        openInfoModal('Load Failed', 'Could not load the sample data.');
      });
  }





  function renderDropdown(container, config) {
    var items = config.items || [];
    var selectedItem = items.find(function (i) { return i.value === config.value; });

    var selectedHtml = selectedItem
      ? (selectedItem.icon || '') + '<span>' + escapeHtml(selectedItem.label) + '</span>'
      : '<span class="dropdown-placeholder">' + escapeHtml(config.placeholder || 'Select') + '</span>';

    var optionsHtml = items.map(function (item) {
      var activeClass = item.value === config.value ? ' active' : '';
      return '<button type="button" class="dropdown-option' + activeClass + '" data-value="' + escapeHtml(item.value) + '">' +
        (item.icon || '') + '<span>' + escapeHtml(item.label) + '</span></button>';
    }).join('');

    container.innerHTML =
      '<div class="dropdown">' +
      '<button type="button" class="form-control dropdown-toggle" aria-haspopup="listbox" aria-expanded="false"' +
      (config.ariaLabel ? ' aria-label="' + escapeHtml(config.ariaLabel) + '"' : '') + '>' +
      '<span class="dropdown-selected">' + selectedHtml + '</span>' +
      ICONS.chevronDown +
      '</button>' +
      '<div class="dropdown-menu" role="listbox" hidden>' + optionsHtml + '</div>' +
      '</div>';

    var dropdown = container.querySelector('.dropdown');
    var toggle = dropdown.querySelector('.dropdown-toggle');
    var menu = dropdown.querySelector('.dropdown-menu');
    var selectedDisplay = dropdown.querySelector('.dropdown-selected');

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        dropdown.classList.remove('open');
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        dropdown.classList.add('open');
        menu.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.dropdown-option').forEach(function (option) {
      option.addEventListener('click', function () {
        var value = option.getAttribute('data-value');
        var item = items.find(function (i) { return i.value === value; });
        config.value = value;
        selectedDisplay.innerHTML = item ? (item.icon || '') + '<span>' + escapeHtml(item.label) + '</span>' : '';
        menu.querySelectorAll('.dropdown-option').forEach(function (o) {
          o.classList.toggle('active', o === option);
        });
        dropdown.classList.remove('open');
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        if (typeof config.onChange === 'function') config.onChange(value);
      });
    });
  }



  var modalApi = Buddy.modal.init();
  var openModal = modalApi.open;
  var closeModal = modalApi.close;

  function openConfirmModal(title, message, confirmLabel, onConfirm, opts) {
    opts = opts || {};
    var danger = opts.danger ? 'btn-danger' : 'btn-primary';
    var html =
      '<p class="modal-message">' + escapeHtml(message) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="btnConfirmNo">' + escapeHtml(opts.cancelLabel || 'Cancel') + '</button>' +
      '<button class="btn ' + danger + '" id="btnConfirmYes">' + escapeHtml(confirmLabel) + '</button>' +
      '</div>';
    openModal(title, html, function (body) {
      body.querySelector('#btnConfirmNo').addEventListener('click', function () {
        closeModal();
        if (typeof opts.onCancel === 'function') opts.onCancel();
      });
      body.querySelector('#btnConfirmYes').addEventListener('click', function () {
        closeModal();
        onConfirm();
      });
    }, { autoSize: true });
  }

  function openInfoModal(title, message) {
    var html =
      '<p class="modal-message">' + escapeHtml(message) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-primary" id="btnInfoOk">OK</button>' +
      '</div>';
    openModal(title, html, function (body) {
      body.querySelector('#btnInfoOk').addEventListener('click', closeModal);
    }, { autoSize: true });
  }

  function openNameModal(title, defaultValue, onSave) {
    var html =
      '<div class="form-group"><label for="nameInput">Name</label>' +
      '<input type="text" id="nameInput" class="form-control" placeholder="e.g. Work"></div>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="btnNameCancel">Cancel</button>' +
      '<button class="btn btn-primary" id="btnNameSave">Save</button>' +
      '</div>';
    openModal(title, html, function (body) {
      var input = body.querySelector('#nameInput');
      input.value = defaultValue || '';
      input.focus();
      input.select();
      body.querySelector('#btnNameCancel').addEventListener('click', closeModal);
      body.querySelector('#btnNameSave').addEventListener('click', submit);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
      });
      function submit() {
        var val = input.value.trim();
        if (!val) { input.focus(); return; }
        closeModal();
        onSave(val);
      }
    }, { autoSize: true });
  }



  function cacheDom() {
    dom.btnSettings = document.getElementById('btnSettings');

    dom.listSearch = document.getElementById('listSearch');
    dom.btnNewList = document.getElementById('btnNewList');
    dom.btnExportAll = document.getElementById('btnExportAll');
    dom.fileImportData = document.getElementById('fileImportData');
    dom.fileBtnIcon = document.getElementById('fileBtnIcon');
    dom.listNav = document.getElementById('listNav');

    dom.noListsState = document.getElementById('noListsState');
    dom.mainContent = document.getElementById('mainContent');
    dom.sidebarLoadSampleHint = document.getElementById('sidebarLoadSampleHint');
    dom.linkLoadSampleSidebar = document.getElementById('linkLoadSampleSidebar');

    dom.activeListTitle = document.getElementById('activeListTitle');
    dom.btnNewTodo = document.getElementById('btnNewTodo');
    dom.todoStats = document.getElementById('todoStats');
    dom.todoSearch = document.getElementById('todoSearch');
    dom.viewSwitch = document.getElementById('viewSwitch');
    dom.statusToggle = document.getElementById('statusToggle');
    dom.priorityFilterContainer = document.getElementById('priorityFilterContainer');
    dom.sortContainer = document.getElementById('sortContainer');

    dom.todoList = document.getElementById('todoList');
    dom.emptyState = document.getElementById('emptyState');
    dom.ganttChart = document.getElementById('ganttChart');
  }

  function wireEvents() {
    dom.btnSettings.addEventListener('click', openSettingsModal);

    dom.listSearch.addEventListener('input', function () {
      state.listSearch = dom.listSearch.value;
      renderListNav();
    });
    dom.btnNewList.addEventListener('click', openNewListModal);
    dom.linkLoadSampleSidebar.addEventListener('click', handleLoadSample);
    dom.btnExportAll.addEventListener('click', exportAllData);
    dom.fileImportData.addEventListener('change', function () {
      var file = this.files[0];
      if (file) importDataFromFile(file);
      this.value = '';
    });

    dom.listNav.addEventListener('click', function (e) {
      var item = e.target.closest('.list-nav-item');
      if (!item) return;
      var id = item.getAttribute('data-id');

      if (e.target.closest('.list-edit')) { renameList(id); return; }
      if (e.target.closest('.list-delete')) { deleteList(id); return; }

      selectList(id);
    });

    dom.btnNewTodo.addEventListener('click', openNewTodoModal);

    dom.todoSearch.addEventListener('input', function () {
      state.search = dom.todoSearch.value;
      renderCurrentView();
    });

    dom.viewSwitch.addEventListener('click', function (e) {
      var btn = e.target.closest('.view-switch-option');
      if (!btn) return;
      state.view = btn.getAttribute('data-view');
      updateViewSwitchVisual();
      renderCurrentView();
    });

    dom.statusToggle.addEventListener('click', function (e) {
      var btn = e.target.closest('.status-toggle-option');
      if (!btn) return;
      state.statusFilter = btn.getAttribute('data-status-filter');
      updateStatusToggleVisual();
      renderCurrentView();
    });

    dom.todoList.addEventListener('change', function (e) {
      var checkbox = e.target.closest('.todo-check');
      if (!checkbox) return;
      var item = checkbox.closest('.todo-item');
      var id = item.getAttribute('data-id');
      var done = checkbox.checked;
      var todo = findTodo(id);

      if (done && todo && (todo.subtasks || []).length > 0) {
        checkbox.checked = false;
        openConfirmModal('Mark All Subtasks Done?', 'This will mark all subtasks as done. Continue?', 'Continue', function () {
          todo.subtasks.forEach(function (s) { s.done = true; });
          toggleDone(id, true);
        });
        return;
      }

      if (!done && todo && (todo.subtasks || []).length > 0) {
        checkbox.checked = true;
        openConfirmModal('Mark All Subtasks Not Done?', 'This will mark all subtasks as not done. Continue?', 'Continue', function () {
          todo.subtasks.forEach(function (s) { s.done = false; });
          toggleDone(id, false);
        });
        return;
      }

      toggleDone(id, done);
    });

    dom.todoList.addEventListener('click', function (e) {
      var item = e.target.closest('.todo-item');
      if (!item) return;
      var id = item.getAttribute('data-id');

      var actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        var action = actionBtn.getAttribute('data-action');
        if (action === 'edit') { openEditTodoModal(findTodo(id)); return; }
        if (action === 'delete') { confirmDeleteTodo(id); return; }
        return;
      }

      if (e.target.closest('.todo-item-body')) {
        openEditTodoModal(findTodo(id));
      }
    });

    dom.ganttChart.addEventListener('click', function (e) {
      var row = e.target.closest('.gantt-row');
      if (!row) return;
      openEditTodoModal(findTodo(row.getAttribute('data-id')));
    });

    document.addEventListener('click', function (e) {
      document.querySelectorAll('.dropdown.open').forEach(function (dd) {
        if (dd.contains(e.target)) return;
        dd.classList.remove('open');
        var menu = dd.querySelector('.dropdown-menu');
        if (menu) menu.hidden = true;
        var toggle = dd.querySelector('.dropdown-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function init() {
    cacheDom();
    dom.btnSettings.innerHTML = ICONS.settings;
    dom.btnExportAll.innerHTML = ICONS.download;
    dom.fileBtnIcon.innerHTML = ICONS.upload;
    dom.viewSwitch.querySelector('[data-view="list"]').innerHTML = ICONS.list;
    dom.viewSwitch.querySelector('[data-view="grid"]').innerHTML = ICONS.grid;
    dom.viewSwitch.querySelector('[data-view="waterfall"]').innerHTML = ICONS.layers;
    dom.viewSwitch.querySelector('[data-view="gantt"]').innerHTML = ICONS.barChart;

    state.lists = loadLists();
    state.todos = loadTodos();
    ensureDefaultListAndMigrate();
    ensureActiveListId();

    updateActiveListHeader();
    updateStatusToggleVisual();
    updateViewSwitchVisual();
    renderListNav();
    renderFilterControls();
    renderStats();
    renderCurrentView();
    updateListsVisibility();

    wireEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
