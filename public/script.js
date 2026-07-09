/**
 * ================================================================
 * DeepTeach - JavaScript الرئيسي (Frontend Logic)
 * الإصدار 4.0.0 (المعدل النهائي)
 * ================================================================
 * 
 * 🧠  العمارة: Module Pattern مع إدارة حالة مركزية
 * 🔄  التنقل: SPA (Single Page Application) مع روابط ديناميكية
 * 📡  الاتصال: Fetch API مع معالجة الأخطاء الموحدة
 * 🎨  التفاعل: تحديث واجهة المستخدم ديناميكياً
 * 🔐  المصادقة: جلسات (Sessions) مع تذكر المستخدم
 * 🛡️  الأمان: التحقق من الصلاحيات قبل أي عملية إدارة
 * 
 * ================================================================
 */

// ================================================================
// 1. إدارة الحالة (State Management)
// ================================================================

const AppState = {
    /** @type {Object|null} المستخدم الحالي */
    currentUser: null,
    
    /** @type {Array} جميع الصفوف */
    allGrades: [],
    
    /** @type {Array} جميع المستخدمين (للمشرف) */
    allUsers: [],
    
    /** @type {number|null} معرف الصف الحالي */
    currentGradeId: null,
    
    /** @type {number|null} معرف المادة الحالية */
    currentSubjectId: null,
    
    /** @type {number|null} معرف الوحدة الحالية */
    currentUnitId: null,
    
    /** @type {string} الصفحة الحالية */
    currentPage: 'home',
    
    /** @type {string} التبويب النشط في الإدارة */
    adminActiveTab: 'users',
    
    /** @type {Object} حالة الامتحان الحالي */
    currentExam: {
        questions: [],
        currentIndex: 0,
        answers: [],
        gradeId: null,
        subjectId: null,
        unitId: null,
        type: 'lesson'
    }
};

// ================================================================
// 2. عناصر DOM (DOM References)
// ================================================================

const DOM = {
    mainContent: document.getElementById('mainContent'),
    sidebar: document.getElementById('mainSidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    authButtons: document.getElementById('authButtonsTop'),
    userInfo: document.getElementById('userInfoTop'),
    userDisplay: document.getElementById('userDisplayTop'),
    sidebarUserInfo: document.getElementById('sidebarUserInfo'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    backToTop: document.getElementById('backToTop'),
    navLinks: document.querySelectorAll('.sidebar-link'),
    profileNav: document.getElementById('profileNavLi'),
    adminUsersNav: document.getElementById('adminUsersLi'),
    adminContentNav: document.getElementById('adminContentLi'),
};

// ================================================================
// 3. دوال مساعدة (Utility Functions)
// ================================================================

/**
 * عرض رسالة للمستخدم
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع الرسالة (error, success, info)
 */
function showToast(message, type = 'info') {
    const prefix = type === 'error' ? '❌ ' : type === 'success' ? '✅ ' : 'ℹ️ ';
    alert(prefix + message);
}

/**
 * تنسيق التاريخ
 * @param {string|Date} date
 * @returns {string}
 */
function formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * اختصار النص الطويل
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * توليد معرف فريد مؤقت
 * @returns {number}
 */
function generateTempId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// ================================================================
// 4. إدارة المصادقة والصلاحيات (Auth & Permissions)
// ================================================================

/**
 * التحقق من أن المستخدم الحالي هو مدير
 * إذا لم يكن مديراً، يعرض رسالة خطأ ويعيد التوجيه
 * @returns {boolean} - true إذا كان مديراً، false إذا لم يكن
 */
function ensureAdmin() {
    if (!AppState.currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        navigateTo('home');
        return false;
    }
    if (AppState.currentUser.role !== 'admin') {
        showToast('غير مصرح: هذه العملية تتطلب صلاحيات المدير', 'error');
        navigateTo('home');
        return false;
    }
    return true;
}

/**
 * التحقق من صحة الجلسة الحالية
 * إذا كانت الجلسة غير صالحة، يقوم بتسجيل الخروج
 * @returns {Promise<boolean>}
 */
async function checkSessionValidity() {
    try {
        const response = await fetch('/api/current-user');
        const data = await response.json();
        if (!data.user) {
            // الجلسة غير صالحة
            AppState.currentUser = null;
            updateUIForUser();
            navigateTo('home');
            return false;
        }
        // تحديث بيانات المستخدم إذا تغيرت
        AppState.currentUser = data.user;
        updateUIForUser();
        return true;
    } catch (error) {
        console.error('❌ خطأ في التحقق من الجلسة:', error);
        return false;
    }
}

/**
 * معالجة أخطاء API المتعلقة بالمصادقة
 * @param {Response} response - كائن الاستجابة
 * @param {string} defaultMessage - رسالة الخطأ الافتراضية
 * @returns {Promise<boolean>} - true إذا كان الخطأ متعلقاً بالمصادقة
 */
async function handleAuthError(response, defaultMessage = 'حدث خطأ') {
    if (response.status === 401 || response.status === 403) {
        // جلسة منتهية أو غير مصرح
        showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
        AppState.currentUser = null;
        updateUIForUser();
        navigateTo('home');
        return true;
    }
    
    try {
        const data = await response.json();
        if (data.error) {
            showToast(data.error, 'error');
            return true;
        }
    } catch (e) {
        // لا يمكن قراءة JSON
    }
    
    showToast(defaultMessage, 'error');
    return false;
}

// ================================================================
// 5. إدارة الشريط الجانبي (Sidebar Management)
// ================================================================

function toggleSidebar() {
    DOM.sidebar.classList.toggle('open');
    const isOpen = DOM.sidebar.classList.contains('open');
    DOM.sidebarToggle.setAttribute('aria-expanded', isOpen);
}

function closeSidebar() {
    DOM.sidebar.classList.remove('open');
    DOM.sidebarToggle.setAttribute('aria-expanded', 'false');
}

function setActiveLink(page) {
    DOM.navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
}

// ================================================================
// 6. التنقل بين الصفحات (Navigation)
// ================================================================

function navigateTo(page, data = null) {
    if (window.innerWidth <= 768) {
        closeSidebar();
    }

    AppState.currentPage = page;
    setActiveLink(page);

    switch (page) {
        case 'home':
            renderHome();
            break;
        case 'grades':
            renderGrades();
            break;
        case 'about':
            renderAbout();
            break;
        case 'profile':
            renderProfile();
            break;
        case 'admin-users':
            renderAdminUsers();
            break;
        case 'admin-content':
            renderAdminContent();
            break;
        default:
            renderHome();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================================
// 7. إدارة المستخدم (User Management)
// ================================================================

function updateUIForUser() {
    const isLoggedIn = !!AppState.currentUser;
    const isAdmin = isLoggedIn && AppState.currentUser.role === 'admin';

    DOM.authButtons.style.display = isLoggedIn ? 'none' : 'flex';
    DOM.userInfo.style.display = isLoggedIn ? 'flex' : 'none';

    if (isLoggedIn) {
        DOM.userDisplay.textContent = AppState.currentUser.username + (isAdmin ? ' 👑' : '');
        DOM.sidebarUserInfo.textContent = AppState.currentUser.username + (isAdmin ? ' (مشرف)' : '');
        DOM.profileNav.style.display = 'block';
        DOM.adminUsersNav.style.display = isAdmin ? 'block' : 'none';
        DOM.adminContentNav.style.display = isAdmin ? 'block' : 'none';
    } else {
        DOM.sidebarUserInfo.textContent = 'زائر';
        DOM.profileNav.style.display = 'none';
        DOM.adminUsersNav.style.display = 'none';
        DOM.adminContentNav.style.display = 'none';
    }
}

async function checkCurrentUser() {
    try {
        const response = await fetch('/api/current-user');
        const data = await response.json();
        if (data.user) {
            AppState.currentUser = data.user;
            updateUIForUser();
            navigateTo('home');
        } else {
            AppState.currentUser = null;
            updateUIForUser();
            navigateTo('home');
        }
    } catch (error) {
        console.error('❌ خطأ في التحقق من الجلسة:', error);
        AppState.currentUser = null;
        updateUIForUser();
        navigateTo('home');
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        AppState.currentUser = null;
        updateUIForUser();
        navigateTo('home');
        showToast('تم تسجيل الخروج بنجاح', 'success');
    } catch (error) {
        console.error('❌ خطأ في تسجيل الخروج:', error);
        showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// ================================================================
// 8. عرض الصفحات (Page Rendering)
// ================================================================

// ==================== 8.1 الصفحة الرئيسية العامة ====================

function renderPublicHome() {
    DOM.mainContent.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:40px 20px; margin-bottom:30px;">
            <h1>مرحباً بك في <span style="color:var(--color-gold);">DeepTeach</span></h1>
            <p style="color:var(--color-text-secondary); font-size:1.2rem; max-width:600px; margin:0 auto;">
                منصة التعلم العميق التي تتيح لك اكتساب المعرفة بطريقة منظمة وتفاعلية
            </p>
            <div style="display:flex; gap:15px; justify-content:center; flex-wrap:wrap; margin-top:20px;">
                <button class="btn" onclick="showLoginModal()">ابدأ الآن</button>
                <button class="btn btn-outline" onclick="showRegisterModal()">سجل مجاناً</button>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:20px; margin-bottom:30px;">
            <div class="glass-card">
                <i class="fas fa-book-open" style="font-size:2rem; color:var(--color-gold);"></i>
                <h3>دروس منظمة</h3>
                <p style="color:var(--color-text-muted);">محتوى مرتب حسب الصفوف والمواد والوحدات</p>
            </div>
            <div class="glass-card">
                <i class="fas fa-video" style="font-size:2rem; color:var(--color-gold);"></i>
                <h3>شروحات فيديو</h3>
                <p style="color:var(--color-text-muted);">دروس مصورة مع أمثلة محلولة وتمارين تفاعلية</p>
            </div>
            <div class="glass-card">
                <i class="fas fa-crown" style="font-size:2rem; color:var(--color-gold);"></i>
                <h3>محتوى مدفوع ومجاني</h3>
                <p style="color:var(--color-text-muted);">اختر الخطة المناسبة لك وتمتع بمزايا إضافية</p>
            </div>
            <div class="glass-card">
                <i class="fas fa-chart-line" style="font-size:2rem; color:var(--color-gold);"></i>
                <h3>تتبع التقدم</h3>
                <p style="color:var(--color-text-muted);">راقب تطورك واحصل على شارات عند إتمام الدروس</p>
            </div>
        </div>
        <h2>استكشف الصفوف الدراسية</h2>
        <div id="gradesGrid" class="grades-grid"></div>
    `;
    loadGradesForPublic();
}

async function loadGradesForPublic() {
    try {
        const response = await fetch('/api/grades');
        const grades = await response.json();
        AppState.allGrades = grades;
        const grid = document.getElementById('gradesGrid');
        if (!grid) return;
        grid.innerHTML = grades.map(g => `
            <div class="grade-card" onclick="viewGradePublic(${g.id})">
                <div class="grade-num">${g.id}</div>
                <div class="grade-label">${g.name}</div>
                <small style="color:var(--color-text-muted);">${g.subjects ? g.subjects.length : 0} مواد</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('❌ خطأ في تحميل الصفوف:', error);
        showToast('حدث خطأ في تحميل الصفوف', 'error');
    }
}

function viewGradePublic(gradeId) {
    if (AppState.currentUser) {
        viewGradeContent(gradeId);
    } else {
        showLoginModal('يجب تسجيل الدخول لمشاهدة محتوى هذا الصف');
    }
}

// ==================== 8.2 الصفحة الرئيسية للمستخدم ====================

function renderHome() {
    if (!AppState.currentUser) {
        renderPublicHome();
        return;
    }

    const user = AppState.currentUser;
    const isAdmin = user.role === 'admin';
    const isPaid = user.plan === 'paid';

    DOM.mainContent.innerHTML = `
        <div class="glass-card" style="margin-bottom:20px;">
            <h2>مرحباً ${user.username} 👋</h2>
            <p style="color:var(--color-text-secondary);">
                خطتك: <strong style="color:${isPaid ? 'var(--color-gold)' : 'var(--color-text-muted)'}">
                    ${isPaid ? 'مدفوعة ⭐' : 'مجانية 🆓'}
                </strong>
                ${isPaid && user.subscriptionEnd ? ` | ينتهي الاشتراك: ${formatDate(user.subscriptionEnd)}` : ''}
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:15px;">
                <button class="btn" onclick="navigateTo('grades')">استعراض الصفوف</button>
                ${isAdmin ? `<button class="btn btn-outline" onclick="navigateTo('admin-users')">👑 إدارة</button>` : ''}
                <button class="btn btn-outline" onclick="navigateTo('profile')">حسابي</button>
            </div>
        </div>
        <h3>صفوفك الدراسية</h3>
        <div id="gradesGrid" class="grades-grid"></div>
    `;
    loadUserGrades();
}

async function loadUserGrades() {
    try {
        const response = await fetch('/api/grades');
        const grades = await response.json();
        AppState.allGrades = grades;
        const grid = document.getElementById('gradesGrid');
        if (!grid) return;

        let availableGrades = grades;
        const user = AppState.currentUser;
        if (user && user.role !== 'admin' && user.plan === 'paid') {
            availableGrades = grades.filter(g => user.selectedGrades.includes(g.id));
        }

        grid.innerHTML = availableGrades.map(g => `
            <div class="grade-card" onclick="viewGradeContent(${g.id})">
                <div class="grade-num">${g.id}</div>
                <div class="grade-label">${g.name}</div>
                <small style="color:var(--color-text-muted);">${g.subjects ? g.subjects.length : 0} مواد</small>
            </div>
        `).join('');

        if (availableGrades.length === 0) {
            grid.innerHTML = `<p style="color:var(--color-text-muted); grid-column:1/-1; text-align:center;">لا توجد صفوف متاحة لك حالياً</p>`;
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل صفوف المستخدم:', error);
        showToast('حدث خطأ في تحميل الصفوف', 'error');
    }
}

// ==================== 8.3 صفحة الصفوف ====================

function renderGrades() {
    DOM.mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">الصفوف الدراسية</h2>
        </div>
        <div id="gradesGrid" class="grades-grid"></div>
    `;
    if (AppState.currentUser) {
        loadUserGrades();
    } else {
        loadGradesForPublic();
    }
}

// ==================== 8.4 صفحة "عن المنصة" ====================

function renderAbout() {
    DOM.mainContent.innerHTML = `
        <h2>عن منصة DeepTeach</h2>
        <div class="glass-card" style="max-width:800px; margin:0 auto;">
            <p style="font-size:1.1rem; line-height:2;">
                DeepTeach هي منصة تعليمية تفاعلية تهدف إلى تسهيل عملية التعلم للطلاب من جميع المراحل الدراسية.
            </p>
            <ul style="list-style:none; padding:0; margin-top:20px;">
                <li style="margin:10px 0;">✅ دروس مصورة ونصوص تفاعلية</li>
                <li style="margin:10px 0;">✅ امتحانات فورية مع تقييم ذاتي</li>
                <li style="margin:10px 0;">✅ نظام نقاط وشارات تحفيزي</li>
                <li style="margin:10px 0;">✅ خطط مجانية ومدفوعة حسب احتياجك</li>
                <li style="margin:10px 0;">✅ لوحة إدارة متكاملة للمعلمين</li>
            </ul>
        </div>
    `;
}

// ==================== 8.5 صفحة الحساب ====================

function renderProfile() {
    if (!AppState.currentUser) {
        showLoginModal('يجب تسجيل الدخول أولاً');
        return;
    }

    const user = AppState.currentUser;
    DOM.mainContent.innerHTML = `
        <div class="glass-card" style="max-width:500px; margin:0 auto;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="margin:0;">حسابي</h2>
            </div>
            <p><strong>اسم المستخدم:</strong> ${user.username}</p>
            <p><strong>البريد الإلكتروني:</strong> ${user.email}</p>
            <p><strong>رقم الهاتف:</strong> ${user.phone || 'غير مضاف'}</p>
            <p><strong>الخطة:</strong> ${user.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</p>
            ${user.plan === 'paid' && user.subscriptionEnd ? `<p><strong>ينتهي الاشتراك:</strong> ${formatDate(user.subscriptionEnd)}</p>` : ''}
            <p><strong>الدور:</strong> ${user.role === 'admin' ? 'مشرف 👑' : 'طالب 🎓'}</p>
            ${user.selectedGrades && user.selectedGrades.length > 0 ? `<p><strong>الصفوف المشترك بها:</strong> ${user.selectedGrades.join(', ')}</p>` : ''}
        </div>
    `;
}

// ================================================================
// 9. عرض المحتوى (صفوف، مواد، وحدات، دروس)
// ================================================================

async function viewGradeContent(gradeId) {
    try {
        const response = await fetch(`/api/grades/${gradeId}/content`);
        const data = await response.json();
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        AppState.currentGradeId = gradeId;
        renderGradeContent(data);
    } catch (error) {
        console.error('❌ خطأ في تحميل محتوى الصف:', error);
        showToast('حدث خطأ في تحميل المحتوى', 'error');
    }
}

function renderGradeContent(grade) {
    DOM.mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('grades')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${grade.name}</h2>
        </div>
        <div id="subjectsContainer">
            ${grade.subjects && grade.subjects.length > 0 ? grade.subjects.map(s => `
                <div class="subject-card" onclick="viewSubject(${grade.id}, ${s.id})">
                    <h3>${s.name}</h3>
                    <small style="color:var(--color-text-muted);">${s.units ? s.units.length : 0} وحدات</small>
                </div>
            `).join('') : '<p style="color:var(--color-text-muted);">لا توجد مواد في هذا الصف بعد</p>'}
        </div>
    `;
}

async function viewSubject(gradeId, subjectId) {
    try {
        const response = await fetch(`/api/grades/${gradeId}/content`);
        const data = await response.json();
        const subject = data.subjects.find(s => s.id === subjectId);
        if (!subject) {
            showToast('المادة غير موجودة', 'error');
            return;
        }
        AppState.currentSubjectId = subjectId;
        renderSubjectContent(gradeId, subject);
    } catch (error) {
        console.error('❌ خطأ في تحميل المادة:', error);
        showToast('حدث خطأ', 'error');
    }
}

function renderSubjectContent(gradeId, subject) {
    DOM.mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="viewGradeContent(${gradeId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${subject.name}</h2>
        </div>
        <div id="unitsContainer">
            ${subject.units && subject.units.length > 0 ? subject.units.map(u => `
                <div class="unit-card" onclick="viewUnit(${gradeId}, ${subject.id}, ${u.id})">
                    <h3>${u.name}</h3>
                    <small style="color:var(--color-text-muted);">${u.lessons ? u.lessons.length : 0} دروس</small>
                    ${u.exam && u.exam.questions && u.exam.questions.length > 0 ? `<span style="color:var(--color-gold);">📝 امتحان</span>` : ''}
                </div>
            `).join('') : '<p style="color:var(--color-text-muted);">لا توجد وحدات في هذه المادة بعد</p>'}
        </div>
    `;
}

async function viewUnit(gradeId, subjectId, unitId) {
    try {
        const response = await fetch(`/api/grades/${gradeId}/content`);
        const data = await response.json();
        const subject = data.subjects.find(s => s.id === subjectId);
        if (!subject) return;
        const unit = subject.units.find(u => u.id === unitId);
        if (!unit) return;
        AppState.currentUnitId = unitId;
        renderUnitContent(gradeId, subjectId, unit);
    } catch (error) {
        console.error('❌ خطأ في تحميل الوحدة:', error);
        showToast('حدث خطأ', 'error');
    }
}

function renderUnitContent(gradeId, subjectId, unit) {
    DOM.mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="viewSubject(${gradeId}, ${subjectId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${unit.name}</h2>
        </div>
        <div id="lessonsContainer">
            ${unit.lessons && unit.lessons.length > 0 ? unit.lessons.map(l => `
                <div class="lesson-card" onclick="viewLesson(${gradeId}, ${subjectId}, ${unit.id}, ${l.id})">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap;">
                        <h4>${l.title}</h4>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            ${l.locked ? '<span style="color:var(--color-danger);">🔒 مقفل</span>' : '<span style="color:var(--color-success);">✅ متاح</span>'}
                            ${l.free ? '<span style="color:var(--color-text-muted); font-size:0.8rem;">🆓 مجاني</span>' : '<span style="color:var(--color-gold); font-size:0.8rem;">⭐ مدفوع</span>'}
                        </div>
                    </div>
                    <small style="color:var(--color-text-muted);">${l.content ? '📄 شرح' : ''} ${l.exam && l.exam.questions && l.exam.questions.length > 0 ? '📝 امتحان' : ''}</small>
                </div>
            `).join('') : '<p style="color:var(--color-text-muted);">لا توجد دروس في هذه الوحدة بعد</p>'}
        </div>
        ${unit.exam && unit.exam.questions && unit.exam.questions.length > 0 ? `
            <div style="margin-top:20px; padding:15px; background:var(--color-glass-bg); border-radius:var(--radius); border:1px solid var(--color-glass-border);">
                <h3>📝 امتحان الوحدة (${unit.exam.questions.length} سؤال)</h3>
                <button class="btn" onclick="startUnitExam(${gradeId}, ${subjectId}, ${unit.id})">بدء الامتحان</button>
            </div>
        ` : ''}
    `;
}

async function viewLesson(gradeId, subjectId, unitId, lessonId) {
    try {
        const response = await fetch(`/api/grades/${gradeId}/content`);
        const data = await response.json();
        const subject = data.subjects.find(s => s.id === subjectId);
        if (!subject) return;
        const unit = subject.units.find(u => u.id === unitId);
        if (!unit) return;
        const lesson = unit.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        if (lesson.locked) {
            showToast('هذا الدرس مقفل. يرجى الترقية للوصول إليه.', 'error');
            return;
        }

        renderLessonContent(gradeId, subjectId, unitId, lesson);
    } catch (error) {
        console.error('❌ خطأ في تحميل الدرس:', error);
        showToast('حدث خطأ', 'error');
    }
}

function renderLessonContent(gradeId, subjectId, unitId, lesson) {
    DOM.mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="viewUnit(${gradeId}, ${subjectId}, ${unitId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${lesson.title}</h2>
            ${lesson.free ? '<span style="color:var(--color-text-muted);">🆓 مجاني</span>' : '<span style="color:var(--color-gold);">⭐ مدفوع</span>'}
        </div>
        <div class="lesson-container">
            ${lesson.content && lesson.content.video ? `
                <div class="video-container">
                    <iframe src="${lesson.content.video}" frameborder="0" allowfullscreen></iframe>
                </div>
            ` : ''}
            ${lesson.content && lesson.content.content ? `
                <div class="lesson-text">
                    <h3>الشرح النصي</h3>
                    <div>${lesson.content.content}</div>
                </div>
            ` : ''}
            ${lesson.content && lesson.content.examples ? `
                <div class="lesson-examples">
                    <h3>أمثلة محلولة</h3>
                    <div>${lesson.content.examples}</div>
                </div>
            ` : ''}
            ${lesson.content && lesson.content.exam && lesson.content.exam.questions && lesson.content.exam.questions.length > 0 ? `
                <div style="margin-top:20px; padding:15px; background:var(--color-glass-bg); border-radius:var(--radius); border:1px solid var(--color-glass-border);">
                    <h3>📝 امتحان الدرس (${lesson.content.exam.questions.length} سؤال)</h3>
                    <button class="btn" onclick="startLessonExam(${gradeId}, ${subjectId}, ${unitId}, ${lesson.id})">بدء الامتحان</button>
                </div>
            ` : ''}
        </div>
    `;
}

// ================================================================
// 10. الامتحانات (Exams)
// ================================================================

function startLessonExam(gradeId, subjectId, unitId, lessonId) {
    fetch(`/api/grades/${gradeId}/content`)
        .then(res => res.json())
        .then(data => {
            const subject = data.subjects.find(s => s.id === subjectId);
            if (!subject) return;
            const unit = subject.units.find(u => u.id === unitId);
            if (!unit) return;
            const lesson = unit.lessons.find(l => l.id === lessonId);
            if (!lesson || !lesson.content || !lesson.content.exam || !lesson.content.exam.questions.length) {
                showToast('لا يوجد امتحان لهذا الدرس', 'error');
                return;
            }
            AppState.currentExam = {
                questions: lesson.content.exam.questions,
                currentIndex: 0,
                answers: [],
                gradeId,
                subjectId,
                unitId,
                type: 'lesson'
            };
            renderExam();
        })
        .catch(err => {
            console.error('❌ خطأ في تحميل الامتحان:', err);
            showToast('حدث خطأ في تحميل الامتحان', 'error');
        });
}

function startUnitExam(gradeId, subjectId, unitId) {
    fetch(`/api/grades/${gradeId}/content`)
        .then(res => res.json())
        .then(data => {
            const subject = data.subjects.find(s => s.id === subjectId);
            if (!subject) return;
            const unit = subject.units.find(u => u.id === unitId);
            if (!unit || !unit.exam || !unit.exam.questions.length) {
                showToast('لا يوجد امتحان لهذه الوحدة', 'error');
                return;
            }
            AppState.currentExam = {
                questions: unit.exam.questions,
                currentIndex: 0,
                answers: [],
                gradeId,
                subjectId,
                unitId,
                type: 'unit'
            };
            renderExam();
        })
        .catch(err => {
            console.error('❌ خطأ في تحميل الامتحان:', err);
            showToast('حدث خطأ في تحميل الامتحان', 'error');
        });
}

function renderExam() {
    const exam = AppState.currentExam;
    if (exam.currentIndex >= exam.questions.length) {
        finishExam();
        return;
    }
    const q = exam.questions[exam.currentIndex];
    DOM.mainContent.innerHTML = `
        <div style="max-width:700px; margin:0 auto;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <button class="btn btn-outline btn-sm" onclick="viewUnit(${exam.gradeId}, ${exam.subjectId}, ${exam.unitId})"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="margin:0;">📝 الامتحان</h2>
            </div>
            <div class="glass-card">
                <p style="color:var(--color-text-secondary);">سؤال ${exam.currentIndex + 1} من ${exam.questions.length}</p>
                <h3>${q.question}</h3>
                <div style="margin-top:15px;">
                    ${q.options.map((opt, idx) => `
                        <label class="option-item" onclick="selectExamAnswer(${idx})" id="examOpt${idx}">
                            <input type="radio" name="examAnswer" value="${idx}" style="display:none;">
                            ${opt}
                        </label>
                    `).join('')}
                </div>
                <button class="btn" id="examNextBtn" onclick="nextExamQuestion()" disabled style="margin-top:15px;">التالي</button>
            </div>
        </div>
    `;
}

function selectExamAnswer(idx) {
    const exam = AppState.currentExam;
    exam.answers[exam.currentIndex] = idx;
    document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
    const selected = document.getElementById(`examOpt${idx}`);
    if (selected) selected.classList.add('selected');
    document.getElementById('examNextBtn').disabled = false;
}

function nextExamQuestion() {
    const exam = AppState.currentExam;
    if (exam.answers[exam.currentIndex] === undefined) {
        showToast('يرجى اختيار إجابة', 'error');
        return;
    }
    exam.currentIndex++;
    renderExam();
}

function finishExam() {
    const exam = AppState.currentExam;
    let correct = 0;
    exam.questions.forEach((q, i) => {
        if (exam.answers[i] === q.correctAnswer) correct++;
    });
    const score = Math.round((correct / exam.questions.length) * 100);
    const passed = score >= 60;

    DOM.mainContent.innerHTML = `
        <div style="max-width:700px; margin:0 auto; text-align:center;" class="glass-card">
            <h2>نتيجة الامتحان</h2>
            <div style="font-size:4rem; margin:20px 0; color:${passed ? 'var(--color-success)' : 'var(--color-danger)'};">${score}%</div>
            <p style="font-size:1.2rem;">${passed ? '🎉 أحسنت! اجتزت الامتحان' : '😔 لم تجتز الامتحان، حاول مرة أخرى'}</p>
            <button class="btn" onclick="viewUnit(${exam.gradeId}, ${exam.subjectId}, ${exam.unitId})">العودة</button>
        </div>
    `;
}

// ================================================================
// 11. إدارة المستخدمين (Admin - Users Management)
// ================================================================

async function renderAdminUsers() {
    // التحقق من صلاحيات المدير
    if (!ensureAdmin()) return;

    try {
        // التحقق من صحة الجلسة
        const isValid = await checkSessionValidity();
        if (!isValid) return;

        const response = await fetch('/api/admin/users');
        
        // معالجة أخطاء المصادقة
        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const users = await response.json();
        AppState.allUsers = users;

        DOM.mainContent.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="margin:0;">👑 إدارة المستخدمين (${users.length})</h2>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;">
                <input type="text" id="userSearchInput" placeholder="🔍 بحث عن مستخدم..." style="flex:1; min-width:200px; padding:8px 14px; background:rgba(255,255,255,0.05); border:1px solid var(--color-glass-border); border-radius:var(--radius-sm); color:white;" oninput="filterUsers()">
                <button class="btn btn-sm" onclick="renderAdminUsers()">🔄 تحديث</button>
            </div>
            <div class="overflow-x-auto">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المستخدم</th>
                            <th>البريد</th>
                            <th>الهاتف</th>
                            <th>الخطة</th>
                            <th>الصفوف</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        ${users.map((u, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td><strong>${u.username}</strong></td>
                                <td>${u.email}</td>
                                <td>${u.phone || '—'}</td>
                                <td>${u.plan === 'paid' ? '⭐ مدفوع' : '🆓 مجاني'}</td>
                                <td>${u.selectedGrades && u.selectedGrades.length > 0 ? u.selectedGrades.join(', ') : '—'}</td>
                                <td>${u.banned ? '🚫 محظور' : '✅ مفعل'}</td>
                                <td style="display:flex; gap:4px; flex-wrap:wrap;">
                                    <button class="btn btn-sm" onclick="editUser('${u._id}')" title="تعديل">✏️</button>
                                    <button class="btn btn-sm ${u.banned ? 'btn-outline' : ''}" onclick="toggleBanUser('${u._id}')" title="${u.banned ? 'إلغاء الحظر' : 'حظر'}">${u.banned ? '🔓' : '🔒'}</button>
                                    ${u.plan === 'paid' ? `<button class="btn btn-sm btn-outline" onclick="setUserPlan('${u._id}', 'free')" title="جعل مجاني">🔄 مجاني</button>` : `<button class="btn btn-sm" onclick="showUpgradeUser('${u._id}')" title="ترقية">⭐ ترقية</button>`}
                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u._id}')" title="حذف">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('❌ خطأ في تحميل المستخدمين:', error);
        showToast('حدث خطأ في تحميل المستخدمين', 'error');
        DOM.mainContent.innerHTML = '<p style="color:var(--color-danger);">حدث خطأ في تحميل المستخدمين</p>';
    }
}

function filterUsers() {
    const query = document.getElementById('userSearchInput')?.value?.toLowerCase() || '';
    const rows = document.querySelectorAll('#usersTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

async function editUser(userId) {
    if (!ensureAdmin()) return;
    
    const user = AppState.allUsers.find(u => u._id === userId);
    if (!user) return;

    const newUsername = prompt('اسم المستخدم:', user.username);
    if (newUsername === null) return;
    const newEmail = prompt('البريد الإلكتروني:', user.email);
    if (newEmail === null) return;
    const newPhone = prompt('رقم الهاتف:', user.phone || '');
    if (newPhone === null) return;
    const newPassword = prompt('كلمة المرور الجديدة (اتركها فارغة للإبقاء على القديمة):', '');
    if (newPassword === null) return;

    const data = { username: newUsername.trim(), email: newEmail.trim(), phone: newPhone.trim() };
    if (newPassword.trim()) data.password = newPassword.trim();

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const result = await response.json();
        if (result.success) {
            showToast('✅ تم تحديث بيانات المستخدم', 'success');
            renderAdminUsers();
        } else {
            showToast('❌ ' + (result.error || 'فشل التحديث'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في تعديل المستخدم:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function toggleBanUser(userId) {
    if (!ensureAdmin()) return;
    if (!confirm('هل تريد تبديل حالة الحظر لهذا المستخدم؟')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/ban`, { method: 'PUT' });
        
        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast(data.banned ? '✅ تم حظر المستخدم' : '✅ تم إلغاء الحظر', 'success');
            renderAdminUsers();
        }
    } catch (error) {
        console.error('❌ خطأ في تبديل الحظر:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function deleteUser(userId) {
    if (!ensureAdmin()) return;
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        
        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم حذف المستخدم', 'success');
            renderAdminUsers();
        }
    } catch (error) {
        console.error('❌ خطأ في حذف المستخدم:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

function showUpgradeUser(userId) {
    if (!ensureAdmin()) return;
    
    const user = AppState.allUsers.find(u => u._id === userId);
    if (!user) return;

    const duration = prompt('اختر مدة الاشتراك (بالأشهر):\n1 - شهر\n3 - 3 أشهر\n9 - 9 أشهر\n12 - سنة', '12');
    if (!duration) return;
    const months = parseInt(duration);
    if (![1, 3, 9, 12].includes(months)) {
        showToast('يرجى اختيار مدة صحيحة (1، 3، 9، 12)', 'error');
        return;
    }

    const gradesInput = prompt('أدخل أرقام الصفوف التي يريد الاشتراك بها (مفصولة بفواصل):\nمثال: 1,2,3', '');
    if (gradesInput === null) return;
    const selectedGrades = gradesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (selectedGrades.length === 0) {
        showToast('يرجى إدخال صف واحد على الأقل', 'error');
        return;
    }

    const data = {
        plan: 'paid',
        subscriptionDuration: months,
        selectedGrades
    };

    fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (res.status === 401 || res.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }
        return res.json();
    })
    .then(result => {
        if (result && result.success) {
            showToast('✅ تم ترقية المستخدم بنجاح', 'success');
            renderAdminUsers();
        } else if (result) {
            showToast('❌ ' + (result.error || 'فشل الترقية'), 'error');
        }
    })
    .catch(() => showToast('حدث خطأ في الاتصال', 'error'));
}

async function setUserPlan(userId, plan) {
    if (!ensureAdmin()) return;
    if (!confirm(`هل تريد تغيير خطة هذا المستخدم إلى ${plan === 'free' ? 'مجانية' : 'مدفوعة'}؟`)) return;

    const data = { plan };
    if (plan === 'free') {
        data.selectedGrades = [];
        data.subscriptionDuration = null;
    } else {
        const duration = prompt('المدة بالأشهر (1,3,9,12):', '12');
        if (!duration) return;
        const months = parseInt(duration);
        if (![1, 3, 9, 12].includes(months)) {
            showToast('مدة غير صحيحة', 'error');
            return;
        }
        const gradesInput = prompt('أرقام الصفوف (مفصولة بفواصل):', '');
        if (gradesInput === null) return;
        const selectedGrades = gradesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (selectedGrades.length === 0) {
            showToast('يرجى إدخال صف واحد على الأقل', 'error');
            return;
        }
        data.subscriptionDuration = months;
        data.selectedGrades = selectedGrades;
    }

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const result = await response.json();
        if (result.success) {
            showToast('✅ تم تغيير الخطة', 'success');
            renderAdminUsers();
        } else {
            showToast('❌ ' + (result.error || 'فشل التغيير'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في تغيير الخطة:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

// ================================================================
// 12. إدارة المحتوى (Admin - Content Management)
// ================================================================

async function renderAdminContent() {
    if (!ensureAdmin()) return;

    DOM.mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">📚 إدارة المحتوى</h2>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
            <button class="btn" onclick="showAddGrade()">➕ إضافة صف</button>
            <button class="btn btn-outline" onclick="renderAdminContent()">🔄 تحديث</button>
        </div>
        <div id="adminContentTree"></div>
    `;
    await loadAdminContentTree();
}

async function loadAdminContentTree() {
    if (!ensureAdmin()) return;

    try {
        const response = await fetch('/api/grades');
        
        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const grades = await response.json();
        AppState.allGrades = grades;
        const container = document.getElementById('adminContentTree');
        if (!grades.length) {
            container.innerHTML = '<p class="text-muted">لا توجد صفوف</p>';
            return;
        }

        let html = '';
        grades.forEach(g => {
            html += `
                <div class="glass-card" style="margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                        <h3>${g.name}</h3>
                        <div style="display:flex; gap:5px;">
                            <button class="btn btn-sm" onclick="showAddSubject(${g.id})">➕ مادة</button>
                            <button class="btn btn-sm btn-outline" onclick="editGrade(${g.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteGrade(${g.id})">🗑️</button>
                        </div>
                    </div>
                    ${g.subjects && g.subjects.length > 0 ? g.subjects.map(s => `
                        <div class="admin-content-tree">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                                <strong>📘 ${s.name}</strong>
                                <div style="display:flex; gap:5px;">
                                    <button class="btn btn-sm" onclick="showAddUnit(${g.id}, ${s.id})">➕ وحدة</button>
                                    <button class="btn btn-sm btn-outline" onclick="editSubject(${g.id}, ${s.id})">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteSubject(${g.id}, ${s.id})">🗑️</button>
                                </div>
                            </div>
                            ${s.units && s.units.length > 0 ? s.units.map(u => `
                                <div style="padding-right:1rem; margin-top:5px; border-right:2px solid var(--color-gold);">
                                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                                        <span>📂 ${u.name}</span>
                                        <div style="display:flex; gap:5px;">
                                            <button class="btn btn-sm" onclick="showAddLesson(${g.id}, ${s.id}, ${u.id})">➕ درس</button>
                                            <button class="btn btn-sm" onclick="editUnitExam(${g.id}, ${s.id}, ${u.id})">📝 امتحان</button>
                                            <button class="btn btn-sm btn-outline" onclick="editUnit(${g.id}, ${s.id}, ${u.id})">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteUnit(${g.id}, ${s.id}, ${u.id})">🗑️</button>
                                        </div>
                                    </div>
                                    ${u.lessons && u.lessons.length > 0 ? u.lessons.map(l => `
                                        <div style="padding-right:1rem; margin-top:3px; border-right:2px solid var(--color-primary); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                                            <span>📖 ${l.title} ${l.free ? '🆓' : '⭐'}</span>
                                            <div style="display:flex; gap:5px;">
                                                <button class="btn btn-sm btn-outline" onclick="editLessonContent(${g.id}, ${s.id}, ${u.id}, ${l.id})">✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${g.id}, ${s.id}, ${u.id}, ${l.id})">🗑️</button>
                                            </div>
                                        </div>
                                    `).join('') : ''}
                                </div>
                            `).join('') : ''}
                        </div>
                    `).join('') : '<p class="text-muted" style="margin-top:5px;">لا توجد مواد</p>'}
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error('❌ خطأ في تحميل شجرة المحتوى:', error);
        showToast('حدث خطأ في تحميل المحتوى', 'error');
    }
}

// ====== دوال إدارة الصفوف ======

async function showAddGrade() {
    if (!ensureAdmin()) return;

    const name = prompt('أدخل اسم الصف الجديد:');
    if (!name) return;
    
    try {
        const response = await fetch('/api/admin/grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim() })
        });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم إضافة الصف', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (data.error || 'فشل الإضافة'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في إضافة الصف:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function editGrade(gradeId) {
    if (!ensureAdmin()) return;
    
    const grade = AppState.allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const newName = prompt('اسم الصف الجديد:', grade.name);
    if (!newName) return;
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim() })
        });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم تعديل الصف', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (data.error || 'فشل التعديل'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في تعديل الصف:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function deleteGrade(gradeId) {
    if (!ensureAdmin()) return;
    if (!confirm('هل أنت متأكد من حذف هذا الصف وجميع محتوياته؟')) return;
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}`, { method: 'DELETE' });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم حذف الصف', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (data.error || 'فشل الحذف'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في حذف الصف:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

// ====== دوال إدارة المواد ======

async function showAddSubject(gradeId) {
    if (!ensureAdmin()) return;

    const name = prompt('أدخل اسم المادة الجديدة:');
    if (!name) return;
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim() })
        });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم إضافة المادة', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (data.error || 'فشل الإضافة'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في إضافة المادة:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function editSubject(gradeId, subjectId) {
    if (!ensureAdmin()) return;
    
    const grade = AppState.allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const subject = grade.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const newName = prompt('اسم المادة الجديد:', subject.name);
    if (!newName) return;
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim() })
        });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم تعديل المادة', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (data.error || 'فشل التعديل'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في تعديل المادة:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function deleteSubject(gradeId, subjectId) {
    if (!ensureAdmin()) return;
    if (!confirm('حذف هذه المادة وجميع محتوياتها؟')) return;
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}`, { method: 'DELETE' });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم حذف المادة', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (data.error || 'فشل الحذف'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في حذف المادة:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

// ====== دوال إدارة الوحدات ======

async function showAddUnit(gradeId, subjectId) {
    if (!ensureAdmin()) return;

    const name = prompt('أدخل اسم الوحدة الجديدة:');
    if (!name) return;
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim() })
        });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم إضافة الوحدة', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (data.error || 'فشل الإضافة'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في إضافة الوحدة:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function editUnit(gradeId, subjectId, unitId) {
    if (!ensureAdmin()) return;
    
    const grade = AppState.allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const subject = grade.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const unit = subject.units.find(u => u.id === unitId);
    if (!unit) return;
    const newName = prompt('اسم الوحدة الجديد:', unit.name);
    if (!newName) return;
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim() })
        });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم تعديل الوحدة', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (data.error || 'فشل التعديل'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في تعديل الوحدة:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function deleteUnit(gradeId, subjectId, unitId) {
    if (!ensureAdmin()) return;
    if (!confirm('حذف هذه الوحدة وجميع دروسها؟')) return;
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}`, { method: 'DELETE' });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم حذف الوحدة', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (data.error || 'فشل الحذف'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في حذف الوحدة:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

// ====== دوال إدارة الدروس ======

async function showAddLesson(gradeId, subjectId, unitId) {
    if (!ensureAdmin()) return;

    const title = prompt('عنوان الدرس:');
    if (!title) return;
    const video = prompt('رابط فيديو (YouTube embed URL):', '');
    const content = prompt('الشرح النصي (HTML مسموح):', '');
    const examples = prompt('الأمثلة المحلولة (HTML):', '');
    const free = confirm('هل هذا الدرس مجاني؟ (موافق = مجاني، إلغاء = مدفوع)');
    
    const examQuestionCount = prompt('كم سؤالاً تريد إضافته في امتحان هذا الدرس؟ (0 يعني لا يوجد امتحان)', '0');
    const count = parseInt(examQuestionCount) || 0;
    const exam = { questions: [] };
    for (let i = 0; i < count; i++) {
        const q = prompt(`السؤال ${i + 1}:`);
        if (!q) break;
        const options = prompt(`خيارات السؤال ${i + 1} (مفصولة بفواصل):`, '');
        if (!options) break;
        const opts = options.split(',').map(s => s.trim());
        const correct = parseInt(prompt(`رقم الإجابة الصحيحة (0-${opts.length - 1}):`, '0'));
        if (isNaN(correct) || correct < 0 || correct >= opts.length) break;
        exam.questions.push({ question: q, options: opts, correctAnswer: correct });
    }

    const data = { title: title.trim(), video, content, examples, free, exam };
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const result = await response.json();
        if (result.success) {
            showToast('✅ تم إضافة الدرس', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (result.error || 'فشل الإضافة'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في إضافة الدرس:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function editLessonContent(gradeId, subjectId, unitId, lessonId) {
    if (!ensureAdmin()) return;
    
    const grade = AppState.allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const subject = grade.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const unit = subject.units.find(u => u.id === unitId);
    if (!unit) return;
    const lesson = unit.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const newTitle = prompt('عنوان الدرس:', lesson.title);
    if (newTitle === null) return;
    const newVideo = prompt('رابط الفيديو:', lesson.video || '');
    const newContent = prompt('الشرح النصي:', lesson.content || '');
    const newExamples = prompt('الأمثلة:', lesson.examples || '');
    const newFree = confirm(`الدرس الحالي ${lesson.free ? 'مجاني' : 'مدفوع'}. هل تريد جعله مجاني؟ (موافق = مجاني، إلغاء = مدفوع)`);

    const data = {
        title: newTitle.trim(),
        video: newVideo,
        content: newContent,
        examples: newExamples,
        free: newFree
    };

    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons/${lessonId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const result = await response.json();
        if (result.success) {
            showToast('✅ تم تعديل الدرس', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (result.error || 'فشل التعديل'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في تعديل الدرس:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function deleteLesson(gradeId, subjectId, unitId, lessonId) {
    if (!ensureAdmin()) return;
    if (!confirm('حذف هذا الدرس؟')) return;
    
    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons/${lessonId}`, { method: 'DELETE' });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const result = await response.json();
        if (result.success) {
            showToast('✅ تم حذف الدرس', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (result.error || 'فشل الحذف'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في حذف الدرس:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function editUnitExam(gradeId, subjectId, unitId) {
    if (!ensureAdmin()) return;
    
    const grade = AppState.allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const subject = grade.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const unit = subject.units.find(u => u.id === unitId);
    if (!unit) return;

    const questionCount = prompt('كم سؤالاً تريد في امتحان هذه الوحدة؟ (0 للحذف)', '0');
    if (questionCount === null) return;
    const count = parseInt(questionCount);
    if (isNaN(count) || count < 0) {
        showToast('رقم غير صحيح', 'error');
        return;
    }
    const exam = { questions: [] };
    for (let i = 0; i < count; i++) {
        const q = prompt(`سؤال ${i + 1}:`);
        if (!q) break;
        const options = prompt(`خيارات (مفصولة بفواصل):`, '');
        if (!options) break;
        const opts = options.split(',').map(s => s.trim());
        const correct = parseInt(prompt(`رقم الإجابة الصحيحة (0-${opts.length - 1}):`, '0'));
        if (isNaN(correct) || correct < 0 || correct >= opts.length) break;
        exam.questions.push({ question: q, options: opts, correctAnswer: correct });
    }

    try {
        const response = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/exam`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exam })
        });

        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const result = await response.json();
        if (result.success) {
            showToast('✅ تم تحديث امتحان الوحدة', 'success');
            renderAdminContent();
        } else {
            showToast('❌ ' + (result.error || 'فشل التحديث'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث امتحان الوحدة:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

// ================================================================
// 13. تسجيل الدخول والتسجيل (Login & Register)
// ================================================================

function showLoginModal(message = '') {
    DOM.loginModal.style.display = 'flex';
    const errorEl = document.getElementById('loginError');
    errorEl.style.display = message ? 'block' : 'none';
    if (message) errorEl.textContent = message;
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function showRegisterModal() {
    DOM.registerModal.style.display = 'flex';
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

async function loadGradesForRegister() {
    try {
        const response = await fetch('/api/grades');
        const grades = await response.json();
        const container = document.getElementById('gradesCheckboxes');
        if (!container) return;
        container.innerHTML = grades.map(g => `
            <label style="display:flex; align-items:center; gap:4px; font-size:0.85rem; color:var(--color-text-secondary); cursor:pointer;">
                <input type="checkbox" value="${g.id}" class="grade-checkbox"> ${g.name}
            </label>
        `).join('');
    } catch (error) {
        console.error('❌ خطأ في تحميل الصفوف للتسجيل:', error);
    }
}

function toggleGradeSelection() {
    const plan = document.querySelector('input[name="regPlan"]:checked');
    const gradeDiv = document.getElementById('gradeSelection');
    gradeDiv.style.display = (plan && plan.value === 'paid') ? 'block' : 'none';
}

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
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.error) {
            errorEl.textContent = data.error;
            errorEl.style.display = 'block';
            return;
        }
        if (data.success) {
            AppState.currentUser = data.user;
            updateUIForUser();
            closeModal('loginModal');
            navigateTo('home');
            showToast('تم تسجيل الدخول بنجاح', 'success');
        }
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        errorEl.textContent = 'حدث خطأ في الاتصال بالخادم';
        errorEl.style.display = 'block';
    }
}

async function registerUser() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    const plan = document.querySelector('input[name="regPlan"]:checked').value;
    const errorEl = document.getElementById('regError');

    if (!username || !email || !password || !confirmPassword) {
        errorEl.textContent = 'يرجى ملء جميع الحقول المطلوبة';
        errorEl.style.display = 'block';
        return;
    }
    if (password !== confirmPassword) {
        errorEl.textContent = 'كلمة المرور وتأكيدها غير متطابقين';
        errorEl.style.display = 'block';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        errorEl.style.display = 'block';
        return;
    }

    let selectedGrades = [];
    if (plan === 'paid') {
        document.querySelectorAll('.grade-checkbox:checked').forEach(cb => {
            selectedGrades.push(parseInt(cb.value));
        });
        if (selectedGrades.length === 0) {
            errorEl.textContent = 'يرجى اختيار صف واحد على الأقل للخطة المدفوعة';
            errorEl.style.display = 'block';
            return;
        }
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password,
                confirmPassword,
                phone,
                plan,
                selectedGrades
            })
        });
        const data = await response.json();
        if (data.error) {
            errorEl.textContent = data.error;
            errorEl.style.display = 'block';
            return;
        }
        if (data.success) {
            if (data.user) {
                AppState.currentUser = data.user;
                updateUIForUser();
                closeModal('registerModal');
                navigateTo('home');
                showToast(data.message, 'success');
            } else {
                closeModal('registerModal');
                showToast(data.message, 'info');
                navigateTo('home');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في التسجيل:', error);
        errorEl.textContent = 'حدث خطأ في الاتصال بالخادم';
        errorEl.style.display = 'block';
    }
}

// ================================================================
// 14. البحث (Search)
// ================================================================

if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', async function() {
        const query = this.value.trim().toLowerCase();
        if (!query) {
            DOM.searchResults.classList.remove('active');
            return;
        }
        try {
            const response = await fetch('/api/grades');
            const grades = await response.json();
            const results = [];
            grades.forEach(g => {
                if (g.name.includes(query)) {
                    results.push({ type: 'grade', id: g.id, name: g.name });
                }
                if (g.subjects) {
                    g.subjects.forEach(s => {
                        if (s.name.includes(query)) {
                            results.push({ type: 'subject', gradeId: g.id, id: s.id, name: s.name, gradeName: g.name });
                        }
                    });
                }
            });
            DOM.searchResults.innerHTML = results.length ? results.map(r => `
                <div class="search-result-item" onclick="navigateSearchResult(${r.gradeId || r.id}, '${r.type}', ${r.id})">
                    <i class="fas ${r.type === 'grade' ? 'fa-layer-group' : 'fa-book'}"></i>
                    <div>
                        <div class="result-text">${r.name}</div>
                        <div class="result-sub">${r.type === 'grade' ? 'صف دراسي' : `مادة في ${r.gradeName}`}</div>
                    </div>
                </div>
            `).join('') : '<div class="search-result-item">لا نتائج</div>';
            DOM.searchResults.classList.add('active');
        } catch (error) {
            console.error('❌ خطأ في البحث:', error);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            DOM.searchResults.classList.remove('active');
        }
    });
}

function navigateSearchResult(id, type, itemId) {
    DOM.searchResults.classList.remove('active');
    DOM.searchInput.value = '';
    if (type === 'grade') {
        viewGradeContent(id);
    } else if (type === 'subject') {
        viewSubject(id, itemId);
    }
}

// ================================================================
// 15. أحداث عامة (General Events)
// ================================================================

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        DOM.backToTop.style.display = 'flex';
    } else {
        DOM.backToTop.style.display = 'none';
    }
});

if (DOM.sidebarToggle) {
    DOM.sidebarToggle.addEventListener('click', toggleSidebar);
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
});

// ================================================================
// 16. بدء التطبيق (App Initialization)
// ================================================================

async function initApp() {
    await checkCurrentUser();
    if (!AppState.currentUser) {
        navigateTo('home');
    } else {
        navigateTo('home');
    }
}

document.addEventListener('DOMContentLoaded', initApp);

// ================================================================
// 17. جعل الدوال عالمية (للاستخدام في HTML)
// ================================================================

window.navigateTo = navigateTo;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.closeModal = closeModal;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logout = logout;
window.toggleGradeSelection = toggleGradeSelection;
window.viewGradeContent = viewGradeContent;
window.viewSubject = viewSubject;
window.viewUnit = viewUnit;
window.viewLesson = viewLesson;
window.viewGradePublic = viewGradePublic;
window.startLessonExam = startLessonExam;
window.startUnitExam = startUnitExam;
window.selectExamAnswer = selectExamAnswer;
window.nextExamQuestion = nextExamQuestion;
window.renderAdminUsers = renderAdminUsers;
window.filterUsers = filterUsers;
window.editUser = editUser;
window.toggleBanUser = toggleBanUser;
window.deleteUser = deleteUser;
window.showUpgradeUser = showUpgradeUser;
window.setUserPlan = setUserPlan;
window.renderAdminContent = renderAdminContent;
window.showAddGrade = showAddGrade;
window.editGrade = editGrade;
window.deleteGrade = deleteGrade;
window.showAddSubject = showAddSubject;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
window.showAddUnit = showAddUnit;
window.editUnit = editUnit;
window.deleteUnit = deleteUnit;
window.showAddLesson = showAddLesson;
window.editLessonContent = editLessonContent;
window.deleteLesson = deleteLesson;
window.editUnitExam = editUnitExam;
window.navigateSearchResult = navigateSearchResult;