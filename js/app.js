

import { KHOA_BO_NHO_TAM_CUC_BO } from './config.js';
import { 
    hienThiThongBao, 
    hienThiTaiTrang, 
    anTaiTrang, 
    dinhDangNgayHienThi, 
    dinhDangNgayISO, 
    trichXuatSoLieu, 
    trichXuatMC, 
    trichXuatHKD, 
    trichXuatDealDoanhSo, 
    trichXuatVolIn, 
    dinhDangDoanhSo 
} from './utils.js';
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
            mcDay: $('input[name="opt-mc-day"]:checked').val() || 'Có',
            chiNhanh: 'TNH',
            duLieuNv: danhSachNhanVien.map(n => ({
                _id: n._id, baoCao: n.baoCao, trangThai: n.trangThai, kiemTraTen: n.kiemTraTen
            })),
            vanBanKetQua: $('#vung-ket-qua-bao-cao').val(),
            vanBanKetQua2: $('#vung-ket-qua-bao-cao-2').val()
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
            if (duLieu.mcDay) {
                $(`input[name="opt-mc-day"][value="${duLieu.mcDay}"]`).prop('checked', true);
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
            if(duLieu.vanBanKetQua2) $('#vung-ket-qua-bao-cao-2').val(duLieu.vanBanKetQua2);
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
            const q = encodeURIComponent(JSON.stringify({ "ngayBaoCao": homNayStr }));
            const bcHomNay = await thucHienGoiApi(`report?q=${q}`);
            if (bcHomNay && bcHomNay.length > 0) {
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
            const q = encodeURIComponent(JSON.stringify({ "ngayBaoCao": { "$lt": homNayStr } }));
            const h = encodeURIComponent(JSON.stringify({ "$orderby": { "ngayBaoCao": -1 } }));
            const dsBcCu = await thucHienGoiApi(`report?q=${q}&h=${h}&max=1`);
            
            if (dsBcCu && dsBcCu.length > 0) {
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
            const q = encodeURIComponent(JSON.stringify({ "ngayBaoCao": cauTruc.ngayBaoCao }));
            const kiemTra = await thucHienGoiApi(`report?q=${q}`);
            if (kiemTra && kiemTra.length > 0) await thucHienGoiApi(`report/${kiemTra[0]._id}`, 'PUT', cauTruc);
            else await thucHienGoiApi('report', 'POST', cauTruc);
            lamMoiThongKeCsdl(capNhatWidgetDb);
        } catch (error) {} finally { setTimeout(() => $('#chi-bao-dang-luu').fadeOut(), 1000); }
    };
    
    const thucHienTaoBaoCao = (e, chiXem = false) => {
        danhSachNhanVien.sort((a, b) => b.chiTieu - a.chiTieu);
        hienThiDanhSachNhanVien();

        const trienKhaiMCDay = $('input[name="opt-mc-day"]:checked').val() || 'Có';
        const chiNhanh = 'TNH';
        const tongSoNhanSu = danhSachNhanVien.length;

        let nvTrienKhai = 0;
        let tongTuongTac = 0;
        let tongGap = 0;
        let tongMC = 0, tongNTB = 0, tongETB = 0;
        let tongHKD = 0, hkdNTB = 0, hkdETB = 0;
        let tongReactive = 0;
        let tongCashIn = 0;
        let tongVolInSo = 0;
        let volInRaws = [];

        // Deal & Doanh số
        let cdDeal = 0, cdDoanhSo = 0;
        let tdDeal = 0, tdDoanhSo = 0;
        let tongShopdeals = 0;
        let tongPOS = 0;
        let pntDeal = 0, pntDoanhSo = 0; // Banca Non Life (PNT)
        let shopcashDeal = 0, shopcashDoanhSo = 0;

        let dsChiTiet = [];
        const banDoLichSu = new Map();
        if (baoCaoLichSuGanNhat?.duLieuNvLichSu) {
            baoCaoLichSuGanNhat.duLieuNvLichSu.forEach(n => banDoLichSu.set(n.ten, n));
        }

        danhSachNhanVien.forEach(nv => {
            const bieuTuong = nv.gioiTinh === 'Nữ' ? '👵' : '👨';
            const bc = nv.baoCao || '';

            // Trích xuất các chỉ số từ báo cáo từng cá nhân
            const infoMC = trichXuatMC(bc);
            const infoHKD = trichXuatHKD(bc);
            const infoVol = trichXuatVolIn(bc);
            const infoCD = trichXuatDealDoanhSo(bc, ['CD', 'Deal CD', 'Cho vay', 'Tin dung']);
            const infoTD = trichXuatDealDoanhSo(bc, ['TD', 'Deal TD', 'Tiết kiệm', 'Tiet kiem']);
            const infoPNT = trichXuatDealDoanhSo(bc, ['Banca Non Life', 'Banca Nonlife', 'Banca phi nhân thọ', 'Phi nhân thọ', 'Banca PNT', 'PNT', 'Non Life', 'Nonlife', 'Banca', 'Deal PNT']);
            const infoShopcash = trichXuatDealDoanhSo(bc, ['Shopcash', 'Shop cash']);

            // Nếu nhân viên báo cáo deal tự do (như "27đ, 1 deal", "1 deal 27đ"...) gán vào Banca Non Life (PNT)
            if (infoPNT.deal === 0 && infoCD.deal === 0 && infoTD.deal === 0 && infoShopcash.deal === 0) {
                const genericDeal = trichXuatDealDoanhSo(bc, ['Deal', 'Báo cáo deal', '']);
                if (genericDeal.deal > 0 || genericDeal.doanhSo > 0) {
                    infoPNT.deal = genericDeal.deal;
                    infoPNT.doanhSo = genericDeal.doanhSo;
                    infoPNT.doanhSoRaw = genericDeal.doanhSoRaw;
                }
            }

            let mtd = trichXuatSoLieu(bc, 'MTD MC');
            if ((nv.trangThai === 'Off' || infoMC.tongMC === 0) && mtd === 0 && baoCaoLichSuGanNhat) {
                const nvLichSu = banDoLichSu.get(nv.ten);
                mtd = nvLichSu ? (nvLichSu.mtdMC || 0) : 0;
            }

            if (nv.trangThai === 'Off') {
                const matchLyDo = bc.match(/^Fos\s+\S+\s+(.*)$/i);
                const lyDo = (matchLyDo && matchLyDo[1] && matchLyDo[1].toUpperCase() !== 'OFF') ? matchLyDo[1] : 'OFF';
                dsChiTiet.push(`${bieuTuong}${nv.ten}: ${lyDo} (MTD: ${mtd}/${nv.chiTieu})`);
            } else {
                nvTrienKhai++;
                tongTuongTac += trichXuatSoLieu(bc, ['Số lượng tương tác', 'Số tương tác', 'Tương tác', 'Tuong tac', 'TT']);
                tongGap += trichXuatSoLieu(bc, ['Số lượng gặp', 'Gặp', 'Gap', 'Số gặp']);
                
                tongMC += infoMC.tongMC;
                tongNTB += infoMC.ntb;
                tongETB += infoMC.etb;

                tongHKD += infoHKD.tongHKD;
                hkdNTB += infoHKD.ntb;
                hkdETB += infoHKD.etb;

                tongReactive += trichXuatSoLieu(bc, ['SL MC Reactive', 'Số lượng MC Reactive', 'MC Reactive', 'MCREACTIVE', 'Reactive']);
                tongCashIn += trichXuatSoLieu(bc, ['Số lượng Cash in mới', 'Số lượng Cash in', 'Cash in mới', 'Cash in moi', 'Cash in', 'Cashin']);
                
                if (infoVol.so > 0) {
                    tongVolInSo += infoVol.so;
                } else if (infoVol.raw && infoVol.raw !== '0') {
                    volInRaws.push(infoVol.raw);
                }

                cdDeal += infoCD.deal;
                cdDoanhSo += infoCD.doanhSo;

                tdDeal += infoTD.deal;
                tdDoanhSo += infoTD.doanhSo;

                tongShopdeals += trichXuatSoLieu(bc, ['Shopdeals', 'Shop deals', 'Shopdeal', 'Shop deal']);
                tongPOS += trichXuatSoLieu(bc, ['POS', 'Pos', 'pos']);

                pntDeal += infoPNT.deal;
                pntDoanhSo += infoPNT.doanhSo;

                shopcashDeal += infoShopcash.deal;
                shopcashDoanhSo += infoShopcash.doanhSo;

                let pntDetail = infoPNT.deal > 0 ? ` | PNT: ${infoPNT.deal} deal (${dinhDangDoanhSo(infoPNT.doanhSo, infoPNT.doanhSoRaw)})` : '';
                let cdDetail = infoCD.deal > 0 ? ` | CD: ${infoCD.deal} deal (${dinhDangDoanhSo(infoCD.doanhSo, infoCD.doanhSoRaw)})` : '';
                dsChiTiet.push(`${bieuTuong}${nv.ten}: ${infoMC.tongMC} MC (${infoMC.ntb} NTB, ${infoMC.etb} ETB) | HKD: ${infoHKD.tongHKD} | MTD: ${mtd}/${nv.chiTieu}${pntDetail}${cdDetail}`);
            }
        });

        const cdDoanhSoStr = dinhDangDoanhSo(cdDoanhSo, '0');
        const tdDoanhSoStr = dinhDangDoanhSo(tdDoanhSo, '0');
        const pntDoanhSoStr = dinhDangDoanhSo(pntDoanhSo, '0');
        const shopcashDoanhSoStr = dinhDangDoanhSo(shopcashDoanhSo, '0');

        let volInDisplay = '0';
        if (tongVolInSo > 0) {
            volInDisplay = dinhDangDoanhSo(tongVolInSo);
        } else if (volInRaws.length > 0) {
            volInDisplay = volInRaws.join(' + ');
        }

        // Format Báo cáo tổng hợp theo đúng mẫu người dùng yêu cầu:
        let ketQua = `Triển khai MC Day: ${trienKhaiMCDay} - Chi nhánh: ${chiNhanh}\n`;
        ketQua += `Số lượng nhân sự: ${tongSoNhanSu}\n`;
        ketQua += `Số lượng nhân sự triển khai: ${nvTrienKhai}\n\n`;

        ketQua += `- Số lượng tương tác: ${tongTuongTac}\n`;
        ketQua += `- Số lượng gặp: ${tongGap}\n`;
        ketQua += `- Số lượng MC: ${tongNTB} NTB, ${tongETB} ETB\n`;
        ketQua += `- Số lượng HKD: ${hkdNTB} NTB ${hkdETB} ETB (${tongHKD} HKD)\n`;
        ketQua += `- SL MC Reactive: ${tongReactive}\n`;
        ketQua += `- Số lượng Cash in mới: ${tongCashIn}\n`;
        ketQua += `- Số lượng Vol In mới: ${volInDisplay}\n\n`;

        ketQua += `* Deal\n`;
        ketQua += `- CD : ${cdDeal} deal/${cdDoanhSoStr}\n`;
        ketQua += `- TD : ${tdDeal} Deal/${tdDoanhSoStr}\n`;
        ketQua += `- Shopdeals: ${tongShopdeals}\n`;
        ketQua += `- POS: ${tongPOS}\n`;
        ketQua += `- Banca Non Life: ${pntDeal} Deal/${pntDoanhSoStr}\n`;
        ketQua += `- Shopcash: ${shopcashDeal} Deal/${shopcashDoanhSoStr}`;

        $('#vung-ket-qua-bao-cao').val(ketQua);

        // Box 2: Chi tiết nhân sự
        let ketQua2 = `Chi tiết nhân sự ngày ${dinhDangNgayHienThi(new Date())} (${nvTrienKhai}/${tongSoNhanSu} FOS):\n`;
        ketQua2 += dsChiTiet.join('\n');
        $('#vung-ket-qua-bao-cao-2').val(ketQua2);

        if (!chiXem) {
            const thongKe = {
                trienKhaiMCDay,
                chiNhanh,
                soLuongNhanSu: tongSoNhanSu,
                soLuongTrienKhai: nvTrienKhai,
                tongFOS: tongSoNhanSu,
                activeFOS: nvTrienKhai,
                tongTuongTac,
                tongGap,
                tongMC,
                tongNTB,
                tongETB,
                tongHKD,
                hkdNTB,
                hkdETB,
                tongReactive,
                tongCashIn,
                tongVolInSo,
                tongVolInStr: volInDisplay,
                cdDeal,
                cdDoanhSo,
                cdDoanhSoStr,
                tdDeal,
                tdDoanhSo,
                tdDoanhSoStr,
                tongShopdeals,
                tongPOS,
                pntDeal,
                pntDoanhSo,
                pntDoanhSoStr,
                shopcashDeal,
                shopcashDoanhSo,
                shopcashDoanhSoStr,
                nsbqNTB: (nvTrienKhai > 0 ? (tongNTB / nvTrienKhai).toFixed(2) : '0.00'),
                nsbqETB: (nvTrienKhai > 0 ? (tongETB / nvTrienKhai).toFixed(2) : '0.00'),
                posChiTieu: tongSoNhanSu * 3,
                tongPosThucHien: tongPOS
            };
            luuBaoCaoLenServer(taoCauTrucGuiBaoCao(danhSachNhanVien, baoCaoLichSuGanNhat, thongKe), true);
        }
    };

    // --- HELPER TẠO BÁO CÁO TỪ DB OBJECT ---
    const taiTaoNoiDungBaoCao = (bc) => {
        const thongKe = bc.tongKetToanDoi || {};
        const trienKhai = thongKe.trienKhaiMCDay || 'Có';
        const chiNhanh = thongKe.chiNhanh || 'TNH';
        const tongSoNhanSu = thongKe.soLuongNhanSu || thongKe.tongSoFOS || (bc.baoCaoFOS ? bc.baoCaoFOS.length : 0);
        const nhanSuTrienKhai = thongKe.soLuongTrienKhai || (thongKe.tyLeActiveFOS ? parseInt(thongKe.tyLeActiveFOS.split('/')[0]) : tongSoNhanSu);

        const tongTuongTac = thongKe.tongTuongTac || 0;
        const tongGap = thongKe.tongGap || 0;
        const tongMC = thongKe.tongMC || thongKe.tongSoMC || 0;
        const tongNTB = thongKe.tongNTB || thongKe.tongSoNTB || 0;
        const tongETB = thongKe.tongETB || thongKe.tongSoETB || 0;
        const tongHKD = thongKe.tongHKD || thongKe.tongSoTKHKD || 0;
        const hkdNTB = thongKe.hkdNTB || 0;
        const hkdETB = thongKe.hkdETB || 0;
        const tongReactive = thongKe.tongReactive || 0;
        const tongCashIn = thongKe.tongCashIn || 0;
        const volInDisplay = thongKe.tongVolInStr || (thongKe.tongVolInSo ? dinhDangDoanhSo(thongKe.tongVolInSo) : '0');

        const cdDeal = thongKe.cdDeal || 0;
        const cdDoanhSoStr = thongKe.cdDoanhSoStr || (thongKe.cdDoanhSo ? dinhDangDoanhSo(thongKe.cdDoanhSo) : '0');
        const tdDeal = thongKe.tdDeal || 0;
        const tdDoanhSoStr = thongKe.tdDoanhSoStr || (thongKe.tdDoanhSo ? dinhDangDoanhSo(thongKe.tdDoanhSo) : '0');
        const tongShopdeals = thongKe.tongShopdeals || thongKe.tongSoTShop || 0;
        const tongPOS = thongKe.tongPOS || (thongKe.tyLePOS ? parseInt(thongKe.tyLePOS.split('/')[0]) : 0);
        const pntDeal = thongKe.pntDeal || 0;
        const pntDoanhSoStr = thongKe.pntDoanhSoStr || (thongKe.pntDoanhSo ? dinhDangDoanhSo(thongKe.pntDoanhSo) : '0');
        const shopcashDeal = thongKe.shopcashDeal || 0;
        const shopcashDoanhSoStr = thongKe.shopcashDoanhSoStr || (thongKe.shopcashDoanhSo ? dinhDangDoanhSo(thongKe.shopcashDoanhSo) : '0');

        let ketQua = `Triển khai MC Day: ${trienKhai} - Chi nhánh: ${chiNhanh}\n`;
        ketQua += `Số lượng nhân sự: ${tongSoNhanSu}\n`;
        ketQua += `Số lượng nhân sự triển khai: ${nhanSuTrienKhai}\n\n`;

        ketQua += `- Số lượng tương tác: ${tongTuongTac}\n`;
        ketQua += `- Số lượng gặp: ${tongGap}\n`;
        ketQua += `- Số lượng MC: ${tongNTB} NTB, ${tongETB} ETB\n`;
        ketQua += `- Số lượng HKD: ${hkdNTB} NTB ${hkdETB} ETB (${tongHKD} HKD)\n`;
        ketQua += `- SL MC Reactive: ${tongReactive}\n`;
        ketQua += `- Số lượng Cash in mới: ${tongCashIn}\n`;
        ketQua += `- Số lượng Vol In mới: ${volInDisplay}\n\n`;

        ketQua += `* Deal\n`;
        ketQua += `- CD : ${cdDeal} deal/${cdDoanhSoStr}\n`;
        ketQua += `- TD : ${tdDeal} Deal/${tdDoanhSoStr}\n`;
        ketQua += `- Shopdeals: ${tongShopdeals}\n`;
        ketQua += `- POS: ${tongPOS}\n`;
        ketQua += `- Banca Non Life: ${pntDeal} Deal/${pntDoanhSoStr}\n`;
        ketQua += `- Shopcash: ${shopcashDeal} Deal/${shopcashDoanhSoStr}`;

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
            const bc = nv.baoCao || '';
            $('#tieu-de-modal-sua-bao-cao').text(`Sửa báo cáo: ${nhanVienHienTai}`);
            
            const mc = trichXuatMC(bc);
            const hkd = trichXuatHKD(bc);
            const vol = trichXuatVolIn(bc);
            const cd = trichXuatDealDoanhSo(bc, ['CD', 'Deal CD', 'Cho vay', 'Tin dung']);
            const td = trichXuatDealDoanhSo(bc, ['TD', 'Deal TD', 'Tiết kiệm', 'Tiet kiem']);
            const pnt = trichXuatDealDoanhSo(bc, ['Banca Non Life', 'Banca Nonlife', 'Banca phi nhân thọ', 'Phi nhân thọ', 'Banca PNT', 'PNT', 'Non Life', 'Nonlife']);
            const shopcash = trichXuatDealDoanhSo(bc, ['Shopcash', 'Shop cash']);

            $('#tuongtac-sua').val(trichXuatSoLieu(bc, ['Số lượng tương tác', 'Số tương tác', 'Tương tác', 'Tuong tac', 'TT']));
            $('#gap-sua').val(trichXuatSoLieu(bc, ['Số lượng gặp', 'Gặp', 'Gap', 'Số gặp']));
            $('#reactive-sua').val(trichXuatSoLieu(bc, ['SL MC Reactive', 'Số lượng MC Reactive', 'MC Reactive', 'MCREACTIVE', 'Reactive']));

            $('#ntb-sua').val(mc.ntb);
            $('#etb-sua').val(mc.etb);
            $('#hkd-ntb-sua').val(hkd.ntb);
            $('#hkd-etb-sua').val(hkd.etb);

            $('#cashin-sua').val(trichXuatSoLieu(bc, ['Số lượng Cash in mới', 'Số lượng Cash in', 'Cash in mới', 'Cash in moi', 'Cash in', 'Cashin']));
            $('#volin-sua').val(vol.raw || (vol.so > 0 ? vol.so : '0'));
            $('#shopdeals-sua').val(trichXuatSoLieu(bc, ['Shopdeals', 'Shop deals', 'Shopdeal', 'Shop deal']));
            $('#pos-sua').val(trichXuatSoLieu(bc, ['POS', 'Pos', 'pos']));

            $('#pnt-deal-sua').val(pnt.deal);
            $('#pnt-ds-sua').val(pnt.doanhSoRaw || (pnt.doanhSo > 0 ? pnt.doanhSo : '0'));

            $('#cd-deal-sua').val(cd.deal);
            $('#cd-ds-sua').val(cd.doanhSoRaw || (cd.doanhSo > 0 ? cd.doanhSo : '0'));

            $('#shopcash-deal-sua').val(shopcash.deal);
            $('#shopcash-ds-sua').val(shopcash.doanhSoRaw || (shopcash.doanhSo > 0 ? shopcash.doanhSo : '0'));

            $('#td-deal-sua').val(td.deal);
            $('#td-ds-sua').val(td.doanhSoRaw || (td.doanhSo > 0 ? td.doanhSo : '0'));

            $('#mtd-sua').val(trichXuatSoLieu(bc, 'MTD MC'));
            modalSuaBaoCao.show();
        }
    });

    $('#nut-xac-nhan-sua-bao-cao').on('click', () => {
        const nv = danhSachNhanVien.find(n => n.ten === nhanVienHienTai);
        if (nv) {
            const tuongTac = parseInt($('#tuongtac-sua').val()) || 0;
            const gap = parseInt($('#gap-sua').val()) || 0;
            const reactive = parseInt($('#reactive-sua').val()) || 0;

            const ntb = parseInt($('#ntb-sua').val()) || 0;
            const etb = parseInt($('#etb-sua').val()) || 0;
            const tongMC = ntb + etb;

            const hkdNTB = parseInt($('#hkd-ntb-sua').val()) || 0;
            const hkdETB = parseInt($('#hkd-etb-sua').val()) || 0;
            const tongHKD = hkdNTB + hkdETB;

            const cashIn = parseInt($('#cashin-sua').val()) || 0;
            const volIn = $('#volin-sua').val().trim() || '0';
            const shopdeals = parseInt($('#shopdeals-sua').val()) || 0;
            const pos = parseInt($('#pos-sua').val()) || 0;

            const pntDeal = parseInt($('#pnt-deal-sua').val()) || 0;
            const pntDS = $('#pnt-ds-sua').val().trim() || '0';

            const cdDeal = parseInt($('#cd-deal-sua').val()) || 0;
            const cdDS = $('#cd-ds-sua').val().trim() || '0';

            const shopcashDeal = parseInt($('#shopcash-deal-sua').val()) || 0;
            const shopcashDS = $('#shopcash-ds-sua').val().trim() || '0';

            const tdDeal = parseInt($('#td-deal-sua').val()) || 0;
            const tdDS = $('#td-ds-sua').val().trim() || '0';

            const mtd = parseInt($('#mtd-sua').val()) || 0;

            let lines = [
                `Fos ${nv.ten}`,
                `- Số lượng tương tác: ${tuongTac}`,
                `- Số lượng gặp: ${gap}`,
                `- Số lượng MC: ${ntb} NTB, ${etb} ETB`,
                `- Số lượng HKD: ${hkdNTB} NTB ${hkdETB} ETB (${tongHKD} HKD)`,
                `- SL MC Reactive: ${reactive}`,
                `- Số lượng Cash in mới: ${cashIn}`,
                `- Số lượng Vol In mới: ${volIn}`,
                `* Deal`,
                `- CD : ${cdDeal} deal/${cdDS}`,
                `- TD : ${tdDeal} Deal/${tdDS}`,
                `- Shopdeals: ${shopdeals}`,
                `- POS: ${pos}`,
                `- Banca Non Life: ${pntDeal} Deal/${pntDS}`,
                `- Shopcash: ${shopcashDeal} Deal/${shopcashDS}`,
                `MTD MC: ${mtd}`
            ];

            nv.baoCao = lines.join('\n');
            nv.trangThai = 'Đã báo cáo';
            hienThiDanhSachNhanVien();
            luuVaoBoNhoTam();
            modalSuaBaoCao.hide();
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
            hienThiThongBao('Đã sao chép báo cáo tổng hợp!');
            $btn.html('<i class="fa-solid fa-check"></i> Đã chép').addClass('btn-success').removeClass('btn-primary');
            setTimeout(() => $btn.html('<i class="fa-regular fa-copy"></i> Sao chép').removeClass('btn-success').addClass('btn-primary'), 2000);
        });
    });

    $('#nut-sao-chep-2').on('click', function() {
        const $btn = $(this);
        navigator.clipboard.writeText($('#vung-ket-qua-bao-cao-2').val()).then(() => {
            hienThiThongBao('Đã sao chép chi tiết nhân sự!');
            $btn.html('<i class="fa-solid fa-check"></i> Đã chép').addClass('btn-success').removeClass('btn-outline-primary');
            setTimeout(() => $btn.html('<i class="fa-regular fa-copy"></i> Sao chép').removeClass('btn-success').addClass('btn-outline-primary'), 2000);
        });
    });
    
    // --- XỬ LÝ SỰ KIỆN XEM BÁO CÁO CŨ (MỚI) ---
    $('#nut-xem-bao-cao-cu').on('click', async () => {
        hienThiTaiTrang("Đang tải báo cáo cũ...");
        try {
            const homNayStr = dinhDangNgayISO(new Date());
            // Lấy báo cáo ngày gần nhất (nhỏ hơn ngày hôm nay)
            const q = encodeURIComponent(JSON.stringify({ "ngayBaoCao": { "$lt": homNayStr } }));
            const h = encodeURIComponent(JSON.stringify({ "$orderby": { "ngayBaoCao": -1 } }));
            
            const duLieu = await thucHienGoiApi(`report?q=${q}&h=${h}&max=1`);
            
            if (duLieu && Array.isArray(duLieu) && duLieu.length > 0) {
                const reportContent = taiTaoNoiDungBaoCao(duLieu[0]);
                $('#vung-ket-qua-bao-cao-cu').val(reportContent);
                $('#modal-xem-bao-cao-cu .modal-title').text(`Báo cáo ngày gần nhất (${dinhDangNgayHienThi(duLieu[0].ngayBaoCao)})`);
                modalXemBaoCaoCu.show();
            } else {
                hienThiThongBao("Không tìm thấy dữ liệu báo cáo lịch sử nào.", "info");
            }
        } catch (e) {
            hienThiThongBao("Lỗi tải lịch sử: " + e.message, "error");
            console.error("Lỗi khi tải báo cáo lịch sử:", e);
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
