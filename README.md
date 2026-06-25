# Quick-commerce
QuickBite is a hyperlocal 30-minute food delivery web app.
Onprogress

# 🚀 QUICK START GUIDE - Authentication Integration

## 📋 What You Now Have

You've created a **complete backend authentication system** with:

✓ User registration & login  
✓ Password hashing with bcrypt  
✓ Session management  
✓ OTP support  
✓ Protected pages  
✓ Logout functionality  

---

## ⚡ 5-MINUTE SETUP

### **1. Install Express** (Node.js backend framework)
```bash
npm install express
```

### **2. Start the Server**
```bash
node server.js
```

**Expected Output:**
```
🚀 Authentication server running at http://localhost:3000
📝 Test login: test@example.com / Test@123
```

### **3. Test Registration**
Go to: `http://localhost:3000/registration.html`

### **4. Test Login**
Go to: `http://localhost:3000/login-auth.html`

Use test account:
- Email: `test@example.com`
- Password: `Test@123`

### **5. Update Your Pages**
Add this to your `index.html` in the `<head>`:
```html
<script src="auth-guard-new.js"></script>
```

This will:
- ✓ Check if user is logged in
- ✓ Show logout button
- ✓ Redirect to login if not authenticated

---

## 📁 4 NEW FILES CREATED

| # | File | Purpose | Location |
|---|------|---------|----------|
| 1 | **server.js** | Backend API server | Run: `node server.js` |
| 2 | **login-auth.html** | Login page | Visit: http://localhost:3000 |
| 3 | **registration.html** | Sign up page | Visit: http://localhost:3000 |
| 4 | **auth-guard-new.js** | Authentication checker | Include in pages |

---

## 🔄 How It Works

```
User Registration:
  registration.html → server.js /api/register → Database
         ↓
      Hash password with bcrypt
         ↓
      Store user safely

User Login:
  login-auth.html → server.js /api/login → Compare passwords
         ↓
      Create session
         ↓
      Return user data
         ↓
      Redirect to dashboard (index.html)

Protected Pages:
  auth-guard-new.js checks /api/me endpoint
         ↓
      User logged in? → Load page
      Not logged in? → Redirect to login
```

---

## 🎯 Integration Steps

### **Step 1: Keep Server Running**
Open terminal and run:
```bash
node server.js
```
*(Keep this running in background)*

### **Step 2: Update index.html (Your Dashboard)**
Add ONE line to your `<head>` section:
```html
<script src="auth-guard-new.js"></script>
```

### **Step 3: Update Other Protected Pages**
Same as Step 2 - add the same script tag to any page that requires login

### **Step 4: Test It Out**
1. Go to http://localhost:3000/registration.html
2. Create an account
3. Login
4. Try accessing index.html (it should work)
5. Clear browser cookies and try index.html (should redirect to login)

---

## 💡 Code Examples

### **Get Current User**
```javascript
async function whoAmI() {
  const res = await fetch('http://localhost:3000/api/me', {
    credentials: 'include'
  });
  const user = await res.json();
  console.log('I am:', user.user.email);
}

whoAmI();
```

### **Logout Programmatically**
```javascript
logout(); // Function from auth-guard-new.js
```

### **Check If User Has Admin Role**
```javascript
async function isAdmin() {
  const res = await fetch('http://localhost:3000/api/me', {
    credentials: 'include'
  });
  const data = await res.json();
  return data.user.role === 'admin';
}

if (await isAdmin()) {
  console.log('You are admin!');
}
```

---

## 🔐 Important Security Points

| Point | Action |
|-------|--------|
| **Server Secret** | Change `'your-super-secret-key-change-this'` in server.js |
| **Passwords** | Never stored in plain text - always hashed with bcrypt |
| **Sessions** | Stored server-side, cookie in browser is just a reference |
| **HTTPS** | Use in production (secure: true in cookie config) |
| **Database** | Currently using in-memory storage - add real DB for production |

---

## ❌ Common Issues & Fixes

### **"Connection error"**
- ✓ Make sure `node server.js` is running
- ✓ Check if something is using port 3000
- ✓ Try: `netstat -ano | findstr :3000` (Windows)

### **"Session not persisting"**
- ✓ Make sure cookies are enabled in browser
- ✓ Check that `credentials: 'include'` is in fetch calls

### **"Email already registered"**
- ✓ Use a different email, or restart server to clear in-memory database

### **"CORS error"**
- ✓ Make sure front-end is accessing `http://localhost:3000`
- ✓ Not `file://` protocol

---

## 📊 Authentication Endpoints

### **Register**
```
POST http://localhost:3000/api/register
Body: { "email": "...", "password": "...", "confirmPassword": "..." }
```

### **Login**
```
POST http://localhost:3000/api/login
Body: { "email": "...", "password": "..." }
Returns: Session cookie + user data
```

### **Check Authentication**
```
GET http://localhost:3000/api/me
Returns: { authenticated: true, user: {...} }
```

### **Logout**
```
POST http://localhost:3000/api/logout
Destroys: Session
```

---

## 📚 Documentation Files

We created 4 documentation files for you:

1. **AUTHENTICATION_GUIDE.md** - Complete API documentation
2. **SETUP_GUIDE.md** - File structure & relationships
3. **EXAMPLE-PROTECTED-PAGE.html** - Code examples & patterns
4. **This file** - Quick reference

---

## ✅ Verification Checklist

Before declaring victory, verify:

- [ ] Run: `npm install express`
- [ ] Run: `node server.js` (server starts on port 3000)
- [ ] Visit: http://localhost:3000/registration.html (can create account)
- [ ] Visit: http://localhost:3000/login-auth.html (can login)
- [ ] Login works with test account (test@example.com / Test@123)
- [ ] Added `<script src="auth-guard-new.js"></script>` to index.html
- [ ] Visit index.html (if logged in, loads; if not, redirects to login)
- [ ] Logout button appears in top-right corner
- [ ] Clicking logout removes session and redirects to login

---

## 🎓 Next Steps (Advanced)

1. **Use Real Database**
   - Replace `users` Map with MongoDB/PostgreSQL
   - Save passwords in database

2. **Email Verification**
   - Send verification link on registration
   - Check email before allowing login

3. **Reset Password**
   - Add /api/forgot-password endpoint
   - Send reset link via email

4. **Two-Factor Authentication**
   - Use OTP endpoints already in server.js
   - Send OTP via email/SMS

5. **OAuth Integration**
   - Add Google/GitHub login
   - Keep your auth as backup

6. **Production Deployment**
   - Deploy server.js to Heroku/Azure/AWS
   - Change localhost:3000 to your domain
   - Enable HTTPS
   - Set secure cookies

---

## 📞 Quick Reference

**Test Account:**
- Email: test@example.com
- Password: Test@123

**Server Command:**
```bash
node server.js
```

**Add to Your Pages:**
```html
<script src="auth-guard-new.js"></script>
```

**Manual Logout (in your code):**
```javascript
logout();
```

**Get Current User (in your code):**
```javascript
// Built-in variable (set by auth-guard-new.js)
console.log(currentUser);
```

---

**You're all set! 🎉**

Keep `node server.js` running and your authentication system is ready to use!
