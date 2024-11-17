import React, { useState } from 'react';
import axios from 'axios';
import './SearchProducts.css';

function SearchProducts() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ priceRange: '', brand: '', productType: '', rating: '' });
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
        <div>
            <div className="title-container">
                <h1>GlowGuide - Beauty & Cosmetics Recommendations</h1>
            </div>
            <div className="search-container">
                <h2>Find Products</h2>
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={handleInputChange}
                    />
                    <div className="filter-row">
                        <select name="priceRange" onChange={handleFilterChange}>
                            <option value="">Price Range</option>
                            <option value="under25">Under $25</option>
                            <option value="25to50">$25 to $50</option>
                            <option value="50to100">$50 to $100</option>
                            <option value="100andAbove">$100 and above</option>
                        </select>
                        <select name="brand" onChange={handleFilterChange}>
                            <option value="">Brand</option>
                            <option value="brandA">Brand A</option>
                            <option value="brandB">Brand B</option>
                            <option value="brandC">Brand C</option>
                        </select>
                        <select name="productType" onChange={handleFilterChange}>
                            <option value="">Product Type</option>
                            <option value="blush">Blush</option>
                            <option value="makeupRemover">Makeup Remover</option>
                            <option value="highlighter">Highlighter</option>
                            <option value="faceMask">Face Mask</option>
                            <option value="foundation">Foundation</option>
                            <option value="powder">Powder</option>
                            <option value="lipGloss">Lip Gloss</option>
                            <option value="ccCream">CC Cream</option>
                            <option value="eyeShadow">Eye Shadow</option>
                            <option value="concealer">Concealer</option>
                            <option value="eyeliner">Eyeliner</option>
                            <option value="lipstick">Lipstick</option>
                            <option value="settingSpray">Setting Spray</option>
                            <option value="cleanser">Cleanser</option>
                            <option value="bronzer">Bronzer</option>
                            <option value="primer">Primer</option>
                            <option value="faceOil">Face Oil</option>
                            <option value="contour">Contour</option>
                            <option value="mascara">Mascara</option>
                            <option value="bbCream">BB Cream</option>
                            <option value="lipLiner">Lip Liner</option>
                            <option value="moisturizer">Moisturizer</option>
                            <option value="exfoliator">Exfoliator</option>
                        </select>
                        <select name="rating" onChange={handleFilterChange}>
                            <option value="">Rating</option>
                            <option value="4">⭐⭐⭐⭐ 4 & up</option>
                            <option value="3">⭐⭐⭐ 3 & up</option>
                            <option value="2">⭐⭐ 2 & up</option>
                            <option value="1">⭐ 1 & up</option>
                        </select>
                    </div>
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
        </div>
    );
}

export default SearchProducts;