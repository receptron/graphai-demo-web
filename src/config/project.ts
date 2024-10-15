// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBI9jxPm-d3pxUw6cQtxk55DhJYfJCrkt8",
  authDomain: "graphai-web-demo.firebaseapp.com",
  projectId: "graphai-web-demo",
  storageBucket: "graphai-web-demo.appspot.com",
  messagingSenderId: "641612969846",
  appId: "1:641612969846:web:f40c4728361de0f4876c57",
  measurementId: "G-VL257S0YH3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
