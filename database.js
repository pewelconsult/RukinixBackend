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



  async function checkProductAlreadyExists(companyId, productName) {
    const collectionPath = `${companyId}/PRODUCTS/data`;
    const lowerCaseProductName = productName.toLowerCase().trim();
    
    const snapshot = await db.collection(collectionPath).get();
    
    const exists = snapshot.docs.some(doc => {
        const docData = doc.data();
        if (!docData || !docData.itemName) return false;
        return docData.itemName.toLowerCase().trim() === lowerCaseProductName;
    });
    
    return { exists, snapshot };
}



// Add this function to your backend
async function updateProduct(company, productId, data) {
  const collectionPath = `${company}/PRODUCTS/data`;
  try {
    await db.collection(collectionPath).doc(productId).update({
      ...data,
      updatedOn: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}



async function deleteProduct(company, productId) {
  const collectionPath = `${company}/PRODUCTS/data`;
  try {
    await db.collection(collectionPath).doc(productId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}





  async function checkCategoryAlreadyExist(companyId, categoryName) {
    // Check if category exists
    const collectionPath = `${companyId}/CATEGORIES/data`;
    const lowerCaseCategoryName = categoryName.toLowerCase().trim();
    
    const snapshot = await db.collection(collectionPath).get();
    
    // Check if any existing category matches (case-insensitive)
    const exists = snapshot.docs.some(doc => {
        const existingCategory = doc.data().categoryName;
        return existingCategory.toLowerCase().trim() === lowerCaseCategoryName;
    });
    
    return {
        exists,
        snapshot
    };
}





  async function addSalesData(data, company) {
    const collectionPath = `${company}/SALES/data`;
    try {
      data.createOn = new Date();
      await db.collection(collectionPath).add(data);
      return true;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }





// Update product quantities function
async function updateProductQuantities(items, companyId) {
  const batch = db.batch();
  const productsRef = db.collection(`${companyId}/PRODUCTS/data`);
  const updateErrors = [];

  try {
    // Get all products that need updating
    const productUpdates = await Promise.all(
      items.map(async (item) => {
        const productDoc = await productsRef.doc(item.id).get();
        if (!productDoc.exists) {
          updateErrors.push(`Product not found: ${item.itemName}`);
          return null;
        }

        const currentQuantity = productDoc.data().quantity || 0;
        if (currentQuantity < item.quantity) {
          updateErrors.push(`Insufficient stock for ${item.itemName}. Available: ${currentQuantity}`);
          return null;
        }

        return {
          ref: productDoc.ref,
          newQuantity: currentQuantity - item.quantity
        };
      })
    );

    // If any errors occurred, throw them
    if (updateErrors.length > 0) {
      throw new Error(updateErrors.join(', '));
    }

    // Add all updates to batch
    productUpdates.forEach(update => {
      if (update) {
        batch.update(update.ref, { quantity: update.newQuantity });
      }
    });

    // Commit the batch
    await batch.commit();
    return true;

  } catch (error) {
    console.error("Error updating product quantities:", error);
    throw error;
  }
}

// Sales route implementation
async function processAndAddSale(saleData, companyId) {
  try {
    // First update product quantities
    await updateProductQuantities(saleData.items, companyId);
    
    // If quantity update succeeds, add the sale
    const saleResult = await addSalesData(saleData, companyId);
    return saleResult;

  } catch (error) {
    console.error("Error processing sale:", error);
    throw error;
  }
}



// Function to get all sales
async function getAllSales(company, startDate = null, endDate = null) {
  const collectionPath = `${company}/SALES/data`;
  try {
    let query = db.collection(collectionPath);

    // Add date filtering if dates are provided
    if (startDate && endDate) {
      query = query.where('createOn', '>=', new Date(startDate))
                  .where('createOn', '<=', new Date(endDate));
    }

    // Order by creation date, newest first
    query = query.orderBy('createOn', 'desc');

    const snapshot = await query.get();
    const sales = [];

    snapshot.forEach(doc => {
      sales.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JavaScript Date
        createOn: doc.data().createOn.toDate()
      });
    });

    return sales;

  } catch (error) {
    console.error("Error getting sales:", error);
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
    getAllUsers,
    processAndAddSale,
    getAllSales,
    checkCategoryAlreadyExist,
    checkProductAlreadyExists,
    deleteProduct,
    updateProduct
};

