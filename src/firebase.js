import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzv8B7u8WafWXoQgINyBdcyz5z5PVmQa8",
  authDomain: "sapsphere.firebaseapp.com",
  projectId: "sapsphere",
  storageBucket: "sapsphere.firebasestorage.app",
  messagingSenderId: "444787922512",
  appId: "1:444787922512:web:7214ce6ac88f4db472e355"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;