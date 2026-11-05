import Icon from './Icon.jsx'
export default function GuideContent({ guide }) {
  return (
    <article className="guide-content">
      <div className="page-heading">
        <span className="eyebrow">Mua sắm cùng Ichiyo</span>
        <h1>{guide.title}</h1>
        {guide.intro && <p className="page-intro">{guide.intro}</p>}
      </div>
      <ol className="guide-steps">
        {guide.steps.map((step, i) => (
          <li key={step.id} className="guide-step">
            <span className="step-number" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {guide.note && (
        <div className="guide-note">
          <Icon name="info" size={23} />
          <p>{guide.note}</p>
        </div>
      )}
    </article>
  )
}
