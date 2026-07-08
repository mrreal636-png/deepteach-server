const API_BASE = '';

// ========== دوال الاتصال العامة بالخادم ==========
async function apiGet(url) {
    const res = await fetch(API_BASE + url);
    return res.json();
}
async function apiPost(url, data) {
    const res = await fetch(API_BASE + url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}
async function apiPut(url, data) {
    const res = await fetch(API_BASE + url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}
async function apiDelete(url) {
    const res = await fetch(API_BASE + url, { method: 'DELETE' });
    return res.json();
}

// ========== بيانات الصفوف والمواد ==========
const subjectsByGrade = {
    1: ['لغة عربية','رياضيات','علوم'],
    2: ['لغة عربية','رياضيات','علوم'],
    3: ['لغة عربية','رياضيات','علوم','دراسات اجتماعية'],
    4: ['لغة عربية','رياضيات','علوم','دراسات اجتماعية','إنجليزي'],
    5: ['لغة عربية','رياضيات','علوم','دراسات اجتماعية','إنجليزي'],
    6: ['لغة عربية','رياضيات','علوم','دراسات اجتماعية','إنجليزي'],
    7: ['لغة عربية','رياضيات','علوم','دراسات اجتماعية','إنجليزي','فيزياء','كيمياء'],
    8: ['لغة عربية','رياضيات','علوم','دراسات اجتماعية','إنجليزي','فيزياء','كيمياء'],
    9: ['لغة عربية','رياضيات','علوم','دراسات اجتماعية','إنجليزي','فيزياء','كيمياء','أحياء'],
    10: ['لغة عربية','رياضيات','فيزياء','كيمياء','أحياء','إنجليزي'],
    11: ['فيزياء','كيمياء','أحياء','رياضيات','إنجليزي'],
    12: ['فيزياء','كيمياء','أحياء','رياضيات','إنجليزي']
};

const subjectIconsFA = {
    'لغة عربية': 'fa-book',
    'رياضيات': 'fa-calculator',
    'علوم': 'fa-flask',
    'دراسات اجتماعية': 'fa-globe',
    'إنجليزي': 'fa-language',
    'فيزياء': 'fa-atom',
    'كيمياء': 'fa-vial',
    'أحياء': 'fa-dna'
};

// ========== حالة المستخدم والبيانات العامة ==========
let currentUser = null;
let coursesCache = [];
let userXP = 0;
let userBadges = [];

// ========== تحميل بيانات المستخدم ==========
async function loadUserData() {
    if (!currentUser) return;
    const [courses, xpRes, badgesRes, notifs] = await Promise.all([
        apiGet('/api/courses'),
        apiGet('/api/xp/' + currentUser.username),
        apiGet('/api/badges/' + currentUser.username),
        apiGet('/api/notifications/' + currentUser.username)
    ]);
    coursesCache = courses;
    userXP = xpRes.xp || 0;
    userBadges = badgesRes || [];
    document.getElementById('xpValue').textContent = userXP + ' XP';
    if (currentUser.role === 'student' && currentUser.plan === 'free') {
        document.getElementById('upgrade-btn').style.display = 'inline-block';
    } else {
        document.getElementById('upgrade-btn').style.display = 'none';
    }
    renderNotifications(notifs);
}

// ========== التنقل ==========
const mainContent = document.getElementById('main-content');
const sidebarEl = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');

if (hamburger) hamburger.addEventListener('click', () => sidebarEl.classList.toggle('active'));
function closeSidebar() { if (window.innerWidth <= 768) sidebarEl.classList.remove('active'); }

function setActiveNav(section) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const active = document.querySelector(`.nav-item[data-nav="${section}"]`);
    if (active) active.classList.add('active');
}

function navigate(page, data = null) {
    closeSidebar();
    switch(page) {
        case 'home': renderHome(); setActiveNav('home'); break;
        case 'grades': renderGrades(); setActiveNav('grades'); break;
        case 'subjects': renderSubjects(data); setActiveNav('grades'); break;
        case 'course': renderCourse(data); break;
        case 'lesson': startLessonView(data.grade, data.subject, data.lessonIdx); break;
        case 'progress': renderProgress(); setActiveNav('progress'); break;
        case 'about': renderAbout(); setActiveNav('about'); break;
        case 'contact': renderContact(); setActiveNav('contact'); break;
        case 'admin': renderAdmin(); setActiveNav('admin'); break;
        default: renderHome();
    }
}

function updateUIForRole(user) {
    document.getElementById('user-display').textContent = user.username;
    document.querySelectorAll('.admin-only').forEach(el => {
        if (user.role === 'admin') {
            el.style.setProperty('display', 'flex', 'important');
        } else {
            el.style.setProperty('display', 'none', 'important');
        }
    });
    document.getElementById('xpValue').textContent = (userXP || 0) + ' XP';
    if (user.role === 'student' && user.plan === 'free') {
        document.getElementById('upgrade-btn').style.display = 'inline-block';
    } else {
        document.getElementById('upgrade-btn').style.display = 'none';
    }
}

// ========== الصفحات ==========
function renderAbout() {
    mainContent.innerHTML = `
        <h2><i class="fas fa-info-circle"></i> عن منصة DeepTeach</h2>
        <div class="card" style="max-width:800px; margin:0 auto;">
            <p style="font-size:1.2rem; line-height:2; color:#ccc;">
                DeepTeach هي منصة تعليمية تفاعلية تهدف إلى تسهيل عملية التعلم للطلاب من جميع المراحل الدراسية.
            </p>
            <p style="font-size:1.1rem; line-height:2; color:#bbb; margin-top:20px;">
                <i class="fas fa-check-circle" style="color:#f59e0b;"></i> دروس مصورة ونصوص تفاعلية<br>
                <i class="fas fa-check-circle" style="color:#f59e0b;"></i> امتحانات فورية مع تقييم ذاتي<br>
                <i class="fas fa-check-circle" style="color:#f59e0b;"></i> نظام نقاط وشارات تحفيزي<br>
                <i class="fas fa-check-circle" style="color:#f59e0b;"></i> خطط مجانية ومدفوعة حسب احتياجك<br>
                <i class="fas fa-check-circle" style="color:#f59e0b;"></i> لوحة إدارة متكاملة للمعلمين
            </p>
        </div>
    `;
}

function renderContact() {
    mainContent.innerHTML = `
        <h2><i class="fas fa-envelope"></i> تواصل معنا</h2>
        <div class="card" style="max-width:600px; margin:0 auto;">
            <form id="contactForm" class="contact-form" style="display:flex; flex-direction:column; gap:15px;">
                <input type="text" id="contact-name" placeholder="اسمك" class="input-field" required>
                <input type="email" id="contact-email" placeholder="بريدك الإلكتروني" class="input-field" required>
                <textarea id="contact-message" placeholder="رسالتك..." rows="5" class="input-field" required></textarea>
                <button type="submit" class="btn" style="align-self:center;">إرسال</button>
            </form>
            <div id="successMessage" style="display: none; text-align: center; margin-top: 2rem; color: #4ade80; font-size: 1.3rem;">
                <i class="fas fa-check-circle"></i> تم استلام رسالتك! شكراً لتواصلك.
            </div>
        </div>
    `;
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            form.style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
        });
    }
}

function renderHome() {
    const xp = userXP || 0;
    const badges = userBadges || [];
    mainContent.innerHTML = `
        <h2><i class="fas fa-hand-peace"></i> مرحباً بك في DeepTeach</h2>
        <div class="xp-badge">
            <span><i class="fas fa-star"></i> نقاط الخبرة: <strong class="xp-value">${xp} XP</strong></span>
            <span><i class="fas fa-medal"></i> الشارات: ${badges.length}</span>
        </div>
        <div class="grades-grid">
            <div class="card" onclick="navigate('grades')">
                <i class="fas fa-layer-group icon"></i><h3>الصفوف الدراسية</h3><p>اختر صفك</p>
            </div>
            <div class="card" onclick="navigate('progress')">
                <i class="fas fa-chart-pie icon"></i><h3>تقدمك</h3><p>شاهد إنجازاتك</p>
            </div>
            <div class="card" onclick="navigate('about')">
                <i class="fas fa-info-circle icon"></i><h3>عن المنصة</h3><p>تعرف علينا</p>
            </div>
            <div class="card" onclick="navigate('contact')">
                <i class="fas fa-envelope icon"></i><h3>اتصل بنا</h3><p>راسلنا</p>
            </div>
        </div>`;
}

function renderGrades() {
    let html = '<h2><i class="fas fa-layer-group"></i> الصفوف الدراسية</h2><div class="grades-grid">';
    for (let i=1; i<=12; i++) {
        html += `<div class="grade-card" onclick="navigate('subjects', ${i})">
            <div class="grade-num">${i}</div>
            <div class="grade-label">الصف ${i}</div>
        </div>`;
    }
    html += '</div>';
    mainContent.innerHTML = html;
}

function renderSubjects(grade) {
    const subs = subjectsByGrade[grade] || [];
    let html = `<h2><i class="fas fa-book-open"></i> مواد الصف ${grade}</h2><div class="grades-grid">`;
    subs.forEach(sub => {
        html += `<div class="card" onclick="navigate('course', {grade:${grade}, subject:'${sub}'})">
            <i class="fas ${subjectIconsFA[sub] || 'fa-graduation-cap'} icon"></i><h3>${sub}</h3>
        </div>`;
    });
    html += '</div>';
    mainContent.innerHTML = html;
}

// ========== عرض المادة ==========
async function renderCourse(data) {
    const courses = await apiGet('/api/courses');
    coursesCache = courses;
    const course = courses.find(c => c.grade === data.grade && c.subject === data.subject);
    if (!course) {
        mainContent.innerHTML = `<h2>${data.subject}</h2><p>المحتوى غير متوفر</p><button class="btn" onclick="navigate('subjects', ${data.grade})">عودة</button>`;
        return;
    }
    if (currentUser.role !== 'admin' && !currentUser.approved) {
        mainContent.innerHTML = '<h2>الحساب معلق</h2>'; return;
    }
    const isPaidUser = currentUser.role === 'admin' || currentUser.plan === 'paid';
    const scoresData = await apiGet('/api/scores/' + currentUser.username);
    const scores = scoresData[course.id] || new Array(course.lessons.length).fill(null);

    let lessonsHTML = course.lessons.map((l, idx) => {
        const canAccess = l.free || isPaidUser;
        const prevOk = idx === 0 || (scores[idx-1] !== null && scores[idx-1] >= 60);
        let cls = '', txt = '', clk = '';
        if (!canAccess) {
            cls = 'locked'; txt = '🔒 مدفوع'; clk = '';
        } else if (scores[idx] !== null) {
            cls = 'completed'; txt = '✓ تم';
            clk = `onclick="navigate('lesson', {grade:${data.grade}, subject:'${data.subject}', lessonIdx:${idx}})"`;
        } else if (prevOk) {
            txt = 'متاح';
            clk = `onclick="navigate('lesson', {grade:${data.grade}, subject:'${data.subject}', lessonIdx:${idx}})"`;
        } else {
            cls = 'locked'; txt = '🔒'; clk = '';
        }
        return `<div class="lesson-item ${cls}" ${clk}>${l.title} <small>${txt}</small></div>`;
    }).join('');

    mainContent.innerHTML = `
        <div class="lesson-view">
            <div class="lesson-sidebar"><h4>${course.subject} - الصف ${course.grade}</h4>${lessonsHTML}</div>
            <div class="lesson-content-area"><h3>اختر درساً</h3></div>
        </div>`;
}

// ========== الدرس والامتحان ==========
let currentExam = { courseId: null, lessonIdx: null, questions: [], currentQ: 0, answers: [] };

async function startLessonView(grade, subject, lessonIdx) {
    const courses = await apiGet('/api/courses');
    coursesCache = courses;
    const course = courses.find(c => c.grade === grade && c.subject === subject);
    if (!course) return;
    const lesson = course.lessons[lessonIdx];
    const isPaidUser = currentUser.role === 'admin' || currentUser.plan === 'paid';
    if (!lesson.free && !isPaidUser) {
        alert('هذا الدرس مدفوع. يرجى ترقية حسابك.');
        navigate('course', {grade, subject});
        return;
    }
    const scoresData = await apiGet('/api/scores/' + currentUser.username);
    const scores = scoresData[course.id] || new Array(course.lessons.length).fill(null);
    if (lessonIdx > 0 && (scores[lessonIdx-1] === null || scores[lessonIdx-1] < 60)) {
        alert('اجتز الدرس السابق بـ 60% أولاً');
        return;
    }
    const imageHTML = lesson.image ? `<img src="${lesson.image}" style="max-width:100%; border-radius:12px; margin:10px 0;">` : '';
    const videoHTML = lesson.video ? `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:15px 0;"><iframe src="${lesson.video.replace('watch?v=', 'embed/')}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>` : '';
    mainContent.innerHTML = `
        <div class="lesson-view">
            <div class="lesson-sidebar"><h4>${course.subject}</h4>
                ${course.lessons.map((l, i) => `<div class="lesson-item ${i===lessonIdx?'active-lesson':''} ${scores[i]!==null?'completed':''}">${l.title}</div>`).join('')}
            </div>
            <div class="lesson-content-area">
                <h2>${lesson.title}</h2>
                <div class="progress-bar"><div class="progress-fill" style="width:${(lessonIdx/course.lessons.length)*100}%"></div></div>
                <div class="card">${imageHTML}${videoHTML}${lesson.content}</div>
                <button class="btn" onclick="startExam(${course.id}, ${lessonIdx})">بدء الامتحان</button>
                <button class="btn btn-outline" onclick="navigate('course', {grade:${grade}, subject:'${subject}'})">عودة</button>
            </div>
        </div>`;
}

function startExam(courseId, lessonIdx) {
    const course = coursesCache.find(c => c.id == courseId);
    if (!course) return;
    const lesson = course.lessons[lessonIdx];
    currentExam = {
        courseId, lessonIdx,
        questions: [...lesson.questions].sort(() => Math.random() - 0.5),
        currentQ: 0, answers: []
    };
    renderExamQuestion();
}

function renderExamQuestion() {
    if (currentExam.currentQ >= currentExam.questions.length) { finishExam(); return; }
    const q = currentExam.questions[currentExam.currentQ];
    const area = document.querySelector('.lesson-content-area');
    if (area) {
        area.innerHTML = `
            <h3>امتحان الدرس</h3>
            <div class="question-box">
                <p><strong>${currentExam.currentQ+1}. ${q.q}</strong></p>
                ${q.options.map((opt, i) => `
                    <label class="option">
                        <input type="radio" name="ans" onchange="selectExamAnswer(${i})"> ${opt}
                    </label>`).join('')}
            </div>
            <button class="btn" id="nextQBtn" disabled onclick="nextExamQuestion()">التالي</button>`;
    }
}

function selectExamAnswer(idx) {
    currentExam.answers[currentExam.currentQ] = idx;
    const btn = document.getElementById('nextQBtn');
    if (btn) btn.disabled = false;
}

function nextExamQuestion() {
    if (currentExam.answers[currentExam.currentQ] === undefined) { alert('اختر إجابة'); return; }
    currentExam.currentQ++;
    renderExamQuestion();
}

async function finishExam() {
    const course = coursesCache.find(c => c.id == currentExam.courseId);
    if (!course) return;
    const lessonIdx = currentExam.lessonIdx;
    let correct = 0;
    currentExam.questions.forEach((q, i) => { if (currentExam.answers[i] === q.answer) correct++; });
    const score = Math.round((correct / currentExam.questions.length) * 100);

    await apiPost('/api/scores', {
        username: currentUser.username,
        courseId: currentExam.courseId,
        lessonIdx,
        score
    });

    if (score >= 60) {
        await apiPost('/api/xp', { username: currentUser.username, amount: 50 });
        await apiPost('/api/badges', { username: currentUser.username, badgeName: 'badge_' + currentExam.courseId + '_' + lessonIdx });
        userXP += 50;
        document.getElementById('xpValue').textContent = userXP + ' XP';
    }

    const passed = score >= 60;
    const area = document.querySelector('.lesson-content-area');
    if (area) {
        area.innerHTML = `
            <h2>النتيجة: ${score}%</h2>
            <p>${passed ? '🎉 أحسنت!' : '😔 حاول مرة أخرى'}</p>
            ${passed && lessonIdx < course.lessons.length-1 ? `<button class="btn" onclick="startLessonView(${course.grade},'${course.subject}',${lessonIdx+1})">الدرس التالي</button>` : ''}
            <button class="btn btn-outline" onclick="startLessonView(${course.grade},'${course.subject}',${lessonIdx})">إعادة</button>
            <button class="btn btn-outline" onclick="navigate('course',{grade:${course.grade},subject:'${course.subject}'})">عودة</button>
        `;
    }
}

function renderProgress() {
    const xp = userXP || 0;
    const badges = userBadges || [];
    let badgesHTML = badges.map(b => `<div class="badge-item earned"><i class="fas fa-medal"></i></div>`).join('');
    mainContent.innerHTML = `<h2><i class="fas fa-chart-line"></i> تقدمك</h2><div class="xp-badge"><span><i class="fas fa-star"></i> XP: <strong>${xp}</strong></span></div><h3><i class="fas fa-trophy"></i> الشارات</h3><div class="badge-collection">${badgesHTML || '<p>لا شارات بعد</p>'}</div>`;
}

// ========== الترقية والإشعارات ==========
function requestUpgrade() {
    document.getElementById('upgrade-modal').style.display = 'flex';
}

async function submitUpgradeRequest() {
    const name = document.getElementById('upgrade-name').value.trim();
    const phone = document.getElementById('upgrade-phone').value.trim();
    const duration = document.getElementById('upgrade-duration').value;
    if (!name || !phone) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    const res = await apiPost('/api/upgrade-request', {
        username: currentUser.username,
        fullName: name,
        phone: phone,
        duration: duration
    });
    if (res.error) {
        alert(res.error);
    } else {
        alert('✅ تم إرسال طلب الترقية بنجاح');
        document.getElementById('upgrade-modal').style.display = 'none';
        document.getElementById('upgrade-btn').style.display = 'none';
    }
}

async function approveUpgrade(username) {
    const res = await apiPut('/api/upgrade-request/approve', { username });
    if (res.error) {
        alert(res.error);
        return;
    }
    if (currentUser && currentUser.username === username) {
        currentUser.plan = 'paid';
        document.getElementById('upgrade-btn').style.display = 'none';
        await loadUserData();
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
            const nav = activeNav.dataset.nav;
            if (nav === 'admin') renderAdmin();
            else navigate(nav);
        }
    }
    renderAdmin();
    alert('✅ تمت الموافقة على ترقية المستخدم ' + username);
}

function showSendNotification() {
    const msg = prompt('أدخل نص الإشعار:');
    if (!msg) return;
    const to = prompt('للمستخدم (اسم المستخدم أو اتركه للكل):') || 'all';
    apiPost('/api/notifications', { from: 'deepteach', to, message: msg });
    alert('تم الإرسال');
}

function renderNotifications(notifs) {
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) {
        dropdown.innerHTML = notifs.length === 0 ? '<div class="notification-item">لا توجد إشعارات</div>' :
            notifs.map(n => `<div class="notification-item ${n.read ? '' : 'unread'}">${n.message}</div>`).join('');
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// ========== دوال إدارة المستخدمين ==========
async function toggleBanUser(username) {
    if (username === 'admin') {
        alert('لا يمكن حظر الأدمن');
        return;
    }
    if (!confirm(`هل تريد تبديل حالة الحظر للمستخدم ${username}؟`)) return;
    const res = await apiPut(`/api/users/${username}/toggle-ban`);
    if (res.error) {
        alert(res.error);
    } else {
        alert(res.banned ? '✅ تم حظر المستخدم' : '✅ تم إلغاء حظر المستخدم');
        renderAdmin();
    }
}

async function setUserPlan(username, plan, duration = 12) {
    if (username === 'admin') {
        alert('لا يمكن تغيير خطة الأدمن');
        return;
    }
    const confirmMsg = plan === 'paid' ? `هل تريد جعل ${username} مشتركاً مدفوعاً لمدة ${duration} شهراً؟` : `هل تريد جعل ${username} مجانياً؟`;
    if (!confirm(confirmMsg)) return;
    const res = await apiPut(`/api/users/${username}/set-plan`, { plan, duration });
    if (res.error) {
        alert(res.error);
    } else {
        alert(`✅ تم تغيير خطة المستخدم إلى ${plan === 'paid' ? 'مدفوعة' : 'مجانية'}`);
        renderAdmin();
    }
}

async function deleteUser(username) {
    if (username === 'admin') {
        alert('لا يمكن حذف الأدمن');
        return;
    }
    if (!confirm(`⚠️ هل أنت متأكد من حذف المستخدم ${username} نهائياً؟`)) return;
    const res = await apiDelete(`/api/users/${username}`);
    if (res.error) {
        alert(res.error);
    } else {
        alert('✅ تم حذف المستخدم');
        renderAdmin();
    }
}

function renderAllUsers(users) {
    let html = `<h3>👥 جميع المستخدمين (${users.length})</h3>`;
    html += `<div style="margin-bottom:10px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-sm" onclick="renderAdmin()">📋 الكل</button>
        <button class="btn btn-sm btn-outline" onclick="filterUsers('paid')">⭐ المدفوعون</button>
        <button class="btn btn-sm btn-outline" onclick="filterUsers('free')">🆓 المجانيون</button>
        <button class="btn btn-sm btn-outline" onclick="filterUsers('banned')">🚫 المحظورون</button>
    </div>`;
    html += `<table class="admin-table">
        <tr>
            <th>المستخدم</th>
            <th>الدور</th>
            <th>الخطة</th>
            <th>نهاية الاشتراك</th>
            <th>الحالة</th>
            <th>جهة الاتصال</th>
            <th>الإجراءات</th>
        </tr>`;
    users.forEach(u => {
        const isBanned = u.banned || false;
        const isPaid = u.plan === 'paid';
        const subEnd = u.subscriptionEnd ? new Date(u.subscriptionEnd).toLocaleDateString('ar-EG') : '—';
        const status = isBanned ? '🚫 محظور' : (u.approved ? '✅ مفعل' : '⏳ معلق');
        html += `<tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.role === 'admin' ? '👑 أدمن' : '🎓 طالب'}</td>
            <td>${isPaid ? '⭐ مدفوع' : '🆓 مجاني'}</td>
            <td>${subEnd}</td>
            <td>${status}</td>
            <td>${u.contact || '—'}</td>
            <td style="display:flex; gap:5px; flex-wrap:wrap; justify-content:center;">
                ${u.role !== 'admin' ? `
                    <button class="btn btn-sm ${isBanned ? 'btn-outline' : ''}" onclick="toggleBanUser('${u.username}')">
                        ${isBanned ? '🔓 إلغاء الحظر' : '🔒 حظر'}
                    </button>
                    <button class="btn btn-sm" onclick="setUserPlan('${u.username}', '${isPaid ? 'free' : 'paid'}')">
                        ${isPaid ? '🔄 جعل مجاني' : '⭐ ترقية'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.username}')">🗑️ حذف</button>
                ` : ''}
            </td>
        </tr>`;
    });
    html += '</table>';
    return html;
}

function filterUsers(filter) {
    renderAdmin(filter);
}

// ========== لوحة الإدارة ==========
async function renderAdmin(filter = null) {
    const users = await apiGet('/api/users');
    coursesCache = await apiGet('/api/courses');
    const upgradeRequests = await apiGet('/api/upgrade-requests');
    
    let filteredUsers = users;
    if (filter === 'paid') filteredUsers = users.filter(u => u.plan === 'paid' && u.role !== 'admin');
    else if (filter === 'free') filteredUsers = users.filter(u => u.plan === 'free' && u.role !== 'admin');
    else if (filter === 'banned') filteredUsers = users.filter(u => u.banned === true && u.role !== 'admin');

    let html = `<h2><i class="fas fa-crown"></i> لوحة الإدارة</h2>`;
    html += renderAllUsers(filteredUsers);

    html += `<h3 style="margin-top:30px;">⬆️ طلبات الترقية</h3>`;
    if (!upgradeRequests.length) html += '<p>لا توجد طلبات.</p>';
    else {
        html += '<table class="admin-table"><tr><th>المستخدم</th><th>الاسم الكامل</th><th>الهاتف</th><th>المدة</th><th>الحالة</th><th>إجراء</th></tr>';
        upgradeRequests.forEach(r => {
            html += `<tr>
                <td>${r.username}</td>
                <td>${r.fullName || ''}</td>
                <td>${r.phone || ''}</td>
                <td>${r.duration || ''}</td>
                <td>${r.status}</td>
                <td>
                    ${r.status === 'pending' ? `<button class="btn btn-sm" onclick="approveUpgrade('${r.username}')">موافقة</button>` : ''}
                </td>
            </tr>`;
        });
        html += '</table>';
    }

    html += `<h3 style="margin-top:30px;">📚 إدارة المحتوى</h3>
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <select id="admin-grade" class="input-field" style="width:auto;"><option value="">اختر الصف</option>${Object.keys(subjectsByGrade).map(g => `<option value="${g}">الصف ${g}</option>`).join('')}</select>
            <select id="admin-subject" class="input-field" style="width:auto;" disabled><option value="">اختر المادة</option></select>
            <button class="btn btn-sm" id="btn-add-subject" style="display:none;" onclick="addNewSubject()">+ مادة جديدة</button>
            <button class="btn" onclick="loadCourseAdmin()">عرض المحتوى</button>
            <button class="btn btn-outline" id="btn-delete-course" style="display:none;" onclick="deleteCourse()">حذف الدورة</button>
            <button class="btn btn-outline" id="btn-delete-subject" style="display:none;" onclick="deleteSubject()">حذف المادة</button>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
            <button class="btn btn-sm" onclick="showSendNotification()">📢 إرسال إشعار</button>
            <button class="btn btn-primary" onclick="addNewSubjectDirect()">➕ إضافة مادة جديدة (للصف المختار)</button>
        </div>
        <div id="admin-course-content"></div>`;

    // زر تغيير كلمة مرور الأدمن
    html += `<div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="showChangePasswordModal()">🔑 تغيير كلمة مرور الأدمن</button>
    </div>`;

    mainContent.innerHTML = html;

    const gradeSel = document.getElementById('admin-grade');
    const subjSel = document.getElementById('admin-subject');
    const btnAddSub = document.getElementById('btn-add-subject');
    const btnDelCourse = document.getElementById('btn-delete-course');
    const btnDelSub = document.getElementById('btn-delete-subject');

    gradeSel.addEventListener('change', () => {
        const g = gradeSel.value;
        subjSel.innerHTML = '<option value="">اختر المادة</option>';
        if (g && subjectsByGrade[g]) {
            subjectsByGrade[g].forEach(s => subjSel.innerHTML += `<option value="${s}">${s}</option>`);
            subjSel.disabled = false;
        } else {
            subjSel.disabled = true;
        }
        btnAddSub.style.display = 'none';
        btnDelSub.style.display = 'none';
        btnDelCourse.style.display = 'none';
    });

    subjSel.addEventListener('change', () => {
        const s = subjSel.value;
        const g = gradeSel.value;
        if (s === '__add_new__') {
            btnAddSub.style.display = 'inline-block';
            btnDelSub.style.display = 'none';
            btnDelCourse.style.display = 'none';
        } else if (s) {
            btnAddSub.style.display = 'none';
            btnDelSub.style.display = 'inline-block';
            const courseExists = coursesCache.some(c => c.grade == g && c.subject == s);
            btnDelCourse.style.display = courseExists ? 'inline-block' : 'none';
        } else {
            btnAddSub.style.display = 'none';
            btnDelSub.style.display = 'none';
            btnDelCourse.style.display = 'none';
        }
    });

    const addOption = document.createElement('option');
    addOption.value = '__add_new__';
    addOption.textContent = '➕ إضافة مادة جديدة';
    subjSel.appendChild(addOption);
}

// ========== تغيير كلمة مرور الأدمن ==========
function showChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'flex';
    document.getElementById('passwordChangeMsg').textContent = '';
}

async function changeAdminPassword() {
    const current = document.getElementById('current-password').value.trim();
    const newPass = document.getElementById('new-password').value.trim();
    const confirm = document.getElementById('confirm-password').value.trim();
    const msg = document.getElementById('passwordChangeMsg');

    if (!current || !newPass || !confirm) {
        msg.textContent = '⚠️ يرجى ملء جميع الحقول';
        return;
    }
    if (newPass !== confirm) {
        msg.textContent = '⚠️ كلمة المرور الجديدة وتأكيدها غير متطابقين';
        return;
    }
    if (newPass.length < 6) {
        msg.textContent = '⚠️ كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل';
        return;
    }

    msg.textContent = '⏳ جاري التغيير...';
    msg.style.color = '#f59e0b';

    try {
        const res = await fetch('/api/admin/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: current, newPassword: newPass })
        });
        const data = await res.json();
        if (data.error) {
            msg.textContent = '❌ ' + data.error;
            msg.style.color = '#ef4444';
        } else {
            msg.textContent = '✅ ' + data.message;
            msg.style.color = '#4ade80';
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
            setTimeout(() => {
                document.getElementById('changePasswordModal').style.display = 'none';
                alert('✅ تم تغيير كلمة المرور بنجاح! استخدم كلمة المرور الجديدة في下次 تسجيل الدخول.');
            }, 1500);
        }
    } catch (error) {
        msg.textContent = '❌ خطأ في الاتصال بالخادم';
        msg.style.color = '#ef4444';
    }
}

// ========== إضافة مادة مباشرة ==========
function addNewSubjectDirect() {
    const grade = parseInt(document.getElementById('admin-grade').value);
    if (!grade) {
        alert('⚠️ يرجى اختيار الصف أولاً من القائمة المنسدلة.');
        return;
    }
    const newName = prompt('✏️ أدخل اسم المادة الجديدة للصف ' + grade + ':');
    if (!newName) return;
    if (!subjectsByGrade[grade]) subjectsByGrade[grade] = [];
    if (subjectsByGrade[grade].includes(newName)) {
        alert('⚠️ هذه المادة موجودة بالفعل في هذا الصف.');
        return;
    }
    subjectsByGrade[grade].push(newName);
    const subjSel = document.getElementById('admin-subject');
    subjSel.innerHTML = '<option value="">اختر المادة</option>';
    subjectsByGrade[grade].forEach(s => subjSel.innerHTML += `<option value="${s}">${s}</option>`);
    subjSel.value = newName;
    subjSel.dispatchEvent(new Event('change'));
    const addOption = document.createElement('option');
    addOption.value = '__add_new__';
    addOption.textContent = '➕ إضافة مادة جديدة';
    subjSel.appendChild(addOption);
    alert('✅ تمت إضافة المادة "' + newName + '" بنجاح.');
}

// ========== دوال المستخدمين ==========
async function approveUser(username) {
    await apiPut('/api/users/approve', { username });
    renderAdmin();
}
async function rejectUser(username) {
    await apiDelete('/api/users/' + username);
    renderAdmin();
}

// ========== دوال المواد والدورات ==========
async function addNewSubject() {
    const grade = parseInt(document.getElementById('admin-grade').value);
    const newName = prompt('اسم المادة الجديدة:');
    if (!newName) return;
    if (!subjectsByGrade[grade]) subjectsByGrade[grade] = [];
    if (!subjectsByGrade[grade].includes(newName)) {
        subjectsByGrade[grade].push(newName);
        const subjSel = document.getElementById('admin-subject');
        subjSel.innerHTML = '<option value="">اختر المادة</option>';
        subjectsByGrade[grade].forEach(s => subjSel.innerHTML += `<option value="${s}">${s}</option>`);
        subjSel.value = newName;
        subjSel.dispatchEvent(new Event('change'));
    }
}

async function deleteSubject() {
    const grade = parseInt(document.getElementById('admin-grade').value);
    const subject = document.getElementById('admin-subject').value;
    if (!grade || !subject) return;
    if (confirm(`حذف المادة "${subject}" من الصف ${grade}؟`)) {
        if (subjectsByGrade[grade]) {
            subjectsByGrade[grade] = subjectsByGrade[grade].filter(s => s !== subject);
        }
        const courses = await apiGet('/api/courses');
        const courseToDelete = courses.find(c => c.grade === grade && c.subject === subject);
        if (courseToDelete) await apiDelete('/api/courses/' + courseToDelete.id);
        renderAdmin();
    }
}

async function deleteCourse() {
    const grade = parseInt(document.getElementById('admin-grade').value);
    const subject = document.getElementById('admin-subject').value;
    if (!grade || !subject) return;
    const course = coursesCache.find(c => c.grade === grade && c.subject === subject);
    if (course && confirm(`حذف دورة "${subject}" للصف ${grade}؟`)) {
        await apiDelete('/api/courses/' + course.id);
        renderAdmin();
    }
}

async function loadCourseAdmin() {
    const grade = parseInt(document.getElementById('admin-grade').value);
    const subject = document.getElementById('admin-subject').value;
    if (!grade || !subject || subject === '__add_new__') { alert('اختر الصف والمادة'); return; }
    const courses = await apiGet('/api/courses');
    coursesCache = courses;
    let course = courses.find(c => c.grade === grade && c.subject === subject);
    if (!course) {
        const res = await apiPost('/api/courses', { grade, subject, lessons: [] });
        course = { id: res.id, grade, subject, lessons: [] };
        coursesCache.push(course);
    }
    displayCourseEditor(course);
}

function displayCourseEditor(course) {
    const cont = document.getElementById('admin-course-content');
    let html = `<h4>${course.subject} - الصف ${course.grade}</h4>`;
    html += `<button class="btn btn-sm" onclick="deleteCourseById(${course.id})">🗑️ حذف الدورة</button><hr>`;

    if (course.lessons.length === 0) {
        html += '<p>لا توجد دروس.</p>';
    } else {
        html += `<table class="admin-table"><tr><th>الدرس</th><th>أسئلة</th><th>الحالة</th><th>إجراءات</th></tr>`;
        course.lessons.forEach((l, i) => {
            html += `<tr>
                <td>${l.title}</td><td>${l.questions.length}</td><td>${l.free ? '🆓 مجاني' : '🔒 مدفوع'}</td>
                <td>
                    <button class="btn btn-sm" onclick="toggleLessonFree(${course.id}, ${i})">تغيير</button>
                    <button class="btn btn-sm btn-outline" onclick="editLesson(${course.id}, ${i})">تعديل</button>
                    <button class="btn btn-sm btn-outline" onclick="deleteLesson(${course.id}, ${i})">حذف</button>
                </td>
            </tr>`;
        });
        html += `</table>`;
    }

    const formDiv = document.createElement('div');
    formDiv.className = 'card';
    formDiv.style.marginTop = '20px';
    formDiv.innerHTML = `
        <h5>إضافة درس جديد</h5>
        <input id="new-title" class="input-field" placeholder="عنوان الدرس">
        <textarea id="new-content" class="input-field" placeholder="محتوى HTML" rows="6"></textarea>
        <input id="new-image" class="input-field" placeholder="رابط الصورة (اختياري)">
        <input id="new-video" class="input-field" placeholder="رابط فيديو يوتيوب (اختياري)">
        <label style="display:flex;align-items:center;gap:10px;margin:10px 0;"><input type="checkbox" id="new-free" checked> مجاني</label>
        <div id="new-questions"></div>
        <button class="btn btn-sm" onclick="addQuestionField()">+ سؤال</button>
        <button class="btn" onclick="saveNewLesson(${course.id})">حفظ</button>
    `;

    cont.innerHTML = html;
    cont.appendChild(formDiv);
}

function addQuestionField() {
    const container = document.getElementById('new-questions');
    const i = container.children.length;
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <input class="input-field" placeholder="نص السؤال" id="qtext-${i}">
        <input class="input-field" placeholder="خيارات (مفصولة بفاصلة)" id="qopt-${i}">
        <input class="input-field" placeholder="الإجابة الصحيحة (رقم)" id="qans-${i}" type="number" min="0">
    `;
    container.appendChild(div);
}

async function saveNewLesson(courseId) {
    const title = document.getElementById('new-title')?.value.trim();
    const content = document.getElementById('new-content')?.value.trim();
    const image = document.getElementById('new-image')?.value.trim();
    const video = document.getElementById('new-video')?.value.trim();
    const free = document.getElementById('new-free')?.checked ?? true;
    if (!title) return alert('أدخل عنوان الدرس');
    const qCards = document.querySelectorAll('#new-questions .card');
    const questions = [];
    qCards.forEach((_, i) => {
        const t = document.getElementById(`qtext-${i}`)?.value.trim();
        const o = document.getElementById(`qopt-${i}`)?.value.trim();
        const a = document.getElementById(`qans-${i}`)?.value;
        if (t && o && a !== '') questions.push({ q: t, options: o.split(',').map(s => s.trim()), answer: parseInt(a) });
    });

    const courses = await apiGet('/api/courses');
    const course = courses.find(c => c.id == courseId);
    if (course) {
        course.lessons.push({ title, content, image, video, free, questions });
        await apiPut('/api/courses/' + courseId, course);
        coursesCache = await apiGet('/api/courses');
        displayCourseEditor(course);
        alert('تمت إضافة الدرس');
    }
}

async function editLesson(courseId, idx) {
    const courses = await apiGet('/api/courses');
    const course = courses.find(c => c.id == courseId);
    if (!course) return;
    const l = course.lessons[idx];
    const newTitle = prompt('العنوان', l.title);
    if (newTitle !== null) {
        l.title = newTitle;
        const newContent = prompt('المحتوى (HTML)', l.content);
        if (newContent !== null) l.content = newContent;
        const newImage = prompt('رابط الصورة', l.image || '');
        if (newImage !== null) l.image = newImage;
        const newVideo = prompt('رابط الفيديو', l.video || '');
        if (newVideo !== null) l.video = newVideo;
        const newFree = confirm('هل الدرس مجاني؟\nموافق = مجاني، إلغاء = مدفوع');
        l.free = newFree;
        await apiPut('/api/courses/' + courseId, course);
        coursesCache = await apiGet('/api/courses');
        displayCourseEditor(course);
    }
}

async function deleteLesson(courseId, idx) {
    if (!confirm('حذف الدرس؟')) return;
    const courses = await apiGet('/api/courses');
    const course = courses.find(c => c.id == courseId);
    if (course) {
        course.lessons.splice(idx, 1);
        await apiPut('/api/courses/' + courseId, course);
        coursesCache = await apiGet('/api/courses');
        displayCourseEditor(course);
    }
}

async function toggleLessonFree(courseId, idx) {
    const courses = await apiGet('/api/courses');
    const course = courses.find(c => c.id == courseId);
    if (course && course.lessons[idx]) {
        course.lessons[idx].free = !course.lessons[idx].free;
        await apiPut('/api/courses/' + courseId, course);
        coursesCache = await apiGet('/api/courses');
        displayCourseEditor(course);
    }
}

async function deleteCourseById(courseId) {
    if (confirm('حذف الدورة نهائياً؟')) {
        await apiDelete('/api/courses/' + courseId);
        renderAdmin();
    }
}

// ========== البحث ==========
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
if (searchInput) {
    searchInput.addEventListener('input', async function() {
        const q = this.value.trim().toLowerCase();
        if (!q) { searchResults.classList.remove('active'); return; }
        const courses = await apiGet('/api/courses');
        const filtered = courses.filter(c => c.subject.toLowerCase().includes(q) || `الصف ${c.grade}`.includes(q));
        searchResults.innerHTML = filtered.length ? filtered.map(c => `
            <div class="search-result-item" onclick="navigate('course',{grade:${c.grade},subject:'${c.subject}'});searchResults.classList.remove('active')">
                <i class="fas ${subjectIconsFA[c.subject] || 'fa-graduation-cap'}"></i>
                <div><div class="result-text">${c.subject}</div><div class="result-sub">الصف ${c.grade}</div></div>
            </div>`).join('') : '<div class="search-result-item">لا نتائج</div>';
        searchResults.classList.add('active');
    });
    document.addEventListener('click', e => { if (!e.target.closest('.search-wrapper')) searchResults.classList.remove('active'); });
}

// ========== أحداث الشريط الجانبي ==========
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const nav = e.currentTarget.dataset.nav;
        if (nav === 'admin') navigate('admin');
        else if (nav === 'home') navigate('home');
        else if (nav === 'grades') navigate('grades');
        else if (nav === 'progress') navigate('progress');
        else if (nav === 'about') navigate('about');
        else if (nav === 'contact') navigate('contact');
    });
});

// ========== بدء التطبيق ==========
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.getElementById('login-tab').classList.add('hidden');
            document.getElementById('register-tab').classList.add('hidden');
            document.getElementById(tab+'-tab').classList.remove('hidden');
        });
    });

    document.getElementById('login-btn').addEventListener('click', async () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const data = await apiPost('/api/login', { username, password });
        if (data.error) {
            document.getElementById('login-msg').textContent = data.error;
        } else {
            currentUser = data.user;
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('app-main').classList.remove('hidden');
            updateUIForRole(currentUser);
            await loadUserData();
            navigate('home');
        }
    });

    document.getElementById('register-btn').addEventListener('click', async () => {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const plan = document.querySelector('input[name="plan"]:checked').value;
        const contact = document.getElementById('reg-contact').value.trim();
        const msg = document.getElementById('reg-msg');
        if (!username || !password) { msg.textContent = 'يرجى ملء جميع الحقول'; return; }
        if (plan === 'paid' && !contact) { msg.textContent = 'أدخل جهة الاتصال للخطة المدفوعة'; return; }
        const data = await apiPost('/api/register', { username, password, plan, contact });
        if (data.error) {
            msg.textContent = data.error;
        } else {
            // تسجيل الدخول التلقائي
            const loginData = await apiPost('/api/login', { username, password });
            if (loginData.error) {
                msg.textContent = 'تم التسجيل! يمكنك تسجيل الدخول الآن.';
            } else {
                currentUser = loginData.user;
                document.getElementById('login-overlay').style.display = 'none';
                document.getElementById('app-main').classList.remove('hidden');
                updateUIForRole(currentUser);
                await loadUserData();
                navigate('home');
                msg.textContent = '✅ تم التسجيل وتسجيل الدخول تلقائياً';
            }
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        currentUser = null;
        location.reload();
    });
});

function toggleContactField() {
    const plan = document.querySelector('input[name="plan"]:checked').value;
    document.getElementById('contact-field').style.display = plan === 'paid' ? 'block' : 'none';
}

// ========== جعل الدوال عالمية ==========
window.toggleBanUser = toggleBanUser;
window.setUserPlan = setUserPlan;
window.deleteUser = deleteUser;
window.approveUpgrade = approveUpgrade;
window.addNewSubjectDirect = addNewSubjectDirect;
window.renderAdmin = renderAdmin;
window.filterUsers = filterUsers;
window.navigate = navigate;
window.requestUpgrade = requestUpgrade;
window.submitUpgradeRequest = submitUpgradeRequest;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.addNewSubject = addNewSubject;
window.deleteSubject = deleteSubject;
window.deleteCourse = deleteCourse;
window.loadCourseAdmin = loadCourseAdmin;
window.deleteCourseById = deleteCourseById;
window.toggleLessonFree = toggleLessonFree;
window.editLesson = editLesson;
window.deleteLesson = deleteLesson;
window.addQuestionField = addQuestionField;
window.saveNewLesson = saveNewLesson;
window.startExam = startExam;
window.selectExamAnswer = selectExamAnswer;
window.nextExamQuestion = nextExamQuestion;
window.startLessonView = startLessonView;
window.showSendNotification = showSendNotification;
window.toggleNotifications = toggleNotifications;
window.showChangePasswordModal = showChangePasswordModal;
window.changeAdminPassword = changeAdminPassword;