# 🧠 Quiz Application – Role Based Online Quiz Platform

## 📌 Project Overview

This is a **full-stack, role-based Quiz Application** designed to conduct online quizzes for **college clubs, technical events, classrooms, and organizations**.
The system supports **secure authentication**, **quiz creation**, **controlled student participation**, **automatic evaluation**, and **result sharing by the quiz maker**.

The platform strictly follows **role-based access control** to ensure data privacy and controlled result visibility.


## 🎯 Purpose of the Application

The main purpose of this Quiz Application is to:

* Help **college clubs and event organizers** conduct quizzes online
* Automate quiz creation, participation, and evaluation
* Prevent unauthorized access to results
* Allow quiz makers to control when and how results are shared
* Reduce manual effort and improve transparency



## 👥 User Roles

### 🔹 Student

### 🔹 Quiz Maker

Each user gets a **separate dashboard** based on their role selected during signup.


## 🔐 Authentication & Authorization

* Secure **Signup & Login** system
* Role selection (**Student / Quiz Maker**) during signup
* Role-based dashboards after login
* JWT-based authentication
* Users can only access features allowed for their role


## 🧩 Quiz Maker Features

### 📋 Quiz Maker Dashboard

* Displays **only quizzes created by the logged-in quiz maker**
* Shows:

  * Total quizzes created
  * Quiz start time & end time
  * Quiz status (active / ended)
  * Number of student participants per quiz


### ✍️ Create Quiz

* Quiz maker must provide:

  * Quiz title
  * Questions
  * Multiple options
  * Correct option (mandatory)
  * Quiz start time & end time
* Quiz is accessible to students **only within the defined time window**
* Prevents late or early access


### 🤖 AI Assistance

* Quiz maker can use **AI assistance** while creating quizzes
* Helps generate quiz questions based on provided input
* Improves efficiency and question quality


### 👁️ View Quiz

* Quiz maker can view:

  * All quiz questions
  * Options
  * Correct answers
* Quiz content can be:

  * Exported as CSV / Excel
  * Shared via WhatsApp


### 🧾 View Marksheet

* After quiz end time:

  * Quiz maker can view **complete student marksheet**
  * Displays student name and obtained marks
* Marksheet can be:

  * Downloaded as CSV / Excel
  * Shared via WhatsApp


### 🏆 Leaderboard (Controlled Access)

* Leaderboard is generated internally based on student marks
* Displays **Top 10 students**
* ❌ **Students cannot view leaderboard by default**
* ✅ **Leaderboard becomes visible to students ONLY if the quiz maker shares the result via WhatsApp**
* Ensures result privacy and controlled disclosure


### 🗑️ Edit / Delete Quiz

* Quiz maker can:

  * Edit quizzes after creation
  * Delete quizzes if required
* Ensures full administrative control


## 🎓 Student Features

### 📌 Student Dashboard

* Displays **available quizzes**
* Shows quiz start time and end time
* Quiz automatically disappears after end time
* Prevents re-attempt after submission or time completion


### 📝 Attempt Quiz

* Student can:

  * Select answers
  * Update answers before final submission
* **Auto-save feature**:

  * If student does not manually save or submit
  * Answers are automatically saved
* Prevents data loss due to accidental refresh or network issues


### 📊 Results Visibility

* Student **cannot directly view results or leaderboard**
* Results are visible **only when quiz maker shares them via WhatsApp**
* Maintains transparency while preventing premature result access


## ⚙️ Technologies Used

### 🌐 Frontend

* HTML
* CSS
* Bootstrap
* JavaScript

### 🛠️ Backend

* Node.js
* Express.js

### 🗄️ Database

* MongoDB Atlas (Cloud Database)

### 🔐 Authentication

* JWT (JSON Web Tokens)
* Role-based authorization


## 🏗️ Project Architecture


Frontend (HTML, CSS, JS, Bootstrap)
        |
        | API Requests
        ↓
Backend (Node.js, Express)
        |
        ↓
MongoDB Atlas (Cloud Database)


## 🚀 Key Highlights

* Secure role-based authentication
* Time-based quiz availability
* Auto-save quiz functionality
* AI-assisted quiz creation
* Controlled result and leaderboard visibility
* CSV / Excel export support
* WhatsApp-based result sharing
* Scalable and cloud-ready architecture


## 📌 Conclusion

This Quiz Application is a **real-world, production-oriented system** designed for controlled and fair quiz management.
It demonstrates strong understanding of:

* Full-stack development
* Authentication & authorization
* Data privacy
* Real-world application logic


