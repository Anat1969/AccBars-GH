import { Link } from 'react-router-dom';
import Page from '../components/Page';

export default function NotFound() {
  return (
    <Page className="page-narrow">
      <section className="card card-calm">
        <h1 className="h-display">הדף לא נמצא</h1>
        <Link className="btn btn-ghost" to="/patients">
          לרשימת המטופלים
        </Link>
      </section>
    </Page>
  );
}
