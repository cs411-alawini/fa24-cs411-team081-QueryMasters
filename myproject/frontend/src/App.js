import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SearchProducts from './components/SearchProducts';

function App() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/products/')
            .then(response => setProducts(response.data))
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    return (
      <div>
          <h1>GlowGuide - Beauty & Cosmetics Recommendations</h1>
          <SearchProducts />
      </div>
    );
}

export default App;
