import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Login } from "@/components/Login";
import { Dashboard } from "@/components/Dashboard";
import { TextContentManager } from "@/components/TextContentManager";
import { BlogManager } from "@/components/BlogManager";
import { PageConfigManager } from "@/components/PageConfigManager";
import { ImageManager } from "@/components/ImageManager";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/text" replace />} />
              <Route path="text" element={<TextContentManager />} />
              <Route path="blog" element={<BlogManager />} />
              <Route path="page-config" element={<PageConfigManager />} />
              <Route path="images" element={<ImageManager />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
