const express = require('express');
const cors = require('cors');
const { addCompany, addUser, addCategory, getUserByEmail, getUserById, getAllCategories, addProduct, 
  getAllProducts, getAllCompanies, getCompanyById, deleteCompany, updateCompany, addUserSessionData,
  getUserLoginHistory, getAllUsers } = require('./database');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); 
const bodyParser = require('body-parser');
require('dotenv').config();



const mySecretKey =  process.env.SECRET_KEY


async function func1 (){
    user1 = await getAllProducts()
    console.log(user1)
}


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
app.post('/add-company', upload.single('companyLogo'), async (req, res) => {
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
    await addCompany(company)

    res.status(201).json({
      message: 'Company added successfully!',
      company,
    });
  } catch (error) {
    console.error('Error adding company:', error);
    res.status(500).json({ message: 'An error occurred while adding the company.' });
  }
});


app.get('/companies', async (req, res) => {
  try {
    const companies = await getAllCompanies();
    res.status(200).json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'An error occurred while fetching companies.' });
  }
});

// Route to get a company by ID
app.get('/companies/:id', async (req, res) => {
  try {
    const company = await getCompanyById(req.params.id);
    res.status(200).json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(404).json({ message: error.message });
  }
});

app.post('/update-company', async (req, res) => {
  try {
      const result = await updateCompany(req.body);
      if (result) {
          res.status(200).json({ message: 'Company updated successfully' });
      } else {
          res.status(404).json({ message: 'Company not found' });
      }
  } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({ message: 'Error updating company', error: error.message });
  }
});


// Route to register a user
app.post('/register', async (req, res) => {
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
      console.error('Registration error:', error);

      res.status(500).json({
          error: 'Error registering user',
          details: error.message
      });
  }
});





app.post('/add-category', authenticateUser, async (req, res) => {
  console.log("This has been called- add categories has been called")
  try {
    const categoryName = req.body.category;
    const newCategory = {
      categoryName: categoryName,
      createdAt: new Date(),
    };
    const companyId = req.user.companyId;
    
    // Save to database
    await addCategory(newCategory, companyId);

    res.status(201).json({
      success: true,
      message: 'Category added successfully',
      category: newCategory
    });

  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the category'
    });
  }
});



app.delete('/delete-company/:id', async (req, res) => {
    try {
        const companyId = req.params.id;
        await deleteCompany(companyId);
        res.status(200).json({ message: 'Company deleted successfully' });
    } catch (error) {
        if (error.message === 'Company not found') {
            res.status(404).json({ error: 'Company not found' });
        } else {
            console.error('Error in delete company route:', error);
            res.status(500).json({ error: 'Failed to delete company' });
        }
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

    // Include important user data in token
    const token = jwt.sign({ 
      email: user1.email,
      id: user1.id,
      role: user1.role,
      companyId: user1.companyId
    }, mySecretKey, { 
      expiresIn: '1h' 
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
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



app.get('/users', async (req, res) => {
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
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories. Please try again later.",
      });
    }
  });


app.post('/add-products', authenticateUser, async (req, res) => {
    try {
      const productData = req.body; 
      company = req.user.companyId
      productData.createdBy = req.user.email;
      console.log(req.user)
      await addProduct(productData, company)
      res.status(201).json(productData);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
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
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories. Please try again later.",
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
      console.error('Error getting active users:', error);
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
      console.error('Error getting login history:', error);
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
      console.error('Error getting all login history:', error);
      res.status(500).json({ message: 'Failed to get login history' });
  }
});

*/



// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});