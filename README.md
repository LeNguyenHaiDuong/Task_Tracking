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

## 4. Cấu hình Database  
Tạo file `.env` và thêm thông tin kết nối đến Supabase (hoặc cơ sở dữ liệu khác).  
Cấu trúc của database sẽ tương tự như hình dưới đây:  

![Cấu trúc Database](/background/database.png)  

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
```

---

## 5. Deploy lên Vercel  
- **Deploy lần đầu** *(sẽ có hướng dẫn để nhập config nếu cần)*  
```sh
vercel
```
- **Deploy phiên bản production** *(bản chính thức)*  
```sh
vercel --prod
```

---
## 6. Hoàn tất triển khai  
Vercel sẽ cung cấp cho bạn một đường link đến trang web sau khi deploy thành công.  
Bạn sẽ có một trang web tương tự như thế này:  

![Demo trang web đã triển khai](/background/image.png)  
---
