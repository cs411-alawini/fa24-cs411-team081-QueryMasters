// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: '',
});

// Import the database connection
const connection = require('./db');

// Import user routes
const userRoutes = require('./user');

app.use(cors());
app.use(express.json());

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

// API Endpoint for products
app.get('/api/products', (req, res) => {
  const { search, priceRange, brand, productType, rating, sortBy, sortOrder } = req.query;


  let query = `
    SELECT Products.*, Brands.BrandName
    FROM Products
    JOIN Brands ON Products.BrandId = Brands.BrandId
    WHERE 1=1
  `;
  const params = [];

  // Filter by search query (ProductName)
  if (search) {
    query += ' AND Products.ProductName LIKE ?';
    params.push(`%${search}%`);
  }
  if (brand) {
    query += ' AND Brands.BrandName = ?';
    params.push(brand);
  }
  // Filter by price range
  if (priceRange) {
    switch (priceRange) {
      case 'under25':
        query += ' AND Price < 25';
        break;
      case '25to50':
        query += ' AND Price BETWEEN 25 AND 50';
        break;
      case '50to100':
        query += ' AND Price BETWEEN 50 AND 100';
        break;
      case '100andAbove':
        query += ' AND Price > 100';
        break;
      default:
        break;
    }
  }



  // Filter by product type (Category)
  if (productType) {
    // Map frontend productType values to database categories
    const productTypeMapping = {
      blush: 'Blush',
      makeupRemover: 'Makeup Remover',
      highlighter: 'Highlighter',
      faceMask: 'Face Mask',
      foundation: 'Foundation',
      powder: 'Powder',
      lipGloss: 'Lip Gloss',
      ccCream: 'CC Cream',
      eyeShadow: 'Eye Shadow',
      concealer: 'Concealer',
      eyeliner: 'Eyeliner',
      lipstick: 'Lipstick',
      settingSpray: 'Setting Spray',
      cleanser: 'Cleanser',
      bronzer: 'Bronzer',
      primer: 'Primer',
      faceOil: 'Face Oil',
      contour: 'Contour',
      mascara: 'Mascara',
      bbCream: 'BB Cream',
      lipLiner: 'Lip Liner',
      moisturizer: 'Moisturizer',
      exfoliator: 'Exfoliator',
    };
    const category = productTypeMapping[productType];
    if (category) {
      query += ' AND Category = ?';
      params.push(category);
    }
  }

  // Filter by rating
  if (rating) {
    query += ' AND Rating >= ?';
    params.push(Number(rating));
  }

  // Add sorting
  if (sortBy) {
    const validSortFields = ['Price', 'Rating'];
    if (validSortFields.includes(sortBy)) {
      const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${sortBy} ${order}`;
    }
  }
  // Execute the query
  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

// User routes
app.use('/api/users', userRoutes);

// API Endpoint for product details
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

app.use(express.json());

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

// Start the Server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});