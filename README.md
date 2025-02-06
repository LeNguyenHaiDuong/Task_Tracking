# 🚀 Hướng Dẫn Deploy Project Lên Vercel  

## 1. Cài đặt Vercel CLI  
Trước tiên, bạn cần cài đặt **Vercel CLI** trên máy tính:  
```sh
npm i -g vercel
```

---

## 2. Tạo Folder và Khởi Tạo Vercel  
- Tạo một thư mục mới cho project:  
```sh
mkdir my-project && cd my-project
```
- Chạy lệnh khởi tạo Vercel:  
```sh
vercel
```
- Làm theo hướng dẫn trên màn hình để liên kết tài khoản.

---

## 3. Clone Project về Folder  
Nếu project đã có trên GitHub, bạn có thể clone về thư mục đã tạo:  
```sh
git clone <repository-url> .
```

---

## 4. Thêm Biến Môi Trường (`.env`)  
Tạo file `.env` trong thư mục project và thêm thông tin kết nối cơ sở dữ liệu (ví dụ: **Supabase**):  
```
VITE_SUPABASE_URL=https://your-supabase-url
VITE_SUPABASE_KEY=your-supabase-key
```

---

## 6. Deploy lên Vercel  
- **Deploy lần đầu** *(sẽ có hướng dẫn để nhập config nếu cần)*  
```sh
vercel
```
- **Deploy phiên bản production** *(bản chính thức)*  
```sh
vercel --prod
```

---
