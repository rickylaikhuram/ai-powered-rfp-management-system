import { Outlet, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/SideBar";
import { useEffect } from "react";

export const MainLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate("/new");
    }
  }, [id, navigate]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex-1">
        <main className="h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
