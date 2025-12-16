import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div style={{ padding: 20 }}>
      <h2>ADMIN LAYOUT</h2>
      <Outlet />
    </div>
  );
}


