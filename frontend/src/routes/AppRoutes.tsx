// routes/GuestRoutes.tsx
import { Navigate, Route } from "react-router-dom";
import { MainLayout } from "../layout/MainLayout";
import Chat from "../pages/chat";
import Error from "../pages/error";

const AppRoutes = (
  <Route element={<MainLayout />}>
    <Route path="/" element={<Navigate to="/new" replace />} /> 
    <Route path="/new" element={<Chat />} />
    <Route path="/:id" element={<Chat />} />
    <Route path="*" element={<Error />} />
  </Route>
);

export default AppRoutes;
