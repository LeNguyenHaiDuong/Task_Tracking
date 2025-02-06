import Task from './task.js';

class Modal {
    constructor() {
        // Trường dữ liệu
        this.taskDescriptionInput = document.getElementById('taskDescription');
        this.taskStatusInput = document.getElementById('taskStatus');
        this.taskDeadlineInput = document.getElementById('taskDeadline');
        this.taskDurationInput = document.getElementById('taskDuration');
        this.taskNameInput = document.getElementById('taskName');
        
        // Trường label
        this.modalHeader = document.querySelector('.modal-header h2');
        this.taskNameLabel = document.getElementById('taskName');
        this.taskDurationLabel = document.getElementById('durationContainer');
        this.taskDeadlineLabel = document.getElementById('taskDeadlineLabel');

        // Button
        this.saveTaskBtn = document.getElementById("saveTask");
        this.editButton = document.getElementById("editTask");
        this.openModalBtn = document.getElementById("openTaskModal");
        this.closeModal = document.getElementById("closeTaskModal");
        
        // Modal
        this.modal = document.getElementById("taskModal");
        this.background = document.getElementById('overlay');
    }
    
    open(task = null) {
        if (task === null) {
            // Đặt trạng thái về "To do"
            this.taskStatusInput.value = "To do";
                
            // Ẩn trường Duration vì "To do" không cần
            this.taskDurationLabel.style.display = "none";

            // Đặt lại nhãn deadline
            this.taskDeadlineLabel.textContent = "Deadline:";

            this.modalHeader.textContent = 'Add Task';

            this.editButton.style.display = "none";   // Ẩn nút "Save Changes"
            this.saveTaskBtn.style.display = "block";  // Hiện nút "Add Task"
        } else {
            this.modalHeader.textContent = 'Edit Task';
            this.saveTaskBtn.style.display = "none";
            this.editButton.style.display = "block";   // Hiện nút "Save Changes"
            // Điền các giá trị có sẵn vào các input
            this.taskNameLabel.value = task.task_name;
            this.taskDescriptionInput.value = task.description;
            
            if (task.duration !== null ) {
                this.taskDurationInput.value = task.duration;
                this.taskStatusInput.value = 'Event';
                // this.taskDurationLabel.style.display = "block";
                this.taskDeadlineLabel.textContent = "Start at:";
            } else {
                this.taskStatusInput.value = 'To do';
                this.taskDurationInput.value = task.duration;
                // this.taskDurationLabel.style.display = "none";
                this.taskDeadlineLabel.textContent = "Deadline:";
            }

            const deadlineDate = new Date(task.deadline);
            this.taskDeadlineInput.value = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000)
                                    .toISOString()
                                    .slice(0, 16);
        }

        // Hiển thị modal
        this.modal.style.display = 'block';
        this.background.style.display = 'block';
    }
  
    close() {
        this.modal.style.display = 'none';
        this.background.style.display = 'none';
    }
  
    restartModalValue() {
        // Xóa nội dung của các input
        this.taskNameInput.value = null;
        this.taskDescriptionInput.value = null;
        this.taskDurationInput.value = null;
        this.taskDeadlineInput.value = null;
    }

  
    getTaskData() {
      return {
        name: this.taskNameInput.value,
        description: this.taskDescriptionInput.value,
        status: this.taskStatusInput.value,
        deadline: this.taskDeadlineInput.value,
        duration: this.taskDurationInput.value
      };
    }
  
    
    // Bổ sung các sự kiện vào modal
    addEventListeners() {
        // Cập nhật sự kiện của nút Edit
        this.editButton.onclick = async () => {
            window.dragSrcEl.updateTask(); // 'dragSrcEl' là phần tử đang chỉnh sửa
            this.close(); // Đóng modal sau khi cập nhật
        };

        // Hiển thị modal khi nhấn vào nút "+ Add Task"
        this.openModalBtn.addEventListener("click", () => {
            this.open(); // Mở modal và làm mới các giá trị
            this.restartModalValue(); // Làm mới giá trị các input
        });

        // Ẩn modal khi nhấn vào nút đóng
        this.closeModal.addEventListener("click", () => {
            this.close(); // Đóng modal
        });

        // Đóng modal khi click vào overlay
        window.addEventListener("click", (event) => {
            if (event.target === this.background) {
                this.close(); // Đóng modal khi click vào overlay
            }
        });

        // Lưu task khi nhấn nút Save
        this.saveTaskBtn.addEventListener("click", async () => {
            try {
                let flag = false;
                do {
                    flag = await this.createTask(); // Đảm bảo tạo task đồng bộ
                } while (flag === false); // Lặp lại cho đến khi tạo task thành công
    
                this.close(); // Đóng modal
            } catch (error) {
                console.error("Error saving task:", error);
            }
        });

        // Thay đổi trạng thái của Duration khi thay đổi Status giữa Event và To do
        this.taskStatusInput.addEventListener("change", function () {
            const durationContainer = document.getElementById("durationContainer");
            const deadlineLabel = document.getElementById("taskDeadlineLabel");
        
            if (this.value === "Event") {
                durationContainer.style.display = "block";
                deadlineLabel.textContent = "Start at:";
            } else {
                durationContainer.style.display = "none";
                deadlineLabel.textContent = "Deadline:";
            }
        });
    }
    
    fromModal() {
        // Trả về task mới từ modal
        return new Task({
            task_name: this.taskNameInput.value,
            description: this.taskDescriptionInput.value,
            status: this.taskStatusInput.value,
            deadline: this.taskDeadlineInput.value,
            duration: this.taskDurationInput.value === "Event" ? this.taskDurationInput.value : null
        });
    }
    
    async createTask() {
        
        // Lấy giá trị từ các trường nhập liệu
        let task = this.fromModal();
        
        // Kiểm tra điều kiện cụ thể đối với Event hoặc Interview
        if (task.status === "Event") {
            task.duration = document.getElementById("taskDuration").value;
        }
        
        // Kiểm tra xem các trường nhập liệu có hợp lệ không
        if (!task.task_name || !task.description || !task.deadline || (task.duration !== null && !task.duration)) {
            alert("All fields are required!"); // Nếu có trường rỗng, hiển thị cảnh báo
            return false;
        }
        
        // Thêm task vào Supabase
        await task.insertTask(); // Đảm bảo là hàm insertTask là bất đồng bộ

        task.updateTaskStatusBasedOnDeadline(); // Cập nhật trạng thái dựa trên deadline

        
        // Render task HTML
        task.taskHTML();

        // Tìm cột có status tương ứng
        const newColumn = document.querySelector(`.project-column[data-status="${task.status}"]`);
        let newTaskList = newColumn.querySelector(".task-list");

        // Thêm task vào cột
        newTaskList.appendChild(task.taskElement);
        return true;
    
    }

    
    
}
  

export default Modal;