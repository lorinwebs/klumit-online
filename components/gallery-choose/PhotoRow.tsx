import { publicPhotoUrl } from './config';
import type { HumanChoice, PhotoFile, PhotoType } from './types';

type Props = {
  file: PhotoFile;
  count?: number;
  score?: number;
  desc: string;
  type: PhotoType;
  auto: boolean;
  human: HumanChoice;
  selected: boolean;
  onYes: () => void;
  onNo: () => void;
};

export function PhotoRow({
  file,
  count,
  score,
  desc,
  type,
  auto,
  human,
  selected,
  onYes,
  onNo,
}: Props) {
  const humanOverride = human !== null;
  const overridesAi = auto && human === 'no';

  return (
    <article
      className={`row${selected ? ' row--yes' : ''}${human === 'no' ? ' row--no' : ''}${auto ? ' row--ai-pick' : ' row--ai-skip'}${overridesAi ? ' row--override' : ''}`}
    >
      <a
        className="row__thumb"
        href={publicPhotoUrl(file.path)}
        target="_blank"
        rel="noreferrer"
      >
        <img
          src={publicPhotoUrl(file.path)}
          alt=""
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
        />
        {type !== 'unknown' && <span className={`row__dot row__dot--${type}`} />}
        <span className={`row__ai-stamp${auto ? ' row__ai-stamp--yes' : ' row__ai-stamp--no'}`}>
          {auto ? 'AI' : '—'}
        </span>
      </a>

      <div className="row__body">
        <div className="row__top">
          <span className="row__uploader">{file.uploader}</span>
          <span className="row__file">{file.name}</span>
          <span className="row__badges">
            <span className={`row__badge${auto ? ' row__badge--auto' : ' row__badge--skip'}`}>
              {auto ? '🤖 AI בחר' : 'לא ב-AI'}
            </span>
            {humanOverride && (
              <span className={`row__badge row__badge--human${human === 'no' ? ' row__badge--reject' : ''}`}>
                {human === 'yes' ? 'שלי ✓' : 'שלי ✗'}
              </span>
            )}
            {overridesAi && (
              <span className="row__badge row__badge--override">גובר על AI</span>
            )}
            {selected && <span className="row__badge row__badge--final">סופי ✓</span>}
            {!selected && human === 'no' && (
              <span className="row__badge row__badge--out">לא באלבום</span>
            )}
          </span>
        </div>

        <div className="row__ai">
          <div className="row__meta-line">
            {count != null && count >= 0 ? (
              <span className="row__count">👤 {count} אנשים</span>
            ) : (
              <span className="row__count row__count--na">לא נותח</span>
            )}
            {score != null && score >= 1 ? (
              <span
                className={`row__score row__score--${
                  score >= 80 ? 'high' : score >= 55 ? 'mid' : 'low'
                }`}
              >
                ציון {score}/100
              </span>
            ) : (
              <span className="row__score row__score--na">אין ציון</span>
            )}
          </div>
          {desc ? <p className="row__desc">{desc}</p> : <p className="row__desc row__desc--empty">—</p>}
        </div>
      </div>

      <div className="row__actions">
        <button
          type="button"
          className={`row__pick row__pick--yes${human === 'yes' ? ' is-active' : ''}${auto && human === null ? ' row__pick--auto' : ''}`}
          title="בחר לאלבום"
          onClick={onYes}
        >
          ✓
        </button>
        <button
          type="button"
          className={`row__pick row__pick--no${human === 'no' ? ' is-active' : ''}`}
          title="לא באלבום (גובר על AI)"
          onClick={onNo}
        >
          ✗
        </button>
      </div>
    </article>
  );
}
