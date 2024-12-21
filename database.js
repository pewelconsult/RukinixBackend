const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const firebaseConfig = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};


admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
});




const db = admin.firestore();


const COMPANY_NAME = "KONKOJAY";


// Function to add a company
async function addCompany(name, contact, code) {
    const collectionName = "CLIENTS";
    const collectionRef = db.collection(collectionName);
    const data = {
        'company name': name,
        'contact': contact,
        'code': code
    };
    await collectionRef.add(data);
    return true;
}

// Function to add a user
async function addUser(firstName, lastName, phone, dateOfBirth, address, email, password) {
    const collectionName = `${COMPANY_NAME}/USERS/data`;
    const collectionRef = db.collection(collectionName);
    const data = {
            'first name': firstName,
            'last name': lastName,
            'phone': phone,
            'dob': dateOfBirth,
            'address':address,
            'email': email,
            'password':password
    };
    await collectionRef.add(data);
    return true;
}



async function addCategory(data) {
    const collectionPath = `${COMPANY_NAME}/CATEGORIES/data`;
    try {
      await db.collection(collectionPath).add(data);
      return true;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }

  async function addProduct(data) {
    const collectionPath = `${COMPANY_NAME}/PRODUCTS/data`;
    try {
      await db.collection(collectionPath).add(data);
      return true;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }


  async function getAllProducts() {
    const collectionPath = `${COMPANY_NAME}/PRODUCTS/data`;
    try {
      const snapshot = await db.collection(collectionPath).get();
      const categories = snapshot.docs.map(doc => ({
        id: doc.id, // Include the document ID if needed
        ...doc.data(), // Spread the document data
      }));
      return categories;
  
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }


  async function getAllCategories() {
    const collectionPath = `${COMPANY_NAME}/CATEGORIES/data`;
    try {
      const snapshot = await db.collection(collectionPath).get();
      const categories = snapshot.docs.map(doc => ({
        id: doc.id, // Include the document ID if needed
        ...doc.data(), // Spread the document data
      }));
      return categories;
  
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }
  


  // Function to get user by email
async function getUserByEmail(email) {
    const collectionName = `${COMPANY_NAME}/USERS/data`;
    const collectionRef = db.collection(collectionName);

    const querySnapshot = await collectionRef.where('email', '==', email).get();

    if (querySnapshot.empty) {
        return null; 
    }

    return querySnapshot.docs[0].data(); 
}

// Function to get user by ID
async function getUserById(userId) {
    const collectionName = `${COMPANY_NAME}/USERS/data`;
    const docRef = db.collection(collectionName).doc(userId);

    const doc = await docRef.get();

    if (!doc.exists) {
        return null; 
    }

    return doc.data();
}


  // Exporting functions
module.exports = {
    addCompany,
    addUser,
    addCategory,
    getUserByEmail,
    getUserById,
    getAllCategories,
    addProduct,
    getAllProducts
};

