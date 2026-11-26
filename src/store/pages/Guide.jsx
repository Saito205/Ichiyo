import { guide } from '../../shared/content.js'
import GuideContent from '../components/GuideContent.jsx'

export default function Guide() {
  return (
    <section className="wrap guide-page">
      <GuideContent guide={guide} />
    </section>
  )
}
