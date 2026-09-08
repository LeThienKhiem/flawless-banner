FLAWLESS CLEAN — banner 3D tương tác (Porsche 911 × Azalea)
=============================================================
Chạy:
  cd flawless-banner
  python3 -m http.server 8080        (hoặc: npx serve)
  mở http://localhost:8080
Không mở index.html trực tiếp (file://) — browser chặn fetch .glb.
Không cần internet: three.js nằm trong ./lib.

Tương tác:
  - Rê chuột lên XE   → 2 cửa mở chậm + cánh gió bung, hoa nở dần nhẹ nhàng (~1.5s), hơi vượt rồi lắng
  - Rời chuột 0.4s   → cửa từ từ đóng, hoa từ từ thu lại
  - Phím F           → mở tất cả (test)
  - Phím D / nút góc trên phải → đổi SÁNG / TỐI
  - Bỏ chuột 4s      → cửa hé nhẹ mời tương tác

Dark mode:
  Lần đầu vào theo cài đặt hệ điều hành (prefers-color-scheme); sau khi bấm nút
  thì lưu lựa chọn vào localStorage ('fc-theme') và không đổi theo OS nữa.
  Đổi theme không chỉ đổi CSS — cả scene 3D đổi theo: background, hemisphere +
  key light, environment map (4 softbox), envMapIntensity, toneMappingExposure.
  Bảng màu nằm ở 2 chỗ, sửa cả 2 cho khớp:
    - CSS   :root  /  html[data-theme="dark"]   (đầu file)
    - 3D    THEMES.light / THEMES.dark          (đầu <script>)

Tinh chỉnh trong index.html:
  SPRIG = 0.85 / branchLen   → cỡ nhánh hoa
  kDoor 1.9 / 1.5          → tốc độ mở / đóng cửa (nhỏ = chậm)
  dt*0.95                    → tốc độ hoa nở;  dt*1.6 → tốc độ hoa thu
  n:14 / n:10 / n:16         → số nhánh mỗi vùng
  camBase                    → góc camera
