import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <div className="centered-page"><div><h1>Page not found</h1><Link to="/chats">Return to chats</Link></div></div>;
}
