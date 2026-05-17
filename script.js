// مصفوفة الذاكرة المؤقتة (للتجربة، سيتم محوها عند تحديث الصفحة كما طلبت)
let subscribers = [];
let currentSubId = null;

// دالة لتنسيق الأرقام
const formatNum = (num) => Number(num).toLocaleString('en-US');

// ================== نظام التنبيهات مع الأنميشن ==================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-check-circle';
    if(type === 'error') icon = 'fa-exclamation-circle';
    if(type === 'warning') icon = 'fa-exclamation-triangle';
    if(message.includes('واتساب')) icon = 'fa-whatsapp fab'; // أيقونة الواتساب
    else icon = `${icon} fas`;

    toast.innerHTML = `<i class="${icon}"></i> <span style="line-height:1.5;">${message}</span>`;
    container.appendChild(toast);
    
    // إخفاء التنبيه تلقائياً بعد 3.5 ثواني
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// رسالة الواتساب المطلوبة
function shareWhatsApp() {
    showToast("يرجى شراء API واتساب بزنس وربطه في البرنامج من الشركة", "warning");
}

// ================== التنقل بين الصفحات والنوافذ ==================
function switchTab(viewId, el) {
    if(el) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    if(viewId === 'subscribers') {
        currentSubId = null;
        renderSubscribers();
    }
}

function goBack() {
    switchTab('subscribers');
    document.querySelectorAll('.nav-item')[0].classList.add('active');
}

function openModal(id) {
    const m = document.getElementById(id);
    m.style.display = 'flex';
    setTimeout(() => m.classList.add('show'), 10);
}

function closeModal(id) {
    const m = document.getElementById(id);
    m.classList.remove('show');
    setTimeout(() => m.style.display = 'none', 300);
}

// ================== إدارة المشتركين ==================
function openSubscriberModal(id = null) {
    const title = document.getElementById('sub-modal-title');
    document.getElementById('sub-id').value = id || '';
    
    if(id) {
        title.innerText = 'تعديل بيانات المشترك';
        const sub = subscribers.find(s => s.id === id);
        document.getElementById('sub-name').value = sub.name;
        document.getElementById('sub-phone').value = sub.rawPhone;
    } else {
        title.innerText = 'إضافة مشترك جديد';
        document.getElementById('sub-name').value = '';
        document.getElementById('sub-phone').value = '';
    }
    openModal('modal-subscriber');
}

function saveSubscriber() {
    const id = document.getElementById('sub-id').value;
    const name = document.getElementById('sub-name').value.trim();
    let phone = document.getElementById('sub-phone').value.trim();

    if(!name || !phone) return showToast('يرجى تعبئة جميع الحقول', 'error');

    // إزالة الصفر من بداية الرقم إن وُجد لتسهيل التحقق
    if(phone.startsWith('0')) phone = phone.substring(1);
    
    // التحقق المتقدم: الرقم يجب أن يبدأ بـ 77، 78، أو 75 ومكون من 10 أرقام
    if(!/^(77|78|75)\d{8}$/.test(phone)) {
        return showToast('رقم غير صالح. يجب أن يبدأ بـ 77 أو 78 أو 75 (كورك) ويتكون من 10 أرقام.', 'error');
    }

    // إضافة مفتاح الدولة تلقائياً
    const fullPhone = '+964 ' + phone;

    if(id) {
        const sub = subscribers.find(s => s.id === id);
        sub.name = name;
        sub.rawPhone = phone;
        sub.phone = fullPhone;
        showToast('تم التعديل بنجاح');
    } else {
        subscribers.push({
            id: Date.now().toString(),
            name: name, 
            rawPhone: phone, 
            phone: fullPhone, 
            transactions: []
        });
        showToast('تم إضافة المشترك بنجاح');
    }
    
    closeModal('modal-subscriber');
    renderSubscribers();
}

function deleteSubscriber(id, event) {
    event.stopPropagation(); // منع فتح بروفايل المشترك عند الضغط على الحذف
    subscribers = subscribers.filter(s => s.id !== id);
    renderSubscribers();
    showToast('تم حذف المشترك وجميع معاملاته', 'success');
}

function renderSubscribers() {
    const list = document.getElementById('subscribers-list');
    list.innerHTML = '';
    
    if(subscribers.length === 0) {
        list.innerHTML = '<div class="empty-state">لا يوجد مشتركين حالياً.<br>قم بإضافة مشترك للتجربة.</div>';
        return;
    }

    subscribers.forEach(sub => {
        const div = document.createElement('div');
        div.className = 'sub-card';
        div.onclick = () => openDetails(sub.id); // عند النقر على البطاقة يفتح التفاصيل
        div.innerHTML = `
            <div class="sub-info">
                <h3>${sub.name}</h3>
                <p dir="ltr">${sub.phone}</p>
            </div>
            <div class="sub-actions">
                <button class="action-btn edit" onclick="openSubscriberModal('${sub.id}'); event.stopPropagation();">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="action-btn delete" onclick="deleteSubscriber('${sub.id}', event)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(div);
    });
}

// ================== إدارة الحسابات والمعاملات ==================
function openDetails(id) {
    currentSubId = id;
    const sub = subscribers.find(s => s.id === id);
    document.getElementById('detail-title').innerText = sub.name;
    switchTab('details');
    renderTransactions();
}

function openTransactionModal() {
    document.getElementById('trans-date').valueAsDate = new Date();
    document.getElementById('trans-driver').value = '';
    document.getElementById('trans-car').value = '';
    document.getElementById('trans-type').value = 'حصو';
    document.getElementById('trans-qty').value = '';
    document.getElementById('trans-price').value = '';
    document.getElementById('trans-total').value = '';
    document.getElementById('trans-paid').value = '';
    openModal('modal-transaction');
}

// حساب الإجمالي التلقائي
function calculateTotal() {
    const qty = parseFloat(document.getElementById('trans-qty').value) || 0;
    const price = parseFloat(document.getElementById('trans-price').value) || 0;
    document.getElementById('trans-total').value = (qty * price).toFixed(0);
}

function saveTransaction() {
    const date = document.getElementById('trans-date').value;
    const driver = document.getElementById('trans-driver').value;
    const car = document.getElementById('trans-car').value;
    const type = document.getElementById('trans-type').value;
    const qty = parseFloat(document.getElementById('trans-qty').value) || 0;
    const price = parseFloat(document.getElementById('trans-price').value) || 0;
    const paid = parseFloat(document.getElementById('trans-paid').value) || 0;
    const total = qty * price;

    if(!date || qty <= 0 || price <= 0) {
        return showToast('يرجى تعبئة الكمية والسعر والتاريخ بشكل صحيح', 'error');
    }

    const sub = subscribers.find(s => s.id === currentSubId);
    sub.transactions.push({
        id: Date.now().toString(),
        date, driver, car, type, qty, price, total, paid
    });

    closeModal('modal-transaction');
    showToast('تمت إضافة المعاملة بنجاح');
    renderTransactions();
}

function renderTransactions() {
    const sub = subscribers.find(s => s.id === currentSubId);
    const list = document.getElementById('transactions-list');
    list.innerHTML = '';

    let totalDebt = 0;   // مجموع المدين (الإجمالي الكلي)
    let totalCredit = 0; // مجموع الدائن (المبالغ الواصلة)

    if(sub.transactions.length === 0) {
        list.innerHTML = '<div class="empty-state">لا توجد معاملات مالية مسجلة لهذا المشترك.</div>';
    } else {
        sub.transactions.forEach(t => {
            totalDebt += t.total;
            totalCredit += t.paid;

            const div = document.createElement('div');
            div.className = 'trans-card';
            div.innerHTML = `
                <div class="trans-header">
                    <span><i class="far fa-calendar-alt"></i> ${t.date}</span>
                    <span>رقم السيارة: <strong>${t.car || '-'}</strong></span>
                </div>
                <div class="trans-grid">
                    <div><span>اسم السائق</span><strong>${t.driver || '-'}</strong></div>
                    <div><span>النوعية</span><strong>${t.type}</strong></div>
                    <div><span>الكمية</span><strong>${formatNum(t.qty)}</strong></div>
                    <div><span>السعر</span><strong>${formatNum(t.price)}</strong></div>
                </div>
                <div class="trans-totals">
                    <div><span style="font-size:11px; color:var(--text-muted); display:block; font-weight:bold;">الإجمالي (المدين)</span><strong style="color:var(--danger)">${formatNum(t.total)}</strong></div>
                    <div><span style="font-size:11px; color:var(--text-muted); display:block; font-weight:bold;">المبلغ الواصل (الدائن)</span><strong style="color:var(--success)">${formatNum(t.paid)}</strong></div>
                </div>
                <button class="btn btn-whatsapp w-100" onclick="shareWhatsApp()">
                    <i class="fab fa-whatsapp" style="font-size:18px;"></i> مشاركة عبر الواتساب
                </button>
            `;
            list.appendChild(div);
        });
    }

    // تحديث بطاقات المدين والدائن العلوية
    document.getElementById('total-debt').innerText = formatNum(totalDebt);
    document.getElementById('total-credit').innerText = formatNum(totalCredit);
}

// بدء التشغيل
renderSubscribers();
