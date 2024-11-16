import React, { useState } from 'react';
import axios from 'axios';
import './SearchProducts.css';

function SearchProducts() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ priceRange: '', brand: '', productType: '' });
    const [products, setProducts] = useState([]);

    const handleInputChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/products/', {
                params: { search: searchQuery, ...filters },
            });
            setProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    return (
        <div className="search-container">
            <h2>Find Products</h2>
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleInputChange}
                />
                <select name="priceRange" onChange={handleFilterChange}>
                    <option value="">Price Range</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                <select name="brand" onChange={handleFilterChange}>
                    <option value="">Brand</option>
                    <option value="brandA">Brand A</option>
                    <option value="brandB">Brand B</option>
                    <option value="brandC">Brand C</option>
                </select>
                <select name="productType" onChange={handleFilterChange}>
                    <option value="">Product Type</option>
                    <option value="skincare">Skincare</option>
                    <option value="makeup">Makeup</option>
                    <option value="haircare">Haircare</option>
                </select>
                <button type="submit">Search</button>
            </form>
            <div className="results-container">
                <h3>Results</h3>
                <ul className="product-list">
                    {products.map(product => (
                        <li key={product.id}>
                            <span className="product-name">{product.name}</span>
                            <span className="product-price">${product.price}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
    
}

export default SearchProducts;
