class Task {
    constructor({
      task_name = null,
      description = null,
      status = null,
      deadline = null,
      duration = null,
      created_at = new Date().toISOString().slice(0, 19),
      remaining_time = null,
      done = false,
      taskElement = null
    } = {}) {
        this.task_name = task_name;
        this.description = description;
        this.status = status;
        this.deadline = deadline;
        this.duration = duration;
        this.created_at = created_at;
        this.done = done;
        this.remaining_time = remaining_time;
        this.taskElement = taskElement;
    }
  
    // Hàm đảo ngược trạng thái "đã hoàn thành" của task
    async markDone() {
        this.done = !this.done;

        if (this.taskElement) {
          if (this.done) {
            this.taskElement.classList.add("task-done"); // Thêm class khi hoàn thành
          } else {
            this.taskElement.classList.remove("task-done"); // Xóa class nếu chưa hoàn thành
          }
        }
    
        const { data, error } = await window.supabase.from('Task')
          .update({ done: this.done}) 
          .eq('created_at', this.created_at.trim());
    }

    async deleteTask() {
      console.log("Attempting to delete task with created_at:", this.created_at);
    
      this.taskElement.remove();
      console.log("Task deleted successfully!");
  
      const { error } = await window.supabase.from('Task')
        .delete()
        .eq('created_at', this.created_at);
    }

    // Hàm để kiểm tra và cập nhật trạng thái dựa trên deadline
    updateTaskStatusBasedOnDeadline() {
        const now = new Date();
        const deadlineDate = new Date(this.deadline);
        const deadlineOnlyDate = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());  // Lấy ngày hiện tại không có giờ
        const timeDiff = deadlineDate - now;

        const durationMs = (this.duration !== null && this.duration !== "") ? this.duration * 60 * 1000 : 0; // Chuyển duration từ phút sang ms
        
        if (timeDiff <= 0 && Math.abs(timeDiff) <= durationMs) {
            // Kiểm tra đang trong thời gian event hoạt động
            this.updateTaskStatus("Today task");
        } else if (deadlineOnlyDate.getTime() === nowDate.getTime() && timeDiff + durationMs >= 0) {
            // Kiểm tra nếu deadline (bắt đầu hoặc kết thúc) là hôm nay, cập nhật status thành "Today task"
            this.updateTaskStatus("Today task");
        } else if (timeDiff > 0) {
            if (this.duration !== null && this.duration !== "") {
                this.updateTaskStatus("Event");
            } else {
                this.updateTaskStatus("To do");
            }
        } else {
            this.updateTaskStatus("Expired"); 
        }
        return this.taskStatus(timeDiff);
    }


    // Hàm cập nhật trạng thái task trong supabse
    async updateTaskStatus(status) {
        if (this.status === status) return;
        this.status = status;
        const { error } = await window.supabse
            .from('Task')
            .update({ status: status })
            .eq('created_at', this.created_at);
        if (error) {
            console.error("Error updating task status:", error);
        }
    }

    // Hàm trả về "thời gian còn lại" hiển thị trên task
    taskStatus(timeDiff) {
        if (this.duration !== null) {
          const durationMs = this.duration * 60 * 1000; // Chuyển duration từ phút sang ms
          if (timeDiff <= 0 && Math.abs(timeDiff) <= durationMs) {
            this.remaining_time = "In Progress"; // Nếu đã bắt đầu nhưng chưa hết thời gian
            return;
          }
        }
    
        if (timeDiff > 0) {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          this.remaining_time = `${days}d ${hours}h ${minutes}m`;
        } else {
          this.remaining_time = "Expired"; // Quá thời gian diễn ra
        }
    }


    innerHTML() {
      return `
          <div class='task__tags'>
              <p>${this.task_name}</p>
              <div class="dropdown">
                <button class='dropdown-btn'>⋮</button>
                <ul class="dropdown-menu">
                  <li class="dropdown-item" data-action="delete" data-id="${this.created_at}">Delete</li>
                  <li class="dropdown-item" data-action="done" data-id="${this.created_at}">Done</li>
                  <li class="dropdown-item" data-action="edit" data-id="${this.created_at}">Edit</li>
                </ul>
              </div>
          </div>
          <a>${this.description}</a>
          <div class='task__stats'>
              <span>
                  <time datetime="${this.deadline}">
                      <i class="fas fa-flag"></i> ${new Date(this.deadline).toLocaleString()}
                  </time>
              </span>
              <span class="remaining-time">
                  ⏳${this.remaining_time}
              </span>
          </div>
        `;
    }

    // Hàm trả về thời gian hiển thị trong task
    taskHTML() {
        this.taskElement = document.createElement("div");
        this.taskElement.classList.add("task");
        this.taskElement.setAttribute("draggable", "true");
        this.taskElement.dataset.taskId = this.created_at;       
    
        // Thêm class 'task-done' nếu task đã hoàn thành
        if (this.done) {
          this.taskElement.classList.add("task-done");
        }
    
        this.taskElement.innerHTML = this.innerHTML();

        this.addEvents();

        return this.taskElement;
    }

    toggleDropdown() {
      // Đóng tất cả dropdown khác
      document.querySelectorAll(".dropdown").forEach((el) => {
        if (el !== this.dropdownButton.parentElement) {
          el.classList.remove("open");
        }
      });
  
      // Toggle dropdown hiện tại
      this.dropdownButton.parentElement.classList.toggle("open");
    }

    async insertTask() {
        const { error } = await window.supabase.from('Task').insert([{
            created_at: this.created_at,
            task_name: this.task_name,
            description: this.description,
            deadline: this.deadline, // Đổi tên cho phù hợp với logic ban đầu
            duration: this.duration, // Chỉ thêm nếu là Event hoặc Interview
            done: false
        }]);
    }

    editTask() {
      // Hiển thị modal và với thông tin điền sẵn của task này
      window.modal.open(this);
    }

    async updateTask() {

      this.task_name = window.modal.taskNameInput.value;
      this.description = window.modal.taskDescriptionInput.value;
      this.deadline = window.modal.taskDeadlineInput.value;
      this.duration = window.modal.taskDurationInput.value;
    
      // Cập nhật task trong Supabase
      const { data, error } = await window.supabase.from('Task')
        .update({
          task_name: this.task_name,
          description: this.description,
          deadline: this.deadline,
          duration: this.duration || null, // Chỉ cập nhật duration nếu có
        })
        .eq('created_at', this.created_at);
    
      if (error) {
        console.error("Error updating task:", error);
      } else {
        console.log("Task updated successfully:", data);
        console.log('New task:', this);
  
        // B1: Tìm task hiện tại và xóa khỏi task-list cũ
        const oldTaskList = this.taskElement.closest(".task-list");
        if (oldTaskList) oldTaskList.removeChild(this.taskElement);
        
        // B2: Cập nhật lại trạng thái dựa trên deadline
        this.updateTaskStatusBasedOnDeadline(); // Cập nhật lại status
  
        // B3: Render lại HTML task mới
        this.taskHTML();
  
        // B4: Tìm task-list trong project-column có data-status mới
        const newColumn = document.querySelector(`.project-column[data-status="${this.status}"]`);
        let newTaskList = newColumn.querySelector(".task-list");
  
        // B5: Thêm task mới vào task-list mới
        newTaskList.appendChild(this.taskElement);
    
      }
    }

    // Hàm cập nhật trạng thái task trong Supabase
    async updateTaskStatus(status) {
        if (this.status === status) return;
        this.status = status;
        const { error } = await supabase
            .from('Task')
            .update({ status: status })
            .eq('created_at', this.created_at);
    }

    // Xử lý sự kiện khi bắt đầu kéo
    handleDragStart(e) {
      window.dragSrcEl = this.taskElement; // Lưu lại phần tử đang bị kéo
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.taskElement.innerHTML); // Lưu dữ liệu thả
    }

    // Khi kết thúc kéo thả
    handleDragEnd(e) {
      document.querySelectorAll('.project-column').forEach(column => {
          column.classList.remove('column-hover');
      });
    }

    // Thêm sự kiện kéo thả vào phần tử task
    addEvents() {

      // Thêm sự kiện mở dropdown cho nút ⋮
      this.dropdownButton = this.taskElement.querySelector(".dropdown-btn");
      this.dropdownButton.addEventListener("click", (event) => {
          event.stopPropagation();
          this.toggleDropdown();
      });
  
      // Thêm sự kiện xử lý menu option
      this.taskElement.querySelectorAll(".dropdown-item").forEach(item => {
        item.addEventListener("click", (event) => {
          const action = item.dataset.action;
          
          window.dragSrcEl = this; // Lưu lại task đang được chọn
          if (action === "delete") this.deleteTask();
          if (action === "done") this.markDone();
          if (action === "edit") this.editTask();
        });
      });

      // Thêm sự kiện kéo thả cho task
      this.taskElement.addEventListener('dragstart', (e) => this.handleDragStart(e), false);
      this.taskElement.addEventListener('dragend', (e) => this.handleDragEnd(e), false);
    }
    
}
  
export default Task;