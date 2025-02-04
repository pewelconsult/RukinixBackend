const express = require('express');
const cors = require('cors');
const { addCompany, addUser, addCategory, getUserByEmail, getUserById, getAllCategories, addProduct, 
  getAllProducts, getAllCompanies, getCompanyById, deleteCompany, updateCompany, addUserSessionData,
  getUserLoginHistory, getAllUsers, processAndAddSale, getAllSales, checkCategoryAlreadyExist,
  checkProductAlreadyExists, deleteProduct, updateProduct, addSupplier, getAllSuppliers, 
  getCompanyByName, deleteSaleItem, addExpense, getExpensesByDateRange, addDebtor, getAllDebtors,
  updateDebtor, addAsset, getAllAssets, editSaleItem, addPurchase, updateProductQuantity, 
  getPurchases, getPurchasesByDateRange} = require('./database');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); 
const bodyParser = require('body-parser');
require('dotenv').config();
const { Timestamp } = require('firebase-admin/firestore');



const mySecretKey =  process.env.SECRET_KEY



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/logos', express.static(path.join(__dirname, 'logos')));
app.use(cors());




const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, mySecretKey);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'logos')); // Save in /logos directory
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName); // Give the file a unique name
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max size
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});



// Define a GET route
app.get('/', (req, res) => {
  res.send('Hello, Sir Newton!');
});


// Route to handle company creation
app.post('/add-company',authenticateUser, upload.single('companyLogo'), async (req, res) => {
  try {
    const {
      companyName, contactPersonName, contactPersonPhone, companyEmail, subscriptionPlan, address,
    } = req.body;
    // Save logo URL if a file was uploaded
    const logoUrl = req.file ? `/logos/${req.file.filename}` : null;
    // Create a new company document
    const company = {
      companyName, contactPersonName, contactPersonPhone, companyEmail, subscriptionPlan, address, logoUrl,
    };

    // Save to database
    company.createdBy = req.user.email
    await addCompany(company)

    res.status(201).json({
      message: 'Company added successfully!',
      company,
    });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while adding the company.' });
  }
});


app.get('/companies',authenticateUser, async (req, res) => {
  try {
    const companies = await getAllCompanies();
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while fetching companies.' });
  }
});

// Route to get a company by ID
app.get('/companies/:id',authenticateUser, async (req, res) => {
  try {
    const company = await getCompanyById(req.params.id);
    res.status(200).json(company);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});


app.get('/companies/name/:name',authenticateUser, async (req, res) => {
  try {
    const company = await getCompanyByName(req.params.name);
    res.status(200).json(company);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});



app.post('/update-company', authenticateUser, async (req, res) => {
  try {
      const result = await updateCompany(req.body);
      if (result) {
          res.status(200).json({ message: 'Company updated successfully' });
      } else {
          res.status(404).json({ message: 'Company not found' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Error updating company', error: error.message });
  }
});


// Route to register a user
app.post('/register', authenticateUser, async (req, res) => {
  try {
      let userData = {
          fullName: req.body.fullName,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          dateOfBirth: req.body.dateOfBirth,
          role: req.body.role,
          company: req.body.company,
          password: req.body.password,
          companyId: req.body.company // Using company as companyId for the collection path
      };

      // Hash password
      const saltRounds = 10;
      userData.password = await bcrypt.hash(String(userData.password), saltRounds);

      // Add user to Firestore
     const result = await addUser(userData);

      if (result) {
          // Remove sensitive data from response
          const { password, ...userResponse } = userData;

          res.status(201).json({
              message: 'User registered successfully',
              user: userResponse
          });
      } else {
          throw new Error('Failed to add user');
      }

  } catch (error) {
      res.status(500).json({
          error: 'Error registering user',
          details: error.message
      });
  }
});





app.post('/add-category', authenticateUser, async (req, res) => {
  try {
      const categoryName = req.body.category;
      const companyId = req.user.companyId;
      

      // Check if category exists
      snapshot = await checkCategoryAlreadyExist(companyId, categoryName)
    

      if (snapshot.exists) {
          return res.status(400).json({
              success: false,
              message: 'Category already exists'
          });
      }

      // If category doesn't exist, proceed to add it
      const newCategory = {
          categoryName: categoryName,
          createdAt: new Date(),
      };

      await addCategory(newCategory, companyId);

      res.status(201).json({
          success: true,
          message: 'Category added successfully',
          category: newCategory
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'An error occurred while adding the category'
      });
  }
});


app.post('/add-expense', authenticateUser, async (req, res) => {
  try {
    const expenseData = req.body; 
    const companyId = req.user.companyId;
    expenseData.createdBy = req.user.email
    
    await addExpense(expenseData, companyId);

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense: expenseData
    });

  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the expense'
    });
  }
});



app.delete('/delete-company/:id', authenticateUser, async (req, res) => {
    try {
        const companyId = req.params.id;
        await deleteCompany(companyId);
        res.status(200).json({ message: 'Company deleted successfully' });
    } catch (error) {
        if (error.message === 'Company not found') {
            res.status(404).json({ error: 'Company not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete company' });
        }
    }
});



// Add this endpoint to your Express app
app.put('/update-product/:productId', authenticateUser, async (req, res) => {
  try {
    const { productId } = req.params;
    const company = req.user.companyId;
    const updateData = req.body;

    await updateProduct(company, productId, updateData);
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});




app.delete('/delete-product/:productId', authenticateUser, async (req, res) => {
  try {
    const { productId } = req.params;
    const company = req.user.companyId;

    await deleteProduct(company, productId);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});


// Express route
app.post('/make-sales', authenticateUser, async (req, res) => {
  try {
    const saleData = {
      items: req.body.items,
      total: req.body.total,
      amountPaid: req.body.amountPaid,
      change: req.body.change,
      paymentMode: req.body.paymentMode,
      customerName: req.body.customerName,
      createdBy: req.user.email 
    };
    
    const companyId = req.user.companyId;
    // Process the sale
    await processAndAddSale(saleData, companyId);

    res.status(201).json({
      success: true,
      message: 'Sale processed successfully'
    });

  } catch (error) {
    // Handle specific errors
    if (error.message.includes('Product not found') || 
        error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    // Handle generic errors
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing the sale'
    });
  }
});




// Express route for getting sales
app.get('/sales', authenticateUser, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { startDate, endDate } = req.query;

    const sales = await getAllSales(companyId, startDate, endDate);

    // Calculate some basic statistics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const salesByPaymentMode = sales.reduce((acc, sale) => {
      acc[sale.paymentMode] = (acc[sale.paymentMode] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        sales,
        summary: {
          totalSales,
          totalRevenue,
          salesByPaymentMode
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching sales data'
    });
  }
});



app.put('/edit-sale', authenticateUser, async (req, res) => {
  try {
    const { saleId, productId, newPrice, quantity } = req.body;
    const companyId = req.user.companyId;

    await editSaleItem(companyId, saleId, productId, newPrice, quantity);

    res.status(200).json({
      success: true,
      message: 'Sale updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});




app.delete('/delete-sale/:saleId/:productId', authenticateUser, async (req, res) => {
  try {
    const { saleId, productId } = req.params;
    const companyId = req.user.companyId;

    // Delete the item from the sale
    await deleteSaleItem(companyId, saleId, productId);

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the item'
    });
  }
});




app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    user1 = await getUserByEmail(email)
    if (!user1) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user1.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const expiresIn = "5h"
    // Include important user data in token
    const token = jwt.sign({ 
      email: user1.email,
      id: user1.id,
      role: user1.role,
      companyId: user1.companyId
    }, mySecretKey, { 
      expiresIn: expiresIn
    });

    // Log the session in Firestore
    const currentTime = new Date().toISOString();
    data = { 
      userId: user1.id, 
      email: email, 
      role: user1.role, 
      companyId: user1.companyId,
      loginTime: currentTime,
      lastActiveTime: currentTime,
      token: token,
      isActive: true,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    };
    await addUserSessionData(data)
    res.json({ message: 'Login successful', token , token_expiry: expiresIn, 
      userRole: user1.role, companyName: user1.companyId});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});




app.get('/user', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
      const user = await getUserById(userId);

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Remove the password field
      const { password, ...userWithoutPassword } = user;

      res.status(200).json(userWithoutPassword);
  } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.get('/users', authenticateUser, async (req, res) => {
  try {
      const users = await getAllUsers(); // Call the function to get all users
      res.status(200).json({
          success: true,
          message: "Users fetched successfully",
          data: users
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: "An error occurred while fetching users",
          error: error.message
      });
  }
});



app.get("/categories", authenticateUser, async (req, res) => {
    try {
      companyId = req.user.companyId
      const categories = await getAllCategories(companyId);
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories. Please try again later.",
      });
    }
  });


  app.post('/add-products', authenticateUser, async (req, res) => {
    try {
        const { itemName } = req.body;
        const company = req.user.companyId;
        const { exists } = await checkProductAlreadyExists(company, itemName);
        if (exists) {
            return res.status(400).json({ error: 'Product already exists' });
        }
        
        const productData = {
            ...req.body,
            createdBy: req.user.email
        };
        
        const result = await addProduct(productData, company);
        // Return the result which includes both id and data
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Add a new purchase
app.post('/add-purchase', authenticateUser, async (req, res) => {
  try {
      const companyId = req.user.companyId;
      const purchaseData = {
          ...req.body,
          createdBy: req.user.email,
          createdOn: new Date()
      };

      
      // Add purchase and update product quantity
      await addPurchase(purchaseData, companyId);
      
  
      // Update product quantity
      await updateProductQuantity(
          companyId, 
          purchaseData.productId, 
          purchaseData.quantity
      );

      res.status(200).json({
          success: true,
          message: 'Purchase added successfully'
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Failed to add purchase',
          error: error.message
      });
  }
});

// Get all purchases
// Backend route
app.get('/purchases', authenticateUser, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Get purchases with date range
    const purchases = await getPurchasesByDateRange(companyId, startDate, endDate);
    res.status(200).json({
      success: true,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases',
      error: error.message
    });
  }
});

app.post('/add-supplier', authenticateUser, async (req, res) => {
  try {
    const companyId = req.user.companyId; // Assuming you have middleware that adds user info
    const supplierData = req.body;
    supplierData.createdBy = req.user.email
    await addSupplier(supplierData, companyId);
    res.status(200).json({
      success: true,
      message: 'Supplier added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add supplier',
      error: error.message
    });
  }
});




app.get('/suppliers', authenticateUser, async (req, res) => {
  try {
      const companyId = req.user.companyId; // From auth middleware
      const suppliers = await getAllSuppliers(companyId);
      
      res.status(200).json({
          success: true,
          data: suppliers,
          total: suppliers.length
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Failed to fetch suppliers',
          error: error.message
      });
  }
});



// Add Debtor Route
app.post('/add-debtor', authenticateUser, async (req, res) => {
  try {
    const { debtorName, amountDue, dateDue, contactNumber, notes } = req.body;
    const companyId = req.user.companyId; // Get company ID from authenticated user

    // Convert dateDue to a Firestore Timestamp
    const dueDate = new Date(dateDue); // Convert string to Date object
    if (isNaN(dueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due date format'
      });
    }

    // Create debtor object
    const newDebtor = {
      debtorName,
      amountDue,
      dueDate: Timestamp.fromDate(dueDate), // Convert Date to Firestore Timestamp
      contactNumber,
      notes: notes || '', // Optional field
      createdAt: Timestamp.now(), // Use Firestore Timestamp for createdAt
      companyId
    };

    // Save debtor to Firestore using the addDebtor function
    newDebtor.amountPaid = 0;
    await addDebtor(newDebtor);

    res.status(201).json({
      success: true,
      message: 'Debtor added successfully',
      debtor: newDebtor
    });

  } catch (error) {
    console.error('Error adding debtor:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the debtor'
    });
  }
});



app.get('/get-expenses', authenticateUser, async (req, res) => {
  try {
    const companyId = req.user.companyId; // Get the company ID from the authenticated user
    const startDate = req.query.startDate; // Get the start date from query parameters
    const endDate = req.query.endDate; // Get the end date from query parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate are required'
      });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const expenses = await getExpensesByDateRange(companyId, start, end);
    res.status(200).json({
      success: true,
      message: 'Expenses fetched successfully',
      expenses: expenses
    });

  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching expenses'
    });
  }
});


app.get("/products", authenticateUser, async (req, res) => {
    try {
      company = req.user.companyId
      const products = await getAllProducts(company);
      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories. Please try again later.",
      });
    }
  });



  app.get('/get-debtors', authenticateUser, async (req, res) => {
    try {
      const companyId = req.user.companyId; // Get company ID from authenticated user
  
      // Fetch all debtors for the company
      const debtors = await getAllDebtors(companyId);
  
      res.status(200).json({
        success: true,
        message: 'Debtors fetched successfully',
        debtors
      });
  
    } catch (error) {
      console.error('Error fetching debtors:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching debtors'
      });
    }
  });


// Update Debtor Route
app.post('/update-debtor', authenticateUser, async (req, res) => {
  try {
    const { id, amountPaid, amountDue } = req.body;
    const companyId = req.user.companyId; // Get company ID from authenticated user

    // Call the database function to update the debtor
    await updateDebtor(companyId, id, { amountPaid, amountDue });

    res.status(200).json({
      success: true,
      message: 'Debtor updated successfully'
    });

  } catch (error) {
    console.error('Error updating debtor:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the debtor'
    });
  }
});



// Add Asset Route
app.post('/add-asset', authenticateUser, async (req, res) => {
  try {
    const { name, description, assetNumber, purchasePrice, estimatedLife, assetType } = req.body;
    const companyId = req.user.companyId; // Get company ID from authenticated user

    // Create asset object
    const newAsset = {
      name,
      description,
      assetNumber,
      purchasePrice,
      estimatedLife,
      assetType,
      createdAt: new Date(),
      companyId
    };

    // Save asset to Firestore
    await addAsset(newAsset);

    res.status(201).json({
      success: true,
      message: 'Asset added successfully',
      asset: newAsset
    });

  } catch (error) {
    console.error('Error adding asset:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the asset'
    });
  }
});


// Get All Assets Route
app.get('/get-assets', authenticateUser, async (req, res) => {
  try {
    const companyId = req.user.companyId; 
    const assets = await getAllAssets(companyId);

    res.status(200).json({
      success: true,
      message: 'Assets fetched successfully',
      assets
    });

  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching assets'
    });
  }
});

  // Get all active users
  /*
app.get('/active-users', async (req, res) => {
  try {
      const sessionsRef = db.collection('userSessions');
      const snapshot = await sessionsRef
          .where('isActive', '==', true)
          .get();
          
      const activeUsers = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
      }));
      
      res.json({ activeUsers });
  } catch (error) {
      res.status(500).json({ message: 'Failed to get active users' });
  }
});
*/

// Get login history for a specific user
/*
app.get('/login-history/:userId', async (req, res) => {
  try {
      const { userId } = req.params;
      const sessionsRef = db.collection('userSessions');
      const snapshot = await sessionsRef
          .where('userId', '==', userId)
          .orderBy('loginTime', 'desc')
          .get();
          
      const loginHistory = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
      }));
      
      res.json({ loginHistory });
  } catch (error) {
      res.status(500).json({ message: 'Failed to get login history' });
  }
});



// Optional: Get all login history (for admin purposes)
app.get('/all-login-history', async (req, res) => {
  try {
      const sessionsRef = db.collection('userSessions');
      const snapshot = await sessionsRef
          .orderBy('loginTime', 'desc')
          .limit(100) // Limit to last 100 sessions
          .get();
          
      const allHistory = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
      }));
      
      res.json({ allHistory });
  } catch (error) {
      res.status(500).json({ message: 'Failed to get login history' });
  }
});

*/



// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});