import { Outlet } from "react-router-dom";
import { BottomNavigation } from "@/components/client/BottomNavigation";

export const ClientLayout = () => {
  return (
    <>
      <Outlet />
      <BottomNavigation />
    </>
  );
};
