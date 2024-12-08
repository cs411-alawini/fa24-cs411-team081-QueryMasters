//user.js
const express = require('express');
const bcrypt = require('bcrypt'); // For password hashing
const connection = require('./db'); // Import the database connection

const router = express.Router();

// User registration endpoint
router.post('/register', async (req, res) => {
    const { username, email, age, gender, password, skintype } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    try {
        // Check for duplicate email
        connection.query('SELECT * FROM Users WHERE Email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Error checking email:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: 'Email is already registered.' });
            }

            // Hash the password for secure storage
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the user into the database
            const query = `
                INSERT INTO Users (UserId, UserName, Email, Age, Gender, Password, SkinType)
                VALUES (UUID(), ?, ?, ?, ?, ?, ?)
            `;
            const params = [username, email, age || null, gender || null, hashedPassword, skintype || null];

            console.log('Executing query:', query, params);
            connection.query(query, params, (insertErr, result) => {
                if (insertErr) {
                    console.error('Error registering user:', insertErr);
                    return res.status(500).json({ message: 'Database error' });
                }

                res.status(201).json({ message: 'User registered successfully!' });
            });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User sign-in endpoint
router.post('/signin', (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check if user exists
    connection.query('SELECT * FROM Users WHERE Email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const user = results[0];

        // Compare hashed passwords
        const isPasswordValid = await bcrypt.compare(password, user.Password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Return success response
        res.status(200).json({ message: 'Sign in successful!', user: { id: user.UserId, username: user.UserName, email: user.Email } });
    });
});

// Add an item to the user's wishlist
router.post('/wishlist', (req, res) => {
    const { UserId, ProductId } = req.body;

    // Validate required fields
    if (!UserId || !ProductId) {
        return res.status(400).json({ message: 'UserId and ProductId are required.' });
    }

    const query = `
        INSERT INTO WishListItem (UserId, ProductId)
        VALUES (?, ?)
    `;
    const params = [UserId, ProductId];

    connection.query(query, params, (err, result) => {
        if (err) {
            console.error('Error adding to wishlist:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        res.status(201).json({ message: 'Item added to wishlist successfully!' });
    });
});

// Get wishlist items for a user
router.get('/wishlist/:userId', (req, res) => {
    const { userId } = req.params;

    const query = `
        SELECT w.RecordId, w.ProductId, p.ProductName, p.Price, p.Category, p.BrandId 
        FROM WishListItem w
        JOIN Products p ON w.ProductId = p.ProductId
        WHERE w.UserId = ?
    `;

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching wishlist:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        res.status(200).json(results);
    });
});

// Delete an item from the user's wishlist
router.delete('/wishlist/:recordId', (req, res) => {
    const { recordId } = req.params;

    // Validate RecordId
    if (!recordId) {
        return res.status(400).json({ message: 'RecordId is required.' });
    }

    const query = 'DELETE FROM WishListItem WHERE RecordId = ?';

    connection.query(query, [recordId], (err, result) => {
        if (err) {
            console.error('Error deleting wishlist item:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Wishlist item not found.' });
        }

        res.status(200).json({ message: 'Wishlist item deleted successfully!' });
    });

});

// Get comments for a user
router.get('/comments/:userId', (req, res) => {
    const { userId } = req.params;

    const query = `
        SELECT c.CommentId, c.ProductId, p.ProductName, c.Rating, c.CommentContent, c.Date
        FROM Comments c
        JOIN Products p ON c.ProductId = p.ProductId
        WHERE c.UserId = ?
    `;

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        res.status(200).json(results);
    });
});

// Delete a comment
router.delete('/comments/:commentId', (req, res) => {
    const { commentId } = req.params;

    // Validate commentId
    if (!commentId) {
        return res.status(400).json({ message: 'CommentId is required.' });
    }

    const query = 'DELETE FROM Comments WHERE CommentId = ?';

    connection.query(query, [commentId], (err, result) => {
        if (err) {
            console.error('Error deleting comment:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        res.status(200).json({ message: 'Comment deleted successfully!' });
    });
});

// Update a comment and rating
router.put('/comments/:commentId', (req, res) => {
    const { commentId } = req.params;
    const { CommentContent, Rating } = req.body;

    // Validate input
    if (!CommentContent || !Rating) {
        return res.status(400).json({ message: 'Comment content and rating are required.' });
    }

    // Check if the comment exists
    const query = `
        SELECT * FROM Comments WHERE CommentId = ?
    `;
    connection.query(query, [commentId], (err, results) => {
        if (err) {
            console.error('Error fetching comment:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Update the comment
        const updateQuery = `
            UPDATE Comments
            SET CommentContent = ?, Rating = ?
            WHERE CommentId = ?
        `;
        const params = [CommentContent, Rating, commentId];

        connection.query(updateQuery, params, (updateErr, result) => {
            if (updateErr) {
                console.error('Error updating comment:', updateErr);
                return res.status(500).json({ message: 'Database error' });
            }

            res.status(200).json({ message: 'Comment updated successfully!' });
        });
    });
});


module.exports = router;


