import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#fff9f8] w-full overflow-x-hidden lg:flex">
      <div className="hidden lg:block lg:shrink-0">
        <Sidebar />
      </div>

      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar />

        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}