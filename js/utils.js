export const hienThiThongBao = (noiDung, loai = 'success') => {
    let mauNen = "linear-gradient(to right, #00b09b, #96c93d)"; // Thành công
    if (loai === 'danger' || loai === 'error') {
        mauNen = "linear-gradient(to right, #ff5f6d, #ffc371)"; // Lỗi
    } else if (loai === 'info') {
        mauNen = "linear-gradient(to right, #2193b0, #6dd5ed)"; // Thông tin
    }

    if (window.Toastify) {
        window.Toastify({
            text: noiDung,
            duration: 3000,
            gravity: "bottom",
            position: "right",
            stopOnFocus: true,
            style: {
                background: mauNen,
                borderRadius: "12px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
                fontFamily: "'Poppins', sans-serif",
                padding: "12px 20px",
                fontWeight: "500",
                fontSize: "0.9rem"
            }
        }).showToast();
    } else {
        console.log(`[${loai}] ${noiDung}`);
    }
};

export const hienThiTaiTrang = (chuThich = "Đang xử lý...") => {
    $('#chu-thich-tai-trang').text(chuThich);
    $('#lop-phu-tai-trang').css('display', 'flex');
};

export const anTaiTrang = () => {
    $('#lop-phu-tai-trang').hide();
};

export const dinhDangNgayHienThi = (ngay) => {
     if (!ngay) return '--/--/----';
     if (typeof ngay === 'string' && ngay.match(/^\d{4}-\d{2}-\d{2}$/)) {
         const [y, m, d] = ngay.split('-');
         return `${d}/${m}/${y}`;
     }
     const n = new Date(ngay);
     if (isNaN(n.getTime())) return '--/--/----';
     const d = String(n.getDate()).padStart(2, '0');
     const m = String(n.getMonth() + 1).padStart(2, '0');
     const y = n.getFullYear();
     return `${d}/${m}/${y}`;
};

export const dinhDangNgayISO = (ngay) => {
    const n = (ngay instanceof Date) ? ngay : new Date(ngay);
    if (isNaN(n.getTime())) return '';
    const y = n.getFullYear();
    const m = String(n.getMonth() + 1).padStart(2, '0');
    const d = String(n.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const trichXuatSoLieu = (noiDung, tuKhoa) => {
    if (!noiDung) return 0;
    const danhSachTuKhoa = Array.isArray(tuKhoa) ? tuKhoa : [tuKhoa];
    for (const tu of danhSachTuKhoa) {
        if (typeof tu !== 'string') continue;
        const tuDaEscape = tu.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const bieuThuc = new RegExp(tuDaEscape + '\\s*[:\\-\\s]\\s*(\\d+)', 'i');
        const khop = noiDung.match(bieuThuc);
        if (khop) return parseInt(khop[1], 10);
    }
    return 0;
};

// Chuyển đổi chuỗi doanh số (ví dụ: "27đ", "50tr", "1.5tr", "1tr5", "2tr520", "500k", "50000000", "50.000.000") thành số nguyên VND
export const chuyenDoiDoanhSoSangSo = (chuoi) => {
    if (!chuoi) return 0;
    if (typeof chuoi === 'number') return chuoi;
    const str = String(chuoi).trim().toLowerCase();
    if (!str || str === '0' || str === 'doanh số' || str === 'doanh so') return 0;

    // Trường hợp có tỷ/ty/b
    const tyMatch = str.match(/([\d.,]+)\s*(?:tỷ|ty|b)/i);
    if (tyMatch) {
        const val = parseFloat(tyMatch[1].replace(/,/g, '.'));
        return isNaN(val) ? 0 : Math.round(val * 1000000000);
    }

    // Trường hợp có tr/triệu/trieu/m kèm phần lẻ phía sau (ví dụ: 1tr5, 2tr520, 2tr050)
    const tr5Match = str.match(/(\d+)\s*(?:tr|triệu|trieu|m)\s*(\d+)/i);
    if (tr5Match) {
        const val1 = parseInt(tr5Match[1], 10);
        const val2Str = tr5Match[2];
        const val2Padded = val2Str.padEnd(6, '0').slice(0, 6);
        const val2 = parseInt(val2Padded, 10) || 0;
        return val1 * 1000000 + val2;
    }

    // Trường hợp có số thập phân và tr/triệu (ví dụ: 1.5tr, 1,5tr, 50tr)
    const trMatch = str.match(/([\d.,]+)\s*(?:tr|triệu|trieu|m)/i);
    if (trMatch) {
        const val = parseFloat(trMatch[1].replace(/,/g, '.'));
        return isNaN(val) ? 0 : Math.round(val * 1000000);
    }

    // Trường hợp có đ/d/đồng/dong/củ/chai (ví dụ: 27đ, 27d, 27 đồng, 27 củ, 27 chai)
    const dMatch = str.match(/([\d.,]+)\s*(?:đ|d|đồng|dong|củ|chai)/i);
    if (dMatch) {
        const val = parseFloat(dMatch[1].replace(/,/g, '.'));
        if (!isNaN(val)) {
            if (val < 1000) return Math.round(val * 1000000);
            return Math.round(val);
        }
    }

    // Trường hợp có k/nghìn/nghin (ví dụ: 500k)
    const kMatch = str.match(/([\d.,]+)\s*(?:k|nghìn|nghin)/i);
    if (kMatch) {
        const val = parseFloat(kMatch[1].replace(/,/g, '.'));
        return isNaN(val) ? 0 : Math.round(val * 1000);
    }

    // Trường hợp số nguyên định dạng chuẩn (50.000.000 hoặc 50,000,000 hoặc 50000000)
    const soSach = str.replace(/[^\d]/g, '');
    if (soSach) {
        const num = parseInt(soSach, 10) || 0;
        if (num > 0 && num < 1000 && (str.includes('đ') || str.includes('d'))) {
            return num * 1000000;
        }
        return num;
    }
    return 0;
};

// Định dạng số thành chuỗi doanh số dễ đọc (ví dụ: 50tr, 1.5tr, 2tr520, 500k, 0)
export const dinhDangDoanhSo = (so, fallback = '0') => {
    if (!so || so <= 0) return fallback;
    if (so >= 1000000000) {
        const ty = so / 1000000000;
        return Number.isInteger(ty) ? `${ty} tỷ` : `${parseFloat(ty.toFixed(2))} tỷ`;
    }
    if (so >= 1000000) {
        const tr = Math.floor(so / 1000000);
        const le = so % 1000000;
        if (le === 0) return `${tr}tr`;
        const k = Math.round(le / 1000);
        if (k > 0) {
            if (k % 100 === 0) {
                return `${tr}tr${k / 100}`;
            }
            let kStr = k < 10 ? `00${k}` : (k < 100 ? `0${k}` : `${k}`);
            return `${tr}tr${kStr}`;
        }
        return `${tr}tr`;
    }
    if (so >= 1000) {
        const k = so / 1000;
        return Number.isInteger(k) ? `${k}k` : `${parseFloat(k.toFixed(1))}k`;
    }
    return `${so.toLocaleString('vi-VN')}`;
};

// Trích xuất Deal và Doanh số từ báo cáo thành viên (hỗ trợ nhiều deal: 2 (500k) (2tr520) hoặc 2 (500k, 2tr520))
export const trichXuatDealDoanhSo = (noiDung, danhSachTuKhoa) => {
    if (!noiDung) return { deal: 0, doanhSo: 0, doanhSoRaw: '0' };
    const tuKhoas = Array.isArray(danhSachTuKhoa) ? danhSachTuKhoa : [danhSachTuKhoa];
    
    for (const tu of tuKhoas) {
        if (typeof tu !== 'string') continue;
        const tuEsc = tu ? tu.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') : '';
        const prefix = tuEsc ? `${tuEsc}\\s*[:\\-]\\s*` : '';

        // Dạng nhiều deal trong ngoặc hoặc phân tách dấu phẩy: Banca Nonlife: 2 (500k) (2tr520) hoặc 2 (500k, 2tr520) hoặc (500k)(2tr520)
        const reMulti = new RegExp(`${prefix}(\\d+)?\\s*(?:deal|deals)?\\s*[:\\-]?\\s*([(\\[][^\\n]+|\\d+\\s*(?:deal|deals)?\\s*[:\\-]?[^\\n]*(?:[,+].*))`, 'i');
        const mMulti = noiDung.match(reMulti);
        if (mMulti) {
            const rawContent = mMulti[2].trim();
            const items = [];
            const parenMatches = rawContent.match(/\(([^)]+)\)/g);
            if (parenMatches && parenMatches.length > 0) {
                parenMatches.forEach(p => {
                    const inner = p.replace(/[()]/g, '').trim();
                    inner.split(/[,+]/).forEach(sub => {
                        if (sub.trim()) items.push(sub.trim());
                    });
                });
            } else {
                rawContent.split(/[,+]/).forEach(sub => {
                    if (sub.trim()) items.push(sub.trim());
                });
            }

            if (items.length > 0) {
                let tongSo = 0;
                let dsRawList = [];
                items.forEach(it => {
                    const val = chuyenDoiDoanhSoSangSo(it);
                    if (val > 0) {
                        tongSo += val;
                        dsRawList.push(it);
                    }
                });

                if (tongSo > 0 || dsRawList.length > 0) {
                    const explicitDeal = mMulti[1] ? parseInt(mMulti[1], 10) : 0;
                    const dealCount = explicitDeal > 0 ? explicitDeal : items.length;
                    return {
                        deal: dealCount,
                        doanhSo: tongSo,
                        doanhSoRaw: dsRawList.join(' + ')
                    };
                }
            }
        }

        // Dạng: PNT: 27đ, 1 deal hoặc CD: 50tr/1 deal hoặc CD: 27đ - 1 deal
        const reDao = new RegExp(`${prefix}([\\d.,]+\\s*(?:đ|d|đồng|dong|tr|triệu|k|củ|chai|tỷ|ty|m|b))\\s*[,/\\-]?\\s*(\\d+)\\s*(?:deal|deals)`, 'i');
        const mDao = noiDung.match(reDao);
        if (mDao) {
            const dsRaw = mDao[1].trim();
            const deal = parseInt(mDao[2], 10) || 0;
            const dsSo = chuyenDoiDoanhSoSangSo(dsRaw);
            return { deal, doanhSo: dsSo, doanhSoRaw: dsRaw };
        }

        // Dạng: CD : 1 deal / 50tr hoặc PNT: 1 deal, 27đ hoặc CD: 1 deal 27tr
        const re1 = new RegExp(`${prefix}(\\d+)\\s*(?:deal|deals)?\\s*[,/\\-]?\\s*([\\d.,]+\\s*(?:đ|d|đồng|dong|tr|triệu|k|củ|chai|tỷ|ty|m|b|\\d+))`, 'i');
        const m1 = noiDung.match(re1);
        if (m1) {
            const deal = parseInt(m1[1], 10) || 0;
            const dsRaw = m1[2].trim();
            const dsSo = chuyenDoiDoanhSoSangSo(dsRaw);
            if (deal > 0 || dsSo > 0) {
                return { deal, doanhSo: dsSo, doanhSoRaw: dsRaw };
            }
        }

        // Dạng: CD : 1 deal / Doanh số hoặc CD: 1 deal
        const re2 = new RegExp(`${prefix}(\\d+)\\s*(?:deal|deals)`, 'i');
        const m2 = noiDung.match(re2);
        if (m2) {
            const deal = parseInt(m2[1], 10) || 0;
            return { deal, doanhSo: 0, doanhSoRaw: '0' };
        }

        // Dạng: CD: 0 hoặc CD: 1 (khi có từ khóa cụ thể)
        if (tuEsc) {
            const re3 = new RegExp(`${tuEsc}\\s*[:\\-]\\s*(\\d+)`, 'i');
            const m3 = noiDung.match(re3);
            if (m3) {
                const deal = parseInt(m3[1], 10) || 0;
                return { deal, doanhSo: 0, doanhSoRaw: '0' };
            }
        }
    }

    return { deal: 0, doanhSo: 0, doanhSoRaw: '0' };
};

// Trích xuất thông tin MC (Tổng MC, NTB, ETB)
export const trichXuatMC = (noiDung) => {
    if (!noiDung) return { tongMC: 0, ntb: 0, etb: 0 };
    
    const mcLineRegex = /(?:Số lượng MC|Tổng MC|MC)\s*[:\-]?\s*([^\n]+)/i;
    const mcMatch = noiDung.match(mcLineRegex);
    const dongMC = mcMatch ? mcMatch[1] : '';

    let ntb = 0;
    let etb = 0;
    let explicitTong = 0;

    if (dongMC) {
        const mTong = dongMC.match(/^(\d+)/);
        if (mTong) explicitTong = parseInt(mTong[1], 10);

        // Khớp pattern NTB và ETB cùng dòng:
        const m1 = dongMC.match(/NTB\s*[:\s]\s*(\d+)[^\n]*?ETB\s*[:\s]\s*(\d+)/i);
        const m2 = dongMC.match(/(\d+)\s*NTB[^\n]*?(\d+)\s*ETB/i);
        const m3 = dongMC.match(/ETB\s*[:\s]\s*(\d+)[^\n]*?NTB\s*[:\s]\s*(\d+)/i);
        const m4 = dongMC.match(/(\d+)\s*ETB[^\n]*?(\d+)\s*NTB/i);

        if (m1) { ntb = parseInt(m1[1], 10); etb = parseInt(m1[2], 10); }
        else if (m2) { ntb = parseInt(m2[1], 10); etb = parseInt(m2[2], 10); }
        else if (m3) { etb = parseInt(m3[1], 10); ntb = parseInt(m3[2], 10); }
        else if (m4) { etb = parseInt(m4[1], 10); ntb = parseInt(m4[2], 10); }
        else {
            const mNTB = dongMC.match(/(?:NTB\s*[:\s]\s*(\d+)|(\d+)\s*NTB)/i);
            const mETB = dongMC.match(/(?:ETB\s*[:\s]\s*(\d+)|(\d+)\s*ETB)/i);
            if (mNTB) ntb = parseInt(mNTB[1] || mNTB[2], 10);
            if (mETB) etb = parseInt(mETB[1] || mETB[2], 10);
        }
    }

    // Nếu chưa tìm thấy NTB/ETB trên dòng MC, tìm trong toàn bộ nội dung
    if (ntb === 0 && etb === 0) {
        const mAll1 = noiDung.match(/(?:MC\s*)?NTB\s*[:\s]\s*(\d+)/i);
        const mAll2 = noiDung.match(/(\d+)\s*(?:MC\s*)?NTB/i);
        if (mAll1) ntb = parseInt(mAll1[1], 10);
        else if (mAll2) ntb = parseInt(mAll2[1], 10);

        const mAllE1 = noiDung.match(/(?:MC\s*)?ETB\s*[:\s]\s*(\d+)/i);
        const mAllE2 = noiDung.match(/(\d+)\s*(?:MC\s*)?ETB/i);
        if (mAllE1) etb = parseInt(mAllE1[1], 10);
        else if (mAllE2) etb = parseInt(mAllE2[1], 10);
    }

    if (explicitTong === 0) {
        explicitTong = trichXuatSoLieu(noiDung, ['Số lượng MC', 'Tổng MC', 'MC']);
    }

    let tongMC = explicitTong > 0 ? explicitTong : (ntb + etb);

    if (tongMC > 0 && ntb === 0 && etb === 0) {
        ntb = tongMC;
    } else if (tongMC > (ntb + etb)) {
        if (etb > 0 && ntb === 0) {
            ntb = tongMC - etb;
        } else if (ntb > 0 && etb === 0) {
            etb = tongMC - ntb;
        }
    } else if ((ntb + etb) > tongMC) {
        tongMC = ntb + etb;
    }

    return { tongMC, ntb, etb };
};

// Trích xuất thông tin HKD (Tổng HKD, HKD NTB, HKD ETB)
export const trichXuatHKD = (noiDung) => {
    if (!noiDung) return { tongHKD: 0, ntb: 0, etb: 0 };

    const hkdLineRegex = /(?:Số lượng HKD|Tài khoản hộ kinh doanh|TK HKD|CA HKD|HKD)\s*[:\-]?\s*([^\n]+)/i;
    const hkdMatch = noiDung.match(hkdLineRegex);
    const dongHKD = hkdMatch ? hkdMatch[1] : '';

    let ntb = 0;
    let etb = 0;
    let explicitTong = 0;

    if (dongHKD) {
        const mTong = dongHKD.match(/^(\d+)/);
        if (mTong) explicitTong = parseInt(mTong[1], 10);

        const m1 = dongHKD.match(/NTB\s*[:\s]\s*(\d+)[^\n]*?ETB\s*[:\s]\s*(\d+)/i);
        const m2 = dongHKD.match(/(\d+)\s*NTB[^\n]*?(\d+)\s*ETB/i);
        const m3 = dongHKD.match(/ETB\s*[:\s]\s*(\d+)[^\n]*?NTB\s*[:\s]\s*(\d+)/i);
        const m4 = dongHKD.match(/(\d+)\s*ETB[^\n]*?(\d+)\s*NTB/i);

        if (m1) { ntb = parseInt(m1[1], 10); etb = parseInt(m1[2], 10); }
        else if (m2) { ntb = parseInt(m2[1], 10); etb = parseInt(m2[2], 10); }
        else if (m3) { etb = parseInt(m3[1], 10); ntb = parseInt(m3[2], 10); }
        else if (m4) { etb = parseInt(m4[1], 10); ntb = parseInt(m4[2], 10); }
        else {
            const mNTB = dongHKD.match(/(?:NTB\s*[:\s]\s*(\d+)|(\d+)\s*NTB)/i);
            const mETB = dongHKD.match(/(?:ETB\s*[:\s]\s*(\d+)|(\d+)\s*ETB)/i);
            if (mNTB) ntb = parseInt(mNTB[1] || mNTB[2], 10);
            if (mETB) etb = parseInt(mETB[1] || mETB[2], 10);
        }
    }

    if (ntb === 0 && etb === 0) {
        const mAll1 = noiDung.match(/(?:HKD\s*)?NTB\s*[:\s]\s*(\d+)/i);
        const mAll2 = noiDung.match(/(\d+)\s*(?:HKD\s*)?NTB/i);
        if (mAll1) ntb = parseInt(mAll1[1], 10);
        else if (mAll2) ntb = parseInt(mAll2[1], 10);

        const mAllE1 = noiDung.match(/(?:HKD\s*)?ETB\s*[:\s]\s*(\d+)/i);
        const mAllE2 = noiDung.match(/(\d+)\s*(?:HKD\s*)?ETB/i);
        if (mAllE1) etb = parseInt(mAllE1[1], 10);
        else if (mAllE2) etb = parseInt(mAllE2[1], 10);
    }

    if (explicitTong === 0) {
        explicitTong = trichXuatSoLieu(noiDung, ['Số lượng HKD', 'Tài khoản hộ kinh doanh', 'TK HKD', 'CA HKD', 'HKD']);
    }

    let tongHKD = explicitTong > 0 ? explicitTong : (ntb + etb);

    if (tongHKD > 0 && ntb === 0 && etb === 0) {
        ntb = tongHKD;
    } else if (tongHKD > (ntb + etb)) {
        if (etb > 0 && ntb === 0) {
            ntb = tongHKD - etb;
        } else if (ntb > 0 && etb === 0) {
            etb = tongHKD - ntb;
        }
    } else if ((ntb + etb) > tongHKD) {
        tongHKD = ntb + etb;
    }

    return { tongHKD, ntb, etb };
};

// Trích xuất thông tin Vol In
export const trichXuatVolIn = (noiDung) => {
    if (!noiDung) return { so: 0, raw: '0' };
    const tuKhoas = ['Số lượng Vol In mới', 'Số lượng Vol In', 'Vol In mới', 'Vol In moi', 'Vol In', 'Vol in', 'Volin', 'Volume In'];
    for (const tu of tuKhoas) {
        const tuEsc = tu.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const re = new RegExp(tuEsc + '\\s*[:\\-]\\s*([^\\n,;]+)', 'i');
        const m = noiDung.match(re);
        if (m) {
            const raw = m[1].trim();
            const so = chuyenDoiDoanhSoSangSo(raw);
            return { so, raw };
        }
    }
    return { so: 0, raw: '0' };
};
