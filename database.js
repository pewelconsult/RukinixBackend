const admin = require('firebase-admin');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { Timestamp } = require('firebase-admin/firestore');


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
      await companyDoc.update(data);
      return true;
  } catch (error) {
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


async function getCompanyByName(name) {
  const collectionName = 'CLIENTS';
  const companiesRef = db.collection(collectionName);
  const snapshot = await companiesRef.get();
  
  if (snapshot.empty) {
    throw new Error('No companies found');
  }
  const matchingDocs = snapshot.docs.filter(doc => 
    doc.data().companyName === name
  );
  
  if (matchingDocs.length === 0) {
    throw new Error('Company not found');
  }
  
  const doc = matchingDocs[0];
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
      throw error;
  }
}

// Function to add a user
async function addUser(data) {

    COMPANY_NAME = data.companyId
    const collectionName = `/USERS`;
    const collectionRef = db.collection(collectionName);
    data.createOn = new Date();
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
      throw error;
    }
  }


  async function addExpense(data, companyId) {
    const collectionPath = `${companyId}/EXPENSES/data`; // Define the collection path
    try {
      data.createdAt = new Date(); // Add a timestamp
      await db.collection(collectionPath).add(data); // Add the expense to Firestore
      return true;
    } catch (error) {
      throw error; // Throw the error to be handled by the route
    }
  }

  async function addOrder(data, companyId) {
    const collectionPath = `${companyId}/ORDERS/data`;
    try {
      data.createOn = new Date();
      await db.collection(collectionPath).add(data);
      return true;
    } catch (error) {
      throw error;
    }
  }


  async function addSupplier(data, companyId) {
    const collectionPath = `${companyId}/SUPPLIERS/data`;
    try {
      data.createOn = new Date();
      await db.collection(collectionPath).add(data);
      return true;
    } catch (error) {
      throw error;
    }
  }



  async function getAllSuppliers(companyId) {
    const collectionPath = `${companyId}/SUPPLIERS/data`;
    try {
        const suppliersSnapshot = await db.collection(collectionPath)
            .orderBy('createOn', 'desc')
            .get();
        
        const suppliers = [];
        suppliersSnapshot.forEach(doc => {
            suppliers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return suppliers;
    } catch (error) {
        throw error;
    }
}



  async function addReturns(data, companyId) {
    const collectionPath = `${companyId}/RETURNS/data`;
    try {
      data.createOn = new Date();
      await db.collection(collectionPath).add(data);
      return true;
    } catch (error) {
      throw error;
    }
  }

  
  async function addProduct(data, company) {
    const collectionPath = `${company}/PRODUCTS/data`;
    try {
        data.createOn = new Date();
        const docRef = await db.collection(collectionPath).add(data);
        // Return both the ID and the data
        return {
            success: true,
            data: {
                id: docRef.id,
                ...data
            }
        };
    } catch (error) {
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
    throw error;
  }
}



async function deleteProduct(company, productId) {
  const collectionPath = `${company}/PRODUCTS/data`;
  try {
    await db.collection(collectionPath).doc(productId).delete();
    return true;
  } catch (error) {
    throw error;
  }
}




// Add a new purchase
async function addPurchase(data, company) {
  const purchasesPath = `${company}/PURCHASES/data`;
  try {
      // Add the purchase record
      await db.collection(purchasesPath).add(data);
      return true;
  } catch (error) {
      throw error;
  }
}

// Update product quantity after purchase
async function updateProductQuantity(company, productId, quantityToAdd) {
  const productsPath = `${company}/PRODUCTS/data`;
  try {
      // Get current product data
      const productDoc = await db.collection(productsPath).doc(productId).get();
      if (!productDoc.exists) {
          throw new Error('Product not found');
      }

      const currentProduct = productDoc.data();
      const newQuantity = (currentProduct.quantity || 0) + quantityToAdd;

      // Update the product
      await db.collection(productsPath).doc(productId).update({
          quantity: newQuantity,
          updatedOn: new Date()
      });

      return true;
  } catch (error) {
      throw error;
  }
}

// Get all purchases
async function getPurchases(company) {
  const purchasesPath = `${company}/PURCHASES/data`;
  const productsPath = `${company}/PRODUCTS/data`;
  
  try {
      const purchasesSnapshot = await db.collection(purchasesPath)
          .orderBy('purchaseDate', 'desc')
          .get();

      // Get all products to map their names
      const productsSnapshot = await db.collection(productsPath).get();
      const productsMap = new Map();
      productsSnapshot.forEach(doc => {
          productsMap.set(doc.id, doc.data());
      });

      const purchases = [];
      purchasesSnapshot.forEach(doc => {
          const purchaseData = doc.data();
          const product = productsMap.get(purchaseData.productId);
          
          purchases.push({
              id: doc.id,
              ...purchaseData,
              productName: product ? product.itemName : 'Unknown Product',
              category: product ? product.category : 'Unknown Category',
              brand: product ? product.brand : 'Unknown Brand'
          });
      });

      return purchases;
  } catch (error) {
      throw error;
  }
}



// Backend function to get purchases by date range
async function getPurchasesByDateRange(company, startDate, endDate) {
  const purchasesPath = `${company}/PURCHASES/data`;
  try {
    let query = db.collection(purchasesPath);
    
    if (startDate && endDate) {
      query = query.where('purchaseDate', '>=', startDate)
                  .where('purchaseDate', '<=', endDate);
    }
    
    const snapshot = await query.get();
    const purchases = [];
    
    snapshot.forEach(doc => {
      purchases.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return purchases;
  } catch (error) {
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
    throw error;
  }
}


async function processAndAddSale(saleData, companyId) {
  try {
    // First update product quantities
    await updateProductQuantities(saleData.items, companyId);
    
    // If quantity update succeeds, add the sale
    const saleResult = await addSalesData(saleData, companyId);
    return saleResult;

  } catch (error) {
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
    throw error;
  }
}



// In database.js
async function editSaleItem(companyId, saleId, productId, newPrice, quantity) {
  const saleDoc = await getSaleById(companyId, saleId);
  const saleData = saleDoc.data();

  const itemIndex = saleData.items.findIndex(item => item.id === productId);
  if (itemIndex === -1) {
    throw new Error('Item not found in sale');
  }

  const oldQuantity = saleData.items[itemIndex].quantity;
  const quantityDiff = quantity - oldQuantity;

  // Update product stock
  const productsRef = db.collection(`${companyId}/PRODUCTS/data`);
  const productDoc = await productsRef.doc(productId).get();
  
  if (!productDoc.exists) {
    throw new Error('Product not found');
  }

  const currentStock = productDoc.data().quantity;
  if (quantityDiff > currentStock) {
    throw new Error('Insufficient stock');
  }

  // Update sale item
  saleData.items[itemIndex].sellingPrice = newPrice;
  saleData.items[itemIndex].quantity = quantity;

  // Update stock
  await productDoc.ref.update({
    quantity: currentStock - quantityDiff
  });

  // Update sale
  await saleDoc.ref.update({ items: saleData.items });

  return true;
}


async function getSaleById(companyId, saleId) {
  const saleDoc = await db.collection(`${companyId}/SALES/data`).doc(saleId).get();
  if (!saleDoc.exists) {
    throw new Error('Sale not found');
  }
  return saleDoc;
}

// Function to restore product quantity for a single item
async function restoreProductQuantity(item, companyId) {
  const productsRef = db.collection(`${companyId}/PRODUCTS/data`);

  const productDoc = await productsRef.doc(item.id).get();
  if (!productDoc.exists) {
    throw new Error(`Product not found: ${item.itemName}`);
  }

  const currentQuantity = productDoc.data().quantity || 0;
  const newQuantity = currentQuantity + item.quantity;

  // Update the product quantity
  await productDoc.ref.update({ quantity: newQuantity });
  return true;
}

// Function to delete an item from a sale
async function deleteSaleItem(companyId, saleId, productId) {
  const saleDoc = await getSaleById(companyId, saleId);
  const saleData = saleDoc.data();

  // Find the item to delete
  const itemIndex = saleData.items.findIndex(item => item.id === productId);
  if (itemIndex === -1) {
    throw new Error('Item not found in the sale');
  }

  const deletedItem = saleData.items[itemIndex];

  // Restore the product quantity
  await restoreProductQuantity(deletedItem, companyId);

  // Remove the item from the sale
  saleData.items.splice(itemIndex, 1);

  // Update the sale in the database
  if (saleData.items.length > 0) {
    // If there are still items in the sale, update the sale
    await saleDoc.ref.update({ items: saleData.items });
  } else {
    // If no items are left, delete the entire sale
    await saleDoc.ref.delete();
  }

  return true;
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
    const collectionName = `/USERS`;
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



async function getExpensesByDateRange(companyId, startDate, endDate) {
  const collectionPath = `${companyId}/EXPENSES/data`; // Define the collection path

  try {
    // Query Firestore for expenses within the date range
    const snapshot = await db.collection(collectionPath)
      .where('createdAt', '>=', startDate) // Filter by start date
      .where('createdAt', '<=', endDate) // Filter by end date
      .get();

    // Map the snapshot documents to an array of expenses
    const expenses = [];
    snapshot.forEach(doc => {
      expenses.push({
        id: doc.id, // Include the document ID
        ...doc.data() // Include all other expense data
      });
    });

    return expenses;

  } catch (error) {
    throw error; // Throw the error to be handled by the route
  }
}


async function addDebtor(data) {
  const collectionPath = `${data.companyId}/DEBTORS/data`; // Define Firestore collection path
  try {
    await db.collection(collectionPath).add(data); // Add debtor to Firestore
    return true;
  } catch (error) {
    throw error;
  }
}


// Function to fetch all debtors from Firestore
async function getAllDebtors(companyId) {
  const collectionPath = `${companyId}/DEBTORS/data`; // Define Firestore collection path
  try {
    const snapshot = await db.collection(collectionPath).get(); // Fetch all documents
    const debtors = [];
    snapshot.forEach(doc => {
      const debtorData = doc.data();
      // Check if amountDue > amountPaid
      if (debtorData.amountDue > debtorData.amountPaid) {
        debtors.push({
          id: doc.id, // Include the document ID
          ...debtorData // Include all other fields
        });
      }
    });
    return debtors;
  } catch (error) {
    throw error;
  }
}


// Function to update a debtor in Firestore
async function updateDebtor(companyId, debtorId, updateData) {
  const collectionPath = `${companyId}/DEBTORS/data`; // Define Firestore collection path
  try {
    const docRef = db.collection(collectionPath).doc(debtorId); // Get the document reference
    await docRef.update(updateData); // Update the document
    return true;
  } catch (error) {
    throw error;
  }
}


// Function to add an asset to Firestore
async function addAsset(data) {
  const collectionPath = `${data.companyId}/ASSETS/data`; // Define Firestore collection path
  try {
    await db.collection(collectionPath).add(data); // Add asset to Firestore
    return true;
  } catch (error) {
    throw error;
  }
}



// Function to fetch all assets from Firestore
async function getAllAssets(companyId) {
  const collectionPath = `${companyId}/ASSETS/data`; // Define Firestore collection path
  try {
    const snapshot = await db.collection(collectionPath).get(); // Fetch all documents
    const assets = [];
    snapshot.forEach(doc => {
      assets.push({
        id: doc.id, // Include the document ID
        ...doc.data() // Include all other fields
      });
    });
    return assets;
  } catch (error) {
    throw error;
  }
}




  // Exporting functions
module.exports = {
    addCompany, addUser, addCategory, getUserByEmail, getUserById, getAllCategories,
    addProduct, getAllProducts, getAllCompanies, getCompanyById, deleteCompany,
    updateCompany, getUserLoginHistory, addUserSessionData, getAllUsers,
    processAndAddSale, getAllSales, checkCategoryAlreadyExist, checkProductAlreadyExists,
    deleteProduct, updateProduct, addSupplier, getAllSuppliers, getCompanyByName,
    getSaleById, deleteSaleItem, addExpense, getExpensesByDateRange, addDebtor,
    getAllDebtors, updateDebtor, addAsset, getAllAssets, editSaleItem,
    addPurchase, updateProductQuantity, getPurchases, getPurchasesByDateRange
};

