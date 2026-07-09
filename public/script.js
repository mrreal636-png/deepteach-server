// ============================================================
// DeepTeach - script.js (النسخة النهائية المتكاملة)
// ============================================================

// ========== المتغيرات العامة ==========
let currentUser = null;
let allGrades = [];
let currentGradeId = null, currentSubjectId = null, currentUnitId = null;
let allUsers = [];
let adminActiveTab = 'users';
let currentExam = { questions: [], currentIndex: 0, answers: [], gradeId: null, subjectId: null, unitId: null };

// ========== عناصر DOM ==========
const mainContent = document.getElementById('mainContent');
const sidebar = document.getElementById('mainSidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const authButtonsTop = document.getElementById('authButtonsTop');
const userInfoTop = document.getElementById('userInfoTop');
const userDisplayTop = document.getElementById('userDisplayTop');
const sidebarUserInfo = document.getElementById('sidebarUserInfo');
const backToTop = document.getElementById('backToTop');
const navLinks = document.querySelectorAll('.sidebar-link');

// ====== تبديل الشريط الجانبي (للجوال) ======
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}
// إغلاق الشريط عند الضغط على رابط
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) sidebar.classList.remove('open');
    });
});

// ====== تحديث الروابط النشطة ======
function setActiveLink(page) {
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
}

// ====== التنقل بين الصفحات ======
function navigateTo(page, data = null) {
    setActiveLink(page);
    switch(page) {
        case 'home': renderHome(); break;
        case 'grades': renderGrades(); break;
        case 'about': renderAbout(); break;
        case 'profile': renderProfile(); break;
        case 'admin-users': renderAdminUsers(); break;
        case 'admin-content': renderAdminContent(); break;
        default: renderHome();
    }
    // تمرير للأعلى
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// ========== إدارة الجلسة والمستخدم ==========
// ============================================================

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

function updateUIForUser() {
    if (currentUser) {
        authButtonsTop.style.display = 'none';
        userInfoTop.style.display = 'flex';
        userDisplayTop.textContent = currentUser.username + (currentUser.role === 'admin' ? ' 👑' : '');
        sidebarUserInfo.textContent = currentUser.username + (currentUser.role === 'admin' ? ' (مشرف)' : '');
        document.getElementById('profileNavLi').style.display = 'block';
        if (currentUser.role === 'admin') {
            document.getElementById('adminUsersLi').style.display = 'block';
            document.getElementById('adminContentLi').style.display = 'block';
        } else {
            document.getElementById('adminUsersLi').style.display = 'none';
            document.getElementById('adminContentLi').style.display = 'none';
        }
    } else {
        authButtonsTop.style.display = 'flex';
        userInfoTop.style.display = 'none';
        userDisplayTop.textContent = '';
        sidebarUserInfo.textContent = 'زائر';
        document.getElementById('profileNavLi').style.display = 'none';
        document.getElementById('adminUsersLi').style.display = 'none';
        document.getElementById('adminContentLi').style.display = 'none';
    }
}

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

// ============================================================
// ========== الصفحات العامة والعرض ==========
// ============================================================

function renderHome() {
    if (!currentUser) {
        renderPublicHome();
        return;
    }
    mainContent.innerHTML = `
        <div class="glass-card" style="margin-bottom:20px;">
            <h2>مرحباً ${currentUser.username} 👋</h2>
            <p style="color:var(--text-secondary);">خطتك: <strong style="color:${currentUser.plan === 'paid' ? 'var(--gold)' : 'var(--text-muted)'}">${currentUser.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</strong></p>
            ${currentUser.plan === 'paid' && currentUser.subscriptionEnd ? `<p style="color:var(--text-secondary);">ينتهي الاشتراك: ${new Date(currentUser.subscriptionEnd).toLocaleDateString('ar-EG')}</p>` : ''}
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:15px;">
                <button class="btn" onclick="navigateTo('grades')">استعراض الصفوف</button>
                <button class="btn btn-outline" onclick="navigateTo('profile')">حسابي</button>
            </div>
        </div>
        <h3>صفوفك الدراسية</h3>
        <div id="gradesGrid" class="grades-grid"></div>
    `;
    loadUserGrades();
}

function renderPublicHome() {
    mainContent.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:40px 20px;">
            <h1>مرحباً بك في <span style="color:var(--gold);">DeepTeach</span></h1>
            <p style="color:var(--text-secondary); font-size:1.1rem; max-width:600px; margin:0 auto;">منصة التعلم العميق التي تتيح لك اكتساب المعرفة بطريقة منظمة وتفاعلية</p>
            <div style="display:flex; gap:15px; justify-content:center; flex-wrap:wrap; margin-top:20px;">
                <button class="btn" onclick="showLoginModal()">ابدأ الآن</button>
                <button class="btn btn-outline" onclick="showRegisterModal()">سجل مجاناً</button>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:20px; margin:20px 0;">
            <div class="glass-card"><i class="fas fa-book-open" style="font-size:2rem; color:var(--gold);"></i><h3>دروس منظمة</h3><p style="color:var(--text-muted);">محتوى مرتب حسب الصفوف والمواد</p></div>
            <div class="glass-card"><i class="fas fa-video" style="font-size:2rem; color:var(--gold);"></i><h3>شروحات فيديو</h3><p style="color:var(--text-muted);">دروس مصورة مع أمثلة محلولة</p></div>
            <div class="glass-card"><i class="fas fa-crown" style="font-size:2rem; color:var(--gold);"></i><h3>محتوى مدفوع ومجاني</h3><p style="color:var(--text-muted);">اختر الخطة المناسبة لك</p></div>
        </div>
        <h2>استكشف الصفوف</h2>
        <div id="gradesGrid" class="grades-grid"></div>
    `;
    loadGradesForPublic();
}

function renderAbout() {
    mainContent.innerHTML = `
        <h2>عن منصة DeepTeach</h2>
        <div class="glass-card" style="max-width:800px; margin:0 auto;">
            <p style="font-size:1.1rem; line-height:2;">DeepTeach هي منصة تعليمية تفاعلية تهدف إلى تسهيل عملية التعلم للطلاب.</p>
            <ul style="list-style:none; padding:0; margin-top:20px;">
                <li style="margin:10px 0;">✅ دروس مصورة ونصوص تفاعلية</li>
                <li style="margin:10px 0;">✅ امتحانات فورية مع تقييم ذاتي</li>
                <li style="margin:10px 0;">✅ نظام نقاط وشارات تحفيزي</li>
                <li style="margin:10px 0;">✅ خطط مجانية ومدفوعة حسب احتياجك</li>
            </ul>
        </div>
    `;
}

function renderProfile() {
    if (!currentUser) { showLoginModal(); return; }
    mainContent.innerHTML = `
        <div class="glass-card" style="max-width:500px; margin:0 auto;">
            <h2>حسابي</h2>
            <p><strong>اسم المستخدم:</strong> ${currentUser.username}</p>
            <p><strong>البريد الإلكتروني:</strong> ${currentUser.email}</p>
            <p><strong>رقم الهاتف:</strong> ${currentUser.phone || 'غير مضاف'}</p>
            <p><strong>الخطة:</strong> ${currentUser.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</p>
            ${currentUser.plan === 'paid' && currentUser.subscriptionEnd ? `<p><strong>ينتهي الاشتراك:</strong> ${new Date(currentUser.subscriptionEnd).toLocaleDateString('ar-EG')}</p>` : ''}
            <p><strong>الدور:</strong> ${currentUser.role === 'admin' ? 'مشرف' : 'طالب'}</p>
            ${currentUser.selectedGrades && currentUser.selectedGrades.length > 0 ? `<p><strong>الصفوف المشترك بها:</strong> ${currentUser.selectedGrades.join(', ')}</p>` : ''}
            <button class="btn btn-outline" onclick="navigateTo('home')" style="margin-top:15px;">العودة</button>
        </div>
    `;
}

// ============================================================
// ========== تحميل الصفوف والعرض ==========
// ============================================================

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
    } catch (error) { console.error(error); }
}

function viewGradePublic(gradeId) {
    if (currentUser) {
        viewGradeContent(gradeId);
    } else {
        showLoginModal('يجب تسجيل الدخول لمشاهدة المحتوى');
    }
}

async function loadUserGrades() {
    try {
        const res = await fetch('/api/grades');
        const grades = await res.json();
        allGrades = grades;
        const grid = document.getElementById('gradesGrid');
        if (!grid) return;
        let available = grades;
        if (currentUser.role !== 'admin' && currentUser.plan === 'paid') {
            available = grades.filter(g => currentUser.selectedGrades.includes(g.id));
        }
        grid.innerHTML = available.map(g => `
            <div class="grade-card" onclick="viewGradeContent(${g.id})">
                <div class="grade-num">${g.id}</div>
                <div class="grade-label">${g.name}</div>
                <small style="color:var(--text-muted);">${g.subjects ? g.subjects.length : 0} مواد</small>
            </div>
        `).join('');
        if (available.length === 0) grid.innerHTML = '<p class="text-muted">لا توجد صفوف متاحة</p>';
    } catch (error) { console.error(error); }
}

function renderGrades() {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">الصفوف الدراسية</h2>
        </div>
        <div id="gradesGrid" class="grades-grid"></div>
    `;
    if (currentUser) loadUserGrades(); else loadGradesForPublic();
}

// ============================================================
// ========== عرض المحتوى (صفوف، مواد، وحدات، دروس) ==========
// ============================================================

async function viewGradeContent(gradeId) {
    try {
        const res = await fetch(`/api/grades/${gradeId}/content`);
        const data = await res.json();
        if (data.error) { alert(data.error); return; }
        currentGradeId = gradeId;
        renderGradeContent(data);
    } catch (error) { alert('حدث خطأ'); }
}

function renderGradeContent(grade) {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('grades')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${grade.name}</h2>
        </div>
        ${grade.subjects && grade.subjects.length > 0 ? grade.subjects.map(s => `
            <div class="subject-card" onclick="viewSubject(${grade.id}, ${s.id})">
                <h3>${s.name}</h3>
                <small style="color:var(--text-muted);">${s.units ? s.units.length : 0} وحدات</small>
            </div>
        `).join('') : '<p class="text-muted">لا توجد مواد</p>'}
    `;
}

async function viewSubject(gradeId, subjectId) {
    try {
        const res = await fetch(`/api/grades/${gradeId}/content`);
        const data = await res.json();
        const subject = data.subjects.find(s => s.id === subjectId);
        if (!subject) { alert('المادة غير موجودة'); return; }
        currentSubjectId = subjectId;
        renderSubjectContent(gradeId, subject);
    } catch (error) { alert('حدث خطأ'); }
}

function renderSubjectContent(gradeId, subject) {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="viewGradeContent(${gradeId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${subject.name}</h2>
        </div>
        ${subject.units && subject.units.length > 0 ? subject.units.map(u => `
            <div class="unit-card" onclick="viewUnit(${gradeId}, ${subject.id}, ${u.id})">
                <h3>${u.name}</h3>
                <small style="color:var(--text-muted);">${u.lessons ? u.lessons.length : 0} دروس</small>
                ${u.exam && u.exam.questions && u.exam.questions.length > 0 ? `<span style="color:var(--gold);">📝 امتحان</span>` : ''}
            </div>
        `).join('') : '<p class="text-muted">لا توجد وحدات</p>'}
    `;
}

async function viewUnit(gradeId, subjectId, unitId) {
    try {
        const res = await fetch(`/api/grades/${gradeId}/content`);
        const data = await res.json();
        const subject = data.subjects.find(s => s.id === subjectId);
        if (!subject) return;
        const unit = subject.units.find(u => u.id === unitId);
        if (!unit) return;
        currentUnitId = unitId;
        renderUnitContent(gradeId, subjectId, unit);
    } catch (error) { alert('حدث خطأ'); }
}

function renderUnitContent(gradeId, subjectId, unit) {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="viewSubject(${gradeId}, ${subjectId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${unit.name}</h2>
        </div>
        ${unit.lessons && unit.lessons.length > 0 ? unit.lessons.map(l => `
            <div class="lesson-card" onclick="viewLesson(${gradeId}, ${subjectId}, ${unit.id}, ${l.id})">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap;">
                    <h4>${l.title}</h4>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        ${l.locked ? '<span style="color:var(--danger);">🔒 مقفل</span>' : '<span style="color:var(--success);">✅ متاح</span>'}
                        ${l.free ? '<span style="color:var(--text-muted); font-size:0.8rem;">🆓 مجاني</span>' : '<span style="color:var(--gold); font-size:0.8rem;">⭐ مدفوع</span>'}
                    </div>
                </div>
                <small style="color:var(--text-muted);">${l.content ? '📄 شرح' : ''} ${l.exam && l.exam.questions.length > 0 ? '📝 امتحان' : ''}</small>
            </div>
        `).join('') : '<p class="text-muted">لا توجد دروس</p>'}
        ${unit.exam && unit.exam.questions && unit.exam.questions.length > 0 ? `
            <div style="margin-top:20px; padding:15px; background:var(--glass-bg); border-radius:var(--radius); border:1px solid var(--glass-border);">
                <h3>📝 امتحان الوحدة (${unit.exam.questions.length} سؤال)</h3>
                <button class="btn" onclick="startUnitExam(${gradeId}, ${subjectId}, ${unit.id})">بدء الامتحان</button>
            </div>
        ` : ''}
    `;
}

async function viewLesson(gradeId, subjectId, unitId, lessonId) {
    try {
        const res = await fetch(`/api/grades/${gradeId}/content`);
        const data = await res.json();
        const subject = data.subjects.find(s => s.id === subjectId);
        if (!subject) return;
        const unit = subject.units.find(u => u.id === unitId);
        if (!unit) return;
        const lesson = unit.lessons.find(l => l.id === lessonId);
        if (!lesson) return;
        if (lesson.locked) { alert('هذا الدرس مقفل. يرجى الترقية.'); return; }
        renderLessonContent(gradeId, subjectId, unitId, lesson);
    } catch (error) { alert('حدث خطأ'); }
}

function renderLessonContent(gradeId, subjectId, unitId, lesson) {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="viewUnit(${gradeId}, ${subjectId}, ${unitId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${lesson.title}</h2>
            ${lesson.free ? '<span style="color:var(--text-muted);">🆓 مجاني</span>' : '<span style="color:var(--gold);">⭐ مدفوع</span>'}
        </div>
        <div class="lesson-container">
            ${lesson.content && lesson.content.video ? `<div class="video-container"><iframe src="${lesson.content.video}" frameborder="0" allowfullscreen></iframe></div>` : ''}
            ${lesson.content && lesson.content.content ? `<div class="lesson-text"><h3>الشرح النصي</h3><div>${lesson.content.content}</div></div>` : ''}
            ${lesson.content && lesson.content.examples ? `<div class="lesson-examples"><h3>أمثلة محلولة</h3><div>${lesson.content.examples}</div></div>` : ''}
            ${lesson.content && lesson.content.exam && lesson.content.exam.questions.length > 0 ? `
                <div style="padding:15px; background:var(--glass-bg); border-radius:var(--radius); border:1px solid var(--glass-border); margin-top:15px;">
                    <h3>📝 امتحان الدرس (${lesson.content.exam.questions.length} سؤال)</h3>
                    <button class="btn" onclick="startLessonExam(${gradeId}, ${subjectId}, ${unitId}, ${lesson.id})">بدء الامتحان</button>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================================
// ========== الامتحانات ==========
// ============================================================

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
                alert('لا يوجد امتحان'); return;
            }
            currentExam = {
                questions: lesson.content.exam.questions,
                currentIndex: 0, answers: [],
                gradeId, subjectId, unitId, type: 'lesson'
            };
            renderExam();
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
                alert('لا يوجد امتحان'); return;
            }
            currentExam = {
                questions: unit.exam.questions,
                currentIndex: 0, answers: [],
                gradeId, subjectId, unitId, type: 'unit'
            };
            renderExam();
        });
}

function renderExam() {
    if (currentExam.currentIndex >= currentExam.questions.length) { finishExam(); return; }
    const q = currentExam.questions[currentExam.currentIndex];
    mainContent.innerHTML = `
        <div style="max-width:700px; margin:0 auto;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <button class="btn btn-outline btn-sm" onclick="viewUnit(${currentExam.gradeId}, ${currentExam.subjectId}, ${currentExam.unitId})"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="margin:0;">📝 الامتحان</h2>
            </div>
            <div class="glass-card">
                <p style="color:var(--text-secondary);">سؤال ${currentExam.currentIndex+1} من ${currentExam.questions.length}</p>
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
    currentExam.answers[currentExam.currentIndex] = idx;
    document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
    const selected = document.getElementById(`examOpt${idx}`);
    if (selected) selected.classList.add('selected');
    document.getElementById('examNextBtn').disabled = false;
}

function nextExamQuestion() {
    if (currentExam.answers[currentExam.currentIndex] === undefined) { alert('اختر إجابة'); return; }
    currentExam.currentIndex++;
    renderExam();
}

function finishExam() {
    let correct = 0;
    currentExam.questions.forEach((q, i) => { if (currentExam.answers[i] === q.correctAnswer) correct++; });
    const score = Math.round((correct / currentExam.questions.length) * 100);
    const passed = score >= 60;
    mainContent.innerHTML = `
        <div style="max-width:700px; margin:0 auto; text-align:center;" class="glass-card">
            <h2>النتيجة</h2>
            <div style="font-size:4rem; margin:20px 0; color:${passed ? 'var(--success)' : 'var(--danger)'};">${score}%</div>
            <p style="font-size:1.2rem;">${passed ? '🎉 اجتزت!' : '😔 حاول مرة أخرى'}</p>
            <button class="btn" onclick="viewUnit(${currentExam.gradeId}, ${currentExam.subjectId}, ${currentExam.unitId})">العودة</button>
        </div>
    `;
}

// ============================================================
// ========== إدارة المستخدمين (للمشرف) ==========
// ============================================================

async function renderAdminUsers() {
    if (!currentUser || currentUser.role !== 'admin') { alert('غير مصرح'); return; }
    try {
        const res = await fetch('/api/admin/users');
        const users = await res.json();
        allUsers = users;
        mainContent.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="margin:0;">👑 إدارة المستخدمين (${users.length})</h2>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;">
                <input type="text" id="userSearchInput" placeholder="🔍 بحث..." style="flex:1; min-width:200px; padding:8px 14px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:var(--radius-sm); color:white;" oninput="filterUsers()">
                <button class="btn btn-sm" onclick="renderAdminUsers()">🔄 تحديث</button>
            </div>
            <div style="overflow-x:auto;">
                <table class="admin-table">
                    <thead><tr>
                        <th>#</th><th>المستخدم</th><th>البريد</th><th>الهاتف</th><th>الخطة</th><th>الصفوف</th><th>الحالة</th><th>الإجراءات</th>
                    </tr></thead>
                    <tbody id="usersTableBody">
                        ${users.map((u, idx) => `
                            <tr>
                                <td>${idx+1}</td>
                                <td>${u.username}</td>
                                <td>${u.email}</td>
                                <td>${u.phone || '—'}</td>
                                <td>${u.plan === 'paid' ? '⭐ مدفوع' : '🆓 مجاني'}</td>
                                <td>${u.selectedGrades && u.selectedGrades.length > 0 ? u.selectedGrades.join(', ') : '—'}</td>
                                <td>${u.banned ? '🚫 محظور' : '✅ مفعل'}</td>
                                <td style="display:flex; gap:4px; flex-wrap:wrap;">
                                    <button class="btn btn-sm" onclick="editUser('${u._id}')">✏️</button>
                                    <button class="btn btn-sm ${u.banned ? 'btn-outline' : ''}" onclick="toggleBanUser('${u._id}')">${u.banned ? '🔓' : '🔒'}</button>
                                    ${u.plan === 'paid' ? `<button class="btn btn-sm btn-outline" onclick="setUserPlan('${u._id}','free')">🔄 مجاني</button>` : `<button class="btn btn-sm" onclick="showUpgradeUser('${u._id}')">⭐ ترقية</button>`}
                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u._id}')">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) { mainContent.innerHTML = '<p style="color:var(--danger);">خطأ في التحميل</p>'; }
}

function filterUsers() {
    const q = document.getElementById('userSearchInput')?.value?.toLowerCase() || '';
    document.querySelectorAll('#usersTableBody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

async function editUser(id) {
    const u = allUsers.find(x => x._id === id); if (!u) return;
    const un = prompt('اسم المستخدم:', u.username); if (un === null) return;
    const em = prompt('البريد:', u.email); if (em === null) return;
    const ph = prompt('الهاتف:', u.phone || ''); if (ph === null) return;
    const pw = prompt('كلمة السر الجديدة (اترك فارغاً):', ''); if (pw === null) return;
    const data = { username: un, email: em, phone: ph };
    if (pw.trim()) data.password = pw.trim();
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    if (result.success) { alert('✅ تم التحديث'); renderAdminUsers(); } else alert('❌ '+result.error);
}

async function toggleBanUser(id) {
    if (!confirm('تبديل حالة الحظر؟')) return;
    const res = await fetch(`/api/admin/users/${id}/ban`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) { alert(data.banned ? '✅ محظور' : '✅ إلغاء الحظر'); renderAdminUsers(); }
}

async function deleteUser(id) {
    if (!confirm('حذف المستخدم نهائياً؟')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { alert('✅ تم الحذف'); renderAdminUsers(); }
}

function showUpgradeUser(id) {
    const u = allUsers.find(x => x._id === id); if (!u) return;
    const duration = prompt('المدة (1,3,9,12 شهر):', '12');
    if (!duration) return;
    const months = parseInt(duration);
    if (![1,3,9,12].includes(months)) { alert('مدة غير صحيحة'); return; }
    const gradesInput = prompt('أرقام الصفوف (مفصولة بفواصل):', '1,2,3');
    if (gradesInput === null) return;
    const selected = gradesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (selected.length === 0) { alert('يجب اختيار صف واحد'); return; }
    fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'paid', subscriptionDuration: months, selectedGrades: selected })
    }).then(res => res.json()).then(data => {
        if (data.success) { alert('✅ تم الترقية'); renderAdminUsers(); } else alert('❌ '+data.error);
    });
}

async function setUserPlan(id, plan) {
    if (!confirm(`تغيير الخطة إلى ${plan === 'free' ? 'مجانية' : 'مدفوعة'}؟`)) return;
    const data = { plan };
    if (plan === 'paid') {
        const d = prompt('المدة (1,3,9,12):', '12');
        if (!d) return; const m = parseInt(d); if (![1,3,9,12].includes(m)) { alert('غير صحيح'); return; }
        const g = prompt('أرقام الصفوف:', '1,2,3');
        if (g === null) return; const s = g.split(',').map(x => parseInt(x.trim())).filter(n => !isNaN(n));
        if (s.length === 0) { alert('يجب اختيار صف'); return; }
        data.subscriptionDuration = m; data.selectedGrades = s;
    } else {
        data.selectedGrades = []; data.subscriptionDuration = null;
    }
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    if (result.success) { alert('✅ تم التغيير'); renderAdminUsers(); } else alert('❌ '+result.error);
}

// ============================================================
// ========== إدارة المحتوى (للمشرف) ==========
// ============================================================

async function renderAdminContent() {
    if (!currentUser || currentUser.role !== 'admin') { alert('غير مصرح'); return; }
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('home')"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">📚 إدارة المحتوى</h2>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
            <button class="btn" onclick="showAddGrade()">➕ إضافة صف</button>
            <button class="btn btn-outline" onclick="refreshAdminContent()">🔄 تحديث</button>
        </div>
        <div id="adminContentTree"></div>
    `;
    await loadAdminContentTree();
}

async function loadAdminContentTree() {
    try {
        const res = await fetch('/api/grades');
        const grades = await res.json();
        allGrades = grades;
        const container = document.getElementById('adminContentTree');
        if (!grades.length) { container.innerHTML = '<p class="text-muted">لا توجد صفوف</p>'; return; }
        let html = '';
        grades.forEach(g => {
            html += `<div class="glass-card" style="margin-bottom:10px;">
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
                            <div style="padding-right:1rem; margin-top:5px; border-right:2px solid var(--gold);">
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
                                    <div style="padding-right:1rem; margin-top:3px; border-right:2px solid var(--primary); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
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
                `).join('') : ''}
            </div>`;
        });
        container.innerHTML = html;
    } catch (error) { console.error(error); }
}

// ====== دوال إدارة الصفوف ======
async function showAddGrade() {
    const name = prompt('اسم الصف الجديد:');
    if (!name) return;
    const res = await fetch('/api/admin/grades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (data.success) { alert('✅ تم الإضافة'); refreshAdminContent(); } else alert('❌ '+data.error);
}
async function editGrade(id) {
    const g = allGrades.find(x => x.id === id); if (!g) return;
    const name = prompt('اسم الصف الجديد:', g.name); if (!name) return;
    const res = await fetch(`/api/admin/grades/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (data.success) { alert('✅ تم التعديل'); refreshAdminContent(); }
}
async function deleteGrade(id) {
    if (!confirm('حذف الصف وجميع محتوياته؟')) return;
    const res = await fetch(`/api/admin/grades/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { alert('✅ تم الحذف'); refreshAdminContent(); }
}
// ====== دوال إدارة المواد ======
async function showAddSubject(gradeId) {
    const name = prompt('اسم المادة:');
    if (!name) return;
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (data.success) { alert('✅ تم الإضافة'); refreshAdminContent(); }
}
async function editSubject(gradeId, subjectId) {
    const g = allGrades.find(x => x.id === gradeId); if (!g) return;
    const s = g.subjects.find(x => x.id === subjectId); if (!s) return;
    const name = prompt('اسم المادة الجديد:', s.name); if (!name) return;
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (data.success) { alert('✅ تم التعديل'); refreshAdminContent(); }
}
async function deleteSubject(gradeId, subjectId) {
    if (!confirm('حذف المادة وجميع محتوياتها؟')) return;
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { alert('✅ تم الحذف'); refreshAdminContent(); }
}
// ====== دوال إدارة الوحدات ======
async function showAddUnit(gradeId, subjectId) {
    const name = prompt('اسم الوحدة:');
    if (!name) return;
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (data.success) { alert('✅ تم الإضافة'); refreshAdminContent(); }
}
async function editUnit(gradeId, subjectId, unitId) {
    const g = allGrades.find(x => x.id === gradeId); if (!g) return;
    const s = g.subjects.find(x => x.id === subjectId); if (!s) return;
    const u = s.units.find(x => x.id === unitId); if (!u) return;
    const name = prompt('اسم الوحدة الجديد:', u.name); if (!name) return;
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (data.success) { alert('✅ تم التعديل'); refreshAdminContent(); }
}
async function deleteUnit(gradeId, subjectId, unitId) {
    if (!confirm('حذف الوحدة وجميع دروسها؟')) return;
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { alert('✅ تم الحذف'); refreshAdminContent(); }
}
// ====== دوال إدارة الدروس ======
async function showAddLesson(gradeId, subjectId, unitId) {
    const title = prompt('عنوان الدرس:'); if (!title) return;
    const video = prompt('رابط الفيديو (embed):', '');
    const content = prompt('الشرح النصي (HTML):', '');
    const examples = prompt('الأمثلة (HTML):', '');
    const free = confirm('هل الدرس مجاني؟ (موافق = مجاني، إلغاء = مدفوع)');
    let exam = { questions: [] };
    const qCount = prompt('عدد أسئلة الامتحان (0 = لا يوجد):', '0');
    const count = parseInt(qCount) || 0;
    for (let i=0; i<count; i++) {
        const q = prompt(`سؤال ${i+1}:`); if (!q) break;
        const opts = prompt(`خيارات (مفصولة بفواصل):`, ''); if (!opts) break;
        const arr = opts.split(',').map(s => s.trim());
        const ans = parseInt(prompt(`الإجابة الصحيحة (0-${arr.length-1}):`, '0'));
        if (isNaN(ans) || ans < 0 || ans >= arr.length) break;
        exam.questions.push({ question: q, options: arr, correctAnswer: ans });
    }
    const data = { title, video, content, examples, free, exam };
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    if (result.success) { alert('✅ تم إضافة الدرس'); refreshAdminContent(); } else alert('❌ '+result.error);
}
async function editLessonContent(gradeId, subjectId, unitId, lessonId) {
    const g = allGrades.find(x => x.id === gradeId); if (!g) return;
    const s = g.subjects.find(x => x.id === subjectId); if (!s) return;
    const u = s.units.find(x => x.id === unitId); if (!u) return;
    const l = u.lessons.find(x => x.id === lessonId); if (!l) return;
    const title = prompt('العنوان:', l.title); if (title === null) return;
    const video = prompt('الفيديو:', l.video || '');
    const content = prompt('الشرح:', l.content || '');
    const examples = prompt('الأمثلة:', l.examples || '');
    const free = confirm(`هل الدرس مجاني؟ (موافق = مجاني، إلغاء = مدفوع)`);
    const data = { title, video, content, examples, free };
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons/${lessonId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    if (result.success) { alert('✅ تم التعديل'); refreshAdminContent(); } else alert('❌ '+result.error);
}
async function deleteLesson(gradeId, subjectId, unitId, lessonId) {
    if (!confirm('حذف الدرس؟')) return;
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons/${lessonId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { alert('✅ تم الحذف'); refreshAdminContent(); }
}
async function editUnitExam(gradeId, subjectId, unitId) {
    const g = allGrades.find(x => x.id === gradeId); if (!g) return;
    const s = g.subjects.find(x => x.id === subjectId); if (!s) return;
    const u = s.units.find(x => x.id === unitId); if (!u) return;
    const count = prompt('عدد الأسئلة (0 للحذف):', '0');
    const cnt = parseInt(count); if (isNaN(cnt) || cnt < 0) { alert('رقم غير صحيح'); return; }
    let exam = { questions: [] };
    for (let i=0; i<cnt; i++) {
        const q = prompt(`سؤال ${i+1}:`); if (!q) break;
        const opts = prompt(`خيارات (مفصولة بفواصل):`, ''); if (!opts) break;
        const arr = opts.split(',').map(s => s.trim());
        const ans = parseInt(prompt(`الإجابة الصحيحة (0-${arr.length-1}):`, '0'));
        if (isNaN(ans) || ans < 0 || ans >= arr.length) break;
        exam.questions.push({ question: q, options: arr, correctAnswer: ans });
    }
    const res = await fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/exam`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exam }) });
    const data = await res.json();
    if (data.success) { alert('✅ تم تحديث الامتحان'); refreshAdminContent(); } else alert('❌ '+data.error);
}

async function refreshAdminContent() {
    if (currentPage === 'admin-content') renderAdminContent();
    else if (currentPage === 'admin-users') renderAdminUsers();
}

// ============================================================
// ========== تسجيل الدخول والتسجيل ==========
// ============================================================

function showLoginModal(msg = '') {
    loginModal.style.display = 'flex';
    document.getElementById('loginError').style.display = msg ? 'block' : 'none';
    if (msg) document.getElementById('loginError').textContent = msg;
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}
function showRegisterModal() {
    registerModal.style.display = 'flex';
    document.getElementById('regError').style.display = 'none';
    loadGradesForRegister();
    toggleGradeSelection();
}
function switchToRegister() { closeModal('loginModal'); showRegisterModal(); }
function switchToLogin() { closeModal('registerModal'); showLoginModal(); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function loginUser() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    if (!username || !password) { errorEl.textContent = 'املأ جميع الحقول'; errorEl.style.display = 'block'; return; }
    try {
        const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await res.json();
        if (data.error) { errorEl.textContent = data.error; errorEl.style.display = 'block'; return; }
        if (data.success) {
            currentUser = data.user; updateUIForUser(); closeModal('loginModal'); navigateTo('home');
        }
    } catch (e) { errorEl.textContent = 'خطأ في الاتصال'; errorEl.style.display = 'block'; }
}

async function loadGradesForRegister() {
    try {
        const res = await fetch('/api/grades');
        const grades = await res.json();
        const container = document.getElementById('gradesCheckboxes');
        if (!container) return;
        container.innerHTML = grades.map(g => `
            <label style="display:flex; align-items:center; gap:4px; font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
                <input type="checkbox" value="${g.id}" class="grade-checkbox"> ${g.name}
            </label>
        `).join('');
    } catch (e) { console.error(e); }
}

function toggleGradeSelection() {
    const plan = document.querySelector('input[name="regPlan"]:checked');
    document.getElementById('gradeSelection').style.display = (plan && plan.value === 'paid') ? 'block' : 'none';
}

async function registerUser() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirm = document.getElementById('regConfirmPassword').value.trim();
    const plan = document.querySelector('input[name="regPlan"]:checked').value;
    const errorEl = document.getElementById('regError');
    if (!username || !email || !password || !confirm) { errorEl.textContent = 'املأ جميع الحقول'; errorEl.style.display = 'block'; return; }
    if (password !== confirm) { errorEl.textContent = 'كلمة المرور غير متطابقة'; errorEl.style.display = 'block'; return; }
    if (password.length < 6) { errorEl.textContent = 'كلمة المرور 6 أحرف على الأقل'; errorEl.style.display = 'block'; return; }
    let selectedGrades = [];
    if (plan === 'paid') {
        document.querySelectorAll('.grade-checkbox:checked').forEach(cb => selectedGrades.push(parseInt(cb.value)));
        if (selectedGrades.length === 0) { errorEl.textContent = 'اختر صفاً واحداً على الأقل'; errorEl.style.display = 'block'; return; }
    }
    try {
        const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password, confirmPassword: confirm, phone, plan, selectedGrades }) });
        const data = await res.json();
        if (data.error) { errorEl.textContent = data.error; errorEl.style.display = 'block'; return; }
        if (data.success) {
            if (data.user) { currentUser = data.user; updateUIForUser(); closeModal('registerModal'); navigateTo('home'); alert(data.message); }
            else { closeModal('registerModal'); alert(data.message); }
        }
    } catch (e) { errorEl.textContent = 'خطأ في الاتصال'; errorEl.style.display = 'block'; }
}

// ============================================================
// ========== بدء التطبيق ==========
// ============================================================

window.addEventListener('scroll', () => {
    backToTop.style.display = window.scrollY > 300 ? 'block' : 'none';
});

document.addEventListener('DOMContentLoaded', async () => {
    await checkCurrentUser();
    navigateTo('home');
});

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
window.filterUsers = filterUsers;
window.editUser = editUser;
window.toggleBanUser = toggleBanUser;
window.deleteUser = deleteUser;
window.showUpgradeUser = showUpgradeUser;
window.setUserPlan = setUserPlan;
window.renderAdminUsers = renderAdminUsers;
window.renderAdminContent = renderAdminContent;
window.refreshAdminContent = refreshAdminContent;
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
window.startLessonExam = startLessonExam;
window.startUnitExam = startUnitExam;
window.selectExamAnswer = selectExamAnswer;
window.nextExamQuestion = nextExamQuestion;
window.toggleGradeSelection = toggleGradeSelection;