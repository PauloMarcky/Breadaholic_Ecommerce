import { Header } from '../components/Header'
import { FeatureProduct } from '../components/FeatureProduct'
import { IntroHook } from '../components/IntroHook'
import { Album } from '../components/Album'
import { Review } from '../components/Review'
import { Footer } from '../components/Footer'
import '../components/FeatureProduct.css'
import '../pages/Home.css'


export function Home() {
  return (
    <>
      <Header />
      <IntroHook />
      <FeatureProduct />
      <Album />
      <Review />
      <Footer />
    </>
  )
}