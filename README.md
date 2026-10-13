# Todo Buddy

A fast, no-fuss to-do list for organizing your tasks into lists, with priorities, due dates, subtasks, and multiple ways to view your work.

Todo Buddy helps you keep track of everything you need to do — from quick one-off reminders to multi-step projects. Group your tasks into lists (like "Work," "Home," or "Groceries"), give each task a priority and a due date, break bigger tasks into subtasks, and switch between list, grid, waterfall, or timeline views depending on how you like to see your day. Everything you enter is saved automatically and stays entirely on your own device.

## Features

### Lists
- Organize your tasks into as many named lists as you like (e.g. "Work," "Personal," "Errands").
- An **All Todos** view sits above your lists and shows every task from every list at once.
- Each list in the sidebar shows how many open (not-yet-done) tasks it contains.
- Rename or delete a list using the pencil and trash icons that appear when you hover over (or focus) a list in the sidebar. Deleting a list also deletes every task inside it, and you'll be warned first.
- Search your lists by name using the search box at the top of the sidebar.

### Tasks (Todos)
Every task can have:
- **Title** — required, shown in bold at the top of the task.
- **Notes** — an optional free-text description shown under the title.
- **List** — which list the task belongs to.
- **Priority** — High, Medium, or Low, shown as a colored badge (red for High, amber for Medium, blue for Low).
- **Due date** — optional. Tasks past their due date and not yet completed are flagged as **overdue** with a red badge and a red left-edge stripe on the task card.
- **Subtasks** — an optional checklist within a task (see below).

Click **Add Todo** to create a new task, or click anywhere on an existing task's body (or its edit icon) to open it for editing. Each task also has a delete icon that appears on hover.

### Subtasks (checklists within a task)
- While adding or editing a task, click **Add Subtask** to add as many checklist items as you need, each with its own checkbox.
- Remove a subtask row with the small "x" button next to it.
- Tasks with subtasks show a small ring-shaped progress indicator (e.g. "2/3") in their meta row, filling in as subtasks are completed.
- Helpful automatic prompts keep the parent task and its subtasks in sync:
  - If you finish the last remaining subtask, Todo Buddy asks whether you'd like to mark the whole task as done too.
  - If you check off a task that still has subtasks, it asks to confirm marking all subtasks done as well.
  - If you un-check a task that still has subtasks, it asks to confirm marking all subtasks as not done.
  - If you edit a completed task and leave a subtask unchecked, it asks whether the task should be reopened.

### Completing tasks
- Click the checkbox on any task to mark it done or not done.
- Completed tasks get a subtle green background and a strikethrough title, and automatically sort to the bottom of the list.

### Searching and filtering
- The **Search todos** box searches task titles, notes, and subtask text at the same time — matching tasks appear instantly as you type.
- The **All / Active / Completed** toggle narrows the list to everything, only unfinished tasks, or only finished tasks.
- The **priority filter** dropdown narrows the list to a single priority level (or shows all).
- The **sort** dropdown reorders tasks by Newest First, Due Date, or Priority (regardless of sort, completed tasks always sink to the bottom).
- All filters, search terms, and sort order work together and combine with whichever list (or "All Todos") you currently have selected.

### Views
Use the four view icons in the toolbar to change how your tasks are displayed:
- **List view** — a simple vertical stack of task cards, one per row.
- **Grid view** — task cards arranged in an even grid of columns.
- **Waterfall view** — a Pinterest-style masonry layout where cards flow into columns based on their height.
- **Gantt (timeline) view** — a horizontal timeline chart. Each task with a due date gets a bar spanning from when it was created to its due date, color-coded by priority (or green if completed). A vertical line marks today's date, and clicking a row opens that task for editing. Tasks with no due date aren't shown on the timeline, but a note tells you how many are being left out.

### Dashboard stats
At the top of the main panel, five stat cards summarize the tasks in your current view (the selected list, or all lists):
- **Total** tasks
- **Active** (not yet completed) tasks
- **Completed** tasks
- **Overdue** tasks (past their due date and not done)
- **Completion** rate, as a percentage

These numbers update live as you add, complete, filter, or delete tasks.

### Import and export
- Click the download icon (next to "New List") to **export** all of your lists and tasks as a single JSON file you can keep as a backup or move to another device.
- Click the upload icon to **import** a previously exported JSON file. If you already have data saved, you'll be asked whether to:
  - **Append** the imported lists/tasks alongside what you already have, or
  - **Cleanup & Replace** everything with the contents of the imported file.
- If the app can't recognize a file as a valid Todo Buddy export, it will let you know rather than importing bad data.

### Sample data
If you're just getting started with an empty list, or from the "no lists yet" screen, you can click the "load some sample todos" link to instantly populate the app with example lists and tasks — a quick way to see the app in action or explore its features risk-free.

### Customization (Settings)
Open **Settings** (gear icon, top right) to personalize the app's look:
- **Theme** — switch between Light and Dark mode.
- **Accent color** — choose from six accent colors (Indigo, Blue, Green, Rose, Amber, Purple) to tint buttons, highlights, and active states throughout the app.

Your theme and accent choices are remembered the next time you open the app.

## How to Use

1. **Create a list.** Click **New List** in the sidebar and give it a name (e.g. "Work"). If you don't have any lists yet, use the **New List** button on the welcome screen instead.
2. **Add a task.** With a list selected (or "All Todos"), click **Add Todo**. Fill in a title, and optionally add notes, pick a list, set a priority, choose a due date, and add subtasks.
3. **Track your progress.** Check tasks off as you complete them, and watch the stat cards and subtask progress rings update.
4. **Organize as you go.** Use the status toggle, priority filter, and sort dropdown to focus on what matters right now — for example, filter to "Active" + "High" priority and sort by "Due Date" to see what's most urgent.
5. **Switch views** depending on the moment: List for a straightforward read, Grid or Waterfall for a visual overview, or Gantt to see how your due dates are spread out over time.
6. **Back up your data** occasionally using Export, especially before clearing your browser data.

## Tips & Shortcuts

- Clicking anywhere on a task's title or notes (not just the edit icon) opens it for editing.
- Hover over a task or list item to reveal its edit/delete controls — they're hidden by default to keep the interface clean (on touch devices, these controls are always visible).
- In Gantt view, click directly on a row to jump straight into editing that task.
- The "All Todos" view is the fastest way to see everything across every list at once, including an overall completion percentage.
- Searching works across notes and subtasks too, so you can find a task even if you only remember a detail buried in a checklist item or description.
- If a task has no due date, it simply won't appear on the Gantt timeline — give it a due date if you want to track it there.
- Deleting a list is permanent and takes its tasks with it, so export a backup first if you're unsure.

## Your Data

All of your lists and tasks are stored locally in your browser (nothing is uploaded anywhere or shared with anyone). This means your data stays private to the device and browser you're using, will persist across visits, but won't automatically appear on another device or browser unless you export and import it there yourself.
