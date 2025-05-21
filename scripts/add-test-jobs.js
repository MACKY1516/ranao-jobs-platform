// Script to add test job data to Firestore
// Run with: node scripts/add-test-jobs.js

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, Timestamp } = require("firebase/firestore");

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxaiAf_pHRfZIyBYLkDZLsodRNCkJqYh0",
  authDomain: "ranaojob.firebaseapp.com",
  projectId: "ranaojob",
  storageBucket: "ranaojob.appspot.com",
  messagingSenderId: "636345591279",
  appId: "1:636345591279:web:ae61c5efdfe54a2267421a",
  measurementId: "G-06LYFC8YDZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample test jobs
const testJobs = [
  {
    title: "Frontend Developer",
    company: "TechCorp",
    companyId: "techcorp123",
    location: "Marawi City",
    type: "Full-time",
    category: "Technology",
    salary: "₱25,000 - ₱35,000",
    postedAt: Timestamp.now(),
    deadline: "2023-12-31",
    tags: ["React", "JavaScript", "UI/UX"]
  },
  {
    title: "Marketing Specialist",
    company: "Global Marketing",
    companyId: "globalmarketing456",
    location: "Remote",
    type: "Part-time",
    category: "Marketing",
    salary: "₱20,000 - ₱30,000",
    postedAt: Timestamp.now(),
    deadline: "2023-12-20",
    tags: ["Digital Marketing", "Social Media", "SEO"]
  },
  {
    title: "Project Manager",
    company: "BuildWell Construction",
    companyId: "buildwell789",
    location: "Marawi City",
    type: "Contract",
    category: "Construction",
    salary: "₱40,000 - ₱60,000",
    postedAt: Timestamp.now(),
    deadline: "2023-12-15",
    tags: ["Construction", "Management", "Planning"]
  }
];

// Function to add test jobs to Firestore
async function addTestJobs() {
  try {
    console.log("Adding test jobs to Firestore...");
    
    for (const job of testJobs) {
      const docRef = await addDoc(collection(db, "jobs"), job);
      console.log(`Job added with ID: ${docRef.id}`);
    }
    
    console.log("All test jobs added successfully!");
  } catch (error) {
    console.error("Error adding test jobs:", error);
  }
}

// Execute the function
addTestJobs(); 