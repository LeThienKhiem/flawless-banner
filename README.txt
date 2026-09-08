FLAWLESS CLEAN — banner 3D tương tác (Porsche 911 × Azalea × Sen)
=================================================================
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

Hoa:
  - azalea.glb  → nhánh hoa nhỏ, rải nhiều: 80 nhánh (desktop) / 46 (mobile).
  - lotus.glb   → BÔNG SEN, cỡ ≈0.6 đơn vị (~13% chiều dài xe), tự nở
    bằng chính clip 5s của nó (node-based, không skin) — mỗi bông một
    AnimationMixer riêng, scrub theo flowerT với threshold lệch nhau nên nở
    so le thành đợt. 8 bông (desktop) / 3 (mobile).
  - Sen gốc màu trắng, chìm hẳn vào xe trắng → petals được nhuộm 0xd9556f,
    roughness đẩy lên 0.82 (gốc 0.29 làm cánh cháy trắng, đo được
    rgb(235,223,223)); sau khi sửa đo lại rgb(229,186,192).

lotus.glb được sinh từ file gốc, ĐỪNG sửa tay:
  node tools/strip-lotus.js ~/Documents/flawless-banner/lotus_flower_blooming_animation.glb lotus.glb
  File gốc 19.73MB / 367k tam giác cho MỘT bông, trong đó 209k tam giác
  (~14MB) là cục nhân siêu dày nằm lọt trong lòng cánh — bỏ nó chỉ đổi 1.122
  pixel (0.15% canvas) ở cỡ zoom sát. Script bỏ nhân + đóng gói lại từng
  accessor (export nhồi 290 accessor vào 8 bufferView dùng chung nên bỏ
  accessor không bỏ được byte) → 4.76MB / 158k tam giác. Không quantize,
  không re-encode: phần giữ lại copy nguyên byte.

Hiệu năng:
  - 3 file .glb được fetch ngay trong <head> (window.GLB), không chờ three.js
    load xong → thanh tiến trình chạy sớm hơn ~0.5-1s. Tổng tải 18.9MB.
  - MOBILE (≤720px hoặc pointer:coarse): pixelRatio 1.5, shadow map 1024,
    PCFShadowMap, ít hoa hơn, hoa không đổ bóng (sen không đổ bóng ở mọi máy
    — 39 mesh mỗi bông, không đáng cho shadow pass).
  - Shadow map chỉ render lại khi cửa/hoa đang chuyển động (autoUpdate = false).
  - Đo trên MacBook, viewport 1440×810, nở hết: 477 draw call, 2.17M tam giác,
    2.2ms/frame (ngân sách 60fps là 16.7ms). Toàn bộ mixer của sen: 0.07ms.
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
