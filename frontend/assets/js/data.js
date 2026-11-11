/* =====================================================================
   SkillRadius — catalog data
   Sample content shared by every page. Replace with API calls
   (e.g. GET /api/courses) when the backend is ready; the shapes below
   are what the pages expect.
   Lesson format: [title, type, duration] where type is video | notes | quiz.
===================================================================== */
window.SR = window.SR || {};

SR.instructors = {
  skillradius: { name: "SkillRadius Studio", role: "In-house curriculum team", color: "#3c59c8", bio: "Our curriculum team designs every course with working professionals and reviews it each quarter so the content stays current." },
  priya: { name: "Priya Raman", role: "Senior Engineer, ex-Flipkart", color: "#7a4fe0", bio: "Priya has shipped web platforms used by millions and has trained 3,000+ developers in React and Node.js over the last six years." },
  arjun: { name: "Arjun Menon", role: "Analytics Lead, Fintech", color: "#1b7f45", bio: "Arjun leads a 12-person analytics team and teaches practical, business-first data analysis with Python, SQL and Power BI." },
  neha: { name: "Neha Kapoor", role: "Product Designer", color: "#e2445c", bio: "Neha designs consumer apps and runs hands-on design sprints for startups and student teams across Bengaluru." },
  kabir: { name: "Kabir Shah", role: "Filmmaker & Creator", color: "#c2410c", bio: "Kabir shoots brand films on phones and mirrorless cameras and has taught mobile filmmaking to 20,000+ creators." },
  rahul: { name: "Dr. Rahul Sharma", role: "Director, SkillRadius Academy", color: "#1e3fbf", bio: "Rahul oversees certification standards and exam quality at SkillRadius and has 15 years of experience in software education." }
};

SR.courses = [
  {
    id: "ai-automation", title: "AI Automation: Automate Any Process Without Coding", short: "AI Automation",
    subtitle: "Build smart systems that handle emails, meetings, data entry, reports and repetitive tasks automatically.",
    cat: "AI & Automation", img: "assets/img/ai-automation.jpg", level: "Beginner", lang: "English",
    rating: 4.2, reviews: 1506, learners: 8420, hours: 3, articles: 14, resources: 80, price: 1200, mrp: 7300, bestseller: true,
    instructor: "skillradius", updated: "Jan 2026",
    overview: [
      "AI Automation is transforming how modern businesses and professionals operate. In this hands-on course, you'll learn how to automate repetitive tasks, streamline workflows, and build intelligent systems using AI tools without needing advanced programming skills.",
      "From automating emails and calendar scheduling to creating smart workflows for businesses, this course will help you design automation systems that save time, reduce errors, and increase productivity.",
      "Whether you're a freelancer, student, entrepreneur, or working professional, automation is a superpower you can't ignore."
    ],
    outcomes: ["Understand the fundamentals of AI automation and workflow design", "Automate email responses using AI", "Build smart calendar scheduling systems", "Create automated task management flows", "Connect apps using automation tools", "Automate repetitive office tasks", "Extract and process data automatically", "Design client-ready automation solutions", "Use AI tools for content generation & reporting", "Build end-to-end automation systems without coding"],
    requirements: ["A laptop with a modern browser", "Free accounts on n8n and Google Workspace (we show you how)", "No coding experience needed"],
    modules: [
      { title: "Introduction to AI Automation", lessons: [["Understanding Workflows & Logic", "video", "10:25"], ["Workflows & Logic Intro Notes", "notes", "6 min"], ["Quiz: Automation basics", "quiz", "5 Q"]] },
      { title: "Understanding Workflows & Logic", lessons: [["Triggers, actions and conditions", "video", "12:40"], ["Branching and loops", "video", "09:15"], ["Quiz: Workflow logic", "quiz", "8 Q"]] },
      { title: "Email Automation Systems", lessons: [["Auto-replies with AI", "video", "14:05"], ["Sorting and labelling your inbox", "video", "11:30"], ["Email templates pack", "notes", "8 min"]] },
      { title: "Calendar & Meeting Automation", lessons: [["Smart scheduling links", "video", "08:50"], ["Meeting notes to tasks", "video", "13:10"], ["Quiz: Calendar flows", "quiz", "6 Q"]] },
      { title: "Business Process Automation", lessons: [["Invoices and reports on autopilot", "video", "15:20"], ["Capstone: automate a small business", "video", "18:45"], ["Final quiz", "quiz", "15 Q"]] }
    ]
  },
  {
    id: "full-stack", title: "Full Stack Development", short: "Full Stack",
    subtitle: "Master React, Node.js and modern databases by building and deploying three real projects.",
    cat: "Development", img: "assets/img/full-stack.jpg", level: "Beginner", lang: "English",
    rating: 4.5, reviews: 1506, learners: 12840, hours: 42, articles: 38, resources: 120, price: 2499, mrp: 9999, bestseller: true,
    instructor: "priya", updated: "Feb 2026",
    overview: ["Go from HTML basics to a deployed full stack app. You'll build a task manager, an e-commerce store and a real-time chat app using React, Node.js, Express and PostgreSQL.", "Every module ends with a project milestone, so by the end you'll have a portfolio you can show employers."],
    outcomes: ["Build responsive UIs with React and hooks", "Design REST APIs with Node.js and Express", "Model data in PostgreSQL and MongoDB", "Add authentication with JWT", "Deploy apps to the cloud", "Write tests for front end and back end"],
    requirements: ["Basic computer skills", "A laptop that can run VS Code and Node.js"],
    modules: [
      { title: "Web Foundations", lessons: [["How the web works", "video", "09:30"], ["HTML & CSS essentials", "video", "22:10"], ["Quiz: Web basics", "quiz", "10 Q"]] },
      { title: "JavaScript Deep Dive", lessons: [["Functions, scope and closures", "video", "18:40"], ["Async JavaScript", "video", "21:05"], ["Cheat sheet", "notes", "10 min"]] },
      { title: "React", lessons: [["Components and props", "video", "16:20"], ["Hooks & side effects", "video", "19:45"], ["Quiz: React Hooks", "quiz", "20 Q"]] },
      { title: "Node.js & Express APIs", lessons: [["Your first API", "video", "17:30"], ["Auth with JWT", "video", "20:15"], ["API design notes", "notes", "12 min"]] },
      { title: "Databases & Deployment", lessons: [["PostgreSQL basics", "video", "18:00"], ["Deploying to the cloud", "video", "14:35"], ["Capstone project brief", "notes", "8 min"]] }
    ]
  },
  {
    id: "ai-video", title: "AI video generation full Course", short: "AI Video",
    subtitle: "Master AI-powered video creation from script to final render. Learn Veo, generative AI and smart editing workflows.",
    cat: "AI & Automation", img: "assets/img/ai-video.jpg", level: "All levels", lang: "English",
    rating: 4.4, reviews: 1218, learners: 6930, hours: 18, articles: 12, resources: 45, price: 1499, mrp: 5999,
    instructor: "kabir", updated: "Mar 2026",
    overview: ["Learn to write, generate and edit cinematic videos with today's AI tools. You'll plan shots like a director and use generative models to produce them.", "Finish with a 60-second AI short film for your portfolio."],
    outcomes: ["Write scripts and shot lists for AI video", "Prompt Veo and other models for consistent shots", "Edit and grade AI footage", "Add AI voice-over and music", "Publish for YouTube and Reels"],
    requirements: ["No prior video experience needed"],
    modules: [
      { title: "AI Video Fundamentals", lessons: [["What AI video can and can't do", "video", "11:10"], ["Tool landscape", "notes", "7 min"]] },
      { title: "Scripting & Storyboards", lessons: [["From idea to script", "video", "13:25"], ["Storyboards with AI", "video", "12:00"]] },
      { title: "Generating Footage", lessons: [["Prompting Veo for cinematic shots", "video", "16:40"], ["Keeping characters consistent", "video", "14:15"], ["Quiz: Prompting", "quiz", "8 Q"]] },
      { title: "Editing & Publishing", lessons: [["Smart editing workflows", "video", "17:20"], ["Sound, music and voice", "video", "10:50"], ["Final project brief", "notes", "6 min"]] }
    ]
  },
  {
    id: "mobile-cine", title: "Mobile Cinematography full Course", short: "Mobile Cinematography",
    subtitle: "Learn storytelling, camera movement and VN editing. Create pro-level content without expensive gear.",
    cat: "Creative", img: "assets/img/mobile-cinematography.jpg", level: "Beginner", lang: "English, Hindi",
    rating: 4.3, reviews: 864, learners: 5210, hours: 12, articles: 9, resources: 30, price: 999, mrp: 3999,
    instructor: "kabir", updated: "Dec 2025",
    overview: ["Turn the phone in your pocket into a cinema camera. You'll learn framing, lighting, movement and editing in VN, step by step.", "Each module ends with a short shooting assignment reviewed by the community."],
    outcomes: ["Frame shots using composition rules", "Light scenes with natural and cheap lights", "Plan smooth camera moves", "Edit and colour grade in VN", "Tell a story in under 60 seconds"],
    requirements: ["Any smartphone from the last 4 years"],
    modules: [
      { title: "Camera Basics", lessons: [["Phone camera settings", "video", "09:40"], ["Framing and composition", "video", "12:15"]] },
      { title: "Light & Movement", lessons: [["Using natural light", "video", "10:20"], ["Camera moves without a gimbal", "video", "11:45"], ["Quiz: Light", "quiz", "6 Q"]] },
      { title: "Editing in VN", lessons: [["Cutting to music", "video", "14:30"], ["Colour grading", "video", "12:50"]] },
      { title: "Storytelling", lessons: [["Story in 60 seconds", "video", "13:05"], ["Final film brief", "notes", "5 min"]] }
    ]
  },
  {
    id: "portfolio", title: "Design your first portfolio!", short: "Portfolio",
    subtitle: "Design and launch your personal brand website, from concept to a live portfolio in simple steps.",
    cat: "Design", img: "assets/img/portfolio.jpg", level: "Beginner", lang: "English",
    rating: 4.6, reviews: 2031, learners: 9480, hours: 8, articles: 10, resources: 25, price: 799, mrp: 2999,
    instructor: "neha", updated: "Jan 2026",
    overview: ["Plan, design and publish a portfolio that gets you noticed. You'll write case studies, design pages in Figma and launch them with a no-code builder."],
    outcomes: ["Write strong case studies", "Design a portfolio in Figma", "Pick a personal brand style", "Publish with a no-code builder", "Get feedback and iterate"],
    requirements: ["A free Figma account"],
    modules: [
      { title: "Plan Your Portfolio", lessons: [["What recruiters look for", "video", "08:30"], ["Choosing your projects", "notes", "6 min"]] },
      { title: "Case Studies", lessons: [["Case study structure", "video", "11:15"], ["Writing that sells", "video", "09:40"]] },
      { title: "Design in Figma", lessons: [["Layouts and grids", "video", "13:20"], ["Type and colour", "video", "10:05"], ["Quiz: Visual design", "quiz", "8 Q"]] },
      { title: "Launch", lessons: [["Publishing your site", "video", "12:10"], ["Launch checklist", "notes", "4 min"]] }
    ]
  },
  {
    id: "automation", title: "Become More Productive with Automation", short: "Productivity Automation",
    subtitle: "Automate notes, meetings and daily workflows. Save hours every week with smart AI automation.",
    cat: "Productivity", img: "assets/img/automation.jpg", level: "All levels", lang: "English",
    rating: 4.5, reviews: 977, learners: 4380, hours: 10, articles: 8, resources: 20, price: 899, mrp: 3499,
    instructor: "skillradius", updated: "Feb 2026",
    overview: ["Practical automations for your everyday work: meeting notes, inbox zero, recurring reports and personal dashboards using Notion, Zapier and AI assistants."],
    outcomes: ["Turn meetings into organized notes automatically", "Set up inbox rules and AI replies", "Automate weekly reports", "Build a personal productivity dashboard"],
    requirements: ["Free accounts on Notion and Zapier"],
    modules: [
      { title: "Productivity Systems", lessons: [["Designing your system", "video", "10:00"], ["Tool setup", "notes", "5 min"]] },
      { title: "Meetings & Notes", lessons: [["AI meeting notes", "video", "12:30"], ["Notes to tasks", "video", "09:45"]] },
      { title: "Zapier Workflows", lessons: [["Multi-step workflows", "video", "14:20"], ["Quiz: Zapier", "quiz", "6 Q"]] }
    ]
  },
  {
    id: "react", title: "React JS Web Development", short: "React JS",
    subtitle: "Components, hooks, context and routing. Build fast, maintainable single-page apps with modern tooling.",
    cat: "Development", img: "assets/img/react.jpg", level: "Intermediate", lang: "English",
    rating: 4.7, reviews: 3120, learners: 15200, hours: 24, articles: 20, resources: 60, price: 1999, mrp: 6999, bestseller: true,
    instructor: "priya", updated: "Mar 2026",
    overview: ["A focused course on modern React: hooks, context, routing, data fetching and performance. You'll build a production-style dashboard app."],
    outcomes: ["Master useState, useEffect and custom hooks", "Share state with Context", "Route with React Router", "Fetch and cache data", "Optimise rendering performance"],
    requirements: ["Comfortable with JavaScript basics"],
    modules: [
      { title: "React Fundamentals", lessons: [["Thinking in components", "video", "12:00"], ["Props and state", "video", "14:30"]] },
      { title: "Hooks", lessons: [["useEffect & data fetching", "video", "16:45"], ["Custom hooks", "video", "13:15"], ["Quiz: React Hooks & Side Effects", "quiz", "20 Q"]] },
      { title: "Context & Routing", lessons: [["useContext explained", "video", "11:50"], ["React Router", "video", "15:05"]] },
      { title: "Performance", lessons: [["Memoisation", "video", "12:40"], ["Project: analytics dashboard", "notes", "10 min"]] }
    ]
  },
  {
    id: "finance-basics", title: "Personal Finance Essentials", short: "Personal Finance",
    subtitle: "Budgeting, saving, investing basics and taxes for young professionals in India.",
    cat: "Business", img: "assets/img/cert-data-ai.jpg", level: "Beginner", lang: "English, Hindi",
    rating: 4.4, reviews: 642, learners: 3120, hours: 6, articles: 10, resources: 15, price: 0, mrp: 0,
    instructor: "skillradius", updated: "Jan 2026",
    overview: ["A free, practical introduction to managing money: budgets, emergency funds, SIPs, insurance and filing your income tax return."],
    outcomes: ["Build a monthly budget", "Understand mutual funds and SIPs", "Choose the right insurance", "File a basic ITR"],
    requirements: ["None"],
    modules: [
      { title: "Money Basics", lessons: [["Budgeting that works", "video", "09:20"], ["Emergency funds", "video", "07:40"]] },
      { title: "Investing", lessons: [["Mutual funds & SIPs", "video", "12:10"], ["Quiz: Investing", "quiz", "8 Q"]] },
      { title: "Taxes", lessons: [["Filing your ITR", "video", "14:00"], ["Tax checklist", "notes", "5 min"]] }
    ]
  }
];

// Dates for batches already running are relative to today, so the demo always has live data.
const srDay = (offset, weekday) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); if (weekday != null) while (d.getDay() !== weekday) d.setDate(d.getDate() - 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

/* Site settings you fill in once.
   · social: paste your real profile links; an empty one shows "launching soon".
   · offer:  the date the discounted course prices end. The "days left" line on course pages
             counts down to it and disappears afterwards. Leave ends:"" for no offer line. */
SR.social = { linkedin: "", instagram: "", youtube: "", x: "", facebook: "" };
SR.offer = { ends: "2026-11-30T23:59:59+05:30" };
SR.offerDaysLeft = () => { const e = SR.offer && SR.offer.ends ? new Date(SR.offer.ends).getTime() : 0, ms = e - Date.now(); return ms > 0 ? Math.ceil(ms / 864e5) : 0; };

SR.trainings = [
  // Running batches (closed for enrolment). They appear for enrolled learners only.
  {
    id: "fsd-oct", closed: true, title: "Full Stack Web Development Bootcamp", batch: "October Weekend Batch", mode: "online",
    start: srDay(-30, 6), weeks: 12, days: "Sat & Sun", time: "10:00–12:00 IST", seats: 40, taken: 40, price: 24999, mrp: 34999,
    trainer: "priya", rating: 4.8, cat: "Development", img: "assets/img/full-stack.jpg", next: "fsd-weekend",
    summary: "12-week trainer-led bootcamp: React, Node.js, PostgreSQL and deployment, with weekly code reviews and a capstone project.",
    assignment: { title: "Build a Todo REST API", dueInDays: 3 },
    topics: ["Kick-off & dev setup", "Modern JavaScript", "Git & GitHub workflows", "Async JavaScript deep-dive", "React components & props", "React state patterns", "Hooks & side effects", "Routing & forms", "Node.js modules & npm", "REST APIs with Express", "Auth with JWT", "Testing APIs", "PostgreSQL basics", "Prisma & data modelling", "Deploying to the cloud"],
    includes: ["48 hours of live sessions", "Recordings of every session", "Weekly 1:1 code reviews", "Capstone project with feedback", "Course certificate"],
    syllabus: [["Weeks 1–2", "JavaScript & Git", "Modern JS, async code, Git workflows"], ["Weeks 3–5", "React", "Components, hooks, routing, state"], ["Weeks 6–8", "Node.js & APIs", "Express, REST, auth, testing"], ["Weeks 9–10", "Databases", "PostgreSQL, Prisma, data modelling"], ["Weeks 11–12", "Capstone & deploy", "Build, review and deploy your project"]]
  },
  {
    id: "data-oct", closed: true, title: "Data Analytics with Python & Power BI", batch: "October Evening Batch", mode: "online",
    start: srDay(-12, 2), weeks: 8, days: "Tue & Thu", time: "19:30–21:00 IST", seats: 35, taken: 35, price: 17999, mrp: 24999,
    trainer: "arjun", rating: 4.7, cat: "Data", img: "assets/img/cert-data-ai.jpg", next: "data-cohort",
    summary: "8-week cohort covering pandas, SQL, dashboards and storytelling with data. Includes 3 industry case studies.",
    assignment: { title: "Sales dataset EDA notebook", dueInDays: 5 },
    topics: ["Python refresher", "pandas basics", "SQL joins in practice", "Cleaning data with pandas", "Exploratory analysis", "Window functions", "Power BI modelling", "DAX essentials"],
    includes: ["24 hours of live sessions", "3 industry case studies", "Recordings of every session", "Course certificate"],
    syllabus: [["Weeks 1–2", "Python for data", "pandas, cleaning, EDA"], ["Weeks 3–4", "SQL", "Joins, windows, CTEs"], ["Weeks 5–6", "Power BI", "Modelling, DAX, dashboards"], ["Weeks 7–8", "Case studies", "Retail, fintech and marketing data"]]
  },
  // Open for enrolment
  {
    id: "fsd-weekend", title: "Full Stack Web Development Bootcamp", batch: "Weekend Batch", mode: "online",
    start: srDay(14, 6), weeks: 12, days: "Sat & Sun", time: "10:00–12:00 IST", seats: 40, taken: 33, price: 24999, mrp: 34999,
    trainer: "priya", rating: 4.8, cat: "Development", img: "assets/img/full-stack.jpg",
    summary: "12-week trainer-led bootcamp: React, Node.js, PostgreSQL and deployment, with weekly code reviews and a capstone project.",
    includes: ["48 hours of live sessions", "Recordings of every session", "Weekly 1:1 code reviews", "Capstone project with feedback", "Course certificate", "Placement prep sessions"],
    syllabus: [["Weeks 1–2", "JavaScript & Git", "Modern JS, async code, Git workflows"], ["Weeks 3–5", "React", "Components, hooks, routing, state"], ["Weeks 6–8", "Node.js & APIs", "Express, REST, auth, testing"], ["Weeks 9–10", "Databases", "PostgreSQL, Prisma, data modelling"], ["Weeks 11–12", "Capstone & deploy", "Build, review and deploy your project"]]
  },
  {
    id: "data-cohort", title: "Data Analytics with Python & Power BI", batch: "Weekday Evening", mode: "online",
    start: srDay(16, 2), weeks: 8, days: "Tue & Thu", time: "19:30–21:00 IST", seats: 35, taken: 21, price: 17999, mrp: 24999,
    trainer: "arjun", rating: 4.7, cat: "Data", img: "assets/img/cert-data-ai.jpg",
    summary: "8-week cohort covering pandas, SQL, dashboards and storytelling with data. Includes 3 industry case studies.",
    includes: ["24 hours of live sessions", "3 industry case studies", "Recordings of every session", "Portfolio-ready dashboards", "Course certificate"],
    syllabus: [["Weeks 1–2", "Python for data", "pandas, cleaning, EDA"], ["Weeks 3–4", "SQL", "Joins, windows, CTEs"], ["Weeks 5–6", "Power BI", "Modelling, DAX, dashboards"], ["Weeks 7–8", "Case studies", "Retail, fintech and marketing data"]]
  },
  {
    id: "uiux-workshop", title: "UI/UX Design Sprint Workshop", batch: "Bengaluru Studio", mode: "in-person",
    start: srDay(21, 6), weeks: 0, days: "Sat & Sun", time: "09:30–17:30", seats: 24, taken: 21, price: 6999, mrp: 9999,
    trainer: "neha", rating: 4.9, cat: "Design", img: "assets/img/cert-uiux.jpg",
    summary: "2-day hands-on design sprint at the SkillRadius studio, Embassy Golf Links. Lunch and materials included.",
    includes: ["2 full days in person", "Lunch and materials", "Real client brief", "Portfolio case study", "Workshop certificate"],
    syllabus: [["Day 1 AM", "Understand", "Brief, interviews, mapping"], ["Day 1 PM", "Sketch", "Crazy 8s, solution sketches"], ["Day 2 AM", "Decide & prototype", "Storyboard, Figma prototype"], ["Day 2 PM", "Test", "User tests and presentation"]]
  },
  {
    id: "mern-intensive", title: "MERN Stack Intensive", batch: "Weekday Morning", mode: "online",
    start: srDay(36, 1), weeks: 10, days: "Mon, Wed & Fri", time: "07:00–08:30 IST", seats: 40, taken: 9, price: 19999, mrp: 27999,
    trainer: "priya", rating: 4.8, cat: "Development", img: "assets/img/cert-mern.jpg",
    summary: "Early-morning batch for working professionals. MongoDB, Express, React and Node with a production-ready capstone.",
    includes: ["45 hours of live sessions", "Recordings of every session", "Mock interviews", "Capstone project", "Course certificate"],
    syllabus: [["Weeks 1–2", "MongoDB", "Schemas, queries, aggregation"], ["Weeks 3–5", "Express & Node", "APIs, middleware, auth"], ["Weeks 6–8", "React", "Hooks, context, data fetching"], ["Weeks 9–10", "Capstone", "Build and deploy"]]
  },
  {
    id: "film-weekend", title: "Mobile Filmmaking Weekend", batch: "Mumbai Studio", mode: "in-person",
    start: srDay(48, 6), weeks: 0, days: "Sat & Sun", time: "10:00–18:00", seats: 20, taken: 6, price: 4999, mrp: 7499,
    trainer: "kabir", rating: 4.8, cat: "Creative", img: "assets/img/mobile-cinematography.jpg",
    summary: "Shoot and edit a short film in two days, on your phone. Small group, hands-on, with a screening at the end.",
    includes: ["2 full days in person", "Lighting and audio kit provided", "Screening of your film", "Workshop certificate"],
    syllabus: [["Day 1 AM", "Story & shots", "Script, shot list, framing"], ["Day 1 PM", "Shooting", "Light, sound, movement"], ["Day 2 AM", "Editing", "VN, colour, music"], ["Day 2 PM", "Screening", "Feedback and showcase"]]
  }
];

SR.certifications = [
  {
    id: "python", code: "DIC-PDI158", card: "DIC-PD158", title: "Certified Advanced Python Development", level: "Industry Professional",
    img: "assets/img/cert-python.jpg", price: 5999, mrp: 10600, validity: 2, months: 24, enrolled: 2341, rating: 4.8, passRate: 98, tag: "Most Popular", cat: "Development",
    summary: "A premium, proctored credential for professionals who build real-world production-grade software systems using Python.",
    skills: ["Python", "Backend Dev", "API Design", "Data Structures", "OOP", "DevOps"],
    exam: { questions: 20, minutes: 60, pass: 60 },
    modules: ["Introduction to Python & Setup", "Variables, Data Types & Operators", "Input, Output & Formatting", "Control Flow Statements", "Functions & Code Reusability", "Data Structures — Lists & Tuples", "Sets & Dictionaries", "Modules & Packages", "File Handling", "Errors & Exception Handling", "Object-Oriented Programming (OOP)", "Advanced Python & Standard Library"]
  },
  {
    id: "uiux", code: "DIC-AUX1326", card: "DIC-AUX1326", title: "Certified Advanced UI/UX Design", level: "Industry Professional",
    img: "assets/img/cert-uiux.jpg", price: 4999, mrp: 8499, validity: 2, months: 24, enrolled: 1870, rating: 4.7, passRate: 95, cat: "Design",
    summary: "Validate end-to-end product design skills, from research and IA to high-fidelity prototypes and usability testing.",
    skills: ["User Research", "Wireframing", "Figma", "Design Systems", "Usability Testing"],
    exam: { questions: 25, minutes: 75, pass: 65 },
    modules: ["Design Thinking", "User Research", "Information Architecture", "Wireframing", "Visual Design", "Usability Testing"]
  },
  {
    id: "data-ai", code: "DIC-ADSAI223", card: "DIC-ADSAI223", title: "Certified Data Science & AIML", level: "Industry Professional",
    img: "assets/img/cert-data-ai.jpg", price: 8999, mrp: 16499, validity: 2, months: 24, enrolled: 3105, rating: 4.8, passRate: 92, tag: "Trending", cat: "Data",
    summary: "Covers statistics, machine learning, deep learning basics and deploying models, assessed through a proctored exam.",
    skills: ["Statistics", "pandas", "scikit-learn", "Deep Learning", "MLOps"],
    exam: { questions: 30, minutes: 90, pass: 60 },
    modules: ["Python for Data", "Statistics & Probability", "Data Wrangling", "Machine Learning", "Deep Learning Basics", "Model Deployment"]
  },
  {
    id: "mern", code: "DIC-SDFS112", card: "DIC-SDFS112", title: "Certified MERN Full Stack", level: "Industry Professional",
    img: "assets/img/cert-mern.jpg", price: 12999, mrp: 22499, validity: 3, months: 36, enrolled: 1490, rating: 4.7, passRate: 94, cat: "Development",
    summary: "Proves you can design, build and deploy full stack applications with MongoDB, Express, React and Node.js.",
    skills: ["MongoDB", "Express", "React", "Node.js", "Auth", "Deployment"],
    exam: { questions: 30, minutes: 90, pass: 65 },
    modules: ["JavaScript Essentials", "MongoDB", "Express & REST", "React", "Authentication", "Testing", "Deployment"]
  },
  {
    id: "react-pro", code: "DIC-RJS204", published: false, title: "Certified React.js Frontend Developer", level: "Professional",
    img: "assets/img/react.jpg", price: 3999, mrp: 6999, validity: 2, months: 24, enrolled: 2780, rating: 4.6, passRate: 96, cat: "Development",
    summary: "A focused credential for frontend developers covering modern React, state management, testing and performance.",
    skills: ["React", "Hooks", "Redux", "Testing", "Performance"],
    exam: { questions: 20, minutes: 60, pass: 60 },
    modules: ["React Fundamentals", "Hooks", "State Management", "Routing", "Testing", "Performance"]
  },
  {
    id: "java", code: "DIC-JFS-2026-006", title: "Certified Advanced Java Full Stack", level: "Industry Professional",
    img: "assets/img/cert-java.jpg", price: 6999, mrp: 12499, validity: 2, months: 24, enrolled: 1640, rating: 4.7, passRate: 93, cat: "Development",
    summary: "Covers core Java, Spring Boot, REST APIs, databases and a modern frontend, assessed through a proctored exam.",
    skills: ["Java", "Spring Boot", "REST APIs", "SQL", "Microservices"],
    exam: { questions: 30, minutes: 90, pass: 60 },
    modules: ["Core Java", "OOP & Collections", "Spring Boot", "REST APIs", "Databases & JPA", "Frontend Integration", "Testing & Deployment"]
  },
  {
    id: "data-analytics", code: "DIC-DA-2026-007", title: "Certified Advanced Data Analytics", level: "Industry Professional",
    img: "assets/img/cert-da.jpg", price: 8999, mrp: 16499, validity: 2, months: 24, enrolled: 2210, rating: 4.7, passRate: 94, tag: "New", cat: "Data",
    summary: "Excel, SQL, Python and Power BI for business analysis, with case studies and a proctored exam.",
    skills: ["Excel", "SQL", "Python", "Power BI", "Storytelling"],
    exam: { questions: 25, minutes: 75, pass: 60 },
    modules: ["Spreadsheets for Analysis", "SQL", "Python for Analysis", "Statistics", "Power BI", "Case Studies"]
  },
  {
    id: "cyber", code: "DIC-CS-2026-005", title: "Certified Advanced Cybersecurity", level: "Industry Professional",
    img: "assets/img/cert-cyber.jpg", price: 7999, mrp: 14499, validity: 2, months: 24, enrolled: 1380, rating: 4.8, passRate: 90, tag: "In Demand", cat: "Security",
    summary: "Network security, threat analysis, ethical hacking fundamentals and incident response, assessed through a proctored exam.",
    skills: ["Network Security", "Threat Analysis", "Ethical Hacking", "SIEM", "Incident Response"],
    exam: { questions: 30, minutes: 90, pass: 65 },
    modules: ["Security Foundations", "Networks", "Threats & Vulnerabilities", "Ethical Hacking Basics", "Security Operations", "Incident Response"]
  },
  {
    id: "digital-marketing", code: "DIC-DM-2026-008", title: "Certified Advanced Digital Marketing", level: "Industry Professional",
    img: "assets/img/cert-dm.jpg", price: 5499, mrp: 9499, validity: 3, months: 36, enrolled: 1960, rating: 4.5, passRate: 93, cat: "Marketing",
    summary: "SEO, paid ads, social media, email and analytics. Proctored exam with case-based questions.",
    skills: ["SEO", "Google Ads", "Social Media", "Email Marketing", "Analytics"],
    exam: { questions: 25, minutes: 60, pass: 60 },
    modules: ["Marketing Foundations", "SEO", "Paid Ads", "Social Media", "Email Marketing", "Analytics"]
  },
  {
    id: "cloud-arch", code: "DIC-CSAP-2026-010", title: "Certified Cloud Solutions Architect", level: "Professional",
    img: "assets/img/cert-cloud.svg", price: 9999, mrp: 16999, validity: 3, months: 36, enrolled: 1184, rating: 4.9, passRate: 61, tag: "Hardest", cat: "Cloud",
    summary: "Our toughest credential. A 40-question, scenario-based exam on designing secure, resilient, fast and cost-efficient cloud systems, scored on a 100–1000 scale.",
    skills: ["Cloud Architecture", "Networking & VPC", "Identity & Security", "High Availability", "Disaster Recovery", "Cost Optimisation"],
    exam: { questions: 40, minutes: 100, pass: 69, bank: "cloud", pro: true, scaled: { min: 100, max: 1000, pass: 720 }, retakeDays: 14,
      domains: [["Secure architectures", 30], ["Resilient architectures", 25], ["High-performing architectures", 25], ["Cost-optimised architectures", 20]] },
    modules: ["Cloud Foundations & Shared Responsibility", "Networking: VPCs, Subnets & Routing", "Identity, Access & Least Privilege", "Data Protection & Encryption", "Compute & Auto Scaling", "Storage Tiers & Lifecycle", "Databases & Caching", "Decoupling with Queues & Events", "High Availability & Disaster Recovery", "Performance & Observability", "Cost Optimisation & FinOps", "Exam Strategy & Practice"]
  }
];

SR.certWhatYouGet = ["Comprehensive study materials & resources", "Industry-recognized certification", "Certificate valid for {v} years", "24/7 access to learning platform", "Expert-designed curriculum", "Professional development opportunities", "Enhanced career prospects", "Skill validation & credibility", "Job referral network access"];
SR.certBenefits = [["check_circle", "Validate your expertise to employers and clients"], ["show_chart", "Increase your earning potential in the industry"], ["door_open", "Open doors to new career opportunities"], ["chess_knight", "Build credibility and professional reputation"], ["arrow_upward", "Enhance your resume with industry recognition"], ["security", "Join a community of certified professionals"], ["business_center", "Access to exclusive resources and benefits"], ["verified", "Demonstrate commitment to professional development"]];

SR.stories = [
  { quote: "Skill Radius completely changed how I approach learning. The structured modules and real-world projects helped me land my first tech role.", name: "Sneha Iyer", role: "Data Analyst @ TCS", color: "#3c59c8", outcome: "Data Science track", photo: "assets/img/people/sneha.webp", face: "assets/img/people/sneha-face.webp", cutout: true, before: "B.Com graduate", months: 6, result: "First tech job" },
  { quote: "I enrolled in the AI Automation track with zero practical experience. Within 4 months, I was building workflow automations for real clients. Skill Radius didn't just teach theory. It gave me hands-on projects that helped me land my first automation role.", name: "Rohan Mehta", role: "AI Automation Specialist @ Tech Startup", color: "#7a4fe0", outcome: "AI Automation track", photo: "assets/img/people/rohan.webp", face: "assets/img/people/rohan-face.webp", cutout: true, before: "Sales executive", months: 4, result: "+70% salary" },
  { quote: "I always loved storytelling but lacked technical direction. The cinematography course helped me understand lighting, framing, and camera movement professionally. Today, I'm working on independent film projects with confidence.", name: "Arjun Verma", role: "Content Creator", color: "#1b7f45", outcome: "Mobile Cinematography", photo: "assets/img/people/arjun.webp", face: "assets/img/people/arjun-face.webp", cutout: false, before: "Hobby filmmaker", months: 3, result: "Paid film projects" }
];

SR.reviews = [
  { name: "Ananya R.", color: "#7a4fe0", rating: 5, when: "2 weeks ago", text: "Clear explanations and the projects actually felt like real work. I built two automations for my team in the first week." },
  { name: "Vikram S.", color: "#1b7f45", rating: 4, when: "1 month ago", text: "Great pacing. I'd love a few more advanced examples in the last module, but overall very practical." },
  { name: "Meera K.", color: "#e2445c", rating: 5, when: "1 month ago", text: "The quizzes after each module helped me check I really understood things. Worth every rupee." }
];

SR.faq = [
  ["Are SkillRadius certifications recognised by employers?", "Our professional certifications are proctored and industry-recognised, and each one carries a unique certificate ID that employers can verify on our Verify page. Certificates stay valid for 2–3 years depending on the program."],
  ["What's the difference between a course, a training and a certification?", "Courses are self-paced video lessons you can take any time. Trainings are live, trainer-led batches with a fixed schedule. Certifications end in a proctored exam and give you a verifiable credential."],
  ["How does the proctored exam work?", "You take it online from your own computer with your webcam on. A typical exam has 20 questions in 60 minutes, and you need 60% to pass. Switching tabs is flagged for review, and you can retake the exam if you don't pass."],
  ["I missed a live session. Can I catch up?", "Yes. Every live session is recorded and appears in your dashboard under Trainings, usually within a few hours of the session ending."],
  ["Can I get a refund?", "Self-paced courses come with a 30-day money-back guarantee if you've completed less than 30% of the content. Trainings can be refunded up to 3 days before the batch starts. Email support@skillradius.in and refunds arrive in 7–10 business days."]
];

// Demo certificate registry used by the Verify page
SR.registry = {
  "CERT-SR-PD-2026-001": { name: "Satish Hebbal", program: "Certified Advanced Python Development", code: "DIC-PDI158", issued: "2026-10-16", valid: "2028-10-16", score: "80% · Distinction" },
  "CERT-SR-RJS-2026-047": { name: "Sudeep Kulkarni", program: "React.js Frontend Development", code: "CRS-RJS204", issued: "2026-01-25", valid: null, score: "Course completion" }
};

// Exam question bank (Certified Advanced Python Development)
SR.examQuestions = [
  { s: "Basics", q: "What is the output of print(type(3 / 2))?", o: ["<class 'int'>", "<class 'float'>", "<class 'decimal'>", "Error"], a: 1 },
  { s: "Basics", q: "Which of these is an immutable data type?", o: ["list", "dict", "tuple", "set"], a: 2 },
  { s: "Control Flow", q: "What will be the output of the following Python code?", code: "x = 10\nif x > 5:\n    print(\"Greater\")\nelse:\n    print(\"Lesser\")", o: ["\"Greater\"", "\"Lesser\"", "\"Error\"", "\"Nothing\""], a: 0 },
  { s: "Control Flow", q: "How many times does this loop run?", code: "for i in range(2, 10, 3):\n    print(i)", o: ["2", "3", "4", "8"], a: 1 },
  { s: "Control Flow", q: "Which keyword skips the rest of the current loop iteration?", o: ["break", "pass", "continue", "skip"], a: 2 },
  { s: "Functions", q: "What does a function return if it has no return statement?", o: ["0", "None", "False", "An empty string"], a: 1 },
  { s: "Functions", q: "What is printed?", code: "def f(a, b=2):\n    return a * b\nprint(f(3))", o: ["3", "5", "6", "Error"], a: 2 },
  { s: "Functions", q: "Which syntax collects extra keyword arguments into a dict?", o: ["*args", "**kwargs", "&kwargs", "kwargs[]"], a: 1 },
  { s: "Data Structures", q: "What is the result of [1, 2, 3][::-1]?", o: ["[1, 2, 3]", "[3, 2, 1]", "[3]", "Error"], a: 1 },
  { s: "Data Structures", q: "Which method adds an item to the end of a list?", o: ["add()", "push()", "append()", "insert()"], a: 2 },
  { s: "Data Structures", q: "What does {x: x*x for x in range(3)} produce?", o: ["{0: 0, 1: 1, 2: 4}", "[0, 1, 4]", "{0, 1, 4}", "Error"], a: 0 },
  { s: "Data Structures", q: "What is len(set([1, 1, 2, 3, 3]))?", o: ["5", "4", "3", "2"], a: 2 },
  { s: "OOP", q: "What is the conventional name of the first parameter of an instance method?", o: ["this", "self", "cls", "obj"], a: 1 },
  { s: "OOP", q: "Which method is called when an object is created?", o: ["__new__ only", "__init__", "__call__", "__create__"], a: 1 },
  { s: "OOP", q: "Which decorator defines a method that receives the class, not the instance?", o: ["@staticmethod", "@property", "@classmethod", "@abstract"], a: 2 },
  { s: "Errors", q: "Which block always runs, whether or not an exception occurred?", o: ["except", "else", "finally", "raise"], a: 2 },
  { s: "Errors", q: "What exception does int(\"abc\") raise?", o: ["TypeError", "ValueError", "SyntaxError", "KeyError"], a: 1 },
  { s: "Errors", q: "Which statement opens a file and closes it automatically?", o: ["open() ... close()", "with open(...) as f:", "try open(...)", "file.auto()"], a: 1 },
  { s: "Testing", q: "Which built-in module is used for unit testing?", o: ["pytest", "unittest", "testlib", "doctest only"], a: 1 },
  { s: "Testing", q: "What does `assert x == 5` do when x is 4?", o: ["Prints False", "Raises AssertionError", "Returns None", "Nothing"], a: 1 }
];

/* =====================================================================
   Marketing & support content
   (learning paths, events, blog, help center, careers, scholarships, press)
===================================================================== */

// Extra trainer profile details for instructor pages
const srInstr = {
  priya: { slug: "priya", expertise: ["React", "Node.js", "System design", "PostgreSQL"], years: 9, learners: 3200, rating: 4.8, city: "Bengaluru" },
  arjun: { slug: "arjun", expertise: ["Python", "SQL", "Power BI", "Statistics"], years: 11, learners: 2100, rating: 4.7, city: "Bengaluru" },
  neha: { slug: "neha", expertise: ["Product design", "Figma", "User research", "Design sprints"], years: 7, learners: 1450, rating: 4.9, city: "Bengaluru" },
  kabir: { slug: "kabir", expertise: ["Mobile filmmaking", "VN editing", "AI video", "Storytelling"], years: 8, learners: 20400, rating: 4.6, city: "Mumbai" },
  rahul: { slug: "rahul", expertise: ["Assessment design", "Software engineering", "Curriculum"], years: 15, learners: 50000, rating: 4.8, city: "Bengaluru" },
  skillradius: { slug: "skillradius", expertise: ["Curriculum design", "AI tools", "Productivity"], years: 4, learners: 18000, rating: 4.4, city: "Bengaluru" }
};
Object.keys(srInstr).forEach(k => Object.assign(SR.instructors[k], srInstr[k]));

SR.paths = [
  { id: "full-stack-developer", title: "Full Stack Developer", role: "Junior Full Stack Developer", img: "assets/img/full-stack.jpg", months: 6, level: "Beginner to job-ready", price: 34999, mrp: 52496, salary: "₹4.5–9 LPA", color: "#3c59c8",
    summary: "Go from zero to job-ready: self-paced foundations, a 12-week live bootcamp, and the MERN certification to prove it.",
    courses: ["full-stack", "react"], trainings: ["fsd-weekend"], certs: ["mern"],
    skills: ["HTML & CSS", "JavaScript", "React", "Node.js", "PostgreSQL", "MongoDB", "Git", "Deployment"],
    steps: [["Foundations", "Full Stack Development course: HTML, CSS, JavaScript and your first full stack app.", "course", "full-stack"], ["Modern React", "React JS Web Development: hooks, context, routing and performance.", "course", "react"], ["Live bootcamp", "12 weeks with a trainer: APIs, databases, code reviews and a capstone.", "training", "fsd-weekend"], ["Get certified", "Certified MERN Full Stack: a 3-year, proctored credential.", "cert", "mern"], ["Placement support", "Resume review, mock interviews and referrals to hiring partners.", "support", ""]] },
  { id: "data-analyst", title: "Data Analyst", role: "Data / Business Analyst", img: "assets/img/cert-data-ai.jpg", months: 4, level: "Beginner", price: 22999, mrp: 32497, salary: "₹4–8 LPA", color: "#1b7f45",
    summary: "Learn Python, SQL and Power BI with a live cohort, then certify in Data Science & AIML.",
    courses: ["finance-basics"], trainings: ["data-cohort"], certs: ["data-ai"],
    skills: ["Python", "pandas", "SQL", "Power BI", "Statistics", "Storytelling"],
    steps: [["Business basics", "Personal Finance Essentials: free primer on money and markets.", "course", "finance-basics"], ["Live analytics cohort", "8 weeks of pandas, SQL and Power BI with case studies.", "training", "data-cohort"], ["Get certified", "Certified Data Science & AIML: proctored, 2-year credential.", "cert", "data-ai"], ["Placement support", "Portfolio review and analyst interview prep.", "support", ""]] },
  { id: "ui-ux-designer", title: "UI/UX Designer", role: "Product / UI Designer", img: "assets/img/cert-uiux.jpg", months: 3, level: "Beginner", price: 11999, mrp: 21497, salary: "₹4–10 LPA", color: "#e2445c",
    summary: "Build a portfolio, run a real design sprint and certify in UI/UX.",
    courses: ["portfolio"], trainings: ["uiux-workshop"], certs: ["uiux"],
    skills: ["User research", "Wireframing", "Figma", "Prototyping", "Usability testing", "Portfolio"],
    steps: [["Portfolio first", "Design your first portfolio: case studies and a live site.", "course", "portfolio"], ["Design sprint", "2-day in-person workshop with a real client brief.", "training", "uiux-workshop"], ["Get certified", "Certified Advanced UI/UX Design.", "cert", "uiux"], ["Placement support", "Portfolio critique and design interview prep.", "support", ""]] },
  { id: "ai-automation-specialist", title: "AI Automation Specialist", role: "Automation / AI Ops Specialist", img: "assets/img/ai-automation.jpg", months: 2, level: "Beginner", price: 5499, mrp: 16798, salary: "₹3.5–8 LPA", color: "#7a4fe0",
    summary: "Automate real business workflows with AI and no-code tools. Freelance-ready in 8 weeks.",
    courses: ["ai-automation", "automation", "ai-video"], trainings: [], certs: ["digital-marketing"],
    skills: ["n8n", "Zapier", "AI agents", "Prompting", "Workflow design", "Client delivery"],
    steps: [["Automation basics", "AI Automation: automate any process without coding.", "course", "ai-automation"], ["Productivity systems", "Become More Productive with Automation.", "course", "automation"], ["AI content", "AI video generation full course.", "course", "ai-video"], ["Get certified", "Certified Digital Marketing Specialist.", "cert", "digital-marketing"]] }
];

const srAt = (days, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d.getTime(); };
SR.events = [
  { id: "career-in-data", title: "How to start a career in data in 2027", type: "Webinar", date: srAt(2, 19, 0), mins: 60, host: "arjun", seats: 500, registered: 412, img: "assets/img/cert-data-ai.jpg", topics: ["Roles and salaries", "Skills that matter", "Live Q&A"], desc: "A practical walk-through of data roles in India, the skills hiring managers test for, and a 90-day plan to get started." },
  { id: "react-19", title: "What's new in React: hands-on session", type: "Workshop", date: srAt(5, 18, 30), mins: 90, host: "priya", seats: 150, registered: 133, img: "assets/img/react.jpg", topics: ["Actions and forms", "Server components", "Live coding"], desc: "Build a small app live and learn the newest React patterns you'll be asked about in interviews." },
  { id: "portfolio-review", title: "Live portfolio review for designers", type: "AMA", date: srAt(9, 17, 0), mins: 75, host: "neha", seats: 200, registered: 96, img: "assets/img/portfolio.jpg", topics: ["Case study structure", "What recruiters skim", "Live critiques"], desc: "Submit your portfolio link when you register. Neha reviews a selection live and answers your questions." },
  { id: "automation-freelance", title: "Freelancing with AI automation", type: "Webinar", date: srAt(14, 19, 30), mins: 60, host: "skillradius", seats: 500, registered: 220, img: "assets/img/ai-automation.jpg", topics: ["Finding first clients", "Pricing automation work", "Tool stack"], desc: "How learners are landing their first automation clients, with real proposals and price sheets." },
  { id: "phone-film", title: "Shoot a short film on your phone", type: "Workshop", date: srAt(-6, 11, 0), mins: 90, host: "kabir", seats: 300, registered: 300, img: "assets/img/mobile-cinematography.jpg", topics: ["Framing", "Natural light", "VN editing"], desc: "Recording available. Learn the 5 shots every phone film needs." },
  { id: "python-interviews", title: "Cracking Python interviews", type: "Webinar", date: srAt(-15, 19, 0), mins: 60, host: "rahul", seats: 500, registered: 488, img: "assets/img/cert-python.jpg", topics: ["Common questions", "Live coding tips", "Certification prep"], desc: "Recording available. The questions we see most in Python interviews, and how to answer them." }
];

const srDate = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return d.getTime(); };
SR.posts = [
  { slug: "learn-react-2027", title: "How to learn React in 2027: a 12-week plan", cat: "Development", date: srDate(3), read: 8, author: "priya", img: "assets/img/react.jpg",
    excerpt: "A week-by-week plan that takes you from JavaScript basics to shipping a real React app.",
    body: [["p", "React is still the most requested front-end skill in Indian job listings. The good news: you don't need to learn everything at once."], ["h", "Weeks 1–3: JavaScript first"], ["p", "Most React confusion is really JavaScript confusion. Get comfortable with arrays, objects, functions, promises and modules before you touch JSX."], ["h", "Weeks 4–7: Components and hooks"], ["ul", ["Build 5 small components a week", "Use useState and useEffect until they feel boring", "Rebuild one UI you use every day"]], ["h", "Weeks 8–12: Ship something"], ["p", "Pick a project with real data: a habit tracker, a budget app, a portfolio. Deploy it and write a short case study. That's what gets interviews."], ["quote", "Recruiters don't ask what you studied. They ask what you built."]] },
  { slug: "data-analyst-roadmap", title: "Data analyst roadmap: the skills that actually get you hired", cat: "Data", date: srDate(8), read: 6, author: "arjun", img: "assets/img/cert-data-ai.jpg",
    excerpt: "SQL, Excel, a BI tool and storytelling. Here's how to prioritise them.",
    body: [["p", "After reviewing hundreds of analyst interviews, the pattern is clear: SQL matters more than anything else."], ["h", "1. SQL, every day"], ["p", "Joins, group by, window functions. Practise on real datasets for 30 minutes a day."], ["h", "2. One BI tool, deeply"], ["p", "Power BI or Tableau. Pick one and build three dashboards that answer business questions."], ["h", "3. Tell the story"], ["ul", ["Lead with the answer", "Show one chart per point", "End with a recommendation"]]] },
  { slug: "portfolio-mistakes", title: "7 portfolio mistakes that cost designers interviews", cat: "Design", date: srDate(15), read: 5, author: "neha", img: "assets/img/portfolio.jpg",
    excerpt: "Too many projects, no process, and other easy fixes.",
    body: [["p", "Your portfolio is skimmed in under a minute. Make that minute count."], ["ul", ["Showing 12 projects instead of 3 strong ones", "No problem statement", "Hiding your process", "No outcomes or metrics", "Walls of text", "Broken prototype links", "Not tailoring to the role"]], ["p", "Fix the first three and you'll already be ahead of most applicants."]] },
  { slug: "automation-first-client", title: "How our learners landed their first automation client", cat: "AI & Automation", date: srDate(21), read: 7, author: "skillradius", img: "assets/img/ai-automation.jpg",
    excerpt: "Real proposals, pricing and the tools they used.",
    body: [["p", "Small businesses are drowning in repetitive work. That's an opportunity."], ["h", "Start with one painful process"], ["p", "Invoices, lead follow-ups and appointment reminders are the most common first projects."], ["h", "Price the outcome, not the hours"], ["p", "Learners who priced by hours saved earned 2–3x more than those who billed hourly."]] },
  { slug: "phone-filmmaking-basics", title: "Phone filmmaking: 5 shots every short film needs", cat: "Creative", date: srDate(30), read: 4, author: "kabir", img: "assets/img/mobile-cinematography.jpg",
    excerpt: "Wide, medium, close-up, insert and reaction. Here's how to use each.",
    body: [["p", "Great phone films aren't about gear. They're about shot choice."], ["ul", ["Wide: where are we?", "Medium: who is here?", "Close-up: how do they feel?", "Insert: what matters?", "Reaction: what changed?"]], ["p", "Shoot all five for every scene and editing becomes easy."]] },
  { slug: "proctored-exam-tips", title: "How to prepare for a proctored certification exam", cat: "Certifications", date: srDate(40), read: 5, author: "rahul", img: "assets/img/cert-python.jpg",
    excerpt: "Practice tests, setup checks and time management.",
    body: [["p", "Most failed attempts come down to time, not knowledge."], ["h", "Before the exam"], ["ul", ["Take at least two mock tests", "Check your webcam and internet", "Close every other tab and app"]], ["h", "During the exam"], ["p", "Answer what you know first, flag the rest, and come back. You'll see the question palette on the right."]] }
];

SR.help = [
  { id: "start", title: "Getting started", icon: "compass", items: [["How do I create an account?", "Click Sign up, enter your details and verify your email with the 6-digit code we send you."], ["Is SkillRadius free?", "Some courses are free. Paid courses, live trainings and certifications show their price on the detail page."], ["Can I use SkillRadius on my phone?", "Yes. The website works on any modern phone browser."], ["Do I need any experience to begin?", "No. Every program lists who it's for and what you should know first. Beginner courses start from zero, and the course finder on the home page suggests a starting point from three quick questions."], ["What's the difference between a course, a live training and a certification?", "Courses are self-paced video lessons you take any time. Live trainings are trainer-led batches with fixed session times. Certifications are study programs that end in a proctored exam and give you a credential employers can verify."], ["What do I need to learn on SkillRadius?", "A phone or laptop and a normal internet connection are enough for lessons. For coding batches and proctored exams you need a laptop or desktop with a webcam and an up-to-date Chrome or Edge browser."], ["What is a learning path?", "A path bundles the courses, one live batch and one certification for a specific job role, in the order we recommend, at a lower price than buying each separately."]] },
  { id: "payments", title: "Payments & refunds", icon: "card", items: [["Which payment methods do you accept?", "UPI, debit and credit cards, netbanking, and no-cost EMI on orders above ₹5,000."], ["How do I get a GST invoice?", "Every order has a downloadable GST invoice under My Learning → Orders. Add your GSTIN at checkout for a business invoice."], ["How do refunds work?", "Self-paced courses: full refund within 30 days if you've completed less than 30%. Trainings: full refund up to 3 days before the batch starts. See the Refund Policy for details."], ["My payment failed but money was deducted.", "Failed payments are reversed by your bank within 5–7 working days. If not, raise a ticket with the transaction ID."], ["Do prices include GST?", "Yes. The price you see on a program page is the price you pay, and the GST amount is shown separately on your invoice."], ["How do I use a coupon, scholarship or referral code?", "Enter the code in the Coupon box at checkout and select Apply. One code can be used per order."], ["Can I pay in instalments?", "No-cost EMI is available on orders above ₹5,000 with supported cards. Choose EMI as the payment method at checkout to see the monthly amount."], ["How long does a refund take?", "Once we approve a refund, it reaches your original payment method in 7–10 business days. You'll get an email when it's issued."]] },
  { id: "learning", title: "Courses & learning", icon: "book", items: [["How long do I have access to a course?", "Self-paced courses come with lifetime access unless the course page says otherwise."], ["How is my progress tracked?", "Each lesson is marked complete when you finish the video, mark notes as done or pass the quiz."], ["Can I download videos?", "Videos stream online. Slides and practice files can be downloaded from the Resources tab."], ["Do I get a certificate for finishing a course?", "Yes. When you complete every lesson and quiz, a course certificate with its own ID appears under My Learning → Certificates."], ["Can I ask questions while I learn?", "Yes. Each lesson has a Q&A where trainers reply, usually within 24 hours. For live batches you can also ask during the session."], ["What are lesson resources?", "Each module has downloadable PDFs: lesson notes, practice exercises and a one-page cheat sheet. You'll find them in the Resources tab of the lesson."], ["Can I take notes inside a lesson?", "Yes. The My notes tab saves notes against the lesson you're watching, so they're there when you come back."], ["Can I leave a review?", "You can rate and review a course after completing 20% of it. Reviews help other learners choose."]] },
  { id: "trainings", title: "Live trainings", icon: "training", items: [["Where do I find the join link?", "On your dashboard, the Join button appears 15 minutes before each session."], ["I missed a session.", "Recordings are posted to your dashboard within a few hours."], ["How do I submit an assignment?", "Open the assignment from your dashboard's Trainings tab, add your link or file, and submit before the due date."], ["How big is a batch?", "Online batches are capped at 40 learners and in-person workshops at 24, so trainers can review everyone's work."], ["Can I switch to a later batch?", "Yes, once and free of charge, up to 3 days before your batch starts. Write to support@skillradius.in with your order ID."], ["Do I need to install anything for live sessions?", "Sessions open in your browser from the Join button. For coding batches we send a setup guide a week before the start date."], ["Do live trainings give a certificate?", "Yes. Attend at least 75% of the sessions and submit the capstone project to receive a certificate with a verifiable ID."], ["The Join button says the room isn't open yet.", "Your trainer opens the classroom a few minutes before the session. Keep the window open and select Check again."]] },
  { id: "certs", title: "Certifications & exams", icon: "cert", items: [["When can I take the exam?", "After you complete every study module. Take a mock test first to check you're ready."], ["What happens if I fail?", "You can retake the exam with no limit and no extra fee."], ["How long is my certificate valid?", "2 or 3 years from the exam date, depending on the program. Course certificates don't expire."], ["How do employers verify my certificate?", "They enter the certificate ID on the Verify page."], ["How does the proctored exam work?", "You take it online on your own computer with the webcam on. The exam checks that one person is in view and flags things like switching tabs. Flagged attempts are reviewed by our team before the certificate is released."], ["What do I need on exam day?", "A laptop or desktop with a working webcam, Chrome or Edge, a stable connection and a quiet, well-lit room. Phones and tablets aren't supported for exams."], ["What is a mock test?", "A practice test with the same style of questions as the real exam. It isn't timed or proctored, and every answer is explained."], ["My result says it's under review.", "That means the proctoring system flagged something during your attempt. A person reviews it, usually within 2 working days, and you'll be notified either way."], ["I need extra time or another adjustment.", "Write to support@skillradius.in at least 7 days before your exam and tell us what you need. Adjustments are free."]] },
  { id: "account", title: "Account & security", icon: "shield", items: [["I forgot my password.", "Use Forgot Password on the login page. We'll email you a code to reset it."], ["Can I change my email?", "Not yet. Raise a ticket and our team will help."], ["How do I delete my account?", "Go to Profile → Delete account. This removes your progress and certificates permanently."], ["How do I update my name, phone or bio?", "Go to Profile, select Edit profile, make your changes and save. Your email address can't be edited there."], ["How do I change which emails I get?", "Under Profile → Notifications you can switch course updates, session reminders, the weekly digest and offers on or off."], ["How do referral rewards work?", "Share your code from the Refer & earn page. Your friend saves on their first purchase, and your credit is added after their refund window has passed."], ["Is my data safe?", "We collect only what we need to run your account, and we don't sell personal data. The Privacy Policy explains what we store and how to ask for a copy or deletion."]] }
];

SR.jobs = [
  { id: "fe-eng", title: "Frontend Engineer", team: "Engineering", location: "Bengaluru · Hybrid", type: "Full-time", exp: "2–4 years", desc: "Build the learning experience used by thousands of learners every day.", reqs: ["Strong JavaScript and React", "Care for accessibility and performance", "Experience with design systems"] },
  { id: "be-eng", title: "Backend Engineer (Node.js)", team: "Engineering", location: "Bengaluru · Hybrid", type: "Full-time", exp: "3–5 years", desc: "Own APIs for payments, exams and certificates.", reqs: ["Node.js and PostgreSQL", "Payments or auth experience", "Writes tests"] },
  { id: "trainer-data", title: "Data Analytics Trainer", team: "Academics", location: "Remote · India", type: "Part-time", exp: "4+ years in industry", desc: "Teach live evening cohorts and mentor learners on case studies.", reqs: ["Hands-on SQL and Python", "Clear communicator", "Evenings 2x a week"] },
  { id: "content-designer", title: "Instructional Designer", team: "Academics", location: "Bengaluru", type: "Full-time", exp: "2+ years", desc: "Turn expert knowledge into clear, practical lessons and assessments.", reqs: ["Curriculum or e-learning experience", "Strong writing", "Comfort with video scripting"] },
  { id: "counsellor", title: "Learner Success Counsellor", team: "Learner Success", location: "Bengaluru", type: "Full-time", exp: "1–3 years", desc: "Help learners pick the right program and stay on track to finish.", reqs: ["Excellent English and Hindi or Kannada", "Empathy and patience", "Target-driven"] },
  { id: "growth-marketer", title: "Growth Marketer", team: "Marketing", location: "Bengaluru · Hybrid", type: "Full-time", exp: "2–4 years", desc: "Run performance and content campaigns for courses and certifications.", reqs: ["Google and Meta ads", "Analytics and experiments", "Edtech a plus"] }
];

SR.scholarships = [
  { id: "women-tech", title: "Women in Tech Scholarship", amount: "50% off", icon: "heart", who: "Women learners enrolling in development, data or design programs.", how: "Short application and a 20-minute aptitude quiz.", seats: "200 per quarter" },
  { id: "student", title: "Student Discount", amount: "30% off", icon: "book", who: "Students with a valid college email (.ac.in / .edu) or ID card.", how: "Verify your student status once; the discount applies at checkout.", seats: "No limit" },
  { id: "merit", title: "Merit Scholarship", amount: "Up to 100% off", icon: "trophy", who: "Top scorers in our monthly SkillRadius Aptitude Test.", how: "Take the free online test. Top 25 each month win.", seats: "25 per month" },
  { id: "defence", title: "Defence Families", amount: "40% off", icon: "shield", who: "Serving and retired armed forces personnel and their families.", how: "Upload a dependent or service ID during application.", seats: "No limit" }
];

SR.pressReleases = [
  { date: srDate(20), title: "SkillRadius crosses 50,000 certified professionals", summary: "The Bengaluru-based learning platform has now certified more than 50,000 learners across 25 professional programs." },
  { date: srDate(75), title: "SkillRadius launches live trainer-led bootcamps", summary: "Small-batch online and in-person trainings in full stack development, data analytics and design." },
  { date: srDate(160), title: "SkillRadius introduces AI-proctored certification exams", summary: "Learners can now sit proctored exams online with instant results and verifiable certificates." }
];

SR.partners = ["IBM", "amazon", "TARGET", "SAMSUNG", "ATLASSIAN", "Infosys", "Swiggy", "Razorpay"];

SR.placementStats = { placed: "3,400+", avgHike: "62%", highest: "₹24 LPA", partners: "180+", byPath: [["Full Stack", 78], ["Data Analyst", 71], ["UI/UX", 64], ["AI Automation", 69]] };

SR.moreStories = [
  { name: "Kavya Nair", role: "Frontend Developer @ Product startup", color: "#e2445c", path: "Full Stack Developer", quote: "The bootcamp code reviews were the turning point. I went from tutorials to shipping features.", before: "B.Com graduate", hike: "First job" },
  { name: "Imran Sheikh", role: "Business Analyst @ Fintech", color: "#1b7f45", path: "Data Analyst", quote: "SQL every day and three solid dashboards. That's literally what my interviews were about.", before: "Customer support", hike: "+85%" },
  { name: "Divya Menon", role: "UI Designer @ Agency", color: "#7a4fe0", path: "UI/UX Designer", quote: "The design sprint gave me a real case study. It was the first thing every interviewer asked about.", before: "Graphic designer", hike: "+60%" }
];
