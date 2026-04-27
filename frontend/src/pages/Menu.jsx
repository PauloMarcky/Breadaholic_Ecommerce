import { Header } from '../components/Header'
import { MenuCategories } from '../components/MenuComponents/MenuCategories'
import { Products } from '../components/MenuComponents/Products'

export function Menu() {
  return (
    <>
      <Header />
      <MenuCategories />
      <Products />
    </>
  )
}