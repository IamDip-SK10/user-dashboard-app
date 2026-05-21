# UserHub Dashboard

A modern Angular-based User Management Dashboard designed to manage users efficiently with dynamic CRUD operations, role-based analytics, search functionality, and real-time visual insights.

🔗 **Live Demo:** https://userhubdashboard.netlify.app  
🔗 **GitHub Repository:** https://github.com/iamDip-SK10/user-dashboard-app  

---

## ✨ Features

### User Management
- Add new users dynamically
- Delete existing users
- Real-time updates without page refresh
- Role-based user classification (Admin / Editor / Viewer)

### Search & Navigation
- Search users by name or email
- Client-side pagination support
- Dynamic user count display

### Analytics & Visualization
- Real-time role distribution pie chart
- Automatic chart updates on add/delete operations
- Interactive Chart.js visualization

### UI / Performance
- Responsive dashboard layout
- Modern card-based interface
- Lazy-loaded modal component
- Optimized rendering using **OnPush Change Detection**
- Reactive state handling using RxJS

---

## 🛠 Tech Stack

**Frontend**
- Angular
- TypeScript
- HTML

**Libraries & Tools**
- Chart.js
- RxJS

**Deployment**
- Netlify

---

## 📂 Project Structure

```bash
src/
└── app/
    ├── app.component.ts
    ├── user-dashboard.component.ts
    ├── user-form.component.ts
    ├── user.model.ts
    └── user.service.ts
