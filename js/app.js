// ==========================================
// ค่าคงที่และ Label ภาษาไทย
// ==========================================
const WASTE_TYPE_LABELS = {
    general: 'ขยะทั่วไป',
    recyclable: 'ขยะรีไซเคิล',
    hazardous: 'ขยะอันตราย',
    organic: 'ขยะอินทรีย์'
};

const STATUS_LABELS = {
    new: 'ใหม่',
    in_progress: 'ดำเนินการอยู่',
    done: 'เสร็จสิ้น'
};

// ==========================================
// จุดเริ่มต้นการทำงาน (Router แบบง่าย)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const isStatsPage = document.getElementById('val-generated') !== null;
    const isReportPage = document.getElementById('report-form') !== null;

    if (isStatsPage) {
        loadStats();
    }

    if (isReportPage) {
        const filterSelect = document.getElementById('filter-type');
        
        // โหลดครั้งแรก (ทั้งหมด หรือ ตามค่าเริ่มต้นของ select)
        loadReports(filterSelect ? filterSelect.value : '');

        // เปลี่ยนตัวกรองแล้วโหลดใหม่
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                loadReports(filterSelect.value);
            });
        }

        const form = document.getElementById('report-form');
        if (form) {
            form.addEventListener('submit', handleReportSubmit);
        }
    }
});

// ==========================================
// ฟังก์ชันสำหรับหน้า Stats (index.html)
// ==========================================
async function loadStats() {
    const els = {
        generated: document.getElementById('val-generated'),
        proper: document.getElementById('val-proper'),
        rate: document.getElementById('val-rate'),
        bangsaenError: document.getElementById('bangsaen-error'),
        topTitle: document.getElementById('top-title'),
        topContainer: document.getElementById('top-table-container'),
        topError: document.getElementById('top-error')
    };

    try {
        const res = await fetch('/api/stats.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();

        if (data.bangsaen) {
            els.generated.textContent = data.bangsaen.generated_tpd ?? '-';
            els.proper.textContent = data.bangsaen.proper_tpd ?? '-';
            els.rate.textContent = data.bangsaen.proper_rate !== null 
                ? `${data.bangsaen.proper_rate}%` 
                : '-';
        } else {
            els.generated.textContent = '-';
            els.proper.textContent = '-';
            els.rate.textContent = '-';
            showError(els.bangsaenError, 'ไม่พบข้อมูลเทศบาลเมืองแสนสุข');
        }

        if (data.year) {
            els.topTitle.textContent = `5 อปท.ที่มีขยะมากที่สุด ปี ${data.year}`;
        }

        if (data.top && data.top.length > 0) {
            renderTopTable(els.topContainer, data.top);
        } else {
            els.topContainer.textContent = '';
            const p = document.createElement('p');
            p.textContent = 'ไม่มีข้อมูลสถิติสำหรับปีล่าสุด';
            p.className = 'loading-msg';
            els.topContainer.appendChild(p);
        }

    } catch (err) {
        els.generated.textContent = '-';
        els.proper.textContent = '-';
        els.rate.textContent = '-';
        showError(els.bangsaenError, 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่ภายหลัง');
        
        els.topContainer.textContent = '';
        showError(els.topError, 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่ภายหลัง');
    }
}

function renderTopTable(container, topData) {
    container.textContent = '';
    const maxVal = Math.max(...topData.map(d => d.generated_tpd));

    topData.forEach(item => {
        const row = document.createElement('div');
        row.className = 'bar-row';

        const label = document.createElement('span');
        label.className = 'bar-label';
        label.textContent = item.local_gov;

        const track = document.createElement('div');
        track.className = 'bar-track';
        
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        const pct = maxVal > 0 ? (item.generated_tpd / maxVal) * 100 : 0;
        fill.style.width = `${pct}%`;
        
        track.appendChild(fill);

        const value = document.createElement('span');
        value.className = 'bar-value';
        value.textContent = `${item.generated_tpd} ตัน`;

        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(value);
        container.appendChild(row);
    });
}

// ==========================================
// ฟังก์ชันสำหรับหน้า Report (report.html)
// ==========================================
async function loadReports(type = '') {
    const container = document.getElementById('reports-container');
    const errorEl = document.getElementById('reports-error');

    // แสดง loading state
    container.textContent = '';
    const loadingP = document.createElement('p');
    loadingP.textContent = 'กำลังโหลด...';
    loadingP.className = 'loading-msg';
    container.appendChild(loadingP);

    try {
        const url = type ? `/api/reports.php?type=${encodeURIComponent(type)}` : '/api/reports.php';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reports = await res.json();
        container.textContent = '';

        if (reports.length === 0) {
            const p = document.createElement('p');
            p.textContent = type 
                ? `ไม่พบรายการประเภท "${WASTE_TYPE_LABELS[type] || type}"` 
                : 'ยังไม่มีรายการแจ้งจุดขยะ';
            p.className = 'loading-msg';
            container.appendChild(p);
            return;
        }

        reports.forEach(report => {
            container.appendChild(createReportCard(report));
        });

    } catch (err) {
        container.textContent = '';
        showError(errorEl, 'ไม่สามารถโหลดรายการได้ กรุณาลองใหม่ภายหลัง');
    }
}

function createReportCard(report) {
    const card = document.createElement('div');
    card.className = 'report-card';
    
    const header = document.createElement('div');
    header.className = 'report-card-header';
    
    const location = document.createElement('span');
    location.className = 'report-location';
    location.textContent = report.location;
    
    const status = document.createElement('span');
    status.className = 'report-status';
    status.textContent = STATUS_LABELS[report.status] || report.status;
    
    header.appendChild(location);
    header.appendChild(status);
    
    const meta = document.createElement('div');
    meta.className = 'report-meta';
    const typeLabel = WASTE_TYPE_LABELS[report.waste_type] || report.waste_type;
    meta.textContent = `${typeLabel} · ${report.amount_kg} กก. · ${report.created_at}`;
    
    card.appendChild(header);
    card.appendChild(meta);
    
    if (report.detail && report.detail.trim().length > 0) {
        const detail = document.createElement('div');
        detail.className = 'report-detail';
        detail.textContent = report.detail;
        card.appendChild(detail);
    }
    
    return card;
}

async function handleReportSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const btn = document.getElementById('btn-submit');
    const errorEl = document.getElementById('form-error');
    const successEl = document.getElementById('form-success');
    
    errorEl.textContent = '';
    successEl.textContent = '';
    
    const payload = {
        location: form.location.value,
        waste_type: form.waste_type.value,
        amount_kg: form.amount_kg.value,
        detail: form.detail.value
    };
    
    if (!payload.location || payload.location.trim().length < 3) {
        errorEl.textContent = 'location ต้องเป็น string ที่ยาว 3–100 ตัวอักษร';
        return;
    }
    if (!payload.waste_type) {
        errorEl.textContent = 'waste_type ต้องเป็นหนึ่งใน ["general","recyclable","hazardous","organic"]';
        return;
    }
    const amt = Number(payload.amount_kg);
    if (!Number.isInteger(amt) || amt < 1 || amt > 1000) {
        errorEl.textContent = 'amount_kg ต้องเป็นจำนวนเต็มระหว่าง 1–1000';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'กำลังบันทึก...';
    
    try {
        const res = await fetch('/api/reports.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const body = await res.json();
        
        if (res.status === 201) {
            successEl.textContent = `บันทึกแล้ว #${body.id}`;
            form.reset();
            
            // รีเซ็ต filter ให้เห็นรายการใหม่ที่เพิ่งเพิ่ม
            const filterSelect = document.getElementById('filter-type');
            if (filterSelect && filterSelect.value !== '') {
                filterSelect.value = '';
            }

            const container = document.getElementById('reports-container');
            const emptyMsg = container.querySelector('.loading-msg');
            if (emptyMsg) emptyMsg.remove();
            
            const newCard = createReportCard(body);
            container.prepend(newCard);
            
        } else if (res.status === 422) {
            errorEl.textContent = body.error || 'ข้อมูลไม่ถูกต้อง';
        } else {
            errorEl.textContent = body.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        }
        
    } catch (err) {
        errorEl.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง';
    } finally {
        btn.disabled = false;
        btn.textContent = 'บันทึกข้อมูล';
    }
}

// ==========================================
// Utility Functions
// ==========================================
function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('hidden');
}