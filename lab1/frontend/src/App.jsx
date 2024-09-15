import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [items, setItems] = useState([]);

  const fetchItems = () => {
    axios.get("https://valdemir.ru/api/items").then(r => {
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
    <>
      {items && items.map(item => {
        return <span style={{padding:'0px 4px'}} key={item.name} className="roll-out">
          <img src={item.img} alt='logo' width="16" style={{padding:'0px 5px'}}></img>
          <span>{item.name}</span>
        </span>
      })}
    </>
  )
}

export default App;