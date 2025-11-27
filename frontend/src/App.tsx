import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductPage from "./pages/ProductPage";
import MyProductsPage from "./pages/MyProductsPage";
import CategoryPage from "./pages/CategoryPage";
import VerifyPage from "./pages/VerifyPage";
import ResendPage from "./pages/ResendPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ModerationPage from "./pages/ModerationPage";
import ModeratorsPage from "./pages/ModeratorsPage";
import ClientsPage from "./pages/ClientsPage";
import ModerationProductsPage from "./pages/ModerationProductsPage";
import ModerationReportsPage from "./pages/ModerationReportsPage";
import LikedProductsPage from "./pages/LikedProductsPage";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/resend" element={<ResendPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/product/:id"
        element={
          <ProtectedRoute>
            <ProductPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-products"
        element={
          <ProtectedRoute>
            <MyProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <LikedProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:category"
        element={
          <ProtectedRoute>
            <CategoryPage />
          </ProtectedRoute>
        }
      />

      {/* Moderation routes with nested structure */}
      <Route
        path="/moderation"
        element={
          <ProtectedRoute>
            <ModerationPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/moderation/products" replace />} />
        <Route path="products" element={<ModerationProductsPage />} />
        <Route path="reports" element={<ModerationReportsPage />} />
        <Route path="moderators" element={<ModeratorsPage />} />
        <Route path="clients" element={<ClientsPage />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
