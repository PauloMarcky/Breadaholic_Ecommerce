import { useState } from 'react';
import { Header } from '../components/Header'
import { MenuCategories } from '../components/MenuComponents/MenuCategories'
import { Products } from '../components/MenuComponents/Products'

export function Menu() {
  const [filters, setFilters] = useState({
    category: 'All',
    sortBy: 'newest',
    minPrice: 0,
    maxPrice: 1000,
  });

  return (
    <>
      <Header />
      <MenuCategories filters={filters} setFilters={setFilters} />
      <Products filters={filters} />
    </>
  )
}