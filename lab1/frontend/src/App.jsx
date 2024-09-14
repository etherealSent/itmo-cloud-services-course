import { useEffect, useState } from 'react'
import './App.css'
import axios from 'axios'

function App() {
  const [items, setItems] = useState(null)

  const fetchItems = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/items`)
    .then(r => {setItems(r.data)})
  }

  useEffect(() => {
    fetchItems()
    setInterval(() => {
      fetchItems()
    }, 5000)
  }, [])

  return (
    <>
      {items && items.map(item => {
        return <span style={{padding:'0px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center'}} key={item.name} className="roll-out">
        <img src={item.img} alt='logo' width="200" style={{padding:'0px 5px'}}></img>
        <span>{item.name}</span>
      </span>
      })}
    </>
  )
}

export default App
