// ============================================================
// DeepTeach - script.js (النسخة الكاملة)
// ============================================================

// ========== المتغيرات العامة ==========
let currentUser = null;
let allGrades = [];
let currentGradeId = null;
let currentSubjectId = null;
let currentUnitId = null;
let currentLessonId = null;
let allUsers = [];
let adminActiveTab = 'users';
let currentExam = {
    questions: [],
    currentIndex: 0,
    answers: [],
    examType: '',
    gradeId: null,
    subjectId: null,
    unitId: null,
    lessonId: null
};

// ========== عناصر DOM ==========
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const userInfoTop = document.getElementById('userInfoTop');
const userDisplayTop = document.getElementById('userDisplayTop');
const loginBtnTop = document.getElementById('loginBtnTop');
const registerBtnTop = document.getElementById('registerBtnTop');
const backToTop = document.getElementById('backToTop');

// ============================================================
// ========== إدارة الجلسة ==========
// ============================================================

async function checkCurrentUser() {
    try {
        const res = await fetch('/api/current-user');
        const data = await res.json();
        if (data.user) {
            currentUser = data.user;
            updateUIForUser();
            renderHome();
        } else {
            currentUser = null;
            updateUIForUser();
            renderPublicHome();
        }
    } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
        currentUser = null;
        updateUIForUser();
        renderPublicHome();
    }
}

function updateUIForUser() {
    if (currentUser) {
        loginBtnTop.style.display = 'none';
        registerBtnTop.style.display = 'none';
        userInfoTop.style.display = 'flex';
        userDisplayTop.textContent = currentUser.username;
        if (currentUser.role === 'admin') {
            userDisplayTop.textContent += ' 👑';
        }
    } else {
        loginBtnTop.style.display = 'inline-block';
        registerBtnTop.style.display = 'inline-block';
        userInfoTop.style.display = 'none';
        userDisplayTop.textContent = '';
    }
}

// ============================================================
// ========== الصفحة العامة (قبل تسجيل الدخول) ==========
// ============================================================

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
                <div class="feature-card">
                    <i class="fas fa-book-open"></i>
                    <h3>دروس منظمة</h3>
                    <p>محتوى تعليمي مرتب حسب الصفوف والمواد والوحدات</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-video"></i>
                    <h3>شروحات فيديو</h3>
                    <p>دروس مصورة مع أمثلة محلولة وتمارين تفاعلية</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-crown"></i>
                    <h3>محتوى مدفوع ومجاني</h3>
                    <p>اختر الخطة المناسبة لك وتمتع بمزايا إضافية</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-chart-line"></i>
                    <h3>تتبع التقدم</h3>
                    <p>راقب تطورك واحصل على شارات عند إتمام الدروس</p>
                </div>
            </div>
        </section>
        <section class="grades-preview">
            <h2>استكشف الصفوف الدراسية</h2>
            <div id="gradesGrid" class="grades-grid"></div>
        </section>
    `;
    loadGradesForPublic();
}

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
    } catch (error) {
        console.error('خطأ في تحميل الصفوف:', error);
    }
}

function viewGradePublic(gradeId) {
    if (currentUser) {
        viewGradeContent(gradeId);
    } else {
        showLoginModal('يجب تسجيل الدخول لمشاهدة محتوى هذا الصف');
    }
}

// ============================================================
// ========== الصفحة الرئيسية للمستخدم ==========
// ============================================================

function renderHome() {
    if (!currentUser) {
        renderPublicHome();
        return;
    }

    mainContent.innerHTML = `
        <section class="welcome-section">
            <h2>مرحباً ${currentUser.username} 👋</h2>
            <p style="color:var(--text-secondary);">خطتك: <strong style="color:${currentUser.plan === 'paid' ? 'var(--gold)' : 'var(--text-muted)'}">${currentUser.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</strong></p>
            ${currentUser.plan === 'paid' && currentUser.subscriptionEnd ? `<p style="color:var(--text-secondary); font-size:0.9rem;">ينتهي الاشتراك في: ${new Date(currentUser.subscriptionEnd).toLocaleDateString('ar-EG')}</p>` : ''}
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:15px;">
                <button class="btn" onclick="renderGrades()">استعراض الصفوف</button>
                ${currentUser.role === 'admin' ? `<button class="btn btn-outline" onclick="renderAdminPanel()">👑 لوحة الإدارة</button>` : ''}
                <button class="btn btn-outline" onclick="renderProfile()">حسابي</button>
            </div>
        </section>
        <section class="grades-preview">
            <h3>صفوفك الدراسية</h3>
            <div id="gradesGrid" class="grades-grid"></div>
        </section>
    `;
    loadUserGrades();
}

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
    } catch (error) {
        console.error('خطأ في تحميل الصفوف:', error);
    }
}

function renderGrades() {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="renderHome()"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">الصفوف الدراسية</h2>
        </div>
        <div id="gradesGrid" class="grades-grid"></div>
    `;
    loadUserGrades();
}

// ============================================================
// ========== عرض محتوى الصف ==========
// ============================================================

async function viewGradeContent(gradeId) {
    try {
        const res = await fetch(`/api/grades/${gradeId}/content`);
        const data = await res.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        currentGradeId = gradeId;
        renderGradeContent(data);
    } catch (error) {
        console.error('خطأ في تحميل محتوى الصف:', error);
        alert('حدث خطأ في تحميل المحتوى');
    }
}

function renderGradeContent(grade) {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="renderHome()"><i class="fas fa-arrow-right"></i> العودة</button>
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

// ============================================================
// ========== عرض المادة ==========
// ============================================================

async function viewSubject(gradeId, subjectId) {
    try {
        const res = await fetch(`/api/grades/${gradeId}/content`);
        const data = await res.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        const subject = data.subjects.find(s => s.id === subjectId);
        if (!subject) {
            alert('المادة غير موجودة');
            return;
        }
        currentSubjectId = subjectId;
        renderSubjectContent(gradeId, subject);
    } catch (error) {
        console.error(error);
        alert('حدث خطأ');
    }
}

function renderSubjectContent(gradeId, subject) {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="viewGradeContent(${gradeId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${subject.name}</h2>
        </div>
        <div id="unitsContainer">
            ${subject.units && subject.units.length > 0 ? subject.units.map(u => `
                <div class="unit-card" onclick="viewUnit(${gradeId}, ${subject.id}, ${u.id})">
                    <h3>${u.name}</h3>
                    <small style="color:var(--text-muted);">${u.lessons ? u.lessons.length : 0} دروس</small>
                    ${u.exam && u.exam.questions && u.exam.questions.length > 0 ? `<span style="color:var(--gold);">📝 امتحان</span>` : ''}
                </div>
            `).join('') : '<p style="color:var(--text-muted);">لا توجد وحدات في هذه المادة بعد</p>'}
        </div>
    `;
}

// ============================================================
// ========== عرض الوحدة ==========
// ============================================================

async function viewUnit(gradeId, subjectId, unitId) {
    try {
        const res = await fetch(`/api/grades/${gradeId}/content`);
        const data = await res.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        const subject = data.subjects.find(s => s.id === subjectId);
        if (!subject) return;
        const unit = subject.units.find(u => u.id === unitId);
        if (!unit) return;
        currentUnitId = unitId;
        renderUnitContent(gradeId, subjectId, unit);
    } catch (error) {
        console.error(error);
        alert('حدث خطأ');
    }
}

function renderUnitContent(gradeId, subjectId, unit) {
    mainContent.innerHTML = `
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
                            ${l.locked ? '<span style="color:var(--danger);">🔒 مقفل</span>' : '<span style="color:var(--success);">✅ متاح</span>'}
                            ${l.free ? '<span style="color:var(--text-muted); font-size:0.8rem;">🆓 مجاني</span>' : '<span style="color:var(--gold); font-size:0.8rem;">⭐ مدفوع</span>'}
                        </div>
                    </div>
                    ${l.content ? '<small style="color:var(--text-muted);">📄 يحتوي على شرح</small>' : ''}
                    ${l.exam && l.exam.questions && l.exam.questions.length > 0 ? '<small style="color:var(--gold);">📝 امتحان</small>' : ''}
                </div>
            `).join('') : '<p style="color:var(--text-muted);">لا توجد دروس في هذه الوحدة بعد</p>'}
        </div>
        ${unit.exam && unit.exam.questions && unit.exam.questions.length > 0 ? `
            <div style="margin-top:20px; padding:15px; background:var(--glass-bg); border-radius:var(--radius); border:1px solid var(--glass-border);">
                <h3>📝 امتحان الوحدة</h3>
                <p style="color:var(--text-secondary);">عدد الأسئلة: ${unit.exam.questions.length}</p>
                <button class="btn" onclick="startUnitExam(${gradeId}, ${subjectId}, ${unit.id})">بدء الامتحان</button>
            </div>
        ` : ''}
    `;
}

// ============================================================
// ========== عرض الدرس ==========
// ============================================================

async function viewLesson(gradeId, subjectId, unitId, lessonId) {
    try {
        const res = await fetch(`/api/grades/${gradeId}/content`);
        const data = await res.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        const subject = data.subjects.find(s => s.id === subjectId);
        if (!subject) return;
        const unit = subject.units.find(u => u.id === unitId);
        if (!unit) return;
        const lesson = unit.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        if (lesson.locked) {
            alert('هذا الدرس مقفل. يرجى الاشتراك للوصول إليه.');
            return;
        }

        renderLessonContent(gradeId, subjectId, unitId, lesson);
    } catch (error) {
        console.error(error);
        alert('حدث خطأ');
    }
}

function renderLessonContent(gradeId, subjectId, unitId, lesson) {
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="viewUnit(${gradeId}, ${subjectId}, ${unitId})"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">${lesson.title}</h2>
            ${lesson.free ? '<span style="color:var(--text-muted);">🆓 مجاني</span>' : '<span style="color:var(--gold);">⭐ مدفوع</span>'}
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
                <div style="margin-top:20px; padding:15px; background:var(--glass-bg); border-radius:var(--radius); border:1px solid var(--glass-border);">
                    <h3>📝 امتحان الدرس</h3>
                    <p style="color:var(--text-secondary);">عدد الأسئلة: ${lesson.content.exam.questions.length}</p>
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
            if (!lesson || !lesson.content || !lesson.content.exam || !lesson.content.exam.questions || lesson.content.exam.questions.length === 0) {
                alert('لا يوجد امتحان لهذا الدرس');
                return;
            }
            currentExam = {
                questions: lesson.content.exam.questions,
                currentIndex: 0,
                answers: [],
                examType: 'lesson',
                gradeId,
                subjectId,
                unitId,
                lessonId
            };
            renderExam();
        })
        .catch(err => {
            console.error(err);
            alert('حدث خطأ في تحميل الامتحان');
        });
}

function startUnitExam(gradeId, subjectId, unitId) {
    fetch(`/api/grades/${gradeId}/content`)
        .then(res => res.json())
        .then(data => {
            const subject = data.subjects.find(s => s.id === subjectId);
            if (!subject) return;
            const unit = subject.units.find(u => u.id === unitId);
            if (!unit || !unit.exam || !unit.exam.questions || unit.exam.questions.length === 0) {
                alert('لا يوجد امتحان لهذه الوحدة');
                return;
            }
            currentExam = {
                questions: unit.exam.questions,
                currentIndex: 0,
                answers: [],
                examType: 'unit',
                gradeId,
                subjectId,
                unitId
            };
            renderExam();
        })
        .catch(err => {
            console.error(err);
            alert('حدث خطأ في تحميل الامتحان');
        });
}

function renderExam() {
    if (currentExam.currentIndex >= currentExam.questions.length) {
        finishExam();
        return;
    }
    const q = currentExam.questions[currentExam.currentIndex];
    mainContent.innerHTML = `
        <div style="max-width:700px; margin:0 auto;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <button class="btn btn-outline btn-sm" onclick="viewUnit(${currentExam.gradeId}, ${currentExam.subjectId}, ${currentExam.unitId})"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="margin:0;">📝 الامتحان</h2>
            </div>
            <div style="background:var(--glass-bg); border-radius:var(--radius); padding:25px; border:1px solid var(--glass-border);">
                <p style="color:var(--text-secondary);">السؤال ${currentExam.currentIndex + 1} من ${currentExam.questions.length}</p>
                <h3 style="margin-top:10px;">${q.question}</h3>
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
    if (currentExam.answers[currentExam.currentIndex] === undefined) {
        alert('يرجى اختيار إجابة');
        return;
    }
    currentExam.currentIndex++;
    renderExam();
}

function finishExam() {
    let correct = 0;
    currentExam.questions.forEach((q, i) => {
        if (currentExam.answers[i] === q.correctAnswer) correct++;
    });
    const score = Math.round((correct / currentExam.questions.length) * 100);
    const passed = score >= 60;

    mainContent.innerHTML = `
        <div style="max-width:700px; margin:0 auto; text-align:center; background:var(--glass-bg); border-radius:var(--radius); padding:30px; border:1px solid var(--glass-border);">
            <h2>نتيجة الامتحان</h2>
            <div style="font-size:4rem; margin:20px 0; color:${passed ? 'var(--success)' : 'var(--danger)'};">${score}%</div>
            <p style="font-size:1.2rem;">${passed ? '🎉 أحسنت! اجتزت الامتحان' : '😔 لم تجتز الامتحان، حاول مرة أخرى'}</p>
            <button class="btn" onclick="viewUnit(${currentExam.gradeId}, ${currentExam.subjectId}, ${currentExam.unitId})">العودة</button>
        </div>
    `;
}

// ============================================================
// ========== حساب المستخدم ==========
// ============================================================

function renderProfile() {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    mainContent.innerHTML = `
        <div style="max-width:500px; margin:0 auto; background:var(--glass-bg); border-radius:var(--radius); padding:30px; border:1px solid var(--glass-border);">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <button class="btn btn-outline btn-sm" onclick="renderHome()"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="margin:0;">حسابي</h2>
            </div>
            <div style="margin-top:20px;">
                <p><strong>اسم المستخدم:</strong> ${currentUser.username}</p>
                <p><strong>البريد الإلكتروني:</strong> ${currentUser.email}</p>
                <p><strong>رقم الهاتف:</strong> ${currentUser.phone || 'غير مضاف'}</p>
                <p><strong>الخطة:</strong> ${currentUser.plan === 'paid' ? 'مدفوعة ⭐' : 'مجانية 🆓'}</p>
                ${currentUser.plan === 'paid' && currentUser.subscriptionEnd ? `<p><strong>ينتهي الاشتراك:</strong> ${new Date(currentUser.subscriptionEnd).toLocaleDateString('ar-EG')}</p>` : ''}
                <p><strong>الدور:</strong> ${currentUser.role === 'admin' ? 'مشرف 👑' : 'طالب 🎓'}</p>
                ${currentUser.selectedGrades && currentUser.selectedGrades.length > 0 ? `<p><strong>الصفوف المشترك بها:</strong> ${currentUser.selectedGrades.join(', ')}</p>` : ''}
            </div>
        </div>
    `;
}

// ============================================================
// ========== لوحة الإدارة ==========
// ============================================================

function renderAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('غير مصرح');
        return;
    }
    mainContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="btn btn-outline btn-sm" onclick="renderHome()"><i class="fas fa-arrow-right"></i> العودة</button>
            <h2 style="margin:0;">👑 لوحة الإدارة</h2>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
            <button class="btn ${adminActiveTab === 'users' ? '' : 'btn-outline'}" onclick="switchAdminTab('users')">👥 المستخدمين</button>
            <button class="btn ${adminActiveTab === 'content' ? '' : 'btn-outline'}" onclick="switchAdminTab('content')">📚 المحتوى</button>
        </div>
        <div id="adminContent">
            ${adminActiveTab === 'users' ? renderAdminUsers() : renderAdminContent()}
        </div>
    `;
}

function switchAdminTab(tab) {
    adminActiveTab = tab;
    renderAdminPanel();
}

// ============================================================
// ========== إدارة المستخدمين (للمشرف) ==========
// ============================================================

async function renderAdminUsers() {
    try {
        const res = await fetch('/api/admin/users');
        const users = await res.json();
        allUsers = users;
        let html = `
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;">
                <input type="text" id="userSearchInput" placeholder="🔍 بحث عن مستخدم..." class="input-group" style="flex:1; min-width:200px; padding:8px 14px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:var(--radius-sm); color:white;" oninput="filterUsers()">
                <button class="btn btn-sm" onclick="refreshUsers()">🔄 تحديث</button>
            </div>
            <div style="overflow-x:auto;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>اسم المستخدم</th>
                            <th>البريد الإلكتروني</th>
                            <th>رقم الهاتف</th>
                            <th>الخطة</th>
                            <th>الصفوف</th>
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
                                <td>${u.selectedGrades && u.selectedGrades.length > 0 ? u.selectedGrades.join(', ') : '—'}</td>
                                <td>${u.banned ? '🚫 محظور' : (u.approved ? '✅ مفعل' : '⏳ معلق')}</td>
                                <td style="display:flex; gap:5px; flex-wrap:wrap; justify-content:center;">
                                    <button class="btn btn-sm" onclick="editUser('${u._id}')">✏️</button>
                                    <button class="btn btn-sm ${u.banned ? 'btn-outline' : ''}" onclick="toggleBanUser('${u._id}')">${u.banned ? '🔓' : '🔒'}</button>
                                    ${u.plan === 'paid' ? `<button class="btn btn-sm btn-outline" onclick="setUserPlan('${u._id}', 'free')">🔄 مجاني</button>` : `<button class="btn btn-sm" onclick="showUpgradeUser('${u._id}')">⭐ ترقية</button>`}
                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u._id}')">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('adminContent').innerHTML = html;
    } catch (error) {
        console.error(error);
        document.getElementById('adminContent').innerHTML = '<p style="color:var(--danger);">خطأ في تحميل المستخدمين</p>';
    }
}

function filterUsers() {
    const q = document.getElementById('userSearchInput')?.value?.toLowerCase() || '';
    const rows = document.querySelectorAll('#usersTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

async function refreshUsers() {
    await renderAdminUsers();
}

async function editUser(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (!user) return;
    const newUsername = prompt('اسم المستخدم:', user.username);
    if (newUsername === null) return;
    const newEmail = prompt('البريد الإلكتروني:', user.email);
    if (newEmail === null) return;
    const newPhone = prompt('رقم الهاتف:', user.phone || '');
    if (newPhone === null) return;
    const newPassword = prompt('كلمة المرور الجديدة (اترك فارغاً للإبقاء على القديمة):', '');
    if (newPassword === null) return;

    const data = { username: newUsername, email: newEmail, phone: newPhone };
    if (newPassword.trim()) data.password = newPassword.trim();

    try {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert('✅ تم تحديث بيانات المستخدم');
            renderAdminUsers();
        } else {
            alert('❌ ' + (result.error || 'فشل التحديث'));
        }
    } catch (error) {
        alert('خطأ في الاتصال');
    }
}

async function toggleBanUser(userId) {
    if (!confirm('هل تريد تبديل حالة الحظر لهذا المستخدم؟')) return;
    try {
        const res = await fetch(`/api/admin/users/${userId}/ban`, { method: 'PUT' });
        const data = await res.json();
        if (data.success) {
            alert(data.banned ? '✅ تم حظر المستخدم' : '✅ تم إلغاء الحظر');
            renderAdminUsers();
        }
    } catch (error) {
        alert('خطأ في الاتصال');
    }
}

async function deleteUser(userId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
    try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            alert('✅ تم حذف المستخدم');
            renderAdminUsers();
        }
    } catch (error) {
        alert('خطأ في الاتصال');
    }
}

function showUpgradeUser(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (!user) return;
    const duration = prompt('اختر مدة الاشتراك (بالأشهر):\n1 - شهر\n3 - 3 أشهر\n9 - 9 أشهر\n12 - سنة', '12');
    if (!duration) return;
    const months = parseInt(duration);
    if (![1, 3, 9, 12].includes(months)) {
        alert('يرجى اختيار مدة صحيحة (1، 3، 9، 12)');
        return;
    }
    const gradesInput = prompt('أدخل أرقام الصفوف التي يريد الاشتراك بها (مفصولة بفواصل):\nمثال: 1,2,3', '');
    if (gradesInput === null) return;
    const selectedGrades = gradesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (selectedGrades.length === 0) {
        alert('يرجى إدخال صف واحد على الأقل');
        return;
    }

    const data = {
        plan: 'paid',
        subscriptionDuration: months,
        selectedGrades: selectedGrades
    };

    fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('✅ تم ترقية المستخدم بنجاح');
                renderAdminUsers();
            } else {
                alert('❌ ' + (result.error || 'فشل الترقية'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

async function setUserPlan(userId, plan) {
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
            alert('مدة غير صحيحة');
            return;
        }
        const gradesInput = prompt('أرقام الصفوف (مفصولة بفواصل):', '');
        if (gradesInput === null) return;
        const selectedGrades = gradesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (selectedGrades.length === 0) {
            alert('يرجى إدخال صف واحد على الأقل');
            return;
        }
        data.subscriptionDuration = months;
        data.selectedGrades = selectedGrades;
    }

    try {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert('✅ تم تغيير الخطة');
            renderAdminUsers();
        } else {
            alert('❌ ' + (result.error || 'فشل التغيير'));
        }
    } catch (error) {
        alert('خطأ في الاتصال');
    }
}

// ============================================================
// ========== إدارة المحتوى (للمشرف) ==========
// ============================================================

function renderAdminContent() {
    let html = `
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;">
            <button class="btn" onclick="showAddGrade()">➕ إضافة صف</button>
            <button class="btn btn-outline" onclick="refreshContent()">🔄 تحديث</button>
        </div>
        <div id="contentManagement">
            <p style="color:var(--text-secondary);">اختر صفاً لإدارته:</p>
            <div id="adminGradesList" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;"></div>
            <div id="adminGradeDetail" style="margin-top:20px;"></div>
        </div>
    `;
    document.getElementById('adminContent').innerHTML = html;
    loadAdminGrades();
}

async function loadAdminGrades() {
    try {
        const res = await fetch('/api/grades');
        const grades = await res.json();
        allGrades = grades;
        const container = document.getElementById('adminGradesList');
        container.innerHTML = grades.map(g => `
            <button class="btn btn-sm btn-outline" onclick="selectAdminGrade(${g.id})">${g.name}</button>
        `).join('');
    } catch (error) {
        console.error(error);
    }
}

function selectAdminGrade(gradeId) {
    const grade = allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    currentGradeId = gradeId;
    renderAdminGradeDetail(grade);
}

function renderAdminGradeDetail(grade) {
    const container = document.getElementById('adminGradeDetail');
    container.innerHTML = `
        <div style="background:var(--glass-bg); border-radius:var(--radius); padding:20px; border:1px solid var(--glass-border);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <h3>${grade.name}</h3>
                <div style="display:flex; gap:5px;">
                    <button class="btn btn-sm" onclick="showAddSubject(${grade.id})">➕ مادة</button>
                    <button class="btn btn-sm btn-outline" onclick="editGrade(${grade.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGrade(${grade.id})">🗑️</button>
                </div>
            </div>
            <div style="margin-top:15px;">
                ${grade.subjects && grade.subjects.length > 0 ? grade.subjects.map(s => `
                    <div style="background:rgba(255,255,255,0.05); padding:10px; margin:5px 0; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:5px;">
                        <span><strong>${s.name}</strong> (${s.units ? s.units.length : 0} وحدات)</span>
                        <div style="display:flex; gap:5px;">
                            <button class="btn btn-sm" onclick="showAddUnit(${grade.id}, ${s.id})">➕ وحدة</button>
                            <button class="btn btn-sm btn-outline" onclick="editSubject(${grade.id}, ${s.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteSubject(${grade.id}, ${s.id})">🗑️</button>
                        </div>
                    </div>
                    ${s.units && s.units.length > 0 ? s.units.map(u => `
                        <div style="padding-right:20px; margin:5px 0; border-right:2px solid var(--gold);">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:5px;">
                                <span>📂 ${u.name} (${u.lessons ? u.lessons.length : 0} دروس)</span>
                                <div style="display:flex; gap:5px;">
                                    <button class="btn btn-sm" onclick="showAddLesson(${grade.id}, ${s.id}, ${u.id})">➕ درس</button>
                                    <button class="btn btn-sm" onclick="editUnitExam(${grade.id}, ${s.id}, ${u.id})">📝 امتحان</button>
                                    <button class="btn btn-sm btn-outline" onclick="editUnit(${grade.id}, ${s.id}, ${u.id})">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteUnit(${grade.id}, ${s.id}, ${u.id})">🗑️</button>
                                </div>
                            </div>
                            ${u.lessons && u.lessons.length > 0 ? u.lessons.map(l => `
                                <div style="padding-right:20px; margin:3px 0; border-right:2px solid var(--primary); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:5px;">
                                    <span>📖 ${l.title} ${l.free ? '🆓' : '⭐'}</span>
                                    <div style="display:flex; gap:5px;">
                                        <button class="btn btn-sm" onclick="editLessonContent(${grade.id}, ${s.id}, ${u.id}, ${l.id})">✏️</button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteLesson(${grade.id}, ${s.id}, ${u.id}, ${l.id})">🗑️</button>
                                    </div>
                                </div>
                            `).join('') : ''}
                        </div>
                    `).join('') : ''}
                `).join('') : '<p style="color:var(--text-muted);">لا توجد مواد في هذا الصف</p>'}
            </div>
        </div>
    `;
}

// ====== دوال إدارة الصفوف ======

function showAddGrade() {
    const name = prompt('أدخل اسم الصف الجديد (مثال: الصف الثالث)');
    if (!name) return;
    fetch('/api/admin/grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم إضافة الصف');
                refreshContent();
            } else {
                alert('❌ ' + (data.error || 'فشل الإضافة'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function editGrade(gradeId) {
    const grade = allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const newName = prompt('اسم الصف الجديد:', grade.name);
    if (!newName) return;
    fetch(`/api/admin/grades/${gradeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم التعديل');
                refreshContent();
            } else {
                alert('❌ ' + (data.error || 'فشل التعديل'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function deleteGrade(gradeId) {
    if (!confirm('هل أنت متأكد من حذف هذا الصف وجميع محتوياته؟')) return;
    fetch(`/api/admin/grades/${gradeId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم الحذف');
                refreshContent();
            } else {
                alert('❌ ' + (data.error || 'فشل الحذف'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

// ====== دوال إدارة المواد ======

function showAddSubject(gradeId) {
    const name = prompt('أدخل اسم المادة الجديدة:');
    if (!name) return;
    fetch(`/api/admin/grades/${gradeId}/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم إضافة المادة');
                refreshContent();
            } else {
                alert('❌ ' + (data.error || 'فشل الإضافة'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function editSubject(gradeId, subjectId) {
    const grade = allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const subject = grade.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const newName = prompt('اسم المادة الجديد:', subject.name);
    if (!newName) return;
    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم التعديل');
                refreshContent();
            } else {
                alert('❌ ' + (data.error || 'فشل التعديل'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function deleteSubject(gradeId, subjectId) {
    if (!confirm('حذف هذه المادة وجميع محتوياتها؟')) return;
    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم الحذف');
                refreshContent();
            } else {
                alert('❌ ' + (data.error || 'فشل الحذف'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

// ====== دوال إدارة الوحدات ======

function showAddUnit(gradeId, subjectId) {
    const name = prompt('أدخل اسم الوحدة الجديدة:');
    if (!name) return;
    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم إضافة الوحدة');
                refreshContent();
            } else {
                alert('❌ ' + (data.error || 'فشل الإضافة'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function editUnit(gradeId, subjectId, unitId) {
    const grade = allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const subject = grade.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const unit = subject.units.find(u => u.id === unitId);
    if (!unit) return;
    const newName = prompt('اسم الوحدة الجديد:', unit.name);
    if (!newName) return;
    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم التعديل');
                refreshContent();
            } else {
                alert('❌ ' + (data.error || 'فشل التعديل'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function deleteUnit(gradeId, subjectId, unitId) {
    if (!confirm('حذف هذه الوحدة وجميع دروسها؟')) return;
    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم الحذف');
                refreshContent();
            } else {
                alert('❌ ' + (data.error || 'فشل الحذف'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

// ====== دوال إدارة الدروس ======

function showAddLesson(gradeId, subjectId, unitId) {
    const title = prompt('عنوان الدرس:');
    if (!title) return;
    const video = prompt('رابط فيديو (YouTube embed URL):', '');
    const content = prompt('الشرح النصي (HTML مسموح):', '');
    const examples = prompt('الأمثلة المحلولة (HTML):', '');
    const free = confirm('هل هذا الدرس مجاني؟ (موافق = مجاني، إلغاء = مدفوع)');
    const questionsCount = prompt('كم سؤالاً تريد إضافته في امتحان هذا الدرس؟ (0 يعني لا يوجد امتحان)', '0');
    const qCount = parseInt(questionsCount) || 0;
    let exam = { questions: [] };
    for (let i = 0; i < qCount; i++) {
        const q = prompt(`السؤال ${i + 1}:`);
        if (!q) break;
        const options = prompt(`خيارات السؤال ${i + 1} (مفصولة بفواصل):`, '');
        if (!options) break;
        const opts = options.split(',').map(s => s.trim());
        const correct = parseInt(prompt(`رقم الإجابة الصحيحة (0-${opts.length - 1}):`, '0'));
        if (isNaN(correct) || correct < 0 || correct >= opts.length) break;
        exam.questions.push({ question: q, options: opts, correctAnswer: correct });
    }

    const data = { title, video, content, examples, free, exam };
    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('✅ تم إضافة الدرس');
                refreshContent();
            } else {
                alert('❌ ' + (result.error || 'فشل الإضافة'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function editLessonContent(gradeId, subjectId, unitId, lessonId) {
    const grade = allGrades.find(g => g.id === gradeId);
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

    const data = { title: newTitle, video: newVideo, content: newContent, examples: newExamples, free: newFree };

    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons/${lessonId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('✅ تم التعديل');
                refreshContent();
            } else {
                alert('❌ ' + (result.error || 'فشل التعديل'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function deleteLesson(gradeId, subjectId, unitId, lessonId) {
    if (!confirm('حذف هذا الدرس؟')) return;
    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/lessons/${lessonId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('✅ تم الحذف');
                refreshContent();
            } else {
                alert('❌ ' + (result.error || 'فشل الحذف'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function editUnitExam(gradeId, subjectId, unitId) {
    const grade = allGrades.find(g => g.id === gradeId);
    if (!grade) return;
    const subject = grade.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const unit = subject.units.find(u => u.id === unitId);
    if (!unit) return;

    const qCount = prompt('كم سؤالاً تريد في امتحان هذه الوحدة؟ (0 للحذف)', '0');
    if (qCount === null) return;
    const count = parseInt(qCount);
    if (isNaN(count) || count < 0) {
        alert('رقم غير صحيح');
        return;
    }
    let exam = { questions: [] };
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

    fetch(`/api/admin/grades/${gradeId}/subjects/${subjectId}/units/${unitId}/exam`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exam })
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('✅ تم تحديث امتحان الوحدة');
                refreshContent();
            } else {
                alert('❌ ' + (result.error || 'فشل التحديث'));
            }
        })
        .catch(() => alert('خطأ في الاتصال'));
}

function refreshContent() {
    if (adminActiveTab === 'content') {
        renderAdminContent();
        if (currentGradeId) {
            const grade = allGrades.find(g => g.id === currentGradeId);
            if (grade) {
                setTimeout(() => selectAdminGrade(currentGradeId), 100);
            }
        }
    } else {
        renderAdminUsers();
    }
}

// ============================================================
// ========== تسجيل الدخول والتسجيل ==========
// ============================================================

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

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
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
            renderHome();
        }
    } catch (error) {
        errorEl.textContent = 'خطأ في الاتصال بالخادم';
        errorEl.style.display = 'block';
    }
}

function showRegisterModal() {
    registerModal.style.display = 'flex';
    document.getElementById('regError').style.display = 'none';
    loadGradesForRegister();
    toggleGradeSelection();
}

function closeRegisterModal() {
    registerModal.style.display = 'none';
}

async function loadGradesForRegister() {
    try {
        const res = await fetch('/api/grades');
        const grades = await res.json();
        const container = document.getElementById('gradesCheckboxes');
        if (!container) return;
        container.innerHTML = grades.map(g => `
            <label style="display:flex; align-items:center; gap:5px; font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
                <input type="checkbox" value="${g.id}" class="grade-checkbox">
                ${g.name}
            </label>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل الصفوف للتسجيل:', error);
    }
}

function toggleGradeSelection() {
    const plan = document.querySelector('input[name="regPlan"]:checked');
    const gradeDiv = document.getElementById('gradeSelection');
    if (plan && plan.value === 'paid') {
        gradeDiv.style.display = 'block';
    } else {
        gradeDiv.style.display = 'none';
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
        const res = await fetch('/api/register', {
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
        const data = await res.json();
        if (data.error) {
            errorEl.textContent = data.error;
            errorEl.style.display = 'block';
            return;
        }
        if (data.success) {
            if (data.user) {
                currentUser = data.user;
                updateUIForUser();
                closeModal('registerModal');
                renderHome();
                alert(data.message);
            } else {
                closeModal('registerModal');
                alert(data.message);
                renderPublicHome();
            }
        }
    } catch (error) {
        errorEl.textContent = 'خطأ في الاتصال بالخادم';
        errorEl.style.display = 'block';
    }
}

// ============================================================
// ========== تسجيل الخروج ==========
// ============================================================

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        updateUIForUser();
        renderPublicHome();
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        location.reload();
    }
}

// ============================================================
// ========== البحث ==========
// ============================================================

if (searchInput) {
    searchInput.addEventListener('input', async function() {
        const q = this.value.trim().toLowerCase();
        if (!q) {
            searchResults.classList.remove('active');
            return;
        }
        try {
            const res = await fetch('/api/grades');
            const grades = await res.json();
            const results = [];
            grades.forEach(g => {
                if (g.name.includes(q)) {
                    results.push({ type: 'grade', id: g.id, name: g.name });
                }
                if (g.subjects) {
                    g.subjects.forEach(s => {
                        if (s.name.includes(q)) {
                            results.push({ type: 'subject', gradeId: g.id, id: s.id, name: s.name, gradeName: g.name });
                        }
                    });
                }
            });
            searchResults.innerHTML = results.length ? results.map(r => `
                <div class="search-result-item" onclick="navigateSearchResult(${r.gradeId || r.id}, '${r.type}', ${r.id})">
                    <i class="fas ${r.type === 'grade' ? 'fa-layer-group' : 'fa-book'}"></i>
                    <div>
                        <div class="result-text">${r.name}</div>
                        <div class="result-sub">${r.type === 'grade' ? 'صف دراسي' : `مادة في ${r.gradeName}`}</div>
                    </div>
                </div>
            `).join('') : '<div class="search-result-item">لا نتائج</div>';
            searchResults.classList.add('active');
        } catch (error) {
            console.error(error);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            searchResults.classList.remove('active');
        }
    });
}

function navigateSearchResult(gradeId, type, id) {
    searchResults.classList.remove('active');
    if (type === 'grade') {
        viewGradeContent(gradeId);
    } else if (type === 'subject') {
        viewSubject(gradeId, id);
    }
}

// ============================================================
// ========== أحداث عامة ==========
// ============================================================

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTop.style.display = 'block';
    } else {
        backToTop.style.display = 'none';
    }
});

// ============================================================
// ========== بدء التطبيق ==========
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    await checkCurrentUser();
    if (!currentUser) {
        renderPublicHome();
    } else {
        renderHome();
    }
});

// جعل الدوال العالمية متاحة من onclick في HTML
window.showLoginModal = showLoginModal;
window.closeModal = closeModal;
window.loginUser = loginUser;
window.showRegisterModal = showRegisterModal;
window.registerUser = registerUser;
window.logout = logout;
window.renderHome = renderHome;
window.renderGrades = renderGrades;
window.viewGradeContent = viewGradeContent;
window.viewSubject = viewSubject;
window.viewUnit = viewUnit;
window.viewLesson = viewLesson;
window.viewGradePublic = viewGradePublic;
window.renderProfile = renderProfile;
window.renderAdminPanel = renderAdminPanel;
window.switchAdminTab = switchAdminTab;
window.filterUsers = filterUsers;
window.refreshUsers = refreshUsers;
window.editUser = editUser;
window.toggleBanUser = toggleBanUser;
window.deleteUser = deleteUser;
window.showUpgradeUser = showUpgradeUser;
window.setUserPlan = setUserPlan;
window.selectAdminGrade = selectAdminGrade;
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
window.refreshContent = refreshContent;
window.startLessonExam = startLessonExam;
window.startUnitExam = startUnitExam;
window.selectExamAnswer = selectExamAnswer;
window.nextExamQuestion = nextExamQuestion;
window.toggleGradeSelection = toggleGradeSelection;
window.navigateSearchResult = navigateSearchResult;