import '../components/Review.css'
import { useRef } from 'react'

export function Review() {

  const scrollRef = useRef(null);

  const scrollEvent = ((direction) => {

    const { current } = scrollRef;
    const scrollAmount = 200;

    if (direction === 'left') {
      current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

  });

  return (
    <>
      <div className="feedback-section">
        <h2 className="feedback-title">COSTUMER FEEDBACK</h2>
        <p className="feedback-sub-title">PLEASE PROVIDE HONEST REVIEWS, AS THIS WILL HELP THE BUSINESS GROWTH</p>

        <div className="feedback-body">
          <button className="scroll-btn" onClick={() => scrollEvent('left')}>
            <img src="../public/left-arrow.png" alt="" />
          </button>

          <div className="reviews-grid" id="reviewsGrid" ref={scrollRef}>
            <div className="review-card">
              <p>The pan de sal here is amazing – fresh every morning and so fluffy inside. Will definitely come back!</p>
              <div className="stars">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
            <div className="review-card">
              <p>Best coffee and pastries in town. The ensaymada melts in your mouth. Highly recommended!</p>
              <div className="stars">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
            <div className="review-card">
              <p>Love the variety of breads here. The staff is very friendly and the prices are very reasonable.</p>
              <div className="stars">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>☆</span>
              </div>
            </div>
            <div className="review-card">
              <p>Great place to grab merienda! The donuts are soft and the toppings are generous. 10/10!</p>
              <div className="stars">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
            <div className="review-card">
              <p>Great place to grab merienda! The donuts are soft and the toppings are generous. 10/10!</p>
              <div className="stars">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
            <div className="review-card">
              <p>Great place to grab merienda! The donuts are soft and the toppings are generous. 10/10!</p>
              <div className="stars">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
          </div>

          <button className="scroll-btn" onClick={() => scrollEvent('right')}><img src="../public/right-arrow.png" alt="" />
          </button>

          <div className="feedback-form">
            <textarea placeholder="Message here . . . ."></textarea>
            <div className="form-stars" id="formStars">
              <span data-v="1" onclick="setStars(1)">★</span>
              <span data-v="2" onclick="setStars(2)">★</span>
              <span data-v="3" onclick="setStars(3)">★</span>
              <span data-v="4" onclick="setStars(4)">★</span>
              <span data-v="5" onclick="setStars(5)">★</span>
            </div>
            <button className="btn-submit">Submit Feedback</button>
          </div>
        </div>
      </div>
    </>
  )
}