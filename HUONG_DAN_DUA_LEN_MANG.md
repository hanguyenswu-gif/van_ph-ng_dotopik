# HUONG DAN DUA THAY/CO HUB 3D V6 LEN MANG

## A. DANG WEB CO 12 AI THUC TE: RENDER + GITHUB

1. Giai nen ZIP, vao https://github.com/new, tao kho Private ten `thay-co-hub-3d`.
2. Tai tat ca cac tep / thu muc cua goi V6 len *thu muc goc* cua GitHub (Add file > Upload files). Quan trong: co `server.js`, `package.json`, `render.yaml` va thu muc `public/` ngay thu muc goc. KHONG tai `.env` hay API key len GitHub.
3. Vao https://dashboard.render.com/ > New > Blueprint, ket noi kho GitHub vua tao; Render doc `render.yaml`.
4. Khi duoc yeu cau, dien gia tri cho `APP_PASSWORD` (mat khau manh, chi chia se cho nguoi duoc phep) va `OPENAI_API_KEY` (lay tu https://platform.openai.com/api-keys; tai khoan API co thanh toan rieng). Khong cong khai mat khau/secret.
5. Deploy xong, Render cap mot dia chi dang `https://thay-co-hub-3d-chibi-xxxx.onrender.com`. Mo link, bam "Ngoai tuyen" hoac "Dang nhap" neu UI hien thi; dang nhap bang APP_PASSWORD, chon AI va gui yeu cau.
6. Giao diện chạy HTTPS; truy cập máy tính/điện thoại bằng cùng URL, không phải bật máy tính ở nhà.

**Quan trong**: Ban free Render ngu khi khong duoc truy cap; luc mo lai co the phai cho khoi dong. Ban free khong co o dia luu tru ben vung. V6 ghi task/chat vao `data/workspace.json`, do do du lieu co the mat khi service restart/redeploy. Dung de thu nghiem; de dung lau dai phai bo sung CSDL (Postgres/...) hoac disk paid.

**Bao mat**: APP_PASSWORD hien tai la mot mat khau chung, khong co phan quyen tung tai khoan, va khong phu hop de nhieu hoc vien truy cap. Khong dua du lieu hoc vien nhay cam vao ban thu nghiem. Can bo sung tai khoan, phan quyen, sao luu, gioi han request va kiem tra bao mat truoc khi su dung chinh thuc.

## B. CHI MUON GIAO DIEN CHIBI TRUC TUYEN: NETLIFY

1. Lay ZIP Netlify di kem, giai nen thanh thu muc co `index.html` va `assets/`.
2. Mo https://app.netlify.com/drop.
3. Keo *ca thu muc* vao khu upload. Netlify cap duong link dang `https://ten-website.netlify.app`.
4. Co the xem nhan vien di lai, bong bong hoi thoai, chon phong; du lieu tasks luu trong browser. **Khong co ket noi OpenAI that** o cach nay; chi tao prompt de sao chep.

## C. THIET LAP THU CONG RENDER (NEU KHONG DUNG BLUEPRINT)

Chon New > Web Service, lien ket GitHub repo. Runtime Node, build `npm install`, start `npm start`, them variables `HOST=0.0.0.0`, `COOKIE_SECURE=1`, `APP_PASSWORD=...`, `OPENAI_API_KEY=...`, `OPENAI_MODEL=gpt-4.1-mini`. Render tu chon bien PORT. Health check `/api/status`.

## D. CAC GIOI HAN VE NHAN VIEN

- Chibi di bo, gap nhau, bong bong thoai: mo phong trong trinh duyet.
- Neu bat tieng, trinh duyet co the doc loi thoai tieng Viet (tuy ho tro voice), khong phai stream audio cua AI.
- 12 AI chi sinh cau tra loi theo yeu cau user khi co key va backend; chua la he thong multi-agent tu phoi hop cong viec.
