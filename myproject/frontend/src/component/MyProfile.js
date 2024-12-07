import React, { useEffect, useState } from 'react';
import './MyProfile.css';

function MyProfile() {
    const [wishlist, setWishlist] = useState([]);
    const [comments, setComments] = useState([]);
    const [editingComment, setEditingComment] = useState(null); // Track which comment is being edited
    const [editContent, setEditContent] = useState('');
    const [editRating, setEditRating] = useState(0);

    const UserId = localStorage.getItem('UserId'); // Get UserId from localStorage

    useEffect(() => {
        if (UserId) {
            fetch(`http://localhost:5001/api/users/wishlist/${UserId}`)
                .then((response) => response.json())
                .then((data) => {
                    setWishlist(data);
                })
                .catch((error) => {
                    console.error('Error fetching wishlist:', error);
                });

            fetch(`http://localhost:5001/api/users/comments/${UserId}`)
                .then((response) => response.json())
                .then((data) => {
                    setComments(data);
                })
                .catch((error) => {
                    console.error('Error fetching comments:', error);
                });
        }
    }, [UserId]);

    const handleDeleteComment = (commentId) => {
        fetch(`http://localhost:5001/api/users/comments/${commentId}`, {
            method: 'DELETE',
        })
            .then((response) => {
                if (response.ok) {
                    setComments(comments.filter((comment) => comment.CommentId !== commentId));
                } else {
                    console.error('Failed to delete comment');
                }
            })
            .catch((error) => {
                console.error('Error deleting comment:', error);
            });
    };

    const handleDeleteWishlistItem = (recordId) => {
        fetch(`http://localhost:5001/api/users/wishlist/${recordId}`, {
            method: 'DELETE',
        })
            .then((response) => {
                if (response.ok) {
                    // Remove the deleted item from the wishlist
                    setWishlist(wishlist.filter((item) => item.RecordId !== recordId));
                } else {
                    console.error('Failed to delete wishlist item');
                }
            })
            .catch((error) => {
                console.error('Error deleting wishlist item:', error);
            });
    };

    const handleEditComment = (comment) => {
        setEditingComment(comment.CommentId);
        setEditContent(comment.CommentContent);
        setEditRating(comment.Rating);
    };

    const handleSaveEdit = (commentId) => {
        fetch(`http://localhost:5001/api/users/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                CommentContent: editContent,
                Rating: editRating,
            }),
        })
            .then((response) => {
                if (response.ok) {
                    setComments(comments.map((comment) => (
                        comment.CommentId === commentId
                            ? { ...comment, CommentContent: editContent, Rating: editRating }
                            : comment
                    )));
                    setEditingComment(null);
                } else {
                    console.error('Failed to update comment');
                }
            })
            .catch((error) => {
                console.error('Error updating comment:', error);
            });
    };

    return (
        <div className="profile-container">
            <h1 className="profile-greeting">Hi, {localStorage.getItem('username')}!</h1>
            <p className="profile-subtext">Welcome to your profile!</p>

            <h2>Your Wishlist</h2>
            {wishlist.length > 0 ? (
                <ul className="wishlist">
                    {wishlist.map((item) => (
                        <li key={item.RecordId} className="wishlist-item">
                            <h3>{item.ProductName}</h3>
                            <p><strong>Price:</strong> ${item.Price}</p>
                            <p><strong>Category:</strong> {item.Category}</p>
                            <p><strong>Brand ID:</strong> {item.BrandId}</p>
                            <button
                                className="delete-button"
                                onClick={() => handleDeleteWishlistItem(item.RecordId)}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Your wishlist is empty.</p>
            )}

            <h2>Your Comments</h2>
            {comments.length > 0 ? (
                <ul className="comments-list">
                    {comments.map((comment) => (
                        <li key={comment.CommentId} className="comment-item">
                            {editingComment === comment.CommentId ? (
                                <div className="edit-comment-form">
                                    <label>
                                        Edit Comment:
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Edit Rating:
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={editRating}
                                            onChange={(e) => setEditRating(Number(e.target.value))}
                                        />
                                    </label>
                                    <button onClick={() => handleSaveEdit(comment.CommentId)}>Save</button>
                                    <button onClick={() => setEditingComment(null)}>Cancel</button>
                                </div>
                            ) : (
                                <div>
                                    <h3>On Product: {comment.ProductName}</h3>
                                    <p><strong>Rating:</strong> {comment.Rating}/5</p>
                                    <p><strong>Comment:</strong> {comment.CommentContent}</p>
                                    <p>
                                        <small>
                                            <strong>Date:</strong> {new Date(comment.Date).toLocaleDateString()}
                                        </small>
                                    </p>
                                    <button
                                        className="edit-button"
                                        onClick={() => handleEditComment(comment)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDeleteComment(comment.CommentId)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You haven't commented on any products yet.</p>
            )}
        </div>
    );
}

export default MyProfile;
