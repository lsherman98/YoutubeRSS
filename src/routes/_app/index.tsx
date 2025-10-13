import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({
      to: "/podcasts",
    });
  }, [navigate]);

  return <div className="h-full w-full flex items-center justify-center"></div>;
}
