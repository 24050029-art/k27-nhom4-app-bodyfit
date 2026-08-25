-- 1. Tạo một database mới cho BodyFit
CREATE DATABASE IF NOT EXISTS bodyfit_db;

-- 2. Tạo một user mới sử dụng xác thực bằng mật khẩu chuẩn
CREATE USER 'bodyfit_user'@'localhost' IDENTIFIED BY 'SecretPassword123';

-- 3. Cấp toàn quyền truy cập database bodyfit_db cho user này
GRANT ALL PRIVILEGES ON bodyfit_db.* TO 'bodyfit_user'@'localhost';

-- 4. Áp dụng thay đổi
FLUSH PRIVILEGES;
