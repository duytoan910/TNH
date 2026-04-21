

import { KHOA_BO_NHO_TAM_CUC_BO } from './config.js';
import { hienThiThongBao, hienThiTaiTrang, anTaiTrang, dinhDangNgayHienThi, dinhDangNgayISO, trichXuatSoLieu } from './utils.js';
import { khoiTaoGiaoDien, xayDungMenuGiaoDien, apDungGiaoDien, luuCauHinhGiaoDien, apDungGiaoDienNgauNhien } from './theme.js';
import { thucHienGoiApi, ghiNhanTuongTacApi, lamMoiThongKeCsdl, datCheDoUngDung, layCheDoUngDung } from './api.js';
import { kiemTraTenTrongBaoCao, taoCauTrucGuiBaoCao } from './report.js';

$(function() {
    // --- TRẠNG THÁI ỨNG DỤNG ---
    let danhSachNhanVien = []; 
    let baoCaoLichSuGanNhat = null; 
    let ngayBaoCaoLichSu = null; 
    let nhanVienHienTai = null;
    let nhanVienCanXoa = null;
    
    // --- KHỞI TẠO MODAL BOOTSTRAP ---
    const modalThemNv = new bootstrap.Modal('#modal-them-nhan-vien');
    const modalSuaBaoCao = new bootstrap.Modal('#modal-sua-bao-cao');
    const modalDanNhieuBaoCao = new bootstrap.Modal('#modal-dan-nhieu-bao-cao');
    const modalXacNhanXoa = new bootstrap.Modal('#modal-xac-nhan-xoa');
    const modalXemBaoCaoCu = new bootstrap.Modal('#modal-xem-bao-cao-cu');

    // --- CẬP NHẬT THÔNG TIN BUILD ---
    const phienBanBuild = "v1.7.1-patch";
    const thoiGianBuildStr = "2026.01.06 17:55"; 
    $('#thoi-gian-build').text(thoiGianBuildStr);
    $('.build-version').text(phienBanBuild);

    // --- SYSTEM MONITOR WIDGET ---
    $('#btn-toggle-monitor').on('click', function() {
        const $panel = $('#system-monitor-panel');
        if ($panel.hasClass('show')) {
            $panel.removeClass('show');
            setTimeout(() => $panel.hide(), 300); // Wait for transition
        } else {
            $panel.show();
            // Small delay to allow display:block to apply before transition
            setTimeout(() => $panel.addClass('show'), 10);
        }
    });

    const capNhatWidgetDb = (trucTuyen, slNv, slBaoCao, slTruyCap) => {
        const $cham = $('#cham-trang-thai-db');
        const $chu = $('#chu-trang-thai-db');
        const $nv = $('#so-luong-nv-db');
        const $bc = $('#so-luong-bao-cao-db');
        const $luong = $('#luong-truy-cap-api');
        
        if (trucTuyen) {
            $cham.removeClass('offline').addClass('online');
            $chu.text('Online');
        } else {
            $cham.removeClass('online').addClass('offline');
            $chu.text('Offline');
        }
        if (slNv !== null) $nv.text(`${slNv} NV`);
        if (slBaoCao !== null) $bc.text(`${slBaoCao} Rpt`);
        if (slTruyCap !== null) $luong.text(`${slTruyCap}`);
    }

    const $vungDsNv = $('#vung-danh-sach-nv');
    
    const capNhatNutTaoBaoCao = () => {
        const daBaoCao = danhSachNhanVien.filter(nv => nv.trangThai !== 'Chưa báo cáo').length;
        const tongSo = danhSachNhanVien.length;
        $('#nut-tao-bao-cao').html(`Tạo & Lưu Báo Cáo (${daBaoCao}/${tongSo})`);
    };

    const hienThiDanhSachNhanVien = () => {
        if (danhSachNhanVien.length === 0) {
             $vungDsNv.html('<div class="text-center py-3 text-muted">Danh sách trống.</div>');
             capNhatNutTaoBaoCao();
             return;
        }
        
        let html = '<div class="row g-2">';
        danhSachNhanVien.forEach(nv => {
            let lopNut = 'nut-ten-nv btn';
            if (nv.kiemTraTen === false) lopNut += ' sai-ten';
            else if (nv.trangThai === 'Đã báo cáo') lopNut += ' da-bao-cao';
            else if (nv.trangThai === 'Off') lopNut += ' nghi';

            html += `
                <div class="col-6">
                    <div class="input-group shadow-sm" style="border-radius: var(--btn-radius); overflow: hidden;">
                        <button class="${lopNut} nut-mo-sua-nhanh" data-nv-ten="${nv.ten}" title="${nv.ten}">
                            ${nv.ten}
                        </button>
                        <button class="btn nut-xoa-nv nut-xoa-nv-kich-hoat" data-nv-id="${nv._id}" data-nv-ten="${nv.ten}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        $vungDsNv.html(html);
        capNhatNutTaoBaoCao();
    };

    const luuVaoBoNhoTam = () => {
        const homNayStr = dinhDangNgayISO(new Date());
        const duLieu = {
            ngay: homNayStr,
            duLieuNv: danhSachNhanVien.map(n => ({
                _id: n._id, baoCao: n.baoCao, trangThai: n.trangThai, kiemTraTen: n.kiemTraTen
            })),
            vanBanKetQua: $('#vung-ket-qua-bao-cao').val()
        };
        localStorage.setItem(KHOA_BO_NHO_TAM_CUC_BO, JSON.stringify(duLieu));
    };

    const khoiPhuTuBoNhoTam = () => {
        const duLieuTho = localStorage.getItem(KHOA_BO_NHO_TAM_CUC_BO);
        if (!duLieuTho) return false;
        try {
            const duLieu = JSON.parse(duLieuTho);
            if (duLieu.ngay !== dinhDangNgayISO(new Date())) {
                localStorage.removeItem(KHOA_BO_NHO_TAM_CUC_BO);
                return false;
            }
            duLieu.duLieuNv.forEach(itemTam => {
                const nv = danhSachNhanVien.find(n => n._id === itemTam._id);
                if (nv && itemTam.baoCao) {
                    nv.baoCao = itemTam.baoCao; 
                    nv.trangThai = itemTam.trangThai; 
                    nv.kiemTraTen = itemTam.kiemTraTen;
                }
            });
            hienThiDanhSachNhanVien();
            if(duLieu.vanBanKetQua) $('#vung-ket-qua-bao-cao').val(duLieu.vanBanKetQua);
            return true;
        } catch (e) { return false; }
    };

    const taiDuLieuTuServer = async () => {
        hienThiTaiTrang("Đang tải danh sách FOS...");
        try {
            ghiNhanTuongTacApi().catch(() => {});
            
            const duLieuGoc = await thucHienGoiApi('nhanvien?h={"$orderby": {"Ten": 1}}');
            datCheDoUngDung('online');
            danhSachNhanVien = duLieuGoc.map(item => ({
                _id: item._id, ten: item.Ten, gioiTinh: item.GioiTinh,
                chiTieu: parseInt(item.ChiTieu, 10) || 50, baoCao: '',
                trangThai: 'Chưa báo cáo', kiemTraTen: null
            }));
            
            hienThiDanhSachNhanVien();
            
            // Ẩn loader ngay khi danh sách nhân viên hiện ra để user thao tác ngay
            anTaiTrang(); 

            // Các công việc nền tiếp tục chạy ngầm sau khi user đã có thể thao tác
            khoiPhuTuBoNhoTam();
            lamMoiThongKeCsdl(capNhatWidgetDb).catch(() => {});
            khoiPhuPhienLamViec().catch(() => {});
            
        } catch (error) {
            datCheDoUngDung('offline');
            hienThiThongBao("Đang hoạt động ngoại tuyến", "info");
            try {
                const phanHoi = await fetch('fos.txt');
                const text = await phanHoi.text();
                danhSachNhanVien = text.split('\n').filter(l => l.trim()).map((line, index) => {
                    const parts = line.split('|');
                    return {
                        _id: `local_${index}`, ten: parts[0]?.trim(), gioiTinh: parts[1]?.trim(), 
                        chiTieu: parseInt(parts[2]?.trim() || '50'), baoCao: '', 
                        trangThai: 'Chưa báo cáo', kiemTraTen: null
                    };
                });
                hienThiDanhSachNhanVien();
                anTaiTrang();
                khoiPhuTuBoNhoTam();
            } catch (e) {
                anTaiTrang();
            }
        }
    };

    const khoiPhuPhienLamViec = async () => {
        const homNayStr = dinhDangNgayISO(new Date());
        
        try {
            const bcHomNay = await thucHienGoiApi(`report?q={"ngayBaoCao": "${homNayStr}"}`);
            if (bcHomNay.length > 0) {
                bcHomNay[0].baoCaoFOS.forEach(item => {
                    const nv = danhSachNhanVien.find(n => n.ten === item.tenNhanVien);
                    if (nv && nv.baoCao === '') {
                        nv.trangThai = (item.OFF === 0 || item.OFF === '0') ? 'Đã báo cáo' : 'Off';
                        nv.baoCao = item.rawReport || `Fos ${item.tenNhanVien} ${nv.trangThai === 'Off' ? 'OFF' : ''}`;
                    }
                });
                hienThiDanhSachNhanVien();
            }
        } catch (e) {}

        // Lấy mốc lịch sử thực sự cũ hơn hôm nay
        try {
            const truyVanLichSu = `{"ngayBaoCao": {"$lt": "${homNayStr}"}}`;
            const sapXepLichSu = `{"$orderby": {"ngayBaoCao": -1}}`;
            const dsBcCu = await thucHienGoiApi(`report?q=${truyVanLichSu}&h=${sapXepLichSu}&max=1`);
            
            if (dsBcCu.length > 0) {
                const bcLichSu = dsBcCu[0];
                baoCaoLichSuGanNhat = bcLichSu;
                ngayBaoCaoLichSu = bcLichSu.ngayBaoCao;
                baoCaoLichSuGanNhat.duLieuNvLichSu = bcLichSu.baoCaoFOS.map(item => ({
                    ten: item.tenNhanVien, 
                    mtdMC: item.chiSoHieuSuat.saleTrongThang
                }));
                thucHienTaoBaoCao(null, true);
            }
        } catch (e) {}
    };

    const luuBaoCaoLenServer = async (cauTruc, chayNgam = false) => {
        if (layCheDoUngDung() === 'offline') return;
        if (chayNgam) $('#chi-bao-dang-luu').css('display', 'flex');
        try {
            const kiemTra = await thucHienGoiApi(`report?q={"ngayBaoCao": "${cauTruc.ngayBaoCao}"}`);
            if (kiemTra.length > 0) await thucHienGoiApi(`report/${kiemTra[0]._id}`, 'PUT', cauTruc);
            else await thucHienGoiApi('report', 'POST', cauTruc);
            lamMoiThongKeCsdl(capNhatWidgetDb);
        } catch (error) {} finally { setTimeout(() => $('#chi-bao-dang-luu').fadeOut(), 1000); }
    };
    
    const thucHienTaoBaoCao = (e, chiXem = false) => {
        danhSachNhanVien.sort((a, b) => b.chiTieu - a.chiTieu);
        hienThiDanhSachNhanVien();
        const quanLy = 'TNH';
        const ngayHienThi = dinhDangNgayHienThi(new Date());
        let tMC = 0, tNTB = 0, tETB = 0, nvActive = 0, tPos = 0, tAE = 0, tTKHKD = 0, tTShop = 0;
        let dsChiTiet = [];
        const banDoLichSu = new Map();
        if (baoCaoLichSuGanNhat?.duLieuNvLichSu) baoCaoLichSuGanNhat.duLieuNvLichSu.forEach(n => banDoLichSu.set(n.ten, n));

        danhSachNhanVien.forEach(nv => {
            const bieuTuong = nv.gioiTinh === 'Nữ' ? '👵' : '👨';
            const bc = nv.baoCao;
            let mtd = trichXuatSoLieu(bc, 'MTD MC');
            let ntb = trichXuatSoLieu(bc, 'NTB'), etb = trichXuatSoLieu(bc, 'ETB');
            let mcNay = ntb + etb;
            if (mcNay === 0) mcNay = trichXuatSoLieu(bc, ['Tổng MC', 'MC']);

            if ((nv.trangThai === 'Off' || mcNay === 0) && mtd === 0 && baoCaoLichSuGanNhat) {
                const nvLichSu = banDoLichSu.get(nv.ten);
                mtd = nvLichSu ? (nvLichSu.mtdMC || 0) : 0;
            }

            if (nv.trangThai === 'Off') {
                const matchLyDo = bc.match(/^Fos\s+\S+\s+(.*)$/i);
                const lyDo = (matchLyDo && matchLyDo[1] && matchLyDo[1].toUpperCase() !== 'OFF') ? matchLyDo[1] : 'OFF';
                dsChiTiet.push(`${bieuTuong}${nv.ten}: ${lyDo}/${mtd}/${nv.chiTieu}`);
            } else {
                nvActive++;
                tMC += mcNay; tNTB += ntb; tETB += etb;
                tPos += trichXuatSoLieu(bc, 'Pos'); tAE += trichXuatSoLieu(bc, ['AE+', 'AE Plus']);
                tTKHKD += trichXuatSoLieu(bc, ['Tài khoản hộ kinh doanh', 'TK HKD', 'HKD']);
                tTShop += trichXuatSoLieu(bc, 'TShop');
                dsChiTiet.push(`${bieuTuong}${nv.ten}: ${mcNay}/${mtd}/${nv.chiTieu}`);
            }
        });

        const nsbqNTB = (nvActive > 0) ? (tNTB / nvActive).toFixed(2) : '0.00';
        const nsbqETB = (nvActive > 0) ? (tETB / nvActive).toFixed(2) : '0.00';
        let ketQua = `${quanLy} ngày ${ngayHienThi}\n🔥${nvActive} FOS – ${tMC} MC\n✅NTB: ${tNTB}\n✅NSBQ NTB: ${nsbqNTB}\n✅ETB: ${tETB}\n✅NSBQ ETB: ${nsbqETB}\n✅AE+: ${tAE}\n✅Pos: ${tPos}/${danhSachNhanVien.length * 3}\n✅TK HKD: ${tTKHKD}\n✅TShop: ${tTShop}\n\n⭐️Active ${nvActive}/${danhSachNhanVien.length}\n${dsChiTiet.join('\n')}`;
        $('#vung-ket-qua-bao-cao').val(ketQua);

        // --- TẠO BÁO CÁO FORMAT 2 (MỚI) ---
        const ngayThangHienThi = (() => {
            const n = new Date();
            const d = String(n.getDate()).padStart(2, '0');
            const m = String(n.getMonth() + 1).padStart(2, '0');
            return `${d}/${m}`;
        })();
        
        const a = (nvActive > 0) ? (Math.floor((tMC / nvActive) * 100) / 100).toFixed(2) : '0.00';
        const b = (nvActive > 0) ? (Math.floor((tTKHKD / nvActive) * 100) / 100).toFixed(2) : '0.00';
        const c = (nvActive > 0) ? (Math.floor((tTShop / nvActive) * 100) / 100).toFixed(2) : '0.00';
        
        let ketQua2 = `Ngày ${ngayThangHienThi}\n`;
        ketQua2 += `${quanLy} - SL FOS: ${nvActive}\n`;
        ketQua2 += `❣️MC ETB+NTB: ${a}/${nvActive}\n`;
        ketQua2 += `🌶️CA HKD: ${b}/${nvActive}\n`;
        ketQua2 += `❤️🔥T-Shop: ${c}/${nvActive}\n`;
        ketQua2 += `🥦Auto Bill: 0/0\n`;
        ketQua2 += `🥕Loyalty: 0/0\n`;
        ketQua2 += `CD: 0`;
        
        $('#vung-ket-qua-bao-cao-2').val(ketQua2);
        
        if (!chiXem) {
            const thongKe = { tongFOS: danhSachNhanVien.length, tongMC: tMC, tongNTB: tNTB, nsbqNTB, tongETB: tETB, nsbqETB, tongPosThucHien: tPos, posChiTieu: danhSachNhanVien.length * 3, activeFOS: nvActive, tongAEPlus: tAE, tongTKHKD: tTKHKD, tongTShop: tTShop };
            luuBaoCaoLenServer(taoCauTrucGuiBaoCao(danhSachNhanVien, baoCaoLichSuGanNhat, thongKe), true);
        }
    };

    // --- HELPER TẠO BÁO CÁO TỪ DB OBJECT ---
    const taiTaoNoiDungBaoCao = (bc) => {
        const ngayHienThi = dinhDangNgayHienThi(bc.ngayBaoCao);
        const thongKe = bc.tongKetToanDoi;
        const dsNv = bc.baoCaoFOS;
        const quanLy = 'TNH'; // Tên quản lý mặc định
        
        // Tái tạo phần Header
        let ketQua = `${quanLy} ngày ${ngayHienThi}\n`;
        
        if (thongKe) {
            const tMC = thongKe.tongSoMC || 0;
            const tFOS = thongKe.tongSoFOS || 0;
            const tNTB = thongKe.tongSoNTB || 0;
            const nsbqNTB = (thongKe.NSBQ_NTB !== undefined && thongKe.NSBQ_NTB !== null) ? Number(thongKe.NSBQ_NTB).toFixed(2) : '0.00';
            const tETB = thongKe.tongSoETB || 0;
            const nsbqETB = (thongKe.NSBQ_ETB !== undefined && thongKe.NSBQ_ETB !== null) ? Number(thongKe.NSBQ_ETB).toFixed(2) : '0.00';
            const tAE = thongKe.tongSoAEPlus || 0;
            const tPos = thongKe.tyLePOS || "0/0";
            const tTKHKD = thongKe.tongSoTKHKD || 0;
            const tTShop = thongKe.tongSoTShop || 0;
            const tActive = thongKe.tyLeActiveFOS || "0/0";

            ketQua += `🔥${tFOS} FOS – ${tMC} MC\n`;
            ketQua += `✅NTB: ${tNTB}\n`;
            ketQua += `✅NSBQ NTB: ${nsbqNTB}\n`;
            ketQua += `✅ETB: ${tETB}\n`;
            ketQua += `✅NSBQ ETB: ${nsbqETB}\n`;
            ketQua += `✅AE+: ${tAE}\n`;
            ketQua += `✅Pos: ${tPos}\n`;
            ketQua += `✅TK HKD: ${tTKHKD}\n`;
            ketQua += `✅TShop: ${tTShop}\n\n`;
            ketQua += `⭐️Active ${tActive}\n`;
        }

        // Tái tạo danh sách nhân viên
        if (dsNv && dsNv.length > 0) {
            dsNv.forEach(n => {
                 // Tìm nhân viên trong danh sách hiện tại để lấy giới tính (icon)
                 const nvHienTai = danhSachNhanVien.find(nv => nv.ten === n.tenNhanVien);
                 // Mặc định icon Nam nếu không tìm thấy hoặc chưa load
                 const icon = nvHienTai ? (nvHienTai.gioiTinh === 'Nữ' ? '👵' : '👨') : '👨';
                 
                 const sale = n.chiSoHieuSuat?.saleHomNay || 0;
                 const mtd = n.chiSoHieuSuat?.saleTrongThang || 0;
                 const chiTieu = n.chiSoHieuSuat?.chiTieu || 0;
                 
                 let statusStr = `${sale}/${mtd}/${chiTieu}`;
                 
                 // Xử lý logic hiển thị OFF (tương tự như thucHienTaoBaoCao)
                 if (n.OFF && n.OFF !== 0 && n.OFF !== '0') {
                     const lyDo = (n.OFF === 1 || n.OFF === '1') ? 'OFF' : n.OFF;
                     statusStr = `${lyDo}/${mtd}/${chiTieu}`;
                 }
                 
                 ketQua += `${icon}${n.tenNhanVien}: ${statusStr}\n`;
            });
        }
        return ketQua;
    };
    
    // --- HELPER LẤY MTD LỊCH SỬ ---
    const layMtdLichSu = (tenNv) => {
        if (!baoCaoLichSuGanNhat || !baoCaoLichSuGanNhat.duLieuNvLichSu) return 0;
        const nvCu = baoCaoLichSuGanNhat.duLieuNvLichSu.find(n => n.ten === tenNv);
        return nvCu ? (nvCu.mtdMC || 0) : 0;
    };

    // --- SỰ KIỆN GIAO DIỆN ---
    $('body').on('click', '.lua-chon-giao-dien', function(e) {
        e.preventDefault();
        const theme = $(this).data('theme');
        const mode = $(this).data('mode');
        const lop = `theme-${theme}-${mode}`;
        apDungGiaoDien(lop); 
        luuCauHinhGiaoDien(lop);
        hienThiThongBao(`Giao diện: ${theme} ${mode}`);
        if (window.capNhatParticles) window.capNhatParticles();
    });

    $('#nut-giao-dien-ngau-nhien').on('click', e => { 
        e.preventDefault(); 
        luuCauHinhGiaoDien('random'); 
        apDungGiaoDienNgauNhien(); 
        if (window.capNhatParticles) window.capNhatParticles();
    });

    $('#nut-luu-nv-moi').on('click', async () => {
        const ten = $('#ten-nv-modal').val().trim(), gt = $('#gioi-tinh-nv-modal').val(), ct = parseInt($('#chi-tieu-nv-modal').val()) || 0;
        if (ten && !danhSachNhanVien.some(n => n.ten.toLowerCase() === ten.toLowerCase())) {
            hienThiTaiTrang("Đang lưu nhân viên...");
            try { await thucHienGoiApi('nhanvien', 'POST', { Ten: ten, GioiTinh: gt, ChiTieu: ct }); modalThemNv.hide(); taiDuLieuTuServer(); }
            catch (e) { hienThiThongBao(e.message, 'error'); } finally { anTaiTrang(); }
        }
    });

    $vungDsNv.on('click', '.nut-xoa-nv-kich-hoat', function() {
        nhanVienCanXoa = { id: $(this).data('nv-id'), ten: $(this).data('nv-ten') };
        $('#noi-dung-xac-nhan-xoa').text(`Xoá nhân viên "${nhanVienCanXoa.ten}"?`);
        modalXacNhanXoa.show();
    });

    $('#nut-xac-nhan-xoa-vinh-vien').on('click', async () => {
        if (!nhanVienCanXoa) return;
        hienThiTaiTrang("Đang xoá vĩnh viễn...");
        try { await thucHienGoiApi(`nhanvien/${nhanVienCanXoa.id}`, 'DELETE'); taiDuLieuTuServer(); }
        catch (e) { hienThiThongBao(e.message, 'error'); } finally { anTaiTrang(); modalXacNhanXoa.hide(); }
    });

    $vungDsNv.on('click', '.nut-mo-sua-nhanh', function() {
        nhanVienHienTai = $(this).data('nv-ten');
        const nv = danhSachNhanVien.find(n => n.ten === nhanVienHienTai);
        if (nv) {
            const bc = nv.baoCao;
            $('#tieu-de-modal-sua-bao-cao').text(`Sửa nhanh: ${nhanVienHienTai}`);
            $('#ntb-sua').val(trichXuatSoLieu(bc, 'NTB')); $('#etb-sua').val(trichXuatSoLieu(bc, 'ETB'));
            $('#pos-sua').val(trichXuatSoLieu(bc, 'Pos')); $('#aeplus-sua').val(trichXuatSoLieu(bc, ['AE+', 'AE Plus']));
            $('#tkhkd-sua').val(trichXuatSoLieu(bc, ['Tài khoản hộ kinh doanh', 'TK HKD', 'HKD'])); $('#tshop-sua').val(trichXuatSoLieu(bc, 'TShop'));
            $('#mtd-sua').val(trichXuatSoLieu(bc, 'MTD MC'));
            modalSuaBaoCao.show();
        }
    });

    $('#nut-xac-nhan-sua-bao-cao').on('click', () => {
        const nv = danhSachNhanVien.find(n => n.ten === nhanVienHienTai);
        if (nv) {
            const n = parseInt($('#ntb-sua').val()) || 0, e = parseInt($('#etb-sua').val()) || 0;
            nv.baoCao = `Fos ${nv.ten}\nTổng MC: ${n+e}\nNTB: ${n}\nETB: ${e}\nAE+: ${$('#aeplus-sua').val() || 0}\nPos: ${$('#pos-sua').val() || 0}\nTK HKD: ${$('#tkhkd-sua').val() || 0}\nTShop: ${$('#tshop-sua').val() || 0}\nMTD MC: ${$('#mtd-sua').val() || 0}`;
            nv.trangThai = 'Đã báo cáo'; hienThiDanhSachNhanVien(); luuVaoBoNhoTam(); modalSuaBaoCao.hide();
        }
    });

    $('#nut-sua-nhanh-off').on('click', () => {
        const nv = danhSachNhanVien.find(n => n.ten === nhanVienHienTai);
        if (nv) {
            const mtdInput = $('#mtd-sua').val() || 0;
            nv.baoCao = `Fos ${nv.ten} OFF\nMTD MC: ${mtdInput}`;
            nv.trangThai = 'Off';
            hienThiDanhSachNhanVien();
            luuVaoBoNhoTam();
            modalSuaBaoCao.hide();
        }
    });

    $('#nut-dan-tu-bo-nho').on('click', async () => {
        try { const t = await navigator.clipboard.readText(); if (t) $('#noi-dung-bao-cao-nhap').val(t); } catch(e) {}
    });

    $('#nut-dan-hang-loat').on('click', async () => {
        try { 
            const t = await navigator.clipboard.readText(); 
            if (t) {
                const hienTai = $('#noi-dung-nhieu-bao-cao-nhap').val();
                // Nếu đã có nội dung thì xuống dòng trước khi dán tiếp
                const moi = hienTai ? (hienTai + '\n\n' + t) : t;
                $('#noi-dung-nhieu-bao-cao-nhap').val(moi); 
            }
        } catch(e) {}
    });

    $('#nut-xu-ly-nhieu-bao-cao').on('click', () => {
        const vanBan = $('#noi-dung-nhieu-bao-cao-nhap').val().trim();
        if (!vanBan) return;
        const khoiBaoCao = vanBan.split(/(?=^Fos\s)/im); 
        khoiBaoCao.forEach(khoi => {
            const khoiTrim = khoi.trim();
            const nv = danhSachNhanVien.find(n => {
                if (!n || typeof n.ten !== 'string') return false;
                const tenEscape = n.ten.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                return new RegExp(`^Fos\\s+${tenEscape}(?=\\s|$)`, 'i').test(khoiTrim);
            });
            if (nv) { nv.baoCao = khoiTrim; nv.trangThai = 'Đã báo cáo'; kiemTraTenTrongBaoCao(nv, khoiTrim); }
        });
        modalDanNhieuBaoCao.hide(); hienThiDanhSachNhanVien(); luuVaoBoNhoTam();
        hienThiThongBao("Đã xử lý xong báo cáo hàng loạt.");
    });

    $('#nut-tao-bao-cao').on('click', () => thucHienTaoBaoCao());
    $('#nut-sao-chep').on('click', function() {
        const $btn = $(this);
        navigator.clipboard.writeText($('#vung-ket-qua-bao-cao').val()).then(() => {
            hienThiThongBao('Đã sao chép báo cáo 1!');
            $btn.html('<i class="fa-solid fa-check"></i> Đã chép').addClass('btn-success').removeClass('btn-primary');
            setTimeout(() => $btn.html('<i class="fa-regular fa-copy"></i> Sao chép').removeClass('btn-success').addClass('btn-primary'), 2000);
        });
    });

    $('#nut-sao-chep-2').on('click', function() {
        const $btn = $(this);
        navigator.clipboard.writeText($('#vung-ket-qua-bao-cao-2').val()).then(() => {
            hienThiThongBao('Đã sao chép báo cáo hiệu suất!');
            $btn.html('<i class="fa-solid fa-check"></i> Đã chép').addClass('btn-success').removeClass('btn-outline-primary');
            setTimeout(() => $btn.html('<i class="fa-regular fa-copy"></i> Sao chép').removeClass('btn-success').addClass('btn-outline-primary'), 2000);
        });
    });
    
    // --- XỬ LÝ SỰ KIỆN XEM BÁO CÁO CŨ (MỚI) ---
    $('#nut-xem-bao-cao-cu').on('click', async () => {
        hienThiTaiTrang("Đang tải báo cáo cũ...");
        try {
            const homNayStr = dinhDangNgayISO(new Date());
            // Lấy báo cáo có ngày < ngày hôm nay, sắp xếp giảm dần, lấy 1
            const truyVan = `q={"ngayBaoCao": {"$lt": "${homNayStr}"}}&h={"$orderby": {"ngayBaoCao": -1}}&max=1`;
            const duLieu = await thucHienGoiApi(`report?${truyVan}`);
            
            if (duLieu.length > 0) {
                $('#vung-ket-qua-bao-cao-cu').val(taiTaoNoiDungBaoCao(duLieu[0]));
            } else {
                $('#vung-ket-qua-bao-cao-cu').val("Không tìm thấy dữ liệu báo cáo trước ngày hôm nay.");
            }
            modalXemBaoCaoCu.show();
        } catch (e) {
            hienThiThongBao("Lỗi tải lịch sử: " + e.message, "error");
        } finally {
            anTaiTrang();
        }
    });
    
    // KHỞI CHẠY
    khoiTaoGiaoDien(); 
    xayDungMenuGiaoDien(); 
    taiDuLieuTuServer(); 

    // Initialize Particles.js with random effects and theme awareness
    let currentParticleTheme = null;

    window.capNhatParticles = (isNew = false) => {
        if (!window.particlesJS) return;
        
        const isDarkMode = $('body').attr('class')?.includes('-dark');

        if (!currentParticleTheme || isNew) {
            const themes = [
                { 
                    name: 'electric',
                    color: ["#00d2ff", "#3a7bd5", "#ffffff"],
                    lineColor: "#00d2ff",
                    shape: "circle",
                    moveSpeed: 6,
                    density: 100,
                    size: 3,
                    opacity: 0.7,
                    hoverMode: "grab",
                    clickMode: "push"
                },
                { 
                    name: 'matrix',
                    color: "#00ff00",
                    shape: "edge",
                    moveSpeed: 8,
                    density: 120,
                    direction: "bottom",
                    straight: true,
                    lines: false,
                    size: 2,
                    opacity: 0.8,
                    hoverMode: "bubble",
                    clickMode: "repulse"
                },
                { 
                    name: 'blizzard',
                    color: "#ffffff",
                    shape: "circle",
                    moveSpeed: 5,
                    density: 150,
                    direction: "bottom-left",
                    lines: false,
                    size: 4,
                    opacity: 0.9,
                    hoverMode: "repulse",
                    clickMode: "bubble"
                },
                { 
                    name: 'plasma',
                    color: ["#ff0080", "#ff8c00", "#40e0d0"],
                    shape: "polygon",
                    moveSpeed: 3,
                    density: 50,
                    size: 15,
                    opacity: 0.6,
                    lines: true,
                    lineColor: "#ffffff",
                    hoverMode: "bubble",
                    clickMode: "push"
                },
                { 
                    name: 'stars',
                    color: "#f1c40f",
                    shape: "star",
                    moveSpeed: 1,
                    density: 80,
                    size: 5,
                    opacity: 1,
                    lines: false,
                    hoverMode: "grab",
                    clickMode: "repulse"
                },
                { 
                    name: 'volcano',
                    color: ["#ff4b2b", "#ff416c", "#000000"],
                    shape: "circle",
                    moveSpeed: 7,
                    density: 90,
                    direction: "top",
                    size: 4,
                    opacity: 0.8,
                    lines: false,
                    hoverMode: "bubble",
                    clickMode: "push"
                }
            ];
            currentParticleTheme = themes[Math.floor(Math.random() * themes.length)];
        }

        const t = JSON.parse(JSON.stringify(currentParticleTheme));

        // Tăng độ tương phản cho nền sáng
        if (!isDarkMode) {
            const darkMap = {
                "#ffffff": "#333333",
                "#00ff00": "#008000",
                "#f1c40f": "#d4ac0d",
                "plasma": { color: ["#c00060", "#e67e22", "#16a085"], lineColor: "#000000" }
            };
            
            if (t.name === 'plasma') {
                t.color = darkMap.plasma.color;
                t.lineColor = darkMap.plasma.lineColor;
            } else {
                const adjust = (c) => darkMap[c] || c;
                if (Array.isArray(t.color)) t.color = t.color.map(adjust);
                else t.color = adjust(t.color);
                if (t.lineColor) t.lineColor = adjust(t.lineColor);
            }
            t.opacity = Math.min(1, t.opacity + 0.2);
        }

        particlesJS('particles-js', {
            "particles": {
                "number": { "value": t.density, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": t.color },
                "shape": { "type": t.shape, "polygon": { "nb_sides": 5 } },
                "opacity": { "value": t.opacity, "random": true, "anim": { "enable": true, "speed": 1, "opacity_min": 0.1, "sync": false } },
                "size": { "value": t.size, "random": true, "anim": { "enable": true, "speed": 4, "size_min": 0.3, "sync": false } },
                "line_linked": { 
                    "enable": t.lines !== undefined ? t.lines : true, 
                    "distance": 150, 
                    "color": t.lineColor || (Array.isArray(t.color) ? t.color[0] : t.color), 
                    "opacity": 0.4, 
                    "width": 2 
                },
                "move": { 
                    "enable": true, "speed": t.moveSpeed, "direction": t.direction || "none", 
                    "random": true, "straight": t.straight || false, "out_mode": "out", "bounce": false 
                }
            },
            "interactivity": {
                "detect_on": "window",
                "events": { 
                    "onhover": { "enable": true, "mode": t.hoverMode || "grab" }, 
                    "onclick": { "enable": true, "mode": t.clickMode || "push" }, 
                    "resize": true 
                },
                "modes": { 
                    "grab": { "distance": 200, "line_linked": { "opacity": 1 } }, 
                    "bubble": { "distance": 200, "size": t.size * 2, "duration": 2, "opacity": 1, "speed": 3 },
                    "repulse": { "distance": 200, "duration": 0.4 },
                    "push": { "particles_nb": 6 }
                }
            },
            "retina_detect": true
        });
    };

    window.capNhatParticles(true);

    // Lắng nghe sự kiện thay đổi giao diện để cập nhật màu sắc hạt
    document.addEventListener('themeChanged', () => {
        // Delay một chút để class body được áp dụng hoàn toàn
        setTimeout(() => window.capNhatParticles(false), 50);
    });
});
