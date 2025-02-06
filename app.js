import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
const supabaseKey=import.meta.env.VITE_SUPABASE_KEY;

window.supabase = createClient(supabaseUrl, supabaseKey);

import Modal from './pages/modal.js';
import Task from './pages/task.js';
import View from './pages/view.js';


document.addEventListener("DOMContentLoaded", async function () {
  
  window.tasksData = await fetchTasks();

  const view = new View();

  window.dragSrcEl = null;
  window.modal = new Modal();
  window.modal.addEventListeners()


  // Hàm lấy dữ liệu tasks từ Supabase
  async function fetchTasks() {
    const { data: tasks, error } = await supabase.from('Task').select('*');
    if (error) {
        console.log("Error fetching tasks:", error);
        return [];
    }
    console.log("Done getting data:", tasks);
    
    tasks.forEach((task, index) => {
      tasks[index] = new Task(task);  // Thay đổi trực tiếp trên mảng gốc
      tasks[index].updateTaskStatusBasedOnDeadline(); // Cập nhật trạng thái
    });

    return tasks;
  }

  
  // Đóng dropdown khi click ra ngoài
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown").forEach((el) => {
          el.classList.remove("open");
      });
    }
  });

  
  
});
