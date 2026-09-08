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
  - Bỏ chuột 4s      → cửa hé nhẹ mời tương tác

Tinh chỉnh trong index.html:
  SPRIG = 0.85 / branchLen   → cỡ nhánh hoa
  kDoor 1.9 / 1.5          → tốc độ mở / đóng cửa (nhỏ = chậm)
  dt*0.95                    → tốc độ hoa nở;  dt*1.6 → tốc độ hoa thu
  n:14 / n:10 / n:16         → số nhánh mỗi vùng
  camBase                    → góc camera
