//REQUIRED MODULES
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const htmlhint = require('htmlhint').HTMLHint;
const csslint = require('csslint').CSSLint;
const { ESLint } = require('eslint');
const { JSDOM } = require('jsdom');
const session = require('express-session');

require('dotenv').config();

//CREATING APP USING EXPRESS
const app = express();


// MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the 'public' directory


// CONNECTING TO DB
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});  
db.connect((err) => {
    if (err) {
      console.error('Database connection failed:', err.stack);
      return;
    }
    console.log('Connected to database.');
});


// HOME.HTML DEFAULT FILE ROUTE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Home.html'));
});

// REGISTER FORM ROUTE & SUBMISSION
app.post('/register', async (req, res) => {
    const { username, email, password, password2 } = req.body;
    // Check if passwords match
    if (password !== password2) {
        return res.status(400).send('Passwords do not match');
    }
    // Hash the password
    const saltRounds = 10;  // Adjust the salt rounds as needed
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Save the user to the database with hashed password
    const query = 'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, hashedPassword], (err, result) => {
        if (err) throw err;
        res.status(200).send('User registered successfully');
    });
});

//USING SESSION IN APPLICATION
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));
  
// SESSION STATUS CHECK ROUTE(LOGIN/LOGOUT)
app.get('/session-status', (req, res) => {
    if (req.session.user) {
      res.json({ loggedIn: true });
    } else {
      res.json({ loggedIn: false });
    }
});

//LOGIN ROUTE
app.post('/login', (req, res) => {
    const { user, password3 } = req.body;
  
    const query = 'SELECT * FROM Users WHERE username = ?';
    db.query(query, [user], async (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error occurred while logging in' });
      }
      if (result.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
  
      const userRecord = result[0];
      const validPassword = await bcrypt.compare(password3, userRecord.password);
  
      if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
  
      // Set session after successful login
      req.session.user = {
        id: userRecord.id,  // Ensure 'id' is a valid field from your Users table
        username: userRecord.username
      };
  
      console.log('Login successful. Redirecting...');
      res.redirect('/'); // Redirect to home page after successful login
    });
});

//LOGOUT ROUTE
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error occurred while logging out' });
      }
  
      // Redirect to home page after successful logout
      res.redirect('/');
    });
});


// SAVE SNIPPETS ROUTE
app.post('/saveSnippet', (req, res) => {
    if (req.session.user) {  // Make sure the user is logged in
        const { codeType, snippet } = req.body;
        const userId = req.session.user.id;  // Use the user ID stored in session
        console.log(userId);
        // Log to see if snippet is being received correctly
        console.log('Snippet received');

        // Save the snippet to the database
        const query = 'INSERT INTO snippets (user_id, code_type, code) VALUES (?, ?, ?)';
        db.query(query, [userId, codeType , snippet], (err, result) => {
            if (err) {
                console.error('Error while saving snippet:', err);  // Log the error
                return res.json({ success: false, message: 'Failed to save snippet' });
            }
            console.log('Snippet saved successfully:', result);
            res.json({ success: true, message: 'Snippet saved successfully' });
        });
    } else {
        res.status(401).json({ success: false, message: 'User not authorized' });
    }
});

//FETCH SNIPPETS ROUTE
app.get('/fetchSnippets', (req, res) => {
    if (req.session.user) {  // Make sure the user is logged in
        const userId = req.session.user.id;  // Get the logged-in user's ID
        // Query to fetch all snippets for the logged-in user
        const query = 'SELECT * FROM snippets WHERE user_id = ?';
        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error fetching snippets:', err);
                return res.status(500).json({ success: false, message: 'Failed to fetch snippets' });
            }
            
            res.json({ success: true, snippets: results });  // Send back the snippets
        });
    } else {
        res.status(401).json({ success: false, message: 'User not authorized' });
    }
});

//SYNTAX-CHECKING
const eslint = new ESLint();
app.post('/check-syntax', async (req, res) => {
    const { codeType, code } = req.body;

    let errors = [];

    try {
        if (codeType === 'html') {
            errors = htmlhint.verify(code);
        } else if (codeType === 'css') {
            errors = csslint.verify(code).messages;
        } else if (codeType === 'js') {
            const jsResults = await eslint.lintText(code);
            errors = jsResults[0].messages;
        } else if (codeType === 'embedded') {
            const dom = new JSDOM(code);
            const document = dom.window.document;

            // Extract and lint internal CSS
            let cssCode = '';
            document.querySelectorAll('style').forEach(style => {
                cssCode += style.textContent + ' ';
            });

            // Extract inline CSS
            document.querySelectorAll('[style]').forEach(elem => {
                cssCode += elem.getAttribute('style').replace(/;/g, ';\n') + ' ';
            });

            if (cssCode.trim()) {
                const cssResults = csslint.verify(cssCode);
                errors = errors.concat(cssResults.messages);
            }

            // Extract and lint internal JS
            let jsCode = '';
            document.querySelectorAll('script').forEach(script => {
                jsCode += script.textContent + '\n';
            });

            // Extract inline JavaScript from attributes
            document.querySelectorAll('*').forEach(elem => {
                [...elem.attributes].forEach(attr => {
                    if (attr.name.startsWith('on')) {
                        jsCode += attr.value + '\n';
                    }
                });
            });

            if (jsCode.trim()) {
                const jsResults = await eslint.lintText(jsCode);
                errors = errors.concat(jsResults[0].messages);
            }
        }

        if (errors.length === 0) {
            res.json([{ message: "No errors found" }]);
        } else {
            res.json(errors);
        }
    } catch (error) {
        console.error('Error during linting:', error);
        res.status(500).json({ message: 'An error occurred during linting', error });
    }
});

// START THE SERVER
const PORT = 1300;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});