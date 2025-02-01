import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
const supabaseKey=import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase Instance: ', supabase)





document.addEventListener("DOMContentLoaded", async function () {

  const tasksContainer = document.querySelector(".project-tasks");
  const saveTaskBtn = document.getElementById("saveTask");
  let dragSrcEl = null;
  let tasksData = null;

  // Hàm lấy dữ liệu tasks từ Supabase
  async function fetchTasks() {
    const { data: tasks, error } = await supabase.from('Task').select('*');
    if (error) {
        console.log("Error fetching tasks:", error);
        return [];
    }
    console.log("Done getting data:", tasks);
    return tasks;
  }

  function taskStatus(task, timeDiff) {
    if (task.duration !== null) {
      const durationMs = task.duration * 60 * 1000; // Chuyển duration từ phút sang ms
      if (timeDiff <= 0 && Math.abs(timeDiff) < durationMs) {
        return "In Progress"; // Nếu đã bắt đầu nhưng chưa hết thời gian
      }
    }

    if (timeDiff > 0) {
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `${days}d ${hours}h ${minutes}m`;
    } else {
      return "Expired"; // Quá thời gian diễn ra
    }
  }

  function taskHTML(task, remainingTime) {
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");
    taskElement.setAttribute("draggable", "true");
    taskElement.dataset.taskId = task.created_at;       

    // Thêm class 'task-done' nếu task đã hoàn thành
    if (task.done) {
      taskElement.classList.add("task-done");
    }

    taskElement.innerHTML =  `
      <div class='task__tags'>
          <p>${task.task_name}</p>
          <div class="dropdown">
            <button class='dropdown-btn'>⋮</button>
            <ul class="dropdown-menu">
              <li class="dropdown-item" data-action="delete" data-id="${task.created_at}">Delete</li>
              <li class="dropdown-item" data-action="done" data-id="${task.created_at}" data-done="${task.done}">Done</li>
              <li class="dropdown-item" data-action="edit" data-id="${task.created_at}">Edit</li>
            </ul>
          </div>
      </div>
      <a>${task.description}</a>
      <div class='task__stats'>
          <span>
              <time datetime="${task.deadline}">
                  <i class="fas fa-flag"></i> ${new Date(task.deadline).toLocaleString()}
              </time>
          </span>
          <span class="remaining-time">
              ⏳${remainingTime}
          </span>
      </div>
    `;


    // Thêm sự kiện mở dropdown cho nút ⋮
    const dropdownButton = taskElement.querySelector(".dropdown-btn");
    dropdownButton.addEventListener("click", function (event) {
        event.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
        toggleDropdown(this);
    });

    // Thêm sự kiện xử lý menu option
    taskElement.querySelectorAll(".dropdown-item").forEach(item => {
      item.addEventListener("click", function () {
        const action = this.dataset.action;
        const taskId = this.dataset.id;
        const taskDone = this.dataset.done === "true";

        // Lấy thông tin task từ danh sách tasksData
        dragSrcEl = tasksData.find(t => t.created_at === taskId);
        if (action === "delete") deleteTask(taskId);
        if (action === "done") markDone(dragSrcEl);
        if (action === "edit") editTask(dragSrcEl);
      });
    });


    return taskElement;
  }

  // Hàm render tasks vào giao diện
  async function renderTasks() {
    tasksContainer.innerHTML = ""; // Xóa nội dung cũ
    tasksData = await fetchTasks();
  
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
  
      // Duyệt qua các task và thêm vào cột nếu trạng thái của task khớp với cột
      tasksData.forEach(task => {
        let remainingTime = updateTaskStatusBasedOnDeadline(task);

        if (task.status == status) {
          const taskElement = taskHTML(task, remainingTime);    
          // Thêm task vào trong cột
          taskListElement.appendChild(taskElement);
        }
      });
  
      // Thêm cột vào container
      tasksContainer.appendChild(columnElement);

      
    });
  
    addDragEvents(); // Thêm sự kiện kéo thả vào các task
  }
  
  function toggleDropdown(button) {
    // Đóng tất cả dropdown khác
    document.querySelectorAll(".dropdown").forEach((el) => {
      if (el !== button.parentElement) {
        el.classList.remove("open");
      }
    });

    // Toggle dropdown hiện tại
    button.parentElement.classList.toggle("open");
  }

  // Đóng dropdown khi click ra ngoài
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown").forEach((el) => {
          el.classList.remove("open");
      });
    }
  });

  window.markDone = async function (task) {
    task.done = !task.done;
    const { data, error } = await supabase.from('Task')
      .update({ done: task.done}) 
      .eq('created_at', task.created_at.trim());

    if (error) {
      console.error("Lỗi cập nhật trạng thái task:", error.message);
    } else {
      console.log("Cập nhật thành công:", data);
      // Tìm taskElement dựa trên `data-task-id`
      const taskElement = document.querySelector(`[data-task-id='${task.created_at}']`);
      
      if (taskElement) {
        if (task.done) {
          taskElement.classList.add("task-done"); // Thêm class khi hoàn thành
        } else {
          taskElement.classList.remove("task-done"); // Xóa class nếu chưa hoàn thành
        }
      }
    }
  }

  window.deleteTask = async function (created_at) {
    console.log("Attempting to delete task with created_at:", created_at);
  
    const { error } = await supabase.from('Task')
      .delete()
      .eq('created_at', created_at.trim());  // Dùng trim để loại bỏ khoảng trắng
  
    if (error) {
      console.error("Error deleting task:", error);
    } else {
      const taskElement = document.querySelector(`[data-task-id='${created_at}']`);
      if (taskElement) {
        taskElement.remove();
        console.log("Task deleted successfully!");
      }
    }
  }
  
  function editTask(task) {
    // Mở modal
    modal.style.display = "block";
    background.style.display = "block";

    const taskNameInput = document.getElementById('taskName');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskStatusInput = document.getElementById('taskStatus');
    const taskDeadlineInput = document.getElementById('taskDeadline');
    const taskDurationInput = document.getElementById('taskDuration');
    const taskDurationLabel = document.getElementById('durationContainer');
    const taskDeadlineLabel = document.getElementById('taskDeadlineLabel');
    const saveButton = saveTaskBtn;
  
    // Điền các giá trị có sẵn vào các input
    taskNameInput.value = task.task_name;
    taskDescriptionInput.value = task.description;
    
    if (dragSrcEl.duration !== null) {
      taskDurationInput.value = task.duration;
      taskStatusInput.value = 'Event';
      taskDurationLabel.style.display = "block";
      taskDeadlineLabel.textContent = "Start at:";
      
    } else {
      taskStatusInput.value = 'To do';
      taskDurationInput.value = task.duration;
      taskDurationLabel.style.display = "none";
      taskDeadlineLabel.textContent = "Deadline:";
    }

    const deadlineDate = new Date(task.deadline);
    taskDeadlineInput.value = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16);
  
    // Cập nhật tiêu đề và nội dung của button
    const modalHeader = modal.querySelector('.modal-header h2');
    modalHeader.textContent = 'Edit Task';
    saveButton.textContent = 'Save Changes';
  
    // Cập nhật sự kiện của button
    saveButton.onclick = async () => {
      await updateTask(task);
    };
  
    
  }
  
  
  async function updateTask(task) {
    const taskName = document.getElementById('taskName').value;
    const taskDescription = document.getElementById('taskDescription').value;
    const taskDeadline = document.getElementById('taskDeadline').value;
    const taskDuration = document.getElementById('taskDuration').value;
  
    // Cập nhật task trong Supabase
    const { data, error } = await supabase.from('Task')
      .update({
        status: task.status,
        task_name: taskName,
        description: taskDescription,
        deadline: taskDeadline,
        duration: taskDuration || null, // Chỉ cập nhật duration nếu có
      })
      .eq('created_at', task.created_at);
  
    if (error) {
      console.error("Error updating task:", error);
    } else {
      console.log("Task updated successfully:", data);
      console.log('New task:', task);
      // renderTasks();

      // B1: Tìm task hiện tại và xóa khỏi task-list cũ
      const taskElement = document.querySelector(`[data-task-id='${task.created_at}']`);
      if (taskElement) {
          const oldTaskList = taskElement.closest(".task-list");
          if (oldTaskList) oldTaskList.removeChild(taskElement);
      }

      // B2: Cập nhật lại trạng thái dựa trên deadline
      const deadlineDate = new Date(taskDeadline);
      const timeDiff = deadlineDate - new Date(); // Tính khoảng cách thời gian (ms)
      task.deadline = taskDeadline; // Cập nhật deadline mới
      updateTaskStatusBasedOnDeadline(task); // Cập nhật lại status

      // B3: Render lại HTML task mới
      let remainingTime = taskStatus(task, timeDiff);
      const newTaskElement = taskHTML(task, remainingTime);

      // B4: Tìm task-list trong project-column có data-status mới
      const newColumn = document.querySelector(`.project-column[data-status="${task.status}"]`);
      let newTaskList = newColumn.querySelector(".task-list");

      // B5: Thêm task mới vào task-list mới
      newTaskList.appendChild(newTaskElement);
  
    }
  }
  
  // Hàm để kiểm tra và cập nhật trạng thái dựa trên deadline
  function updateTaskStatusBasedOnDeadline(task) {
    const now = new Date();
    const deadlineDate = new Date(task.deadline);
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());  // Lấy ngày hiện tại không có giờ
    const timeDiff = deadlineDate - now;

    // Kiểm tra nếu deadline là hôm nay, cập nhật status thành "Today task"
    if (deadlineDate.getTime() === nowDate.getTime()) {
      task.status = "Today task";
      updateTaskStatus(task.created_at, "Today task");
      return taskStatus(task, timeDiff);;
    }

    if (task.duration !== null) {
      const durationMs = task.duration * 60 * 1000; // Chuyển duration từ phút sang ms
      console.log('Durationsms', durationMs)
      if (timeDiff <= 0 && Math.abs(timeDiff) < durationMs) {
        task.status = "Today task";
        updateTaskStatus(task.created_at, "Today task");
        return taskStatus(task, timeDiff);; // Nếu đã bắt đầu nhưng chưa hết thời gian
      }
    }

    if (timeDiff > 0) {
      if (task.duration !== null) {
        task.status = "Event";
        updateTaskStatus(task.created_at, "Event");
      } else {
        task.status = "To do";
        updateTaskStatus(task.created_at, "To do");
      }
    } else {
      task.status = "Expired";
      updateTaskStatus(task.created_at, "Expired");
    }
    return taskStatus(task, timeDiff);
  }
  
  // Hàm xử lý dragstart
  function handleDragStart(e) {
    dragSrcEl = this; // Lưu lại phần tử đang bị kéo

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML); // Lưu dữ liệu thả
  }

  // Hàm xử lý dragover (cho phép thả vào cột)
  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault(); // Cho phép thả
    }
    e.dataTransfer.dropEffect = 'move'; // Chỉ cho phép di chuyển
    return false;
  }

  // Hàm xử lý dragenter (khi con trỏ vào cột)
  function handleDragEnter(e) {
    if (this.classList.contains('project-column')) {
      this.classList.add('column-hover');
    }
  }

  // Hàm xử lý dragleave (khi con trỏ ra khỏi cột)
  function handleDragLeave(e) {
    if (this.classList.contains('project-column')) {
      this.classList.remove('column-hover');
    }
  }

  function handleDragEnd(e) {

    projectColumns.forEach(function (column) {
      column.classList.remove('column-hover');
    });
  }

  // Hàm xử lý drop (khi thả task vào cột)
  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation(); // Ngăn trình duyệt thực hiện hành vi mặc định
    }

    // Kiểm tra nếu thả vào một cột có lớp `project-column`
    if (this.classList.contains('project-column')) {
      const taskList = this.querySelector('.task-list');
      taskList.appendChild(dragSrcEl); // Thêm task vào cột
      const status = this.getAttribute("data-status");
      // Cập nhật trạng thái của task trong cơ sở dữ liệu (Supabase)
      updateTaskStatus(dragSrcEl.dataset.taskId, status);
    }

    return false;
  }

  // Hàm cập nhật trạng thái task trong Supabase
  async function updateTaskStatus(taskId, status) {
    const { error } = await supabase
      .from('Task')
      .update({ status: status })
      .eq('created_at', taskId);
    if (error) {
      console.error("Error updating task status:", error);
    }
  }

  // Hàm thêm sự kiện kéo thả vào các cột
  function addDragEvents() {
    let items = document.querySelectorAll('.task');
    items.forEach(function (item) {
      item.addEventListener('dragstart', handleDragStart, false);
      item.addEventListener('dragend', handleDragEnd, false);
    });

    let projectColumns = document.querySelectorAll('.project-column');
    projectColumns.forEach(function (column) {
      column.addEventListener('dragover', handleDragOver, false);
      column.addEventListener('dragenter', handleDragEnter, false);
      column.addEventListener('dragleave', handleDragLeave, false);
      column.addEventListener('drop', handleDrop, false);
    });
  }

  document.getElementById("taskStatus").addEventListener("change", function () {
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

  // Gọi hàm renderTasks khi trang được tải xong
  renderTasks();
  let projectColumns = document.querySelectorAll('.project-column');

  const background = document.getElementById('overlay');
  const modal = document.getElementById("taskModal");
  const openModalBtn = document.getElementById("openTaskModal");
  const closeModal = document.getElementById("closeTaskModal");

  // Hiển thị modal khi nhấn vào button
  openModalBtn.addEventListener("click", function () {
    saveTaskBtn.textContent = "Add Task";
    modal.style.display = "block";
    background.style.display = "block";
  });

  // Ẩn modal khi nhấn vào nút đóng hoặc ngoài modal
  closeModal.addEventListener("click", function () {
    modal.style.display = "none";
    background.style.display = "none";
  });

  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
      background.style.display = "none";
    }
  });

  saveTaskBtn.addEventListener("click", function () {
    modal.style.display = "none";
    background.style.display = "none";
  });
});
