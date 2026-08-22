
import { dinhDangNgayHienThi, dinhDangNgayISO, trichXuatSoLieu, trichXuatMC, trichXuatHKD, trichXuatDealDoanhSo, trichXuatVolIn } from './utils.js';

export const kiemTraTenTrongBaoCao = (duLieuNv, noiDungBaoCao) => {
    if (!noiDungBaoCao.trim() || !duLieuNv || typeof duLieuNv.ten !== 'string') {
        duLieuNv.kiemTraTen = null;
        return;
    }
    const tenDaEscape = duLieuNv.ten.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const bieuThuc = new RegExp(`^(fos\\s+)?${tenDaEscape}(?=\\s|$)`, 'i');
    duLieuNv.kiemTraTen = bieuThuc.test(noiDungBaoCao.trim());
};

export const taoCauTrucGuiBaoCao = (danhSachNhanVien, baoCaoLichSu, thongKe) => {
     const homNayStr = dinhDangNgayISO(new Date());
     const tongKetToanDoi = {
         // Thông tin MC Day & Chi nhánh
         trienKhaiMCDay: thongKe.trienKhaiMCDay || 'Có',
         chiNhanh: thongKe.chiNhanh || 'TNH',
         soLuongNhanSu: thongKe.soLuongNhanSu || danhSachNhanVien.length,
         soLuongTrienKhai: thongKe.soLuongTrienKhai || thongKe.activeFOS,

         // Các chỉ số hoạt động hàng ngày
         tongTuongTac: thongKe.tongTuongTac || 0,
         tongGap: thongKe.tongGap || 0,
         tongMC: thongKe.tongMC || 0,
         tongNTB: thongKe.tongNTB || 0,
         tongETB: thongKe.tongETB || 0,
         tongHKD: thongKe.tongHKD || 0,
         hkdNTB: thongKe.hkdNTB || 0,
         hkdETB: thongKe.hkdETB || 0,
         tongReactive: thongKe.tongReactive || 0,
         tongCashIn: thongKe.tongCashIn || 0,
         tongVolInSo: thongKe.tongVolInSo || 0,
         tongVolInStr: thongKe.tongVolInStr || '0',

         // Deal & Doanh số
         cdDeal: thongKe.cdDeal || 0,
         cdDoanhSo: thongKe.cdDoanhSo || 0,
         cdDoanhSoStr: thongKe.cdDoanhSoStr || '0',
         tdDeal: thongKe.tdDeal || 0,
         tdDoanhSo: thongKe.tdDoanhSo || 0,
         tdDoanhSoStr: thongKe.tdDoanhSoStr || 'Doanh số',
         tongShopdeals: thongKe.tongShopdeals || 0,
         tongPOS: thongKe.tongPOS || 0,
         pntDeal: thongKe.pntDeal || 0,
         pntDoanhSo: thongKe.pntDoanhSo || 0,
         pntDoanhSoStr: thongKe.pntDoanhSoStr || '0',
         shopcashDeal: thongKe.shopcashDeal || 0,
         shopcashDoanhSo: thongKe.shopcashDoanhSo || 0,
         shopcashDoanhSoStr: thongKe.shopcashDoanhSoStr || '0',

         // Trường tương thích cũ
         tongSoFOS: thongKe.tongFOS || danhSachNhanVien.length,
         tongSoMC: thongKe.tongMC || 0,
         tongSoNTB: thongKe.tongNTB || 0,
         NSBQ_NTB: parseFloat(thongKe.nsbqNTB || '0'),
         tongSoETB: thongKe.tongETB || 0,
         NSBQ_ETB: parseFloat(thongKe.nsbqETB || '0'),
         tongSoAEPlus: thongKe.tongAEPlus || 0,
         tongSoTKHKD: thongKe.tongHKD || thongKe.tongTKHKD || 0,
         tongSoTShop: thongKe.tongTShop || 0,
         tyLePOS: `${thongKe.tongPOS || thongKe.tongPosThucHien || 0}/${thongKe.posChiTieu || danhSachNhanVien.length * 3}`,
         tyLeActiveFOS: `${thongKe.activeFOS || thongKe.soLuongTrienKhai || 0}/${danhSachNhanVien.length}`
     };
     
     const baoCaoNhanVien = danhSachNhanVien.map(nv => {
         const noiDung = nv.baoCao || '';
         const infoMC = trichXuatMC(noiDung);
         let mtd = trichXuatSoLieu(noiDung, 'MTD MC');
         let mcHomNay = infoMC.tongMC;
         
         let giaTriOff = 0;
         if (nv.trangThai === 'Off') {
             const khopLyDo = noiDung.match(/^Fos\s+\S+\s+(.*)$/i);
             const chuLyDo = (khopLyDo && khopLyDo[1]) ? khopLyDo[1].trim() : 'OFF';
             giaTriOff = chuLyDo.toUpperCase() === 'OFF' ? 1 : chuLyDo;
         }

         if ((nv.trangThai === 'Off' || mcHomNay === 0) && mtd === 0 && baoCaoLichSu && baoCaoLichSu.duLieuNvLichSu) {
             const nvCu = baoCaoLichSu.duLieuNvLichSu.find(f => f.ten === nv.ten);
             if (nvCu) mtd = nvCu.mtdMC || 0;
         } else if (mtd === 0 && nv.trangThai === 'Đã báo cáo' && baoCaoLichSu && baoCaoLichSu.duLieuNvLichSu) {
             const nvCu = baoCaoLichSu.duLieuNvLichSu.find(f => f.ten === nv.ten);
             if (nvCu) mtd = (nvCu.mtdMC || 0) + mcHomNay;
         }

         return {
             tenNhanVien: nv.ten,
             OFF: giaTriOff,
             chiSoHieuSuat: {
                 saleHomNay: nv.trangThai === 'Off' ? 0 : mcHomNay,
                 saleTrongThang: mtd,
                 chiTieu: nv.chiTieu
             },
             rawReport: nv.baoCao 
         };
     });

     return {
         ngayBaoCao: homNayStr,
         tongKetToanDoi: tongKetToanDoi,
         baoCaoFOS: baoCaoNhanVien
     };
};

