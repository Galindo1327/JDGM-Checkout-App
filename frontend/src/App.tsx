import { Navigate, Route, Routes } from 'react-router-dom';
import CheckoutFormPage from './pages/CheckoutFormPage';
import ProductPage from './pages/ProductPage';
import ResultPage from './pages/ResultPage';
import SummaryPage from './pages/SummaryPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductPage />} />
      <Route path="/checkout" element={<CheckoutFormPage />} />
      <Route path="/summary" element={<SummaryPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
