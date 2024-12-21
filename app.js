const express = require('express');
const cors = require('cors');
const { addCompany, addUser, addCategory, getUserByEmail, getUserById, getAllCategories, addProduct, getAllProducts } = require('./database');
const bcrypt = require('bcrypt');
const app = express();
const jwt = require('jsonwebtoken');



const mySecretKey = "123465757484839391"


async function func1 (){
    user1 = await getAllProducts()
    console.log(user1)
}


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// Define a GET route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Route to add a company
app.post('/add-company', async (req, res) => {
    const { name, contact, code } = req.body;
    try {
        await addCompany(name, contact, code);
        res.status(201).send('Company added successfully');
    } catch (error) {
        res.status(500).send(`Error adding company: ${error.message}`);
    }
});

// Route to register a user
app.post('/register', async (req, res) => {
    try {
        // Log received data
        console.log('Received registration data:', {
            ...req.body,
            password: req.body.password ? 'exists' : 'missing'
        });

        const { firstName, lastName, phone, dateOfBirth, address, email, password } = req.body;


        if (password.length < 1) {
            return res.status(400).json({
                error: 'Password cannot be empty'
            });
        }

        // Validation for other fields
        if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || 
            !dateOfBirth || !address?.trim() || !email?.trim()) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }

        // Validate date
        const dobDate = new Date(dateOfBirth);
        if (isNaN(dobDate.getTime())) {
            return res.status(400).json({
                error: 'Invalid date of birth'
            });
        }

        // Log pre-hash password info (without revealing the password)
        console.log('Password validation passed, attempting to hash password of length:', password.length);

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(String(password), saltRounds);

        // Create new user with trimmed values
        const newUser = await addUser(
            firstName.trim(),
            lastName.trim(),
            phone.trim(),
            dobDate,
            address.trim(),
            email.trim().toLowerCase(),
            hashedPassword
        );

        // Log successful user creation
        console.log('User created successfully:', {
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName
        });

        // Remove sensitive data from response
        const userResponse = {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: newUser.phone,
            dateOfBirth: newUser.dateOfBirth,
            address: newUser.address,
            email: newUser.email
        };

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse
        });

    } catch (error) {
        console.error('Full error object:', error);
        console.error('Registration error:', error.message);
        console.error('Error stack:', error.stack);

        // Handle duplicate email
        if (error.code === 11000) {
            return res.status(409).json({
                error: 'Email already registered'
            });
        }

        res.status(500).json({
            error: 'Error registering user',
            details: error.message
        });
    }
});





app.post('/add-category', async (req, res) => {
  try {
    const categoryName = req.body.category;
    const newCategory = {
      categoryName: categoryName,
      createdAt: new Date(),
    };

    // Save to database
    await addCategory(newCategory);

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




app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      user1 = await getUserByEmail(email)
      if (!user1) {
        console.log('User not found')
        return res.status(401).json({ message: 'User not found' });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user1.password);

      if (!isPasswordValid) {
        console.log("Invalid credentials")
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ email }, mySecretKey, { expiresIn: '1h' });
      res.json({ message: 'Login successful', token });
      console.log("Login successfully")

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });


  app.get("/categories", async (req, res) => {
    try {
      const categories = await getAllCategories();
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


  app.post('/add-products', async (req, res) => {
    try {
      const productData = req.body; 
      await addProduct(productData)
      res.status(201).json(productData);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });



  app.get("/products", async (req, res) => {
    try {
      const products = await getAllProducts();
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





// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});