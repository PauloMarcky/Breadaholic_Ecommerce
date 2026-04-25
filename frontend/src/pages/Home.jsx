import { Header } from '../components/Header';
import { FeatureProduct } from '../components/HomeComponents/FeatureProduct';
import { IntroHook } from '../components/HomeComponents/IntroHook';
import { Album } from '../components/HomeComponents/Album';
import { Review } from '../components/HomeComponents/Review';
import { Footer } from '../components/Footer';
import '../index.css';


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