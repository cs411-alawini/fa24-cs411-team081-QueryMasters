// src/components/ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ProductDetail.css';

function ProductDetail() {
  const { productId } = useParams(); // Get productId from the URL params
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch product details from the backend
    fetch(`http://localhost:5001/api/products/${productId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Product not found');
        }
        return response.json();
      })
      .then((data) => {
        setProduct(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching product details:', error);
        setIsLoading(false);
      });
  }, [productId]);

  const handleAddToWishlist = () => {
    const storedUserId = localStorage.getItem('UserId');

    if (!storedUserId) {
      alert('Please sign in to add items to your wishlist.');
      return;
    }

    fetch('http://localhost:5001/api/users/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserId: storedUserId, ProductId: productId }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message || 'Item added to wishlist!');
      })
      .catch((error) => {
        console.error('Error adding to wishlist:', error);
        alert('An error occurred while adding the item to the wishlist.');
      });
  };

  const handleDeleteComment = (commentId) => {
    // Call API to delete the comment
    fetch(`http://localhost:5001/api/product/${productId}/comments/${commentId}`, {
      method: 'DELETE',
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message || 'Comment deleted successfully!');
        // Reload the product details after deleting the comment
        setIsLoading(true);
        fetch(`http://localhost:5001/api/products/${productId}`)
          .then((response) => response.json())
          .then((data) => {
            setProduct(data);
            setIsLoading(false);
          });
      })
      .catch((error) => {
        console.error('Error deleting comment:', error);
        alert('An error occurred while deleting the comment.');
      });
  };

  if (isLoading) {
    return <p>Loading product details...</p>;
  }

  if (!product) {
    return <p>Product not found.</p>;
  }

  // Function to convert video links to embed URLs
  const getEmbedUrl = (url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes('youtube.com')) {
        const videoId = parsedUrl.searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (parsedUrl.hostname.includes('youtu.be')) {
        const videoId = parsedUrl.pathname.slice(1);
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      // Add support for other platforms if necessary
      return url; // Return original URL if not a recognized platform
    } catch (error) {
      console.error('Invalid video URL:', error);
      return url;
    }
  };

  // CommentForm component
  const CommentForm = ({ productId, reloadProductDetails }) => {
    const [commentContent, setCommentContent] = useState('');
    const [rating, setRating] = useState(0);
    const storedUserId = localStorage.getItem('UserId');

    if (!storedUserId) {
      alert('Please log in to submit a comment.');
      return null; // Return null to avoid rendering form if user is not logged in
    }

    const handleCommentSubmit = async (e) => {
      e.preventDefault(); // Prevent default form submission behavior
      console.log("User ID:", storedUserId);  // Check if storedUserId is defined
      console.log("Product ID:", productId);  // Check if productId is defined
      console.log("Rating:", rating);  // Check if rating is defined
      console.log("Comment Content:", commentContent);  // Check if commentContent is defined

      if (rating < 1 || rating > 5) {
        alert('Rating must be between 1 and 5.');
        return;
      }

      if (!commentContent.trim()) {
        alert('Comment content cannot be empty.');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5001/api/product/${productId}/comments`, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            UserId: storedUserId,
            ProductId: productId,
            Rating: rating,
            CommentContent: commentContent.trim(),
            Date: new Date().toISOString(),
          }),
        });

        const data = await response.json();  // Get JSON data from the response
        console.log('Response Data:', data);
        if (response.ok) {
          alert('Comment submitted successfully!');
          setCommentContent('');
          setRating(0);
          reloadProductDetails(); // Refresh product details to show the new comment
        } else {
          alert(`Error: ${data.message}`);
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
        alert('An error occurred while submitting the comment.');
      }
    };

    return (
      <form onSubmit={handleCommentSubmit} className="comment-form">
        <h3>Write Your Comment Here!</h3>
        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="Write your comment here"
          className="comment-textarea"
        />
        <div className="rating-container">
          <label htmlFor="rating" className="rating-label">
            Your Rating (1-5):
          </label>
          <input
            type="number"
            id="rating"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            placeholder="Enter rating (1-5)"
            min="1"
            max="5"
            className="rating-input"
          />
        </div>
        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>
    );
  };

  return (
    <div className="product-detail-container">
      <h2>{product.ProductName}</h2>
      <p>
        <strong>Price:</strong> ${product.Price}
      </p>
      <p>
        <strong>Category:</strong> {product.Category}
      </p>
      <p>
        <strong>Brand ID:</strong> {product.BrandId}
      </p>
      <p>
        <strong>Usage Frequency:</strong> {product.UsageFrequency}
      </p>
      <p>
        <strong>Skin Type:</strong> {product.SkinType}
      </p>
      <p>
        <strong>Rating:</strong> {product.Rating}
      </p>
      <p>
        <strong>Gender Target:</strong> {product.GenderTarget}
      </p>
      {/* Add other product details as necessary */}

      <button onClick={handleAddToWishlist} className="wishlist-button">
        Add to Wishlist
      </button>

      {/* Display Videos */}
      {product.videoLinks && product.videoLinks.length > 0 && (
        <div className="product-videos">
          <h3>Product Videos</h3>
          {product.videoLinks.map((videoLink, index) => {
            const embedUrl = getEmbedUrl(videoLink);

            return (
              <div key={index} className="video-container">
                <iframe
                  width="560"
                  height="315"
                  src={embedUrl}
                  title={`Product Video ${index + 1}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            );
          })}
        </div>
      )}

      {/* Display Comments */}
      {product.comments && product.comments.length > 0 ? (
        <div className="product-comments">
          <h3>Product Reviews</h3>
          {product.comments.map((comment, index) => (
            <div key={index} className="comment-container">
              <p><strong>Rating:</strong> {comment.Rating} / 5</p>
              <p><strong>Comment:</strong> {comment.CommentContent}</p>
              <p><strong>By User:</strong> {comment.UserName}</p>
              <p><strong>Date:</strong> {new Date(comment.Date).toLocaleString()}</p>
              <button onClick={() => handleDeleteComment(comment.commentId)} className="delete-comment-button">
                Delete Comment
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-comments">
          <p>No Comments Now!</p>
        </div>
      )}

      {/* Render Comment Form */}
      <CommentForm productId={productId} reloadProductDetails={() => setIsLoading(true)} />
    </div>
  );
}

export default ProductDetail;
