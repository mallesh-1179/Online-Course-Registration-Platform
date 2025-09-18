/* app.js - shared by all pages
   - Stores data in LocalStorage under keys: cc_users, cc_currentUser, cc_courses
   - Demo-only: passwords stored plain in LocalStorage (NOT secure). For real apps use backend + hashing.
*/

/* -------------------- Sample Courses (you can extend) -------------------- */
const SAMPLE_COURSES = [
  {
    id: 'c_js_basics',
    title: 'JavaScript Basics',
    slug: 'javascript-basics',
    description: 'Learn the fundamentals of JavaScript: variables, functions, DOM.',
    category: 'Programming',
    level: 'Beginner',
    price: 0,
    instructor: 'Instructor A',
    lessons: [
      { id: 'l1', title: 'Intro & Setup', duration: 300, url: '' },
      { id: 'l2', title: 'Variables & Types', duration: 600, url: '' }
    ]
  },
  {
    id: 'c_react',
    title: 'React for Beginners',
    slug: 'react-for-beginners',
    description: 'Build interactive UIs with React, JSX, components & state.',
    category: 'Programming',
    level: 'Beginner',
    price: 9.99,
    instructor: 'Instructor B',
    lessons: [
      { id: 'r1', title: 'JSX & Components', duration: 500, url: '' },
      { id: 'r2', title: 'State & Props', duration: 800, url: '' }
    ]
  },
  {
    id: 'c_uiux',
    title: 'UI/UX Essentials',
    slug: 'ui-ux-essentials',
    description: 'Design beautiful and usable interfaces. Design thinking & prototyping.',
    category: 'Design',
    level: 'Intermediate',
    price: 14.99,
    instructor: 'Instructor C',
    lessons: [
      { id: 'u1', title: 'Design Principles', duration: 700, url: '' }
    ]
  }
];

/* -------------------- Storage helpers -------------------- */
function lsGet(key, fallback = null){
  const v = localStorage.getItem(key);
  if(!v) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}
function lsSet(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

/* initialize courses on first load */
if(!lsGet('cc_courses')){
  lsSet('cc_courses', SAMPLE_COURSES);
}

/* ensure user list */
if(!lsGet('cc_users')) lsSet('cc_users', []);

/* currentUser helpers */
function getCurrentUser(){ return lsGet('cc_currentUser', null); }
function setCurrentUser(u){ lsSet('cc_currentUser', u); }

/* utility find course by slug or id */
function getCourseBySlug(slug){
  const courses = lsGet('cc_courses', []);
  return courses.find(c => c.slug === slug);
}
function getCourseById(id){
  const courses = lsGet('cc_courses', []);
  return courses.find(c => c.id === id);
}

/* -------------------- Page: index.html (catalog) -------------------- */
function renderCatalog(){
  const grid = document.getElementById('coursesGrid');
  if(!grid) return;
  const courses = lsGet('cc_courses', []);
  const search = (document.getElementById('search') && document.getElementById('search').value.toLowerCase()) || '';
  const cat = document.getElementById('filterCategory').value;
  const level = document.getElementById('filterLevel').value;

  const filtered = courses.filter(c => {
    if(search && !(c.title.toLowerCase().includes(search) || (c.description||'').toLowerCase().includes(search))) return false;
    if(cat && c.category !== cat) return false;
    if(level && c.level !== level) return false;
    return true;
  });

  grid.innerHTML = '';
  filtered.forEach(c => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${c.title}</h3>
      <div class="muted">${c.category} • ${c.level} • Instructor: ${c.instructor}</div>
      <p style="margin:0.6rem 0">${c.description}</p>
      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center">
        <div class="badge">${c.price === 0 ? 'Free' : '₹' + c.price}</div>
        <a class="btn" href="course.html?slug=${encodeURIComponent(c.slug)}">View Course</a>
      </div>
    `;
    grid.appendChild(card);
  });

  // populate categories dropdown
  const categories = Array.from(new Set(courses.map(c => c.category)));
  const catSelect = document.getElementById('filterCategory');
  if(catSelect && catSelect.children.length === 1){
    categories.forEach(cat => {
      const o = document.createElement('option'); o.value = cat; o.textContent = cat;
      catSelect.appendChild(o);
    });
  }
}

/* attach catalog listeners (search + filters) */
document.addEventListener('input', (e) => {
  if(e.target && (e.target.id === 'search' || e.target.id === 'filterCategory' || e.target.id === 'filterLevel')){
    renderCatalog();
  }
});

/* -------------------- Page: course.html (course detail & enroll) -------------------- */
function renderCourseDetail(){
  const el = document.getElementById('courseDetail');
  if(!el) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const course = getCourseBySlug(slug);
  if(!course){
    el.innerHTML = '<p>Course not found. <a href="index.html">Back to catalog</a></p>';
    return;
  }

  const user = getCurrentUser();
  const enrolledKey = `enroll_${course.id}`;
  const isEnrolled = user && lsGet('cc_enrollments', []).some(en => en.userId === user.email && en.courseId === course.id);

  el.innerHTML = `
    <div class="course-detail">
      <div class="main">
        <h2>${course.title}</h2>
        <div class="muted">${course.category} • ${course.level} • Instructor: ${course.instructor}</div>
        <p style="margin-top:.6rem">${course.description}</p>
        <hr style="margin:1rem 0" />
        <h3>Lessons</h3>
        <ul id="lessonList"></ul>
      </div>

      <aside class="aside">
        <div><strong>Price:</strong> ${course.price === 0 ? 'Free' : '₹' + course.price}</div>
        <div style="margin-top:.6rem"><strong>Enrolled:</strong> ${isEnrolled ? 'Yes' : 'No'}</div>
        <div style="margin-top:1rem">
          ${isEnrolled ? `<a class="btn" id="gotoCourse">Go to Course</a>` : `<button class="btn" id="enrollBtn">${course.price === 0 ? 'Enroll for Free' : 'Enroll'}</button>`}
        </div>
      </aside>
    </div>
  `;

  const lessonList = document.getElementById('lessonList');
  course.lessons.forEach(ln => {
    const li = document.createElement('li');
    li.textContent = ln.title + (ln.duration ? ` — ${Math.round(ln.duration/60)}m` : '');
    lessonList.appendChild(li);
  });

  const enrollBtn = document.getElementById('enrollBtn');
  if(enrollBtn){
    enrollBtn.addEventListener('click', () => {
      const user = getCurrentUser();
      if(!user){
        alert('Please login or register to enroll.');
        window.location.href = 'login.html';
        return;
      }
      enrollUser(user, course.id);
      alert('Enrolled successfully!');
      window.location.reload();
    });
  }

  const goto = document.getElementById('gotoCourse');
  if(goto){
    goto.addEventListener('click', () => {
      // For demo: just show alert or navigate to dashboard
      window.location.href = 'dashboard.html';
    });
  }
}

/* -------------------- Enrollment storage -------------------- */
function enrollUser(user, courseId){
  const list = lsGet('cc_enrollments', []);
  if(list.some(e => e.userId === user.email && e.courseId === courseId)) return;
  list.push({ userId: user.email, courseId, enrolledAt: new Date().toISOString(), progress: {} });
  lsSet('cc_enrollments', list);
}

/* -------------------- Login/Register (login.html) -------------------- */
function attachAuthHandlers(){
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;
      const users = lsGet('cc_users', []);
      const u = users.find(x => x.email === email && x.password === password);
      if(!u){ alert('Invalid credentials'); return; }
      setCurrentUser({ name: u.name, email: u.email, role: u.role });
      alert('Logged in as ' + u.name);
      window.location.href = 'dashboard.html';
    });

    // show register
    document.getElementById('showRegister').addEventListener('click', (ev) => {
      ev.preventDefault();
      document.getElementById('registerBox').classList.remove('hidden');
      loginForm.parentElement.classList.add('hidden');
    });
  }

  const registerForm = document.getElementById('registerForm');
  if(registerForm){
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const password = document.getElementById('regPassword').value;
      const role = document.getElementById('regRole').value;
      if(password.length < 6){ alert('Password must be at least 6 characters'); return; }
      const users = lsGet('cc_users', []);
      if(users.some(u => u.email === email)){ alert('Email already registered'); return; }
      users.push({ name, email, password, role });
      lsSet('cc_users', users);
      setCurrentUser({ name, email, role });
      alert('Registered & logged in as ' + name);
      window.location.href = 'dashboard.html';
    });

    document.getElementById('showLogin').addEventListener('click', (ev) => {
      ev.preventDefault();
      registerForm.parentElement.classList.add('hidden');
      document.querySelector('#loginForm').parentElement.classList.remove('hidden');
    });
  }
}

/* -------------------- Dashboard (dashboard.html) -------------------- */
function renderDashboard(){
  const el = document.getElementById('myCoursesGrid');
  const welcome = document.getElementById('welcomeUser');
  if(!el) return;
  const user = getCurrentUser();
  if(!user){
    el.innerHTML = `<div class="card"><p>Please <a href="login.html">login</a> to see your courses.</p></div>`;
    if(welcome) welcome.textContent = '';
    return;
  }
  welcome.textContent = `Welcome, ${user.name} (${user.role})`;

  const enrolls = lsGet('cc_enrollments', []).filter(e => e.userId === user.email);
  if(enrolls.length === 0){
    el.innerHTML = `<div class="card"><p>You are not enrolled in any courses. Browse <a href="index.html">courses</a>.</p></div>`;
    return;
  }

  el.innerHTML = '';
  enrolls.forEach(en => {
    const course = getCourseById(en.courseId);
    if(!course) return;
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${course.title}</h3>
      <div class="muted">${course.category} • ${course.level} • Instructor: ${course.instructor}</div>
      <p style="margin:.5rem 0">Enrolled on: ${new Date(en.enrolledAt).toLocaleDateString()}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto">
        <div><strong>Progress:</strong> ${Math.round((Object.keys(en.progress).length / Math.max(1, course.lessons.length)) * 100)}%</div>
        <a class="btn" href="course.html?slug=${encodeURIComponent(course.slug)}">Open</a>
      </div>
    `;
    el.appendChild(card);
  });
}

/* -------------------- Nav updates & logout -------------------- */
function updateNav(){
  const user = getCurrentUser();
  const navAuth = document.getElementById('navAuth');
  const navAuth2 = document.getElementById('navAuth2');
  const navAuth3 = document.getElementById('navAuth3');
  if(user){
    const text = `${user.name} (Logout)`;
    if(navAuth) navAuth.textContent = user.name;
    if(navAuth2) navAuth2.textContent = user.name;
    if(navAuth3) navAuth3.textContent = user.name;
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setCurrentUser(null);
      alert('Logged out');
      window.location.href = 'index.html';
    });
  }
}

/* -------------------- Init: decide what to render on each page -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  attachAuthHandlers();
  renderCatalog();
  renderCourseDetail();
  renderDashboard();
});
