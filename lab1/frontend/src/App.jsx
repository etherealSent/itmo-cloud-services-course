import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [items, setItems] = useState([]);

  const fetchItems = () => {
    axios.get("https://valdemir.online/api/items").then(r => {
      setItems(r.data)
    })
  }

  useEffect(() => {
    fetchItems()
    setInterval(() => {
      fetchItems()
    }, 4000)
  }, [])

  return (
    <div className="items-container">
      {items && items.map(item => {
        return (
          <span style={{padding: '0px 4px'}} key={item.name} className="roll-out">
            <img src={item.img} alt='logo' width="16" style={{padding: '0px 5px'}} />
            <span>{item.name}</span>
          </span>
        );
      })}
    </div>
  );
}

export default App;