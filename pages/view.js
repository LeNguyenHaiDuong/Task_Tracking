class View {
    constructor() {
        // Lấy các phần tử nút và chế độ view
        this.viewMode = "Kanban"; // Mặc định là Kanban
        this.taskViews = {
            Kanban: document.querySelector("#Kanban"),
            Calendar: document.querySelector("#Calendar"),
            Stats: document.querySelector("#Stats")
        };

        this.buttons = {
            Kanban: document.getElementById("kanbanBtn"),
            Calendar: document.getElementById("calendarBtn"),
            Stats: document.getElementById("statsBtn")
        };

        this.tasksContainer = this.taskViews[this.viewMode];

        this.render();
        this.addEventListeners();
    }
        

    addEventListeners() {
        Object.entries(this.buttons).forEach(([view, button]) => {
            button.addEventListener("click", () => this.switchView(view));
        });
    }

    // Hàm chuyển chế độ view
    async switchView(viewName) {
        Object.values(this.taskViews).forEach(view => view.style.display = "none");

        this.viewMode = viewName;
        this.tasksContainer = this.taskViews[this.viewMode];
        this.tasksContainer.style.display = this.viewMode === "Kanban" ? "grid" : "block";

        await this.render();
    }


    async render() {
        console.log("View mode:", this.viewMode);
        if (!this.tasksContainer.innerHTML) {
            console.log("Render view mode:", this.viewMode);
            // Nếu tasksContainer chưa từng được render trước đây, gọi render tương ứng với viewMode
            if (this.viewMode === "Kanban") {
                await this.renderKanban();
            } else if (this.viewMode === "Calendar") {
                await this.renderCalendar();
            } else if (this.viewMode === "Stats") {
                await this.renderStats();
            }
        }
    }

    // Hàm render tasks vào giao diện
    async renderKanban() {
        this.tasksContainer.innerHTML = ""; // Xóa nội dung cũ
    
        // Các trạng thái cố định
        const fixedStatuses = ['To do', 'Event', 'Today task', 'Expired'];

        // Tạo các cột cho từng trạng thái
        fixedStatuses.forEach(status => {
            const columnElement = document.createElement("div");
            columnElement.classList.add("project-column");
            columnElement.setAttribute("data-status", status);
        
            // Cấu trúc cột với tiêu đề và phần chứa task
            columnElement.innerHTML = `
                <div class='project-column-heading' data-status="${status}">
                <h2 class='project-column-heading__title'>${status}</h2>
                </div>
                <div class="task-list"></div>
            `;

            const taskListElement = columnElement.querySelector(".task-list"); // Phần chứa task

            window.tasksData
                .filter(task => task.status === status)
                .forEach(task => {
                    const taskElement = task.taskHTML();
                    taskListElement.appendChild(taskElement);
                });
        
            // Thêm cột vào container
            this.tasksContainer.appendChild(columnElement);
        });
    
        this.projectColumns = document.querySelectorAll('.project-column');
        this.addDragEvents(); // Thêm sự kiện kéo thả vào các task
    
    }

    // Cho phép phần tử được thả vào cột
    handleDragOver(e) {
        e.preventDefault(); // Cho phép thả
        e.dataTransfer.dropEffect = 'move'; // Chỉ cho phép di chuyển
    }

    // Khi con trỏ kéo vào cột
    handleDragEnter(e) {
        if (e.currentTarget.classList.contains('project-column')) {
            e.currentTarget.classList.add('column-hover');
        }
    }

    // Khi con trỏ rời khỏi cột
    handleDragLeave(e) {
        if (e.currentTarget.classList.contains('project-column')) {
            e.currentTarget.classList.remove('column-hover');
        }
    }

    // Khi thả task vào cột mới
    handleDrop(e) {
        e.stopPropagation(); // Ngăn trình duyệt thực hiện hành vi mặc định

        const taskList = e.currentTarget.querySelector('.task-list');
        if (taskList) {
            taskList.appendChild(window.dragSrcEl);
        }
        
        return false;
    }

    // Gán sự kiện kéo thả cho các cột trong Kanban
    addDragEvents() {
        this.projectColumns.forEach((column) => {
            column.addEventListener('dragover', (e) => this.handleDragOver(e), false);
            column.addEventListener('dragenter', (e) => this.handleDragEnter(e), false);
            column.addEventListener('dragleave', (e) => this.handleDragLeave(e), false);
            column.addEventListener('drop', (e) => this.handleDrop(e), false);
        });
    }

    

    async renderCalendar() {
        // Logic render Calendar
    }

    async renderStats() {
        // Logic render Stats
    }
    
}
  

export default View;