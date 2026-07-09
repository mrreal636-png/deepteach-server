// ============================================================
// DeepTeach - script.js (نسخة متقدمة مع Nav Bar)
// ============================================================

// ========== المتغيرات العامة ==========
let currentUser = null;
let allGrades = [];
let currentPage = 'home';

// ========== عناصر DOM ==========
const mainContent = document.getElementById('mainContent');
const navLinks = document.querySelectorAll('.nav-link');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const authButtons = document.getElementById('authButtons');
const userInfoNav = document.getElementById('userInfoNav');
const userDisplayNav = document.getElementById('userDisplayNav');
const navToggle = document.getElementById('navToggle');

// ========== إدارة شريط التنقل ==========
function toggleNav() {
    const links = document.getElementById('navLinks');
    links.classList.toggle('open');
}

if (navToggle) {
    navToggle.addEventListener('click', toggleNav);
}

// إغلاق القائمة عند الضغط على رابط
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('navLinks').classList.remove('open');
    });
});

// ========== التنقل بين الصفحات ==========
function navigateTo(page, data = null) {
    currentPage = page;
    // تحديث الروابط النشطة
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    switch(page) {
        case 'home': renderHome(); break;
        case 'grades': renderGrades(); break;
        case 'about': renderAbout(); break;
        case 'profile': renderProfile(); break;
        case 'admin-users': renderAdminUsers(); break;
        case 'admin-content': renderAdminContent(); break;
        default: renderHome();
    }
}

// ========== الصفحات ==========
function renderHome() {
    if (!currentUser) {
        renderPublicHome();
        return;
    }
    // صفحة المستخدم المسجل
    mainContent.innerHTML = `
        <section class="welcome-section">
            <h2>مرحباً ${currentUser.username} 👋</h2>
            <p style="color:var(--text-secondary);">خطتك: <strong style="color:${currentUser.plan === 'paid' ? 'var(--gold)' : 'var(--text-muted)'}">${currentUser.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</strong></p>
            ${currentUser.plan === 'paid' && currentUser.subscriptionEnd ? `<p style="color:var(--text-secondary); font-size:0.9rem;">ينتهي الاشتراك في: ${new Date(currentUser.subscriptionEnd).toLocaleDateString('ar-EG')}</p>` : ''}
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:15px;">
                <button class="btn" onclick="navigateTo('grades')">استعراض الصفوف</button>
                ${currentUser.role === 'admin' ? `<button class="btn btn-outline" onclick="navigateTo('admin-users')">👑 إدارة</button>` : ''}
                <button class="btn btn-outline" onclick="navigateTo('profile')">حسابي</button>
            </div>
        </section>
        <section class="grades-preview">
            <h3>صفوفك الدراسية</h3>
            <div id="gradesGrid" class="grades-grid"></div>
        </section>
    `;
    loadUserGrades();
}

function renderPublicHome() {
    mainContent.innerHTML = `
        <section class="hero-section">
            <div class="hero-content">
                <h1>مرحباً بك في <span style="color: var(--gold);">DeepTeach</span></h1>
                <p>منصة التعلم العميق التي تتيح لك اكتساب المعرفة بطريقة منظمة وتفاعلية</p>
                <div style="display:flex; gap:15px; justify-content:center; margin-top:20px; flex-wrap:wrap;">
                    <button class="btn" onclick="showLoginModal()">ابدأ الآن</button>
                    <button class="btn btn-outline" onclick="showRegisterModal()">سجل مجاناً</button>
                </div>
            </div>
        </section>
        <section class="features-section">
            <h2>ما الذي تقدمه لك المنصة؟</h2>
            <div class="features-grid">
                <div class="feature-card"><i class="fas fa-book-open"></i><h3>دروس منظمة</h3><p>محتوى تعليمي مرتب حسب الصفوف والمواد والوحدات</p></div>
                <div class="feature-card"><i class="fas fa-video"></i><h3>شروحات فيديو</h3><p>دروس مصورة مع أمثلة محلولة وتمارين تفاعلية</p></div>
                <div class="feature-card"><i class="fas fa-crown"></i><h3>محتوى مدفوع ومجاني</h3><p>اختر الخطة المناسبة لك وتمتع بمزايا إضافية</p></div>
                <div class="feature-card"><i class="fas fa-chart-line"></i><h3>تتبع التقدم</h3><p>راقب تطورك واحصل على شارات عند إتمام الدروس</p></div>
            </div>
        </section>
        <section class="grades-preview">
            <h2>استكشف الصفوف الدراسية</h2>
            <div id="gradesGrid" class="grades-grid"></div>
        </section>
    `;
    loadGradesForPublic();
}

function renderAbout() {
    mainContent.innerHTML = `
        <h2>عن منصة DeepTeach</h2>
        <div class="glass-card" style="max-width:800px; margin:0 auto;">
            <p style="font-size:1.1rem; line-height:2; color:#ccc;">
                DeepTeach هي منصة تعليمية تفاعلية تهدف إلى تسهيل عملية التعلم للطلاب من جميع المراحل الدراسية.
            </p>
            <p style="font-size:1rem; line-height:2; color:#bbb; margin-top:20px;">
                <i class="fas fa-check-circle" style="color:var(--gold);"></i> دروس مصورة ونصوص تفاعلية<br>
                <i class="fas fa-check-circle" style="color:var(--gold);"></i> امتحانات فورية مع تقييم ذاتي<br>
                <i class="fas fa-check-circle" style="color:var(--gold);"></i> نظام نقاط وشارات تحفيزي<br>
                <i class="fas fa-check-circle" style="color:var(--gold);"></i> خطط مجانية ومدفوعة حسب احتياجك<br>
                <i class="fas fa-check-circle" style="color:var(--gold);"></i> لوحة إدارة متكاملة للمعلمين
            </p>
        </div>
    `;
}

// ========== تحميل الصفوف ==========
async function loadGradesForPublic() {
    try {
        const res = await fetch('/api/grades');
        const grades = await res.json();
        allGrades = grades;
        const grid = document.getElementById('gradesGrid');
        if (!grid) return;
        grid.innerHTML = grades.map(g => `
            <div class="grade-card" onclick="viewGradePublic(${g.id})">
                <div class="grade-num">${g.id}</div>
                <div class="grade-label">${g.name}</div>
                <small style="color:var(--text-muted);">${g.subjects ? g.subjects.length : 0} مواد</small>
            </div>
        `).join('');
    } catch (error) { console.error('خطأ في تحميل الصفوف:', error); }
}

function viewGradePublic(gradeId) {
    if (currentUser) {
        viewGradeContent(gradeId);
    } else {
        showLoginModal('يجب تسجيل الدخول لمشاهدة محتوى هذا الصف');
    }
}

// ========== تحميل صفوف المستخدم ==========
async function loadUserGrades() {
    try {
        const res = await fetch('/api/grades');
        const grades = await res.json();
        allGrades = grades;
        const grid = document.getElementById('gradesGrid');
        if (!grid) return;
        let availableGrades = grades;
        if (currentUser.role !== 'admin' && currentUser.plan === 'paid') {
            availableGrades = grades.filter(g => currentUser.selectedGrades.includes(g.id));
        }
        grid.innerHTML = availableGrades.map(g => `
            <div class="grade-card" onclick="viewGradeContent(${g.id})">
                <div class="grade-num">${g.id}</div>
                <div class="grade-label">${g.name}</div>
                <small style="color:var(--text-muted);">${g.subjects ? g.subjects.length : 0} مواد</small>
            </div>
        `).join('');
        if (availableGrades.length === 0) {
            grid.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1; text-align:center;">لا توجد صفوف متاحة لك حالياً</p>`;
        }
    } catch (error) { console.error('خطأ في تحميل صفوف المستخدم:', error); }
}

// ========== عرض الصفوف (صفحة منفصلة) ==========
function renderGrades() {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">الصفوف الدراسية</h2>
        </div>
        <div id="gradesGrid" class="grades-grid"></div>
    `;
    if (currentUser) {
        loadUserGrades();
    } else {
        loadGradesForPublic();
    }
}

// ========== عرض محتوى الصف ==========
async function viewGradeContent(gradeId) {
    try {
        const res = await fetch(`/api/grades/${gradeId}/content`);
        const data = await res.json();
        if (data.error) { alert(data.error); return; }
        renderGradeContent(data);
    } catch (error) {
        console.error('خطأ في تحميل محتوى الصف:', error);
        alert('حدث خطأ في تحميل المحتوى');
    }
}

function renderGradeContent(grade) {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('grades')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${grade.name}</h2>
        </div>
        <div id="subjectsContainer">
            ${grade.subjects && grade.subjects.length > 0 ? grade.subjects.map(s => `
                <div class="subject-card" onclick="viewSubject(${grade.id}, ${s.id})">
                    <h3>${s.name}</h3>
                    <small style="color:var(--text-muted);">${s.units ? s.units.length : 0} وحدات</small>
                </div>
            `).join('') : '<p style="color:var(--text-muted);">لا توجد مواد في هذا الصف بعد</p>'}
        </div>
    `;
}

// ========== عرض المادة، الوحدة، الدرس (مختصرة) ==========
// (الدوال الكاملة موجودة مسبقاً، سأعتمد على الدوال الموجودة في الملف السابق)
// ...

// ========== تسجيل الدخول والتسجيل ==========
function showLoginModal(message = '') {
    loginModal.style.display = 'flex';
    document.getElementById('loginError').style.display = 'none';
    if (message) {
        document.getElementById('loginError').textContent = message;
        document.getElementById('loginError').style.display = 'block';
    }
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function showRegisterModal() {
    registerModal.style.display = 'flex';
    document.getElementById('regError').style.display = 'none';
    loadGradesForRegister();
    toggleGradeSelection();
}

function switchToRegister() {
    closeModal('loginModal');
    showRegisterModal();
}

function switchToLogin() {
    closeModal('registerModal');
    showLoginModal();
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// ========== دوال تسجيل الدخول والتسجيل (كما هي مسبقاً) ==========
async function loginUser() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    if (!username || !password) {
        errorEl.textContent = 'يرجى ملء جميع الحقول';
        errorEl.style.display = 'block';
        return;
    }
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.error) {
            errorEl.textContent = data.error;
            errorEl.style.display = 'block';
            return;
        }
        if (data.success) {
            currentUser = data.user;
            updateUIForUser();
            closeModal('loginModal');
            navigateTo('home');
        }
    } catch (error) {
        errorEl.textContent = 'خطأ في الاتصال بالخادم';
        errorEl.style.display = 'block';
    }
}

async function registerUser() {
    // ... (نفس الكود السابق)
    // بعد التسجيل الناجح، يتم تحديث الواجهة
}

// ========== تحديث واجهة المستخدم ==========
function updateUIForUser() {
    if (currentUser) {
        authButtons.style.display = 'none';
        userInfoNav.style.display = 'flex';
        userDisplayNav.textContent = currentUser.username + (currentUser.role === 'admin' ? ' 👑' : '');
        // إظهار روابط الأدمن
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'flex';
        });
        // إظهار رابط الحساب
        document.getElementById('profileNav').style.display = 'flex';
    } else {
        authButtons.style.display = 'flex';
        userInfoNav.style.display = 'none';
        userDisplayNav.textContent = '';
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        document.getElementById('profileNav').style.display = 'none';
    }
}

// ========== تسجيل الخروج ==========
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        updateUIForUser();
        navigateTo('home');
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        location.reload();
    }
}

// ========== حساب المستخدم ==========
function renderProfile() {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    mainContent.innerHTML = `
        <div style="max-width:500px; margin:0 auto; background:var(--glass-bg); border-radius:var(--radius); padding:30px; border:1px solid var(--glass-border);">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="margin:0;">حسابي</h2>
            </div>
            <p><strong>اسم المستخدم:</strong> ${currentUser.username}</p>
            <p><strong>البريد الإلكتروني:</strong> ${currentUser.email}</p>
            <p><strong>رقم الهاتف:</strong> ${currentUser.phone || 'غير مضاف'}</p>
            <p><strong>الخطة:</strong> ${currentUser.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</p>
            ${currentUser.plan === 'paid' && currentUser.subscriptionEnd ? `<p><strong>ينتهي الاشتراك:</strong> ${new Date(currentUser.subscriptionEnd).toLocaleDateString('ar-EG')}</p>` : ''}
            <p><strong>الدور:</strong> ${currentUser.role === 'admin' ? 'مشرف 👑' : 'طالب 🎓'}</p>
            ${currentUser.selectedGrades && currentUser.selectedGrades.length > 0 ? `<p><strong>الصفوف المشترك بها:</strong> ${currentUser.selectedGrades.join(', ')}</p>` : ''}
        </div>
    `;
}

// ========== دوال الإدارة (مختصرة) ==========
function renderAdminUsers() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('غير مصرح');
        return;
    }
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">👑 إدارة المستخدمين</h2>
        </div>
        <p style="color:var(--text-secondary);">هنا ستظهر قائمة المستخدمين مع خيارات الإدارة.</p>
        <p style="color:var(--text-muted);">(يتم تحميل البيانات...)</p>
    `;
    // استدعاء تحميل المستخدمين (الكود موجود مسبقاً)
}

function renderAdminContent() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('غير مصرح');
        return;
    }
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">📚 إدارة المحتوى</h2>
        </div>
        <p style="color:var(--text-secondary);">هنا ستظهر أدوات إضافة وتعديل الصفوف والمواد والدروس.</p>
        <p style="color:var(--text-muted);">(يتم تحميل البيانات...)</p>
    `;
}

// ========== بدء التطبيق ==========
document.addEventListener('DOMContentLoaded', async () => {
    await checkCurrentUser();
    if (!currentUser) {
        navigateTo('home');
    } else {
        navigateTo('home');
    }
});

// التحقق من الجلسة
async function checkCurrentUser() {
    try {
        const res = await fetch('/api/current-user');
        const data = await res.json();
        if (data.user) {
            currentUser = data.user;
            updateUIForUser();
        } else {
            currentUser = null;
            updateUIForUser();
        }
    } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
        currentUser = null;
        updateUIForUser();
    }
}

// جعل الدوال عالمية
window.navigateTo = navigateTo;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.closeModal = closeModal;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logout = logout;
window.viewGradeContent = viewGradeContent;
window.viewSubject = viewSubject;
window.viewUnit = viewUnit;
window.viewLesson = viewLesson;
window.viewGradePublic = viewGradePublic;
window.renderProfile = renderProfile;
// ... باقي الدوال العالمية