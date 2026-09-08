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
  - Cảm ứng: chạm vào xe → nở; chạm lần nữa (hoặc chạm ra ngoài) → đóng
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

Hiệu năng:
  - 2 file .glb được fetch ngay trong <head> (window.GLB), không chờ three.js
    load xong → thanh tiến trình chạy sớm hơn ~0.5-1s.
  - MOBILE (≤720px hoặc pointer:coarse): pixelRatio 1.5, shadow map 1024,
    PCFShadowMap, 23 nhánh hoa (desktop 40), hoa không đổ bóng.
  - Shadow map chỉ render lại khi cửa/hoa đang chuyển động (autoUpdate = false).
  - CHƯA LÀM: porsche.glb 11.9MB mà texture chỉ 1.7MB — ~10MB là geometry thô.
    Nén Draco/meshopt sẽ còn ~2-3MB (cần vendor thêm decoder vào ./lib).

Mobile:
  - Landscape: giữ nguyên cú máy desktop, chỉ lùi camera nếu xe + hoa tràn mép.
  - Portrait (aspect < 0.8): fitCamera() GIẢI ra khoảng cách sao cho THÂN XE
    chiếm đúng BODY_FILL = 0.78 chiều ngang khung (hoa được phép tràn mép),
    và ngắm cao hơn 0.5 để xe rơi vào khoảng trống giữa 2 hàng số liệu.
    Muốn xe to/nhỏ hơn: sửa BODY_FILL (0.78 = 78% chiều ngang).
  - Cảm ứng không có hover, nên dùng latch: chạm vào xe → nở, chạm lần nữa →
    đóng, chạm ra ngoài xe → đóng. Chữ gợi ý ở đáy đổi theo trạng thái.

Tinh chỉnh trong index.html:
  SPRIG = 0.85 / branchLen   → cỡ nhánh hoa
  kDoor 1.9 / 1.5          → tốc độ mở / đóng cửa (nhỏ = chậm)
  dt*0.95                    → tốc độ hoa nở;  dt*1.6 → tốc độ hoa thu
  n:14 / n:10 / n:16         → số nhánh mỗi vùng
  camBase                    → góc camera
