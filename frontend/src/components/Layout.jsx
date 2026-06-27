import { Link } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div className="app">
      <nav className="nav">
        <Link to="/" className="nav-brand">
          Home Project
        </Link>
        <div className="nav-links">
          <Link to="/">테이블</Link>
          <Link to="/charts">차트</Link>
          <Link to="/register">자산 등록</Link>
        </div>
      </nav>
      {children}
    </div>
  )
}
