const express = require('express');
const app = express();
const PORT = 3000;

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





// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});