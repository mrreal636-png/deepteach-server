const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== قراءة متغير البيئة ==========
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI غير موجود في متغيرات البيئة!');
    console.error('تأكد من إضافة متغير MONGODB_URI في Render.');
    process.exit(1);
}

console.log('🔗 محاولة الاتصال بقاعدة البيانات...');
console.log(`📌 الرابط المستخدم: ${MONGODB_URI.replace(/\/\/.*@/, '//****:****@')}`);

// ========== الاتصال بقاعدة البيانات ==========
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    initDatabase();
    startServer();
})
.catch(err => {
    console.error('❌ فشل الاتصال بقاعدة البيانات:');
    console.error(err.message);
    if (err.message.includes('ENOTFOUND') || err.message.includes('querySrv')) {
        console.error('⚠️  يبدو أن اسم الكلستر غير صحيح أو أن الرابط خاطئ.');
        console.error('تأكد من نسخ الرابط الصحيح من MongoDB Atlas (يبدأ بـ mongodb+srv://)');
        console.error('وتأكد من استبدال <db_password> بكلمة المرور الصحيحة.');
    } else if (err.message.includes('bad auth')) {
        console.error('⚠️  اسم المستخدم أو كلمة المرور غير صحيحة.');
        console.error('تأكد من اسم المستخدم وكلمة المرور في رابط الاتصال.');
    }
    console.error('❌ تم إنهاء السيرفر بسبب فشل الاتصال بقاعدة البيانات.');
    process.exit(1);
});

// ========== تعريف المخططات (Schemas) ==========
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

const ScoreSchema = new mongoose.Schema({
    username: String,
    courseId: Number,
    lessonIdx: Number,
    score: Number
});
const Score = mongoose.model('Score', ScoreSchema);

const XPSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    xp: { type: Number, default: 0 }
});
const XP = mongoose.model('XP', XPSchema);

const BadgeSchema = new mongoose.Schema({
    username: String,
    badges: [String]
});
const Badge = mongoose.model('Badge', BadgeSchema);

const UpgradeRequestSchema = new mongoose.Schema({
    username: String,
    fullName: String,
    phone: String,
    duration: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
const UpgradeRequest = mongoose.model('UpgradeRequest', UpgradeRequestSchema);

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

// ========== API Routes ==========
app.post('/api/login', async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.put('/api/users/approve', async (req, res) => {
    try {
        const { username } = req.body;
        await User.findOneAndUpdate({ username }, { approved: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.delete('/api/users/:username', async (req, res) => {
    try {
        const username = req.params.username;
        if (username === 'admin') return res.json({ error: 'لا يمكن حذف الأدمن' });
        await User.deleteOne({ username });
        await Score.deleteMany({ username });
        await XP.deleteOne({ username });
        await Badge.deleteOne({ username });
        await UpgradeRequest.deleteMany({ username });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.put('/api/users/:username/toggle-ban', async (req, res) => {
    try {
        const username = req.params.username;
        if (username === 'admin') return res.json({ error: 'لا يمكن حظر الأدمن' });
        const user = await User.findOne({ username });
        if (!user) return res.json({ error: 'المستخدم غير موجود' });
        user.banned = !user.banned;
        await user.save();
        res.json({ success: true, banned: user.banned });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.put('/api/users/:username/set-plan', async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/courses', async (req, res) => {
    try {
        const { grade, subject, lessons } = req.body;
        const last = await Course.findOne().sort({ id: -1 });
        const newId = last ? last.id + 1 : 1;
        const course = new Course({ id: newId, grade, subject, lessons: lessons || [] });
        await course.save();
        res.json({ success: true, id: newId });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.put('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findOne({ id: req.params.id });
        if (!course) return res.json({ error: 'الدورة غير موجودة' });
        Object.assign(course, req.body);
        await course.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        await Course.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/scores', async (req, res) => {
    try {
        const { username, courseId, lessonIdx, score } = req.body;
        const existing = await Score.findOne({ username, courseId, lessonIdx });
        if (existing) {
            existing.score = score;
            await existing.save();
        } else {
            await new Score({ username, courseId, lessonIdx, score }).save();
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/scores/:username', async (req, res) => {
    try {
        const scores = await Score.find({ username: req.params.username });
        const result = {};
        scores.forEach(s => {
            if (!result[s.courseId]) result[s.courseId] = [];
            result[s.courseId][s.lessonIdx] = s.score;
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/xp', async (req, res) => {
    try {
        const { username, amount } = req.body;
        let xpDoc = await XP.findOne({ username });
        if (!xpDoc) xpDoc = new XP({ username, xp: 0 });
        xpDoc.xp += amount;
        await xpDoc.save();
        res.json({ xp: xpDoc.xp });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/xp/:username', async (req, res) => {
    try {
        const xpDoc = await XP.findOne({ username: req.params.username });
        res.json({ xp: xpDoc ? xpDoc.xp : 0 });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/badges', async (req, res) => {
    try {
        const { username, badgeName } = req.body;
        let badgeDoc = await Badge.findOne({ username });
        if (!badgeDoc) badgeDoc = new Badge({ username, badges: [] });
        if (!badgeDoc.badges.includes(badgeName)) badgeDoc.badges.push(badgeName);
        await badgeDoc.save();
        res.json(badgeDoc.badges);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/badges/:username', async (req, res) => {
    try {
        const badgeDoc = await Badge.findOne({ username: req.params.username });
        res.json(badgeDoc ? badgeDoc.badges : []);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/upgrade-requests', async (req, res) => {
    try {
        const requests = await UpgradeRequest.find();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/upgrade-request', async (req, res) => {
    try {
        const { username, fullName, phone, duration } = req.body;
        const existing = await UpgradeRequest.findOne({ username, status: 'pending' });
        if (existing) return res.json({ error: 'لديك طلب ترقية قيد الانتظار' });
        const request = new UpgradeRequest({ username, fullName, phone, duration });
        await request.save();
        res.json({ message: 'تم إرسال طلب الترقية' });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.put('/api/upgrade-request/approve', async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.delete('/api/upgrade-request/:username', async (req, res) => {
    try {
        await UpgradeRequest.deleteMany({ username: req.params.username });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/notifications/:username', async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [{ to: req.params.username }, { to: 'all' }]
        }).sort({ timestamp: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/notifications', async (req, res) => {
    try {
        const { from, to, message } = req.body;
        await new Notification({ from, to, message }).save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ========== تغيير كلمة مرور الأدمن ==========
app.put('/api/admin/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'يرجى إرسال كلمة المرور الحالية والجديدة' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
        }

        const admin = await User.findOne({ username: 'admin', password: currentPassword });
        if (!admin) {
            return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({ success: true, message: 'تم تغيير كلمة مرور الأدمن بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ========== تهيئة البيانات الأولية ==========
async function initDatabase() {
    try {
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
        } else {
            console.log('✅ حساب admin موجود بالفعل');
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
        } else {
            console.log('✅ دورة فيزياء موجودة بالفعل');
        }
    } catch (err) {
        console.error('❌ خطأ في تهيئة البيانات:', err.message);
    }
}

// ========== بدء تشغيل السيرفر ==========
function startServer() {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
    });
}

// ========== الصفحة الرئيسية ==========
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});