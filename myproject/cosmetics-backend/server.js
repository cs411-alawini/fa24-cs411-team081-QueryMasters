// server.js

const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const connection = require('./db'); // Make sure this exports a working MySQL connection
const userRoutes = require('./user'); // Adjust if needed

const youtube = google.youtube({
  version: 'v3',
  auth: '' // Insert your YouTube API Key if required
});

const app = express();

const bundleRoutes = require('./bundle_back');
const bundleFetchRoutes = require('./user_fetch'); 
const recommendation = require('./recommendation');

app.use(cors());
app.use(express.json());

// Helper function to query the database
function queryDatabase(query, params) {
  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
}


// Route to search products using the stored procedure
app.get('/api/products', (req, res) => {
  const { search, priceRange, brand, productType, rating, sortBy, sortOrder } = req.query;

  // Define default values if parameters are not provided
  const params = [
    search || '',       // p_search
    priceRange || '',   // p_priceRange
    brand || '',        // p_brand
    productType || '',  // p_productType
    rating || 0,        // p_rating
    sortBy || '',       // p_sortBy
    sortOrder || ''     // p_sortOrder
  ];

  // Call the stored procedure. This procedure returns multiple result sets:
  //  - The first result set: list of products
  //  - The second result set: possibly a summary or count (as per the example logic)
  connection.query('CALL search_product_procedure(?, ?, ?, ?, ?, ?, ?)', params, (error, results) => {
    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // results is an array of arrays because of multiple SELECT statements.
    // For example:
    // results[0] = the products
    // results[1] = the summary/count result
    const products = results[0] || [];
    let summary = {};
    if (results[1] && results[1].length > 0) {
      summary = results[1][0]; // e.g., { total_products: 10 }
    }

    // You can return both products and summary to the client:
    res.json({
      products,
      summary
    });
  });
});

// User routes
app.use('/api/users', userRoutes);
// Helper function to fetch a YouTube video link
async function fetchYouTubeVideo(searchQuery) {
  try {
    const response = await youtube.search.list({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: 1,
    });

    const items = response.data.items;
    if (items.length > 0) {
      const videoId = items[0].id.videoId;
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return null;
  } catch (error) {
    console.error('YouTube API error:', error);
    return null;
  }
}

// API endpoint to get product details
app.get('/api/products/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    // Fetch product details
    const productQuery = `
      SELECT Products.*, Brands.BrandName
      FROM Products
      JOIN Brands ON Products.BrandId = Brands.BrandId
      WHERE Products.ProductId = ?
    `;
    const productResults = await queryDatabase(productQuery, [productId]);

    if (productResults.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResults[0];

    // Fetch video links and comments concurrently
    const videoQuery = 'SELECT VideoLink FROM Video WHERE ProductId = ?';
    const commentQuery = `
      SELECT c.CommentId, c.UserId, c.Date, c.Rating, c.CommentContent, u.UserName
      FROM Comments c
      LEFT JOIN Users u ON c.UserId = u.UserId
      WHERE c.ProductId = ?
    `;

    const [videoResults, commentResults] = await Promise.all([
      queryDatabase(videoQuery, [productId]),
      queryDatabase(commentQuery, [productId]),
    ]);

    // Add video links to the product object
    if (videoResults.length > 0) {
      product.videoLinks = videoResults.map((row) => row.VideoLink);
    } else {
      // Fetch YouTube video if no video link exists
      const searchQuery = `${product.BrandName} ${product.ProductName} review`;
      const videoLink = await fetchYouTubeVideo(searchQuery);

      if (videoLink) {
        const insertVideoQuery = 'INSERT INTO Video (ProductId, VideoLink) VALUES (?, ?)';
        await queryDatabase(insertVideoQuery, [productId, videoLink]);
        product.videoLinks = [videoLink];
      } else {
        product.videoLinks = [];
      }
    }

    // Map comments
    product.comments = commentResults.map((row) => ({
      CommentId: row.CommentId,
      UserName: row.UserName,
      UserId: row.UserId,
      Date: row.Date,
      Rating: row.Rating,
      CommentContent: row.CommentContent,
    }));

    // Send the final response
    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/product/:productId/comments', async (req, res) => {
  const { productId } = req.params;
  const { UserId: storedUserId, Rating: rating, CommentContent: commentContent } = req.body;
  console.log('Request Body:', req.body);  // Debugging line to check the request body
  console.log('Product ID:', productId);  // Debugging line to check the productId

  if (!storedUserId || !rating || !commentContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log('begin to insert');
  try {
    const insertCommentQuery = `
      INSERT INTO Comments (ProductId, UserId, Rating, CommentContent, Date)
      VALUES (?, ?, ?, ?, NOW())`;
    await queryDatabase(insertCommentQuery, [productId, storedUserId, rating, commentContent]);

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User routes
app.use('/api/users', userRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/fetch', bundleFetchRoutes);
app.use('/api/recommend', recommendation);

// Start the Server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
