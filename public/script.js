/**
 * ================================================================
 * DeepTeachSY - JavaScript الرئيسي (الإصدار النهائي الاحترافي)
 * ================================================================
 * 
 * 🧠  العمارة: Module Pattern مع إدارة حالة مركزية
 * 🔄  التنقل: SPA (Single Page Application) مع روابط ديناميكية
 * 📡  الاتصال: Fetch API مع معالجة الأخطاء الموحدة
 * 🎨  التفاعل: تحديث واجهة المستخدم ديناميكياً
 * 🔐  المصادقة: جلسات (Sessions) مع تذكر المستخدم
 * 🛡️  الأمان: التحقق من الصلاحيات قبل أي عملية إدارة
 * ⬆️  طلبات الترقية: نظام متكامل لقبول/رفض طلبات المستخدمين
 * 📊  تتبع التقدم: نظام متكامل لتتبع تقدم الطلاب
 * 🏆  الشهادات: نظام إنشاء شهادات إنجاز للمستخدمين
 * 
 * ================================================================
 */

// ================================================================
// 1. إدارة الحالة (State Management)
// ================================================================

const AppState = {
    currentUser: null,
    allGrades: [],
    allUsers: [],
    currentGradeId: null,
    currentSubjectId: null,
    currentUnitId: null,
    currentLessonId: null,
    currentPage: 'home',
    adminActiveTab: 'users',
    currentExam: {
        questions: [],
        currentIndex: 0,
        answers: [],
        gradeId: null,
        subjectId: null,
        unitId: null,
        lessonId: null,
        type: 'lesson'
    },
    userProgress: {},
    userScores: {},
    upgradeRequests: []
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

function showToast(message, type = 'info') {
    const icons = {
        error: '❌',
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️'
    };
    const prefix = icons[type] || 'ℹ️';
    alert(prefix + ' ' + message);
}

function formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    if (!date) return '—';
    return new Date(date).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function truncateText(text, maxLength = 50) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function generateTempId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `${minutes} دقيقة`;
    if (hours < 24) return `${hours} ساعة`;
    if (days < 7) return `${days} يوم`;
    return formatDate(date);
}

// ================================================================
// 4. إدارة المصادقة والصلاحيات (Auth & Permissions)
// ================================================================

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

function ensureAuthenticated() {
    if (!AppState.currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        showLoginModal();
        return false;
    }
    return true;
}

async function checkSessionValidity() {
    try {
        const response = await fetch('/api/current-user');
        const data = await response.json();
        if (!data.user) {
            AppState.currentUser = null;
            updateUIForUser();
            navigateTo('home');
            return false;
        }
        AppState.currentUser = data.user;
        updateUIForUser();
        return true;
    } catch (error) {
        console.error('❌ خطأ في التحقق من الجلسة:', error);
        return false;
    }
}

async function handleAuthError(response, defaultMessage = 'حدث خطأ') {
    if (response.status === 401 || response.status === 403) {
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
            // تحميل تقدم المستخدم
            if (data.user.role === 'student') {
                await loadUserProgress(data.user.username);
                await loadUserScores(data.user.username);
            }
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
// 8. طلبات الترقية (للطالب)
// ================================================================

async function requestUpgrade() {
    if (!AppState.currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    if (AppState.currentUser.plan === 'paid') {
        showToast('أنت مشترك بالفعل في الخطة المدفوعة', 'info');
        return;
    }
    
    const user = AppState.currentUser;
    const name = prompt('الاسم الكامل:', user.username);
    if (name === null) return;
    const phone = prompt('رقم الهاتف للتواصل:', user.phone || '');
    if (phone === null) return;
    const duration = prompt('المدة (بالأشهر):\n1 - شهر واحد\n3 - 3 أشهر\n6 - 6 أشهر\n12 - سنة', '1');
    if (duration === null) return;
    const months = parseInt(duration);
    if (![1, 3, 6, 12].includes(months)) {
        showToast('يرجى اختيار مدة صحيحة (1، 3، 6، 12)', 'error');
        return;
    }
    
    // اختيار الصفوف
    const grades = await fetch('/api/grades').then(r => r.json());
    const gradeOptions = grades.map(g => `${g.id}: ${g.name}`).join('\n');
    const gradesInput = prompt(`أدخل أرقام الصفوف التي تريد الاشتراك بها (مفصولة بفواصل):\n${gradeOptions}`, '');
    if (gradesInput === null) return;
    const selectedGrades = gradesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (selectedGrades.length === 0) {
        showToast('يرجى إدخال صف واحد على الأقل', 'error');
        return;
    }

    try {
        const response = await fetch('/api/upgrade-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user.username,
                fullName: name,
                phone: phone,
                duration: `${months} شهر`,
                selectedGrades: selectedGrades
            })
        });
        const data = await response.json();
        if (data.message) {
            showToast('✅ ' + data.message, 'success');
        } else {
            showToast('❌ ' + (data.error || 'فشل إرسال الطلب'), 'error');
        }
    } catch (error) {
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

// ================================================================
// 9. تحميل تقدم المستخدم ونتائجه
// ================================================================

async function loadUserProgress(username) {
    try {
        const response = await fetch(`/api/user-progress/${username}`);
        const data = await response.json();
        AppState.userProgress = data || {};
    } catch (error) {
        console.error('❌ خطأ في تحميل تقدم المستخدم:', error);
        AppState.userProgress = {};
    }
}

async function loadUserScores(username) {
    try {
        const response = await fetch(`/api/scores/${username}`);
        const data = await response.json();
        AppState.userScores = data || {};
    } catch (error) {
        console.error('❌ خطأ في تحميل نتائج المستخدم:', error);
        AppState.userScores = {};
    }
}

// ================================================================
// 10. عرض الصفحات (Page Rendering)
// ================================================================

// ==================== 10.1 الصفحة الرئيسية العامة (للزوار) ====================

function renderPublicHome() {
    DOM.mainContent.innerHTML = `
        <div class="hero-section">
            <div class="hero-content">
                <h1>مرحباً بك في <span class="text-gold">DeepTeachSY</span></h1>
                <p class="hero-subtitle">منصة التعلم العميق التي تتيح لك اكتساب المعرفة بطريقة منظمة وتفاعلية</p>
                <div class="hero-buttons">
                    <button class="btn btn-primary" onclick="showRegisterModal()">ابدأ رحلتك التعليمية</button>
                    <button class="btn btn-outline" onclick="showLoginModal()">تسجيل الدخول</button>
                </div>
            </div>
        </div>

        <section class="features-section">
            <h2 class="section-title">ما الذي تقدمه لك المنصة؟</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-book-open"></i></div>
                    <h3>دروس منظمة</h3>
                    <p>محتوى تعليمي مرتب حسب الصفوف والمواد والوحدات</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-video"></i></div>
                    <h3>شروحات فيديو</h3>
                    <p>دروس مصورة مع أمثلة محلولة وتمارين تفاعلية</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-crown"></i></div>
                    <h3>محتوى مدفوع ومجاني</h3>
                    <p>اختر الخطة المناسبة لك وتمتع بمزايا إضافية</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-chart-line"></i></div>
                    <h3>تتبع التقدم</h3>
                    <p>راقب تطورك واحصل على شارات عند إتمام الدروس</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-certificate"></i></div>
                    <h3>شهادات إنجاز</h3>
                    <p>احصل على شهادات معتمدة بعد إتمام الدورات</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-users"></i></div>
                    <h3>مجتمع تعليمي</h3>
                    <p>تفاعل مع المعلم والطلاب عبر نظام الأسئلة والأجوبة</p>
                </div>
            </div>
        </section>

        <section class="grades-preview">
            <h2 class="section-title">استكشف الصفوف الدراسية</h2>
            <div id="gradesGrid" class="grades-grid"></div>
        </section>

        <section class="cta-section">
            <div class="cta-content">
                <h2>جاهز لبدء رحلتك التعليمية؟</h2>
                <p>انضم إلى آلاف الطلاب الذين يطورون مهاراتهم مع DeepTeachSY</p>
                <button class="btn btn-primary btn-large" onclick="showRegisterModal()">سجل الآن مجاناً</button>
            </div>
        </section>
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
                <div class="grade-icon">${g.id}</div>
                <div class="grade-label">${g.name}</div>
                <small>${g.subjects ? g.subjects.length : 0} مواد</small>
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

// ==================== 10.2 الصفحة الرئيسية للمستخدم ====================

function renderHome() {
    if (!AppState.currentUser) {
        renderPublicHome();
        return;
    }

    const user = AppState.currentUser;
    const isAdmin = user.role === 'admin';
    const isPaid = user.plan === 'paid';

    // جلب أحدث الكورسات والاقتراحات
    const recentCourses = getRecentCourses();
    const suggestedContent = getSuggestedContent(user);

    DOM.mainContent.innerHTML = `
        <div class="user-dashboard">
            <!-- الترحيب -->
            <div class="welcome-banner">
                <div class="welcome-text">
                    <h2>مرحباً ${user.username} 👋</h2>
                    <p>خطتك: <strong class="${isPaid ? 'text-gold' : 'text-muted'}">${isPaid ? 'مدفوعة ⭐' : 'مجانية 🆓'}</strong>
                    ${isPaid && user.subscriptionEnd ? ` | ينتهي الاشتراك: ${formatDate(user.subscriptionEnd)}` : ''}</p>
                </div>
                <div class="quick-actions">
                    <button class="btn btn-sm" onclick="navigateTo('grades')">استعراض الصفوف</button>
                    ${isAdmin ? `<button class="btn btn-sm btn-outline" onclick="navigateTo('admin-users')">👑 إدارة</button>` : ''}
                    <button class="btn btn-sm btn-outline" onclick="navigateTo('profile')">حسابي</button>
                </div>
            </div>

            <!-- إحصائيات سريعة -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-book"></i></div>
                    <div class="stat-info">
                        <span class="stat-value">${getCompletedLessonsCount(user)}</span>
                        <span class="stat-label">دروس مكتملة</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-star"></i></div>
                    <div class="stat-info">
                        <span class="stat-value">${getAverageScore(user)}%</span>
                        <span class="stat-label">متوسط الدرجات</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                    <div class="stat-info">
                        <span class="stat-value">${getBadgesCount(user)}</span>
                        <span class="stat-label">الشارات</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-info">
                        <span class="stat-value">${getTotalStudyTime(user)}</span>
                        <span class="stat-label">وقت الدراسة</span>
                    </div>
                </div>
            </div>

            <!-- محتوى مقترح -->
            ${suggestedContent.length > 0 ? `
            <div class="suggested-section">
                <h3 class="section-title">📚 محتوى مقترح لك</h3>
                <div class="suggested-grid">
                    ${suggestedContent.map(item => `
                        <div class="suggested-card" onclick="viewLesson(${item.gradeId}, ${item.subjectId}, ${item.unitId}, ${item.lessonId})">
                            <div class="suggested-thumbnail">
                                <i class="fas fa-play-circle"></i>
                            </div>
                            <div class="suggested-info">
                                <h4>${item.title}</h4>
                                <p>${item.subjectName} - ${item.gradeName}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- أحدث الكورسات -->
            <div class="recent-section">
                <h3 class="section-title">🆕 أحدث الكورسات</h3>
                <div class="recent-grid">
                    ${recentCourses.length > 0 ? recentCourses.map(c => `
                        <div class="recent-card" onclick="viewGradeContent(${c.gradeId})">
                            <div class="recent-icon"><i class="fas fa-graduation-cap"></i></div>
                            <div class="recent-info">
                                <h4>${c.subjectName}</h4>
                                <p>${c.gradeName}</p>
                            </div>
                        </div>
                    `).join('') : '<p class="text-muted">لا توجد كورسات جديدة حالياً</p>'}
                </div>
            </div>

            <!-- صفوف المستخدم -->
            <div class="user-grades-section">
                <h3 class="section-title">صفوفك الدراسية</h3>
                <div id="gradesGrid" class="grades-grid"></div>
            </div>
        </div>
    `;
    loadUserGrades();
}

// ==================== 10.3 دوال مساعدة للصفحة الرئيسية ====================

function getRecentCourses() {
    // في النسخة الكاملة، سيتم جلب أحدث الكورسات من الخادم
    return AppState.allGrades.slice(0, 4).map(g => ({
        gradeId: g.id,
        gradeName: g.name,
        subjectName: g.subjects && g.subjects.length > 0 ? g.subjects[0].name : 'لا توجد مواد'
    }));
}

function getSuggestedContent(user) {
    // في النسخة الكاملة، سيتم جلب محتوى مقترح بناءً على تقدم المستخدم
    const suggested = [];
    AppState.allGrades.forEach(g => {
        if (g.subjects) {
            g.subjects.forEach(s => {
                if (s.units) {
                    s.units.forEach(u => {
                        if (u.lessons) {
                            u.lessons.forEach(l => {
                                // اقتراح الدروس التي لم يكملها المستخدم بعد
                                const key = `${g.id}_${s.id}_${u.id}_${l.id}`;
                                if (!AppState.userProgress[key]) {
                                    suggested.push({
                                        gradeId: g.id,
                                        gradeName: g.name,
                                        subjectId: s.id,
                                        subjectName: s.name,
                                        unitId: u.id,
                                        lessonId: l.id,
                                        title: l.title
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
    return suggested.slice(0, 6);
}

function getCompletedLessonsCount(user) {
    if (!AppState.userProgress) return 0;
    return Object.keys(AppState.userProgress).filter(key => AppState.userProgress[key] === true).length;
}

function getAverageScore(user) {
    if (!AppState.userScores) return 0;
    const scores = [];
    Object.keys(AppState.userScores).forEach(courseId => {
        const courseScores = AppState.userScores[courseId] || [];
        courseScores.forEach(s => {
            if (s !== null && s !== undefined) scores.push(s);
        });
    });
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function getBadgesCount(user) {
    // سيتم جلب الشارات من الخادم
    return 0;
}

function getTotalStudyTime(user) {
    // سيتم حساب وقت الدراسة من الخادم
    return '0 دقيقة';
}

// ==================== 10.4 تحميل صفوف المستخدم ====================

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
                <div class="grade-icon">${g.id}</div>
                <div class="grade-label">${g.name}</div>
                <small>${g.subjects ? g.subjects.length : 0} مواد</small>
            </div>
        `).join('');

        if (availableGrades.length === 0) {
            grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1; text-align:center;">لا توجد صفوف متاحة لك حالياً</p>`;
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل صفوف المستخدم:', error);
        showToast('حدث خطأ في تحميل الصفوف', 'error');
    }
}

// ==================== 10.5 صفحة الصفوف ====================

function renderGrades() {
    DOM.mainContent.innerHTML = `
        <div class="page-header">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 class="page-title">الصفوف الدراسية</h2>
        </div>
        <div id="gradesGrid" class="grades-grid"></div>
    `;
    if (AppState.currentUser) {
        loadUserGrades();
    } else {
        loadGradesForPublic();
    }
}

// ==================== 10.6 صفحة "عن المنصة" ====================

function renderAbout() {
    DOM.mainContent.innerHTML = `
        <div class="about-page">
            <h2 class="page-title">عن منصة DeepTeachSY</h2>
            <div class="about-content">
                <div class="about-card">
                    <h3>رسالتنا</h3>
                    <p>تقديم تعليم عالي الجودة للجميع، بغض النظر عن موقعهم أو ظروفهم المادية.</p>
                </div>
                <div class="about-card">
                    <h3>رؤيتنا</h3>
                    <p>أن نكون المنصة التعليمية الرائدة في سوريا والمنطقة العربية، نصنع جيلاً مبدعاً ومتعلماً.</p>
                </div>
                <div class="about-card">
                    <h3>قيمنا</h3>
                    <ul>
                        <li>📚 الجودة في المحتوى التعليمي</li>
                        <li>🎯 التميز في الأداء</li>
                        <li>🤝 التعاون والمشاركة</li>
                        <li>💡 الابتكار والتطوير المستمر</li>
                    </ul>
                </div>
                <div class="about-card">
                    <h3>من نحن</h3>
                    <p>DeepTeachSY هي منصة تعليمية سورية تأسست لتوفير فرص تعلم مميزة للطلاب في سوريا والعالم العربي. نقدم محتوى تعليمياً متنوعاً في الفيزياء، الكيمياء، الرياضيات، واللغة الإنجليزية.</p>
                </div>
                <div class="about-card contact-card">
                    <h3>تواصل مع الدعم</h3>
                    <p>لديك استفسار أو مشكلة؟ تواصل معنا وسنكون سعداء بمساعدتك</p>
                    <button class="btn" onclick="navigateTo('profile')">📩 تواصل معنا</button>
                </div>
            </div>
        </div>
    `;
}

// ==================== 10.7 صفحة الحساب ====================

function renderProfile() {
    if (!AppState.currentUser) {
        showLoginModal('يجب تسجيل الدخول أولاً');
        return;
    }

    const user = AppState.currentUser;
    const isPaid = user.plan === 'paid';
    const isAdmin = user.role === 'admin';

    DOM.mainContent.innerHTML = `
        <div class="profile-page">
            <h2 class="page-title">حسابي</h2>
            <div class="profile-container">
                <!-- معلومات الحساب -->
                <div class="profile-card">
                    <h3><i class="fas fa-user-circle"></i> معلومات الحساب</h3>
                    <div class="profile-info">
                        <div class="info-row"><strong>اسم المستخدم:</strong> ${user.username}</div>
                        <div class="info-row"><strong>البريد الإلكتروني:</strong> ${user.email}</div>
                        <div class="info-row"><strong>رقم الهاتف:</strong> ${user.phone || 'غير مضاف'}</div>
                        <div class="info-row"><strong>الخطة:</strong> ${isPaid ? 'مدفوعة ⭐' : 'مجانية 🆓'}</div>
                        ${isPaid && user.subscriptionEnd ? `<div class="info-row"><strong>ينتهي الاشتراك:</strong> ${formatDate(user.subscriptionEnd)}</div>` : ''}
                        <div class="info-row"><strong>الدور:</strong> ${isAdmin ? 'مشرف 👑' : 'طالب 🎓'}</div>
                        ${user.selectedGrades && user.selectedGrades.length > 0 ? `<div class="info-row"><strong>الصفوف المشترك بها:</strong> ${user.selectedGrades.join(', ')}</div>` : ''}
                    </div>
                </div>

                <!-- تقدم المستخدم -->
                <div class="profile-card">
                    <h3><i class="fas fa-chart-line"></i> تقدمك التعليمي</h3>
                    <div class="progress-stats">
                        <div class="progress-stat">
                            <span class="stat-number">${getCompletedLessonsCount(user)}</span>
                            <span class="stat-label">دروس مكتملة</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-number">${getAverageScore(user)}%</span>
                            <span class="stat-label">متوسط الدرجات</span>
                        </div>
                        <div class="progress-stat">
                            <span class="stat-number">${getBadgesCount(user)}</span>
                            <span class="stat-label">الشارات</span>
                        </div>
                    </div>
                </div>

                <!-- طلب الترقية (للمجانيين فقط) -->
                ${!isPaid && !isAdmin ? `
                <div class="profile-card upgrade-card">
                    <h3><i class="fas fa-crown"></i> طلب ترقية</h3>
                    <p>قم بترقية حسابك للوصول إلى جميع الدروس المدفوعة</p>
                    <button class="btn btn-primary" onclick="requestUpgrade()">⭐ طلب ترقية</button>
                    <p class="upgrade-note">سيتواصل معك المدير لتأكيد طلبك</p>
                </div>
                ` : ''}

                <!-- الدعم -->
                <div class="profile-card support-card">
                    <h3><i class="fas fa-headset"></i> الدعم</h3>
                    <p>لديك استفسار أو مشكلة؟ تواصل مع الدعم</p>
                    <button class="btn btn-outline" onclick="showSupportForm()">📩 تواصل مع الدعم</button>
                </div>
            </div>
        </div>
    `;
}

// ================================================================
// 11. عرض المحتوى (صفوف، مواد، وحدات، دروس)
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
        <div class="page-header">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('grades')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 class="page-title">${grade.name}</h2>
        </div>
        <div class="subjects-grid">
            ${grade.subjects && grade.subjects.length > 0 ? grade.subjects.map(s => `
                <div class="subject-card" onclick="viewSubject(${grade.id}, ${s.id})">
                    <div class="subject-icon"><i class="fas fa-book"></i></div>
                    <h3>${s.name}</h3>
                    <small>${s.units ? s.units.length : 0} وحدات</small>
                </div>
            `).join('') : '<p class="text-muted">لا توجد مواد في هذا الصف بعد</p>'}
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
        <div class="page-header">
            <button class="btn btn-outline btn-sm" onclick="viewGradeContent(${gradeId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 class="page-title">${subject.name}</h2>
        </div>
        <div class="units-grid">
            ${subject.units && subject.units.length > 0 ? subject.units.map(u => `
                <div class="unit-card" onclick="viewUnit(${gradeId}, ${subject.id}, ${u.id})">
                    <div class="unit-icon"><i class="fas fa-layer-group"></i></div>
                    <h3>${u.name}</h3>
                    <small>${u.lessons ? u.lessons.length : 0} دروس</small>
                    ${u.exam && u.exam.questions && u.exam.questions.length > 0 ? `<span class="exam-badge">📝 امتحان</span>` : ''}
                </div>
            `).join('') : '<p class="text-muted">لا توجد وحدات في هذه المادة بعد</p>'}
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
    const isPaidUser = AppState.currentUser && AppState.currentUser.plan === 'paid';
    const user = AppState.currentUser;

    DOM.mainContent.innerHTML = `
        <div class="page-header">
            <button class="btn btn-outline btn-sm" onclick="viewSubject(${gradeId}, ${subjectId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 class="page-title">${unit.name}</h2>
        </div>
        <div class="lessons-list">
            ${unit.lessons && unit.lessons.length > 0 ? unit.lessons.map(l => {
                const isLocked = l.locked;
                const isCompleted = user && AppState.userProgress && AppState.userProgress[`${gradeId}_${subjectId}_${unitId}_${l.id}`];
                return `
                    <div class="lesson-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}" onclick="${!isLocked ? `viewLesson(${gradeId}, ${subjectId}, ${unitId}, ${l.id})` : 'showLockedMessage()'}">
                        <div class="lesson-left">
                            <div class="lesson-status-icon">${isCompleted ? '✅' : isLocked ? '🔒' : '📖'}</div>
                            <div class="lesson-info">
                                <div class="lesson-title">${l.title}</div>
                                <div class="lesson-meta">
                                    ${l.free ? '<span class="badge-free">🆓 مجاني</span>' : '<span class="badge-paid">⭐ مدفوع</span>'}
                                    ${isCompleted ? '<span class="badge-completed">✓ مكتمل</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <div class="lesson-right">
                            ${l.content && l.content.content ? '<span class="lesson-type">📄 شرح</span>' : ''}
                            ${l.content && l.content.exam && l.content.exam.questions && l.content.exam.questions.length > 0 ? '<span class="lesson-type">📝 امتحان</span>' : ''}
                            ${l.content && l.content.video ? '<span class="lesson-type">🎬 فيديو</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('') : '<p class="text-muted">لا توجد دروس في هذه الوحدة بعد</p>'}
        </div>
        ${unit.exam && unit.exam.questions && unit.exam.questions.length > 0 ? `
            <div class="unit-exam-section">
                <h3>📝 امتحان الوحدة</h3>
                <p>عدد الأسئلة: ${unit.exam.questions.length}</p>
                <button class="btn btn-primary" onclick="startUnitExam(${gradeId}, ${subjectId}, ${unitId})">بدء الامتحان</button>
            </div>
        ` : ''}
    `;
}

// ================================================================
// 12. عرض الدرس
// ================================================================

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

        // التحقق من الوصول
        if (lesson.locked) {
            if (AppState.currentUser && AppState.currentUser.plan === 'free') {
                showToast('هذا الدرس مدفوع. يرجى طلب الترقية للوصول إليه.', 'warning');
                showUpgradePrompt();
                return;
            } else if (!AppState.currentUser) {
                showLoginModal('يجب تسجيل الدخول لمشاهدة هذا الدرس');
                return;
            } else {
                showToast('هذا الدرس غير متاح لك حالياً', 'error');
                return;
            }
        }

        // تحديث تقدم المستخدم (تسجيل أنه بدأ الدرس)
        if (AppState.currentUser && AppState.currentUser.role === 'student') {
            const key = `${gradeId}_${subjectId}_${unitId}_${lessonId}`;
            AppState.userProgress[key] = true;
            // يمكن إرسال تحديث التقدم إلى الخادم هنا
        }

        AppState.currentLessonId = lessonId;
        renderLessonContent(gradeId, subjectId, unitId, lesson);
    } catch (error) {
        console.error('❌ خطأ في تحميل الدرس:', error);
        showToast('حدث خطأ', 'error');
    }
}

function renderLessonContent(gradeId, subjectId, unitId, lesson) {
    const user = AppState.currentUser;
    const canAccessPaid = user && (user.role === 'admin' || user.plan === 'paid');
    const canViewVideo = lesson.free || canAccessPaid;
    const canViewPDF = lesson.free || canAccessPaid;
    const canTakeExam = lesson.free || canAccessPaid;
    const canViewFullContent = lesson.free || canAccessPaid;

    DOM.mainContent.innerHTML = `
        <div class="lesson-page">
            <div class="page-header">
                <button class="btn btn-outline btn-sm" onclick="viewUnit(${gradeId}, ${subjectId}, ${unitId})"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 class="page-title">${lesson.title}</h2>
                <div class="lesson-badges">
                    ${lesson.free ? '<span class="badge-free">🆓 مجاني</span>' : '<span class="badge-paid">⭐ مدفوع</span>'}
                </div>
            </div>

            <div class="lesson-container">
                <!-- فيديو -->
                ${lesson.content && lesson.content.video ? `
                    <div class="lesson-video-section">
                        <h3>🎬 فيديو الشرح</h3>
                        ${canViewVideo ? `
                            <div class="video-container">
                                <iframe src="${lesson.content.video}" frameborder="0" allowfullscreen></iframe>
                            </div>
                        ` : `
                            <div class="locked-content">
                                <i class="fas fa-lock"></i>
                                <p>هذا الفيديو مدفوع. يرجى الترقية للوصول إليه.</p>
                                ${user && user.plan === 'free' ? '<button class="btn btn-sm" onclick="showUpgradePrompt()">⭐ طلب ترقية</button>' : ''}
                            </div>
                        `}
                    </div>
                ` : ''}

                <!-- الشرح النصي -->
                ${lesson.content && lesson.content.content ? `
                    <div class="lesson-text-section">
                        <h3>📄 الشرح النصي</h3>
                        <div class="lesson-text-content">${lesson.content.content}</div>
                        ${canViewPDF ? `
                            <button class="btn btn-sm btn-outline" onclick="downloadLessonPDF(${gradeId}, ${subjectId}, ${unitId}, ${lesson.id})">
                                📥 تحميل الشرح كـ PDF
                            </button>
                        ` : `
                            <div class="locked-content small">
                                <i class="fas fa-lock"></i>
                                <p>تحميل PDF متاح للمشتركين فقط</p>
                            </div>
                        `}
                    </div>
                ` : ''}

                <!-- الأمثلة المحلولة -->
                ${lesson.content && lesson.content.examples ? `
                    <div class="lesson-examples-section">
                        <h3>📝 أمثلة محلولة</h3>
                        <div class="lesson-examples-content">${lesson.content.examples}</div>
                    </div>
                ` : ''}

                <!-- امتحان الدرس -->
                ${lesson.content && lesson.content.exam && lesson.content.exam.questions && lesson.content.exam.questions.length > 0 ? `
                    <div class="lesson-exam-section">
                        <h3>📝 امتحان الدرس</h3>
                        <p>عدد الأسئلة: ${lesson.content.exam.questions.length}</p>
                        ${canTakeExam ? `
                            <button class="btn btn-primary" onclick="startLessonExam(${gradeId}, ${subjectId}, ${unitId}, ${lesson.id})">بدء الامتحان</button>
                        ` : `
                            <div class="locked-content small">
                                <i class="fas fa-lock"></i>
                                <p>الامتحان متاح للمشتركين فقط</p>
                            </div>
                        `}
                    </div>
                ` : ''}

                <!-- أسئلة وأجوبة -->
                <div class="lesson-qa-section">
                    <h3>💬 أسئلة الطلاب</h3>
                    <div id="questionsContainer"></div>
                    ${AppState.currentUser ? `
                        <button class="btn btn-sm btn-outline" onclick="showAddQuestionForm(${gradeId}, ${subjectId}, ${unitId}, ${lesson.id})">➕ اسأل سؤالاً</button>
                    ` : '<p class="text-muted">سجل الدخول لتتمكن من طرح سؤال</p>'}
                </div>
            </div>
        </div>
    `;
    
    // تحميل الأسئلة
    loadQuestions(gradeId, subjectId, unitId, lesson.id);
}

// ================================================================
// 13. دوال الأسئلة والأجوبة
// ================================================================

async function loadQuestions(gradeId, subjectId, unitId, lessonId) {
    try {
        const response = await fetch(`/api/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons/${lessonId}/questions`);
        const questions = await response.json();
        const container = document.getElementById('questionsContainer');
        if (!container) return;
        
        if (questions.length === 0) {
            container.innerHTML = '<p class="text-muted">لا توجد أسئلة بعد. كن أول من يسأل!</p>';
            return;
        }
        
        container.innerHTML = questions.map((q, idx) => `
            <div class="qa-item">
                <div class="qa-question">
                    <div class="qa-meta">
                        <strong>${q.student}</strong>
                        <span class="qa-time">${getTimeAgo(q.createdAt)}</span>
                    </div>
                    <p>${q.question}</p>
                </div>
                ${q.answer ? `
                    <div class="qa-answer">
                        <div class="qa-meta">
                            <strong>${q.answeredBy || 'المدير'}</strong>
                            <span class="qa-time">${q.answeredAt ? getTimeAgo(q.answeredAt) : ''}</span>
                        </div>
                        <p>${q.answer}</p>
                    </div>
                ` : `
                    ${AppState.currentUser && AppState.currentUser.role === 'admin' ? `
                        <button class="btn btn-sm" onclick="answerQuestion(${gradeId}, ${subjectId}, ${unitId}, ${lessonId}, ${idx})">✏️ إجابة</button>
                    ` : '<p class="text-muted">⏳ بانتظار إجابة</p>'}
                `}
            </div>
        `).join('');
    } catch (error) {
        console.error('❌ خطأ في تحميل الأسئلة:', error);
    }
}

function showAddQuestionForm(gradeId, subjectId, unitId, lessonId) {
    if (!AppState.currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    const question = prompt('أدخل سؤالك عن هذا الدرس:');
    if (!question) return;
    
    fetch(`/api/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons/${lessonId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('✅ تم إضافة سؤالك', 'success');
            loadQuestions(gradeId, subjectId, unitId, lessonId);
        } else {
            showToast('❌ ' + (data.error || 'فشل الإضافة'), 'error');
        }
    })
    .catch(() => showToast('حدث خطأ', 'error'));
}

function answerQuestion(gradeId, subjectId, unitId, lessonId, index) {
    const answer = prompt('أدخل إجابتك على هذا السؤال:');
    if (!answer) return;
    
    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons/${lessonId}/questions/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('✅ تمت الإجابة', 'success');
            loadQuestions(gradeId, subjectId, unitId, lessonId);
        } else {
            showToast('❌ ' + (data.error || 'فشل الإجابة'), 'error');
        }
    })
    .catch(() => showToast('حدث خطأ', 'error'));
}

// ================================================================
// 14. الامتحانات
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
                lessonId,
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
                lessonId: null,
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
        <div class="exam-container">
            <div class="page-header">
                <button class="btn btn-outline btn-sm" onclick="viewUnit(${exam.gradeId}, ${exam.subjectId}, ${exam.unitId})"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 class="page-title">📝 الامتحان</h2>
            </div>
            <div class="exam-card">
                <div class="exam-progress">
                    <span>سؤال ${exam.currentIndex + 1} من ${exam.questions.length}</span>
                    <div class="exam-progress-bar">
                        <div class="exam-progress-fill" style="width: ${((exam.currentIndex) / exam.questions.length) * 100}%"></div>
                    </div>
                </div>
                <div class="exam-question">
                    <h3>${q.question}</h3>
                    <div class="exam-options">
                        ${q.options.map((opt, idx) => `
                            <label class="exam-option" onclick="selectExamAnswer(${idx})" id="examOpt${idx}">
                                <input type="radio" name="examAnswer" value="${idx}">
                                <span class="option-text">${opt}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <button class="btn btn-primary" id="examNextBtn" onclick="nextExamQuestion()" disabled>التالي</button>
            </div>
        </div>
    `;
}

function selectExamAnswer(idx) {
    const exam = AppState.currentExam;
    exam.answers[exam.currentIndex] = idx;
    document.querySelectorAll('.exam-option').forEach(el => el.classList.remove('selected'));
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
    
    // حفظ النتيجة في AppState
    const key = `${exam.gradeId}_${exam.subjectId}_${exam.unitId}_${exam.lessonId || 'unit'}`;
    if (!AppState.userScores) AppState.userScores = {};
    if (!AppState.userScores[key]) AppState.userScores[key] = [];
    AppState.userScores[key].push(score);
    
    DOM.mainContent.innerHTML = `
        <div class="exam-result-container">
            <div class="exam-result-card ${passed ? 'passed' : 'failed'}">
                <div class="result-icon">${passed ? '🎉' : '😔'}</div>
                <h2>نتيجة الامتحان</h2>
                <div class="result-score">${score}%</div>
                <p class="result-message">${passed ? 'أحسنت! اجتزت الامتحان بنجاح' : 'لم تجتز الامتحان، حاول مرة أخرى'}</p>
                <div class="result-details">
                    <p>الإجابات الصحيحة: ${correct} من ${exam.questions.length}</p>
                </div>
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="viewUnit(${exam.gradeId}, ${exam.subjectId}, ${exam.unitId})">العودة للوحدة</button>
                    <button class="btn btn-outline" onclick="retryExam()">🔄 إعادة المحاولة</button>
                </div>
            </div>
        </div>
    `;
}

function retryExam() {
    const exam = AppState.currentExam;
    if (exam.type === 'lesson') {
        startLessonExam(exam.gradeId, exam.subjectId, exam.unitId, exam.lessonId);
    } else {
        startUnitExam(exam.gradeId, exam.subjectId, exam.unitId);
    }
}

// ================================================================
// 15. تنزيل PDF
// ================================================================

function downloadLessonPDF(gradeId, subjectId, unitId, lessonId) {
    // في النسخة الكاملة، سيتم إنشاء PDF على الخادم
    showToast('جاري تحضير ملف PDF...', 'info');
    // يمكن إضافة رابط تحميل حقيقي هنا
    window.open(`/api/lesson-pdf/${gradeId}/${subjectId}/${unitId}/${lessonId}`, '_blank');
}

// ================================================================
// 16. عرض طلب الترقية للمستخدم المجاني
// ================================================================

function showUpgradePrompt() {
    if (!AppState.currentUser) {
        showLoginModal('يجب تسجيل الدخول أولاً');
        return;
    }
    if (AppState.currentUser.plan === 'paid') {
        showToast('أنت بالفعل مشترك في الخطة المدفوعة', 'info');
        return;
    }
    if (confirm('⚠️ هذا المحتوى مدفوع. هل تريد طلب الترقية الآن؟')) {
        requestUpgrade();
    }
}

function showSupportForm() {
    if (!AppState.currentUser) {
        showLoginModal('يجب تسجيل الدخول أولاً');
        return;
    }
    const message = prompt('أدخل رسالتك للدعم:');
    if (!message) return;
    // في النسخة الكاملة، سيتم إرسال الرسالة إلى الخادم
    showToast('✅ تم إرسال رسالتك، سيتم الرد عليك قريباً', 'success');
}

// ================================================================
// 17. إدارة المستخدمين (Admin - Users Management)
// ================================================================

async function renderAdminUsers() {
    if (!ensureAdmin()) return;

    try {
        const isValid = await checkSessionValidity();
        if (!isValid) return;

        const response = await fetch('/api/admin/users');
        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const users = await response.json();
        AppState.allUsers = users;

        // جلب طلبات الترقية
        const upgradeResponse = await fetch('/api/upgrade-requests');
        let upgradeRequests = [];
        if (upgradeResponse.ok) {
            upgradeRequests = await upgradeResponse.json();
            AppState.upgradeRequests = upgradeRequests;
        }

        DOM.mainContent.innerHTML = `
            <div class="admin-page">
                <div class="page-header">
                    <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
                    <h2 class="page-title">👑 إدارة المستخدمين</h2>
                </div>

                <!-- إحصائيات -->
                <div class="admin-stats">
                    <div class="admin-stat-card">
                        <span class="stat-number">${users.length}</span>
                        <span class="stat-label">إجمالي المستخدمين</span>
                    </div>
                    <div class="admin-stat-card">
                        <span class="stat-number">${users.filter(u => u.plan === 'paid').length}</span>
                        <span class="stat-label">مستخدمين مدفوعين</span>
                    </div>
                    <div class="admin-stat-card">
                        <span class="stat-number">${upgradeRequests.filter(r => r.status === 'pending').length}</span>
                        <span class="stat-label">طلبات ترقية معلقة</span>
                    </div>
                    <div class="admin-stat-card">
                        <span class="stat-number">${users.filter(u => u.banned).length}</span>
                        <span class="stat-label">مستخدمين محظورين</span>
                    </div>
                </div>

                <!-- البحث والفلترة -->
                <div class="admin-controls">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="userSearchInput" placeholder="🔍 بحث عن مستخدم..." oninput="filterUsers()" />
                    </div>
                    <div class="filter-buttons">
                        <button class="btn btn-sm btn-outline" onclick="filterUsers('all')">الكل</button>
                        <button class="btn btn-sm btn-outline" onclick="filterUsers('paid')">مدفوع</button>
                        <button class="btn btn-sm btn-outline" onclick="filterUsers('free')">مجاني</button>
                        <button class="btn btn-sm btn-outline" onclick="filterUsers('banned')">محظور</button>
                        <button class="btn btn-sm btn-outline" onclick="filterUsers('pending')">معلق</button>
                    </div>
                    <button class="btn btn-sm" onclick="renderAdminUsers()">🔄 تحديث</button>
                </div>

                <!-- جدول المستخدمين -->
                <div class="admin-table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>المستخدم</th>
                                <th>البريد</th>
                                <th>الهاتف</th>
                                <th>الخطة</th>
                                <th>نهاية الاشتراك</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            ${users.map((u, idx) => `
                                <tr id="userRow-${u._id}">
                                    <td>${idx + 1}</td>
                                    <td><strong>${u.username}</strong></td>
                                    <td>${u.email}</td>
                                    <td>${u.phone || '—'}</td>
                                    <td>${u.plan === 'paid' ? '⭐ مدفوع' : '🆓 مجاني'}</td>
                                    <td>${u.subscriptionEnd ? formatDate(u.subscriptionEnd) : '—'}</td>
                                    <td>${u.banned ? '🚫 محظور' : (u.approved ? '✅ مفعل' : '⏳ معلق')}</td>
                                    <td class="actions-cell">
                                        <button class="btn btn-sm" onclick="viewUserDetails('${u._id}')" title="عرض التفاصيل">👁️</button>
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

                <!-- طلبات الترقية -->
                <div class="upgrade-requests-section">
                    <h3>⬆️ طلبات الترقية</h3>
                    <div id="upgradeRequestsContainer"></div>
                </div>
            </div>
        `;

        // تحميل طلبات الترقية
        loadUpgradeRequests();
    } catch (error) {
        console.error('❌ خطأ في تحميل المستخدمين:', error);
        showToast('حدث خطأ في تحميل المستخدمين', 'error');
        DOM.mainContent.innerHTML = '<p class="text-danger">حدث خطأ في تحميل المستخدمين</p>';
    }
}

// ================================================================
// 18. طلبات الترقية (للمشرف)
// ================================================================

async function loadUpgradeRequests() {
    try {
        const response = await fetch('/api/upgrade-requests');
        if (response.status === 401 || response.status === 403) {
            return;
        }
        const requests = await response.json();
        AppState.upgradeRequests = requests;
        const container = document.getElementById('upgradeRequestsContainer');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = '<p class="text-muted">لا توجد طلبات ترقية</p>';
            return;
        }

        container.innerHTML = `
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th>الاسم الكامل</th>
                            <th>الهاتف</th>
                            <th>المدة</th>
                            <th>الصفوف المختارة</th>
                            <th>تاريخ الطلب</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${requests.map(r => `
                            <tr>
                                <td><strong>${r.username}</strong></td>
                                <td>${r.fullName || '—'}</td>
                                <td>${r.phone || '—'}</td>
                                <td>${r.duration || '—'}</td>
                                <td>${r.selectedGrades && r.selectedGrades.length > 0 ? r.selectedGrades.join(', ') : '—'}</td>
                                <td>${formatDate(r.createdAt)}</td>
                                <td>${r.status === 'pending' ? '⏳ معلق' : r.status === 'approved' ? '✅ مقبول' : '❌ مرفوض'}</td>
                                <td class="actions-cell">
                                    ${r.status === 'pending' ? `
                                        <button class="btn btn-sm" onclick="showApproveUpgradeForm('${r.username}')" title="قبول">✅ قبول</button>
                                        <button class="btn btn-sm btn-danger" onclick="rejectUpgradeRequest('${r.username}')" title="رفض">❌ رفض</button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('❌ خطأ في تحميل طلبات الترقية:', error);
        const container = document.getElementById('upgradeRequestsContainer');
        if (container) {
            container.innerHTML = '<p class="text-danger">حدث خطأ في تحميل الطلبات</p>';
        }
    }
}

function showApproveUpgradeForm(username) {
    if (!ensureAdmin()) return;
    
    const duration = prompt('اختر مدة الاشتراك (بالأشهر):\n1 - شهر واحد\n3 - 3 أشهر\n6 - 6 أشهر\n12 - سنة', '1');
    if (duration === null) return;
    const months = parseInt(duration);
    if (![1, 3, 6, 12].includes(months)) {
        showToast('يرجى اختيار مدة صحيحة (1، 3، 6، 12)', 'error');
        return;
    }
    
    if (!confirm(`هل تريد الموافقة على طلب ترقية المستخدم ${username} لمدة ${months} شهراً؟`)) return;
    approveUpgradeRequest(username, months);
}

async function approveUpgradeRequest(username, months = 12) {
    if (!ensureAdmin()) return;
    
    try {
        const response = await fetch('/api/upgrade-request/approve', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, duration: months })
        });
        
        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.message) {
            showToast(`✅ ${data.message}`, 'success');
            renderAdminUsers();
        } else {
            showToast('❌ ' + (data.error || 'فشل الموافقة'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في الموافقة على الترقية:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

async function rejectUpgradeRequest(username) {
    if (!ensureAdmin()) return;
    if (!confirm(`هل تريد رفض طلب ترقية المستخدم ${username}؟`)) return;
    
    try {
        const response = await fetch(`/api/upgrade-request/${username}`, { method: 'DELETE' });
        
        if (response.status === 401 || response.status === 403) {
            showToast('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'error');
            logout();
            return;
        }

        const data = await response.json();
        if (data.success) {
            showToast('✅ تم رفض الطلب', 'success');
            renderAdminUsers();
        } else {
            showToast('❌ ' + (data.error || 'فشل الرفض'), 'error');
        }
    } catch (error) {
        console.error('❌ خطأ في رفض طلب الترقية:', error);
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

// ================================================================
// 19. عرض تفاصيل المستخدم
// ================================================================

function viewUserDetails(userId) {
    if (!ensureAdmin()) return;
    
    const user = AppState.allUsers.find(u => u._id === userId);
    if (!user) {
        showToast('المستخدم غير موجود', 'error');
        return;
    }

    // جلب تقدم المستخدم
    fetch(`/api/user-progress/${user.username}`)
        .then(res => res.json())
        .then(progress => {
            const completedLessons = progress ? Object.values(progress).filter(v => v === true).length : 0;
            
            DOM.mainContent.innerHTML = `
                <div class="admin-page">
                    <div class="page-header">
                        <button class="btn btn-outline btn-sm" onclick="renderAdminUsers()"><i class="fas fa-arrow-right"></i> العودة</button>
                        <h2 class="page-title">👤 تفاصيل المستخدم: ${user.username}</h2>
                    </div>
                    
                    <div class="user-details-grid">
                        <div class="user-detail-card">
                            <h3>معلومات الحساب</h3>
                            <div class="detail-row"><strong>اسم المستخدم:</strong> ${user.username}</div>
                            <div class="detail-row"><strong>البريد الإلكتروني:</strong> ${user.email}</div>
                            <div class="detail-row"><strong>رقم الهاتف:</strong> ${user.phone || 'غير مضاف'}</div>
                            <div class="detail-row"><strong>الخطة:</strong> ${user.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</div>
                            <div class="detail-row"><strong>نهاية الاشتراك:</strong> ${user.subscriptionEnd ? formatDate(user.subscriptionEnd) : '—'}</div>
                            <div class="detail-row"><strong>الحالة:</strong> ${user.banned ? '🚫 محظور' : '✅ مفعل'}</div>
                            <div class="detail-row"><strong>تاريخ التسجيل:</strong> ${formatDate(user.createdAt)}</div>
                        </div>
                        
                        <div class="user-detail-card">
                            <h3>تقدم المستخدم</h3>
                            <div class="progress-summary">
                                <div class="progress-item">
                                    <span>الدروس المكتملة</span>
                                    <span class="progress-value">${completedLessons}</span>
                                </div>
                                <div class="progress-item">
                                    <span>متوسط الدرجات</span>
                                    <span class="progress-value">${getAverageScore(user)}%</span>
                                </div>
                                <div class="progress-item">
                                    <span>الشارات</span>
                                    <span class="progress-value">${getBadgesCount(user)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-detail-card">
                            <h3>الصفوف المشترك بها</h3>
                            <div class="user-grades-list">
                                ${user.selectedGrades && user.selectedGrades.length > 0 ? 
                                    user.selectedGrades.map(gid => {
                                        const grade = AppState.allGrades.find(g => g.id === gid);
                                        return `<span class="grade-tag">${grade ? grade.name : `الصف ${gid}`}</span>`;
                                    }).join('') 
                                    : '<p class="text-muted">لم يختار أي صف بعد</p>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(() => {
            showToast('حدث خطأ في تحميل تقدم المستخدم', 'error');
        });
}

// ================================================================
// 20. دوال إدارة المستخدمين الأخرى
// ================================================================

function filterUsers(filter = 'all') {
    const query = document.getElementById('userSearchInput')?.value?.toLowerCase() || '';
    const rows = document.querySelectorAll('#usersTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const userPlan = row.querySelector('td:nth-child(5)')?.textContent?.includes('مدفوع') ? 'paid' : 'free';
        const userStatus = row.querySelector('td:nth-child(7)')?.textContent?.includes('محظور') ? 'banned' : 'active';
        const userApproved = row.querySelector('td:nth-child(7)')?.textContent?.includes('معلق') ? 'pending' : 'active';
        
        let show = true;
        if (filter === 'paid' && userPlan !== 'paid') show = false;
        if (filter === 'free' && userPlan !== 'free') show = false;
        if (filter === 'banned' && userStatus !== 'banned') show = false;
        if (filter === 'pending' && userApproved !== 'pending') show = false;
        if (query && !text.includes(query)) show = false;
        
        row.style.display = show ? '' : 'none';
    });
}

async function editUser(userId) {
    if (!ensureAdmin()) return;
    
    const user = AppState.allUsers.find(u => u._id === userId);
    if (!user) return;

    const fields = [
        { key: 'username', label: 'اسم المستخدم', value: user.username },
        { key: 'email', label: 'البريد الإلكتروني', value: user.email },
        { key: 'phone', label: 'رقم الهاتف', value: user.phone || '' },
        { key: 'password', label: 'كلمة المرور الجديدة (اتركها فارغة للإبقاء على القديمة)', value: '' }
    ];

    let newData = {};
    for (const field of fields) {
        const val = prompt(`${field.label}:`, field.value);
        if (val === null) return;
        if (field.key === 'password' && val.trim()) {
            newData[field.key] = val.trim();
        } else if (field.key !== 'password') {
            newData[field.key] = val.trim();
        }
    }

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
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

    const duration = prompt('اختر مدة الاشتراك (بالأشهر):\n1 - شهر واحد\n3 - 3 أشهر\n6 - 6 أشهر\n12 - سنة', '1');
    if (duration === null) return;
    const months = parseInt(duration);
    if (![1, 3, 6, 12].includes(months)) {
        showToast('يرجى اختيار مدة صحيحة (1، 3، 6، 12)', 'error');
        return;
    }

    const gradeOptions = AppState.allGrades.map(g => `${g.id}: ${g.name}`).join('\n');
    const gradesInput = prompt(`أدخل أرقام الصفوف التي يريد الاشتراك بها (مفصولة بفواصل):\n${gradeOptions}`, '');
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
        const duration = prompt('المدة بالأشهر (1,3,6,12):', '1');
        if (!duration) return;
        const months = parseInt(duration);
        if (![1, 3, 6, 12].includes(months)) {
            showToast('مدة غير صحيحة', 'error');
            return;
        }
        const gradeOptions = AppState.allGrades.map(g => `${g.id}: ${g.name}`).join('\n');
        const gradesInput = prompt(`أرقام الصفوف (مفصولة بفواصل):\n${gradeOptions}`, '');
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
// 21. إدارة المحتوى (Admin - Content Management)
// ================================================================

async function renderAdminContent() {
    if (!ensureAdmin()) return;

    DOM.mainContent.innerHTML = `
        <div class="admin-page">
            <div class="page-header">
                <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 class="page-title">📚 إدارة المحتوى</h2>
            </div>

            <div class="admin-controls">
                <button class="btn" onclick="showAddGrade()">➕ إضافة صف</button>
                <button class="btn btn-outline" onclick="renderAdminContent()">🔄 تحديث</button>
            </div>

            <div id="adminContentTree" class="admin-content-tree"></div>
        </div>
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
                <div class="content-grade-card">
                    <div class="content-grade-header">
                        <h3>📚 ${g.name}</h3>
                        <div class="content-actions">
                            <button class="btn btn-sm" onclick="showAddSubject(${g.id})">➕ مادة</button>
                            <button class="btn btn-sm btn-outline" onclick="editGrade(${g.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteGrade(${g.id})">🗑️</button>
                        </div>
                    </div>
                    <div class="content-subjects">
                        ${g.subjects && g.subjects.length > 0 ? g.subjects.map(s => `
                            <div class="content-subject-item">
                                <div class="content-subject-header">
                                    <strong>📘 ${s.name}</strong>
                                    <div class="content-actions">
                                        <button class="btn btn-sm" onclick="showAddUnit(${g.id}, ${s.id})">➕ وحدة</button>
                                        <button class="btn btn-sm btn-outline" onclick="editSubject(${g.id}, ${s.id})">✏️</button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteSubject(${g.id}, ${s.id})">🗑️</button>
                                    </div>
                                </div>
                                <div class="content-units">
                                    ${s.units && s.units.length > 0 ? s.units.map(u => `
                                        <div class="content-unit-item">
                                            <div class="content-unit-header">
                                                <span>📂 ${u.name}</span>
                                                <div class="content-actions">
                                                    <button class="btn btn-sm" onclick="showAddLesson(${g.id}, ${s.id}, ${u.id})">➕ درس</button>
                                                    <button class="btn btn-sm" onclick="editUnitExam(${g.id}, ${s.id}, ${u.id})">📝 امتحان</button>
                                                    <button class="btn btn-sm btn-outline" onclick="editUnit(${g.id}, ${s.id}, ${u.id})">✏️</button>
                                                    <button class="btn btn-sm btn-danger" onclick="deleteUnit(${g.id}, ${s.id}, ${u.id})">🗑️</button>
                                                </div>
                                            </div>
                                            <div class="content-lessons">
                                                ${u.lessons && u.lessons.length > 0 ? u.lessons.map(l => `
                                                    <div class="content-lesson-item">
                                                        <span>📖 ${l.title} ${l.free ? '🆓' : '⭐'}</span>
                                                        <div class="content-actions">
                                                            <button class="btn btn-sm btn-outline" onclick="editLessonContent(${g.id}, ${s.id}, ${u.id}, ${l.id})">✏️</button>
                                                            <button class="btn btn-sm btn-danger" onclick="deleteLesson(${g.id}, ${s.id}, ${u.id}, ${l.id})">🗑️</button>
                                                        </div>
                                                    </div>
                                                `).join('') : '<p class="text-muted" style="padding:5px 10px;">لا توجد دروس</p>'}
                                            </div>
                                        </div>
                                    `).join('') : '<p class="text-muted" style="padding:5px 10px;">لا توجد وحدات</p>'}
                                </div>
                            </div>
                        `).join('') : '<p class="text-muted" style="padding:5px 10px;">لا توجد مواد</p>'}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error('❌ خطأ في تحميل شجرة المحتوى:', error);
        showToast('حدث خطأ في تحميل المحتوى', 'error');
    }
}

// ================================================================
// 22. دوال إدارة المحتوى - الصفوف
// ================================================================

async function showAddGrade() {
    if (!ensureAdmin()) return;

    const name = prompt('أدخل اسم الصف الجديد (مثل: الصف الثالث):');
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
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الصف وجميع محتوياته نهائياً؟')) return;
    
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

// ================================================================
// 23. دوال إدارة المحتوى - المواد
// ================================================================

async function showAddSubject(gradeId) {
    if (!ensureAdmin()) return;

    const name = prompt('أدخل اسم المادة الجديدة (مثل: فيزياء):');
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
    if (!confirm('⚠️ حذف هذه المادة وجميع محتوياتها؟')) return;
    
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

// ================================================================
// 24. دوال إدارة المحتوى - الوحدات
// ================================================================

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
    if (!confirm('⚠️ حذف هذه الوحدة وجميع دروسها؟')) return;
    
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

// ================================================================
// 25. دوال إدارة المحتوى - الدروس
// ================================================================

async function showAddLesson(gradeId, subjectId, unitId) {
    if (!ensureAdmin()) return;

    const title = prompt('عنوان الدرس:');
    if (!title) return;
    
    const video = prompt('رابط الفيديو (YouTube embed URL):', '');
    const content = prompt('الشرح النصي (HTML مسموح):', '');
    const examples = prompt('الأمثلة المحلولة (HTML):', '');
    const free = confirm('هل هذا الدرس مجاني؟ (موافق = مجاني، إلغاء = مدفوع)');
    
    const examQuestionCount = prompt('كم سؤالاً تريد إضافته في امتحان هذا الدرس؟ (0 = لا يوجد امتحان)', '0');
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
    if (!confirm('⚠️ حذف هذا الدرس نهائياً؟')) return;
    
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
// 26. تسجيل الدخول والتسجيل (Login & Register)
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
            <label>
                <input type="checkbox" value="${g.id}" class="grade-checkbox" /> ${g.name}
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
// 27. البحث
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
// 28. أحداث عامة وبدء التطبيق
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
// 29. جعل الدوال عالمية (للاستخدام في HTML)
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
window.viewUserDetails = viewUserDetails;
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
window.requestUpgrade = requestUpgrade;
window.approveUpgradeRequest = approveUpgradeRequest;
window.rejectUpgradeRequest = rejectUpgradeRequest;
window.loadUpgradeRequests = loadUpgradeRequests;
window.showApproveUpgradeForm = showApproveUpgradeForm;
window.showUpgradePrompt = showUpgradePrompt;
window.showSupportForm = showSupportForm;
window.downloadLessonPDF = downloadLessonPDF;
window.retryExam = retryExam;
window.answerQuestion = answerQuestion;
window.showAddQuestionForm = showAddQuestionForm;