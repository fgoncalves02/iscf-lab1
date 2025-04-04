// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase, ref, set, onValue} from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCsrUa6nox4jbiJN4QAAPfdHC6pkrdQK8I",
  authDomain: "accel-2391d.firebaseapp.com",
  databaseURL: "https://accel-2391d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "accel-2391d",
  storageBucket: "accel-2391d.firebasestorage.app",
  messagingSenderId: "185236364241",
  appId: "1:185236364241:web:586f5b4b308447c97b1ef0",
  measurementId: "G-0H1BD30FLW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
// Initialize realtime Database
const db = getDatabase(app);


//ref pode ser vista como uma URL para o local específico do seu banco de dados, onde você deseja fazer operações de leitura ou gravação.

// ref(db, "extraction_freq"), você está criando uma referência ao caminho "extraction_freq" dentro da estrutura do banco de dados.

//Depois de criar uma referência para um caminho específico com ref, você usa set para salvar dados nesse caminho.

// o valor que você passa para o set será armazenado nesse caminho. Se o caminho já contiver dados, ele será substituído por esse novo valor.

export { db, analytics, ref, set, onValue };