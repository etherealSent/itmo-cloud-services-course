import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [items, setItems] = useState([]);

  const fetchItems = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/items`)
      .then(r => {
        if (Array.isArray(r.data)) {
          setItems(r.data);
        } else {
          setItems([]);
        }
      })
      .catch(error => {
        console.error('Error fetching items:', error);
        setItems([]);
      });
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(() => {
      fetchItems();
    }, 5000);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return (
    <>
      <h1>Items</h1>
      <ul>
        {items.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </>
  );
}

export default App;