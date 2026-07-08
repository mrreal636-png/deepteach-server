const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== الاتصال بقاعدة البيانات ==========
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deepteach';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ تم الاتصال بقاعدة البيانات'))
    .catch(err => console.error('❌ فشل الاتصال:', err));

// ========== تعريف المخططات (Schemas) ==========

// مستخدم
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'student' },
    plan: { type: String, default: 'free' },
    approved: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    contact: { type: String, default: null },
    subscriptionEnd: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// دورة (مادة)
const LessonSchema = new mongoose.Schema({
    title: String,
    content: String,
    image: String,
    video: String,
    free: { type: Boolean, default: true },
    questions: [{
        q: String,
        options: [String],
        answer: Number
    }]
});

const CourseSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    grade: Number,
    subject: String,
    lessons: [LessonSchema]
});
const Course = mongoose.model('Course', CourseSchema);

// نتائج الامتحانات
const ScoreSchema = new mongoose.Schema({
    username: String,
    courseId: Number,
    lessonIdx: Number,
    score: Number
});
const Score = mongoose.model('Score', ScoreSchema);

// نقاط الخبرة
const XPSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    xp: { type: Number, default: 0 }
});
const XP = mongoose.model('XP', XPSchema);

// الشارات
const BadgeSchema = new mongoose.Schema({
    username: String,
    badges: [String]
});
const Badge = mongoose.model('Badge', BadgeSchema);

// طلبات الترقية
const UpgradeRequestSchema = new mongoose.Schema({
    username: String,
    fullName: String,
    phone: String,
    duration: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
const UpgradeRequest = mongoose.model('UpgradeRequest', UpgradeRequestSchema);

// الإشعارات
const NotificationSchema = new mongoose.Schema({
    from: String,
    to: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});
const Notification = mongoose.model('Notification', NotificationSchema);

// ========== Middleware ==========
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== API ==========

// ----- المستخدمون -----
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.json({ error: 'بيانات خاطئة' });
    if (!user.approved) return res.json({ error: 'بانتظار الموافقة' });
    if (user.banned) return res.json({ error: 'تم حظر هذا الحساب' });
    if (user.plan === 'paid' && user.subscriptionEnd && new Date() > user.subscriptionEnd) {
        user.plan = 'free';
        user.subscriptionEnd = null;
        await user.save();
    }
    res.json({ user: user.toObject() });
});

app.post('/api/register', async (req, res) => {
    const { username, password, plan, contact } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.json({ error: 'المستخدم موجود' });
    const newUser = new User({
        username, password, plan: plan || 'free',
        approved: plan === 'free',
        contact: plan === 'paid' ? contact : null
    });
    await newUser.save();
    res.json({ message: 'تم التسجيل' });
});

app.get('/api/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

app.put('/api/users/approve', async (req, res) => {
    const { username } = req.body;
    await User.findOneAndUpdate({ username }, { approved: true });
    res.json({ success: true });
});

app.delete('/api/users/:username', async (req, res) => {
    const username = req.params.username;
    if (username === 'admin') return res.json({ error: 'لا يمكن حذف الأدمن' });
    await User.deleteOne({ username });
    await Score.deleteMany({ username });
    await XP.deleteOne({ username });
    await Badge.deleteOne({ username });
    await UpgradeRequest.deleteMany({ username });
    res.json({ success: true });
});

app.put('/api/users/:username/toggle-ban', async (req, res) => {
    const username = req.params.username;
    if (username === 'admin') return res.json({ error: 'لا يمكن حظر الأدمن' });
    const user = await User.findOne({ username });
    if (!user) return res.json({ error: 'المستخدم غير موجود' });
    user.banned = !user.banned;
    await user.save();
    res.json({ success: true, banned: user.banned });
});

app.put('/api/users/:username/set-plan', async (req, res) => {
    const username = req.params.username;
    const { plan, duration } = req.body;
    if (username === 'admin') return res.json({ error: 'لا يمكن تغيير خطة الأدمن' });
    const user = await User.findOne({ username });
    if (!user) return res.json({ error: 'المستخدم غير موجود' });
    user.plan = plan;
    if (plan === 'paid' && duration) {
        const now = new Date();
        user.subscriptionEnd = new Date(now.setMonth(now.getMonth() + parseInt(duration)));
    } else if (plan === 'free') {
        user.subscriptionEnd = null;
    }
    await user.save();
    res.json({ success: true, user });
});

// ----- الدورات -----
app.get('/api/courses', async (req, res) => {
    const courses = await Course.find();
    res.json(courses);
});

app.post('/api/courses', async (req, res) => {
    const { grade, subject, lessons } = req.body;
    const last = await Course.findOne().sort({ id: -1 });
    const newId = last ? last.id + 1 : 1;
    const course = new Course({ id: newId, grade, subject, lessons: lessons || [] });
    await course.save();
    res.json({ success: true, id: newId });
});

app.put('/api/courses/:id', async (req, res) => {
    const course = await Course.findOne({ id: req.params.id });
    if (!course) return res.json({ error: 'الدورة غير موجودة' });
    Object.assign(course, req.body);
    await course.save();
    res.json({ success: true });
});

app.delete('/api/courses/:id', async (req, res) => {
    await Course.deleteOne({ id: req.params.id });
    res.json({ success: true });
});

// ----- الدرجات والخبرة والشارات -----
app.post('/api/scores', async (req, res) => {
    const { username, courseId, lessonIdx, score } = req.body;
    const existing = await Score.findOne({ username, courseId, lessonIdx });
    if (existing) {
        existing.score = score;
        await existing.save();
    } else {
        await new Score({ username, courseId, lessonIdx, score }).save();
    }
    res.json({ success: true });
});

app.get('/api/scores/:username', async (req, res) => {
    const scores = await Score.find({ username: req.params.username });
    const result = {};
    scores.forEach(s => {
        if (!result[s.courseId]) result[s.courseId] = [];
        result[s.courseId][s.lessonIdx] = s.score;
    });
    res.json(result);
});

app.post('/api/xp', async (req, res) => {
    const { username, amount } = req.body;
    let xpDoc = await XP.findOne({ username });
    if (!xpDoc) xpDoc = new XP({ username, xp: 0 });
    xpDoc.xp += amount;
    await xpDoc.save();
    res.json({ xp: xpDoc.xp });
});

app.get('/api/xp/:username', async (req, res) => {
    const xpDoc = await XP.findOne({ username: req.params.username });
    res.json({ xp: xpDoc ? xpDoc.xp : 0 });
});

app.post('/api/badges', async (req, res) => {
    const { username, badgeName } = req.body;
    let badgeDoc = await Badge.findOne({ username });
    if (!badgeDoc) badgeDoc = new Badge({ username, badges: [] });
    if (!badgeDoc.badges.includes(badgeName)) badgeDoc.badges.push(badgeName);
    await badgeDoc.save();
    res.json(badgeDoc.badges);
});

app.get('/api/badges/:username', async (req, res) => {
    const badgeDoc = await Badge.findOne({ username: req.params.username });
    res.json(badgeDoc ? badgeDoc.badges : []);
});

// ----- طلبات الترقية -----
app.get('/api/upgrade-requests', async (req, res) => {
    const requests = await UpgradeRequest.find();
    res.json(requests);
});

app.post('/api/upgrade-request', async (req, res) => {
    const { username, fullName, phone, duration } = req.body;
    const existing = await UpgradeRequest.findOne({ username, status: 'pending' });
    if (existing) return res.json({ error: 'لديك طلب ترقية قيد الانتظار' });
    const request = new UpgradeRequest({ username, fullName, phone, duration });
    await request.save();
    res.json({ message: 'تم إرسال طلب الترقية' });
});

app.put('/api/upgrade-request/approve', async (req, res) => {
    const { username } = req.body;
    const request = await UpgradeRequest.findOne({ username, status: 'pending' });
    if (!request) return res.json({ error: 'لا يوجد طلب معلق' });
    request.status = 'approved';
    await request.save();
    const user = await User.findOne({ username });
    if (user) {
        user.plan = 'paid';
        const now = new Date();
        user.subscriptionEnd = new Date(now.setMonth(now.getMonth() + 12));
        await user.save();
    }
    res.json({ message: 'تمت الموافقة على الترقية' });
});

app.delete('/api/upgrade-request/:username', async (req, res) => {
    await UpgradeRequest.deleteMany({ username: req.params.username });
    res.json({ success: true });
});

// ----- الإشعارات -----
app.get('/api/notifications/:username', async (req, res) => {
    const notifications = await Notification.find({
        $or: [{ to: req.params.username }, { to: 'all' }]
    }).sort({ timestamp: -1 });
    res.json(notifications);
});

app.post('/api/notifications', async (req, res) => {
    const { from, to, message } = req.body;
    await new Notification({ from, to, message }).save();
    res.json({ success: true });
});

// ----- تهيئة البيانات الأولية (مرة واحدة عند التشغيل الأول) -----
async function initDatabase() {
    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
        const newAdmin = new User({
            username: 'admin',
            password: 'admin',
            role: 'admin',
            approved: true,
            plan: 'paid',
            banned: false
        });
        await newAdmin.save();
        console.log('✅ تم إنشاء حساب admin');
    }

    const course = await Course.findOne({ subject: 'فيزياء' });
    if (!course) {
        const newCourse = new Course({
            id: 1,
            grade: 10,
            subject: 'فيزياء',
            lessons: [
                {
                    title: 'الحركة المستقيمة المنتظمة',
                    content: '<p>الحركة المستقيمة المنتظمة: d = v × t</p>',
                    image: '',
                    video: '',
                    free: true,
                    questions: [
                        { q: 'السرعة في الحركة المنتظمة:', options: ['ثابتة', 'متغيرة'], answer: 0 }
                    ]
                }
            ]
        });
        await newCourse.save();
        console.log('✅ تم إنشاء دورة فيزياء افتراضية');
    }
}

// ========== الصفحة الرئيسية ==========
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== بدء التشغيل ==========
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
    await initDatabase();
});