const admin = require('firebase-admin');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');


// Initialize Firebase Admin SDK
const firebaseConfig = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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



// Function to add a company
async function addCompany(data) {
    data.status = 'pending';
    data.users = 1;
    data.companyId = uuidv4()
    const collectionName = "CLIENTS";
    const collectionRef = db.collection(collectionName);
    data.createOn = new Date();
    data.createdBy = 'Newton Kumi';
    await collectionRef.add(data);
    return true;
}


// Function to update a company
async function updateCompany(data) {
  try {
      const collectionName = "CLIENTS";
      const collectionRef = db.collection(collectionName);
      
      // Assuming data contains the company ID
      const companyId = data.id; // or data._id depending on your data structure
      delete data.id; // Remove id from data before update
      
      const companyDoc = collectionRef.doc(companyId);
      const doc = await companyDoc.get();
      
      if (!doc.exists) {
          return false;
      }
      data.updatedAt = new Date();
      data.createdBy = "NEWTON"
      await companyDoc.update(data);
      return true;
  } catch (error) {
      console.error('Error in updateCompany:', error);
      throw error;
  }
}

// Function to get all companies from Firestore
async function getAllCompanies() {
  const collectionName = 'CLIENTS';
  const snapshot = await db.collection(collectionName).get();
  const companies = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return companies;
}

// Function to get a company by ID from Firestore
async function getCompanyById(id) {
  const collectionName = 'CLIENTS';
  const docRef = db.collection(collectionName).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error('Company not found');
  }
  return { id: doc.id, ...doc.data() };
}


// Delete company function
async function deleteCompany(companyId) {
  const collectionName = "CLIENTS";
  const collectionRef = db.collection(collectionName);
  
  try {
      const docRef = collectionRef.doc(companyId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
          throw new Error('Company not found');
      }
      
      await docRef.delete();
      return true;
  } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
  }
}

// Function to add a user
async function addUser(data) {

    COMPANY_NAME = data.companyId
    const collectionName = `/USERS`;
    const collectionRef = db.collection(collectionName);
    data.createOn = new Date();
    data.createdBy = 'Newton';
    await collectionRef.add(data);
    return true;
}



// Function to get all users
async function getAllUsers() {
  const collectionName = `/USERS`;
  const collectionRef = db.collection(collectionName);

  try {
      const snapshot = await collectionRef.get();
      const users = [];

      // Process each document in the collection
      snapshot.forEach(doc => {
          const userData = doc.data();
          userData.id = doc.id; // Add document ID to the user data
          users.push(userData);
      });

      return users; // Return the array of users
  } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Could not retrieve users.");
  }
}



async function addCategory(data, companyId) {
    const collectionPath = `${companyId}/CATEGORIES/data`;
    try {
      data.createOn = new Date();
      data.createdBy = 'Newton Kumi';
      await db.collection(collectionPath).add(data);
      return true;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }

  async function addProduct(data, company) {
    const collectionPath = `${company}/PRODUCTS/data`;
    try {
      data.createOn = new Date();
      await db.collection(collectionPath).add(data);
      return true;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }

async function addUserSessionData(data) {
  await db.collection('userSessions').add(data);
}
  

  async function getAllProducts(companyId) {
    const collectionPath = `${companyId}/PRODUCTS/data`;
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


  async function getAllCategories(companyId) {
    const collectionPath = `${companyId}/CATEGORIES/data`;
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
    const collectionName = `/USERS`;
    const collectionRef = db.collection(collectionName);

    const querySnapshot = await collectionRef.where('email', '==', email).get();

    if (querySnapshot.empty) {
        return null; 
    }
    newData = querySnapshot.docs[0].data();
    newData.id = querySnapshot.docs[0].id;
    return newData; 
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

const getUserLoginHistory = async (userId) => {
  const sessionsRef = db.collection('userSessions');
  const snapshot = await sessionsRef
      .where('userId', '==', userId)
      .orderBy('loginTime', 'desc')
      .get();
      
  return snapshot.docs.map(doc => doc.data());
};

  // Exporting functions
module.exports = {
    addCompany,
    addUser,
    addCategory,
    getUserByEmail,
    getUserById,
    getAllCategories,
    addProduct,
    getAllProducts,
    getAllCompanies, 
    getCompanyById,
    deleteCompany,
    updateCompany,
    getUserLoginHistory,
    addUserSessionData,
    getAllUsers
};

